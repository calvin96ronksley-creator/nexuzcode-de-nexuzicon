import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Image as ImageIcon,
  Sliders,
  Save,
  Download,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Settings2,
  FileCode,
  Globe,
  Database,
} from 'lucide-react';
import {
  ChatMessage,
  DimensionPreset,
  GalleryItem,
  PurposePreset,
  SupportedFormat,
} from '../../types';
import { convertCanvasToFormat, loadImage, processImageVariant } from '../../services/imageConverter';

interface AIStudioViewProps {
  onSaveToGallery: (item: GalleryItem) => void;
  onSendToConverter: (item: GalleryItem) => void;
}

const DEFAULT_SYSTEM_INSTRUCTION = `Du bist der offizielle NexusPix KI-Assistent & Prompt-Ingenieur für Grafiken, Icons und Banner.
Du berätst den Benutzer ausführlich bei Bildideen, Farbpaletten, Vektorisierung und geeigneten Dimensionen.
Wenn der Benutzer eine Idee nennt, formuliere ihm einen präzisen, hochauflösenden Prompt in Deutsch oder Englisch und erkläre das ideale Ausgabeformat (PNG, SVG, ICO, WEBP, TIFF) und die optimale Auflösung (8x8 bis 1024x1024).`;

export const AIStudioView: React.FC<AIStudioViewProps> = ({
  onSaveToGallery,
  onSendToConverter,
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hallo! Ich bin dein NexusPix KI-Assistent. Beschreibe mir einfach, welches Bild, Icon oder Banner du erstellen möchtest. Ich optimiere den Prompt für dich oder generiere die Grafik direkt nach deinen Vorgaben!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customSystemInstruction, setCustomSystemInstruction] = useState(DEFAULT_SYSTEM_INSTRUCTION);

  // Generator form state
  const [prompt, setPrompt] = useState('Modern minimal flat vector app icon with floating holographic prism');
  const [purposePreset, setPurposePreset] = useState<PurposePreset>('Icon');
  const [selectedFormat, setSelectedFormat] = useState<SupportedFormat>('png');
  const [dimensionPreset, setDimensionPreset] = useState<DimensionPreset>('512x512');
  const [saveDestination, setSaveDestination] = useState<'local' | 'online' | 'both'>('local');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    originalUrl: string;
    formattedUrl: string;
    formattedBlob: Blob;
    format: SupportedFormat;
    dimensions: { width: number; height: number };
    fileSize: number;
    prompt: string;
  } | null>(null);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Pre-configured dimensions mapping
  const getDimensionValues = (preset: DimensionPreset): { width: number; height: number } => {
    switch (preset) {
      case '8x8':
        return { width: 8, height: 8 };
      case '16x16':
        return { width: 16, height: 16 };
      case '32x32':
        return { width: 32, height: 32 };
      case '64x64':
        return { width: 64, height: 64 };
      case '128x128':
        return { width: 128, height: 128 };
      case '256x256':
        return { width: 256, height: 256 };
      case '512x512':
        return { width: 512, height: 512 };
      case '1024x1024':
        return { width: 1024, height: 1024 };
      case 'original':
      default:
        return { width: 512, height: 512 };
    }
  };

  // Adjust dimension recommendations when purpose changes
  const handlePurposeChange = (purpose: PurposePreset) => {
    setPurposePreset(purpose);
    if (purpose === 'Hintergrund') {
      setDimensionPreset('1024x1024');
      setSelectedFormat('jpg');
    } else if (purpose === 'Banner') {
      setDimensionPreset('1024x1024');
      setSelectedFormat('webp');
    } else if (purpose === 'Icon') {
      setDimensionPreset('512x512');
      setSelectedFormat('png');
    } else if (purpose === 'Social-Media-Post') {
      setDimensionPreset('1024x1024');
      setSelectedFormat('png');
    }
  };

  // Chat message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: customSystemInstruction,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Abrufen der KI-Antwort');

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Ich habe deine Anfrage verarbeitet.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `Entschuldigung, es gab ein Problem: ${err.message}. Du kannst den Bildgenerator auf der rechten Seite dennoch direkt verwenden!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Image Generation execution
  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);
    setIsSavedFeedback(false);

    try {
      const { width, height } = getDimensionValues(dimensionPreset);

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          purposePreset,
          format: selectedFormat,
          dimensions: `${width}x${height}`,
          aspectRatio: '1:1',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generierung fehlgeschlagen');

      const rawUrl = data.imageUrl;

      // Resizing & Format Conversion according to user choices
      const loadedImg = await loadImage(rawUrl);
      const variant = await processImageVariant(
        loadedImg,
        'ai-artwork',
        width,
        height,
        selectedFormat
      );

      const result = {
        originalUrl: rawUrl,
        formattedUrl: variant.dataUrl,
        formattedBlob: variant.blob,
        format: selectedFormat,
        dimensions: { width, height },
        fileSize: variant.blob.size,
        prompt: prompt.trim(),
      };

      setGeneratedResult(result);

      // Auto-save based on user's preselected destination
      await handleSaveResult(result);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Fehler beim Generieren des Bildes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveResult = async (resToSave = generatedResult) => {
    if (!resToSave) return;

    const source = saveDestination === 'online' ? 'online' : 'local';
    const isSyncedToOnline = saveDestination === 'both' || saveDestination === 'online';

    const newItem: GalleryItem = {
      id: `ai-gen-${Date.now()}`,
      title: `${purposePreset}: ${resToSave.prompt.slice(0, 32)}...`,
      url: resToSave.formattedUrl,
      source,
      isSyncedToOnline,
      isLocalCached: true,
      format: resToSave.format,
      dimensions: resToSave.dimensions,
      fileSize: resToSave.fileSize,
      tags: ['ai-generiert', purposePreset.toLowerCase(), resToSave.format],
      upvotes: 1,
      downvotes: 0,
      viewCount: 1,
      createdAt: new Date().toISOString(),
      purposePreset,
      aiPrompt: resToSave.prompt,
      notes: `KI-Generiert (${resToSave.dimensions.width}x${resToSave.dimensions.height} ${resToSave.format.toUpperCase()}) mit Zweck: ${purposePreset}`,
    };

    onSaveToGallery(newItem);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 4000);
  };

  const handleDownloadGenerated = () => {
    if (!generatedResult) return;
    const a = document.createElement('a');
    a.href = generatedResult.formattedUrl;
    a.download = `nexuspix-${purposePreset.toLowerCase()}-${generatedResult.dimensions.width}x${generatedResult.dimensions.height}.${generatedResult.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: AI Chatbot Assistant (lg:col-span-5) */}
      <div className="lg:col-span-5 flex flex-col h-[750px] rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* Chatbot Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">NexusPix KI-Assistent</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                Prompt-Engineering, Styling & Bildberatung
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="System-Anweisungen & Assistenten-Wissen konfigurieren"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Advanced System Instructions Panel */}
        {showAdvancedSettings && (
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-2 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Spezifische Anweisungen & Wissen des Bots</span>
              <button
                onClick={() => setCustomSystemInstruction(DEFAULT_SYSTEM_INSTRUCTION)}
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Zurücksetzen
              </button>
            </div>
            <textarea
              rows={3}
              value={customSystemInstruction}
              onChange={(e) => setCustomSystemInstruction(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="Gib dem Assistenten hier spezifische Instruktionen oder Fachwissen mit..."
            />
          </div>
        )}

        {/* Chat Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/30">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {/* Quick Action: If bot suggested a prompt, user can click to adopt */}
                {m.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                    <button
                      onClick={() => {
                        // Extract text between quotes if exists, else first sentence
                        const match = m.content.match(/"([^"]+)"/);
                        const cleanPrompt = match ? match[1] : m.content.slice(0, 100);
                        setPrompt(cleanPrompt);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      Als Bild-Prompt übernehmen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-xl w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Assistent formuliert Antwort...</span>
            </div>
          )}
        </div>

        {/* Quick prompt inspiration chips */}
        <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0">Vorschläge:</span>
          <button
            onClick={() => setChatInput('Erstelle mir einen Prompt für ein 3D App-Icon im devicons Stil')}
            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            App-Icon Idee
          </button>
          <button
            onClick={() => setChatInput('Welche Auflösung und welches Format eignet sich am besten für Web-Favicons?')}
            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            Icon Formate & DPI
          </button>
          <button
            onClick={() => setChatInput('Design-Idee für einen Twitter/X Header Banner im Cyberpunk-Stil')}
            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            Header Banner
          </button>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Frage den Bot nach Ideen oder Prompts..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatLoading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Column: AI Generator & Parameter Matrix (lg:col-span-7) */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        {/* Main Generator Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">KI-Bildgenerator & Format-Studio</h3>
                <p className="text-xs text-slate-400">
                  Konfiguriere Zweck, Dimensionen und Ausgabeformat direkt vor der Generierung
                </p>
              </div>
            </div>
          </div>

          {/* Prompt Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Beschreibung / Prompt des Nutzers
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="z.B. Neon glowing React logo floating above holographic grid, minimalist flat vector style..."
              className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
            />
          </div>

          {/* Parameter Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Verwendungszweck (Purpose Preset) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Verwendungszweck (Preset)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Icon', 'Hintergrund', 'Banner', 'Social-Media-Post'] as PurposePreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePurposeChange(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                      purposePreset === p
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {p === 'Icon' && '📱 '}
                    {p === 'Hintergrund' && '🖼️ '}
                    {p === 'Banner' && '🏷️ '}
                    {p === 'Social-Media-Post' && '📱 '}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Ausgabe-Format (PNG, JPG, JPEG, ICO, SVG, GIF, WEBP, TIFF) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Ausgabe-Dateiformat
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['png', 'jpg', 'jpeg', 'ico', 'svg', 'gif', 'webp', 'tiff'] as SupportedFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`py-1.5 rounded-xl text-xs font-mono font-semibold uppercase border transition text-center ${
                      selectedFormat === fmt
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Feste Ausgabe-Größen (8x8 bis 1024x1024 & Original) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Ausgabe-Größe (Auflösung in Pixeln)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
              {(
                [
                  '8x8',
                  '16x16',
                  '32x32',
                  '64x64',
                  '128x128',
                  '256x256',
                  '512x512',
                  '1024x1024',
                  'original',
                ] as DimensionPreset[]
              ).map((dim) => (
                <button
                  key={dim}
                  type="button"
                  onClick={() => setDimensionPreset(dim)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-mono font-medium border transition text-center ${
                    dimensionPreset === dim
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Speicherort Auswahl (Lokal vs Online vs Beides) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-semibold text-slate-200">
                Speicherort nach Generierung:
              </span>
              <span className="text-[11px] text-slate-400">
                Wähle, wo das neue Bild automatisch abgelegt werden soll
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSaveDestination('local')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  saveDestination === 'local'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-3 h-3" />
                Lokale Galerie
              </button>
              <button
                type="button"
                onClick={() => setSaveDestination('online')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  saveDestination === 'online'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                Online Galerie
              </button>
              <button
                type="button"
                onClick={() => setSaveDestination('both')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  saveDestination === 'both'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Beide (Sync)
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {generationError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generiere Bild & konvertiere nach {selectedFormat.toUpperCase()} ({dimensionPreset})...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Bild jetzt erstellen ({dimensionPreset} • {selectedFormat.toUpperCase()})
              </>
            )}
          </button>
        </div>

        {/* Generated Result Preview Card */}
        {generatedResult && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Generiertes Bild Ergebnis</h4>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                {generatedResult.format} • {generatedResult.dimensions.width}×
                {generatedResult.dimensions.height}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="w-48 h-48 rounded-xl bg-slate-900 p-2 flex items-center justify-center border border-slate-800 shrink-0">
                <img
                  src={generatedResult.formattedUrl}
                  alt="Generiertes Bild"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div>
                  <h5 className="text-xs font-semibold text-slate-400">Prompt:</h5>
                  <p className="text-xs text-white italic mt-0.5 line-clamp-3">
                    "{generatedResult.prompt}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Dateigröße</span>
                    <span className="font-mono text-slate-200">
                      {(generatedResult.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Status</span>
                    <span className="text-emerald-400 font-medium">
                      {isSavedFeedback ? 'In Galerie gespeichert ✓' : 'Bereit'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleDownloadGenerated}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Datei herunterladen
                  </button>

                  <button
                    onClick={() => handleSaveResult()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    In Galerie erneut sichern
                  </button>

                  <button
                    onClick={() => {
                      onSendToConverter({
                        id: `ai-conv-${Date.now()}`,
                        title: prompt.slice(0, 30),
                        url: generatedResult.formattedUrl,
                        source: 'ai',
                        isSyncedToOnline: false,
                        isLocalCached: true,
                        format: generatedResult.format,
                        dimensions: generatedResult.dimensions,
                        fileSize: generatedResult.fileSize,
                        tags: ['ai-konverter'],
                        upvotes: 0,
                        downvotes: 0,
                        viewCount: 1,
                        createdAt: new Date().toISOString(),
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Im Batch-Konverter weiter skalieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
