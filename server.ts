import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Chatbot endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Ungültige Nachrichtenliste' });
      return;
    }

    const defaultSystem = `Du bist der NexusPix KI-Assistent & Bildexperte für die PWA Galerie und das Grafikstudio.
Du hilfst Nutzern beim Entwerfen von Prompts für Bilder, App-Icons, Banner und Hintergründe, sowie bei Fragen zu Bildformaten (PNG, JPG, WEBP, ICO, SVG, TIFF), Auflösungen (8x8 bis 1024x1024) und Gallerie-Organisation (Tags, OneDrive-ähnlicher Sync, Remote Caching).
Antworte freundlich, präzise und auf Deutsch. Gib bei Bildanfragen konkrete, detaillierte Prompts aus, die der Nutzer direkt im Bild-Studio nutzen kann.`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemInstruction || defaultSystem,
      },
    });

    res.json({
      reply: response.text || 'Keine Antwort erhalten.',
    });
  } catch (error: any) {
    console.error('Fehler bei /api/chat:', error);
    res.status(500).json({
      error: error?.message || 'Fehler bei der Kommunikation mit dem KI-Dienst.',
    });
  }
});

// AI Image Generation Endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', purposePreset = 'Icon', format = 'png', dimensions = '512x512' } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt ist erforderlich' });
      return;
    }

    // Try generating image via gemini-3.1-flash-lite-image
    let imageDataUrl: string | null = null;
    let generatedType = 'image/png';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: `Generate a high quality visual asset. Purpose: ${purposePreset}. Style: clean, professional, aesthetic, detailed. Prompt: ${prompt}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
            generatedType = mime;
            break;
          }
        }
      }
    } catch (imgError: any) {
      console.warn('Image generation with image model notice:', imgError?.message);
    }

    // If direct image model is unavailable or requires key permission, fallback to high-quality SVG vector generation using gemini-3.8-flash
    if (!imageDataUrl) {
      const svgPrompt = `Create a visually stunning, production-ready, beautiful modern SVG graphic representing: "${prompt}".
Purpose preset: ${purposePreset}.
Dimensions: viewBox="0 0 512 512".
Rules:
1. Return ONLY the valid standalone <svg ...>...</svg> XML string.
2. Use modern gradients, drop shadows, rich modern color palettes, crisp paths and aesthetic shapes.
3. No markdown ticks, no commentary. Just raw SVG.`;

      const svgRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: svgPrompt,
      });

      let svgText = (svgRes.text || '').trim();
      if (svgText.includes('```xml')) {
        svgText = svgText.replace(/```xml/g, '').replace(/```/g, '').trim();
      } else if (svgText.includes('```svg')) {
        svgText = svgText.replace(/```svg/g, '').replace(/```/g, '').trim();
      } else if (svgText.includes('```')) {
        svgText = svgText.replace(/```/g, '').trim();
      }

      if (svgText.startsWith('<svg') || svgText.includes('<svg')) {
        const svgClean = svgText.substring(svgText.indexOf('<svg'));
        const base64Svg = Buffer.from(svgClean).toString('base64');
        imageDataUrl = `data:image/svg+xml;base64,${base64Svg}`;
        generatedType = 'image/svg+xml';
      }
    }

    if (!imageDataUrl) {
      res.status(500).json({ error: 'Bild konnte nicht generiert werden.' });
      return;
    }

    res.json({
      imageUrl: imageDataUrl,
      mimeType: generatedType,
      prompt,
      purposePreset,
      dimensions,
      format,
    });
  } catch (error: any) {
    console.error('Fehler bei /api/generate-image:', error);
    res.status(500).json({ error: error?.message || 'Fehler beim Generieren des Bildes' });
  }
});

// Remote image proxy endpoint to bypass CORS and allow permanent local caching
app.get('/api/proxy-remote', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).json({ error: 'URL Parameter fehlt' });
      return;
    }

    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Nur HTTP/HTTPS URLs erlaubt' });
      return;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusPix/1.0',
        Accept: 'image/*,*/*',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Remote Server antwortete mit ${response.status}` });
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error: any) {
    console.error('Proxy Fehler:', error);
    res.status(500).json({ error: 'Remote Bild konnte nicht geladen werden.' });
  }
});

// Static / Vite middleware integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`NexusPix Studio Server läuft auf Port ${PORT}`);
  });
}

startServer();
