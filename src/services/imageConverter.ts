import JSZip from 'jszip';
import { ConvertedVariant, SupportedFormat } from '../types';

/**
 * Creates a valid Windows ICO file from a canvas
 */
function canvasToIcoBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        resolve(new Blob([], { type: 'image/x-icon' }));
        return;
      }
      pngBlob.arrayBuffer().then((buffer) => {
        const pngBytes = new Uint8Array(buffer);
        const w = Math.min(256, canvas.width);
        const h = Math.min(256, canvas.height);

        // ICO Header (6 bytes)
        // Directory Entry (16 bytes)
        // Image Data (pngBytes.length)
        const totalSize = 6 + 16 + pngBytes.length;
        const out = new Uint8Array(totalSize);
        const view = new DataView(out.buffer);

        // ICONDIR
        view.setUint16(0, 0, true); // reserved
        view.setUint16(2, 1, true); // type: 1 = ICO
        view.setUint16(4, 1, true); // count: 1 image

        // ICONDIRENTRY
        out[6] = w === 256 ? 0 : w; // width (0 = 256)
        out[7] = h === 256 ? 0 : h; // height (0 = 256)
        out[8] = 0; // color palette count
        out[9] = 0; // reserved
        view.setUint16(10, 1, true); // color planes
        view.setUint16(12, 32, true); // bits per pixel
        view.setUint32(14, pngBytes.length, true); // bytes in resource
        view.setUint32(18, 22, true); // image offset (6 + 16)

        // Copy PNG payload
        out.set(pngBytes, 22);

        resolve(new Blob([out], { type: 'image/x-icon' }));
      });
    }, 'image/png');
  });
}

/**
 * Creates an uncompressed baseline TIFF file
 */
function canvasToTiffBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
      return;
    }
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const rgba = imgData.data;

    // Convert RGBA to RGB (strip alpha for baseline TIFF)
    const rgbBytes = new Uint8Array(width * height * 3);
    let j = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      rgbBytes[j++] = rgba[i]; // R
      rgbBytes[j++] = rgba[i + 1]; // G
      rgbBytes[j++] = rgba[i + 2]; // B
    }

    const ifdOffset = 8;
    const numEntries = 12;
    const ifdSize = 2 + numEntries * 12 + 4;
    const valuesOffset = ifdOffset + ifdSize;
    const stripDataOffset = valuesOffset + 32;

    const totalSize = stripDataOffset + rgbBytes.length;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const outBytes = new Uint8Array(buffer);

    // Header: Little endian 'II' + 42
    view.setUint8(0, 0x49);
    view.setUint8(1, 0x49);
    view.setUint16(2, 42, true);
    view.setUint32(4, ifdOffset, true);

    // Number of tags
    view.setUint16(ifdOffset, numEntries, true);

    let tagIdx = ifdOffset + 2;
    const writeTag = (tag: number, type: number, count: number, valOrOffset: number) => {
      view.setUint16(tagIdx, tag, true);
      view.setUint16(tagIdx + 2, type, true);
      view.setUint32(tagIdx + 4, count, true);
      view.setUint32(tagIdx + 8, valOrOffset, true);
      tagIdx += 12;
    };

    // 1: ImageWidth (SHORT)
    writeTag(256, 3, 1, width);
    // 2: ImageLength (SHORT)
    writeTag(257, 3, 1, height);
    // 3: BitsPerSample (SHORT, count 3 => offset to values)
    writeTag(258, 3, 3, valuesOffset);
    // values for BitsPerSample: 8, 8, 8
    view.setUint16(valuesOffset, 8, true);
    view.setUint16(valuesOffset + 2, 8, true);
    view.setUint16(valuesOffset + 4, 8, true);

    // 4: Compression (1 = uncompressed)
    writeTag(259, 3, 1, 1);
    // 5: PhotometricInterpretation (2 = RGB)
    writeTag(262, 3, 1, 2);
    // 6: StripOffsets
    writeTag(273, 4, 1, stripDataOffset);
    // 7: SamplesPerPixel (3)
    writeTag(277, 3, 1, 3);
    // 8: RowsPerStrip
    writeTag(278, 3, 1, height);
    // 9: StripByteCounts
    writeTag(279, 4, 1, rgbBytes.length);
    // 10: XResolution (RATIONAL, offset)
    writeTag(282, 5, 1, valuesOffset + 8);
    view.setUint32(valuesOffset + 8, 72, true);
    view.setUint32(valuesOffset + 12, 1, true);

    // 11: YResolution (RATIONAL, offset)
    writeTag(283, 5, 1, valuesOffset + 16);
    view.setUint32(valuesOffset + 16, 72, true);
    view.setUint32(valuesOffset + 20, 1, true);

    // 12: ResolutionUnit (2 = inch)
    writeTag(296, 3, 1, 2);

    // Next IFD offset = 0
    view.setUint32(tagIdx, 0, true);

    // Copy RGB pixel data
    outBytes.set(rgbBytes, stripDataOffset);

    resolve(new Blob([buffer], { type: 'image/tiff' }));
  });
}

/**
 * Creates BMP blob
 */
function canvasToBmpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
      return;
    }
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Header 'BM'
    view.setUint16(0, 0x424d, false);
    view.setUint32(2, fileSize, true);
    view.setUint32(6, 0, true); // reserved
    view.setUint32(10, 54, true); // pixel array offset

    // DIB Header (BITMAPINFOHEADER 40 bytes)
    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true); // bottom-up
    view.setUint16(26, 1, true); // planes
    view.setUint16(28, 24, true); // 24 bpp
    view.setUint32(30, 0, true); // BI_RGB no compression
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true); // 72 DPI
    view.setInt32(42, 2835, true);
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    // Pixels (BGR, bottom to top)
    for (let y = 0; y < height; y++) {
      const srcRow = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const srcIdx = (srcRow * width + x) * 4;
        const destIdx = 54 + y * rowSize + x * 3;
        bytes[destIdx] = data[srcIdx + 2]; // B
        bytes[destIdx + 1] = data[srcIdx + 1]; // G
        bytes[destIdx + 2] = data[srcIdx]; // R
      }
    }

    resolve(new Blob([buffer], { type: 'image/bmp' }));
  });
}

/**
 * Creates SVG Wrapper Blob
 */
function canvasToSvgBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((png) => {
      if (!png) {
        resolve(new Blob([], { type: 'image/svg+xml' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />
</svg>`;
        resolve(new Blob([svgContent], { type: 'image/svg+xml' }));
      };
      reader.readAsDataURL(png);
    }, 'image/png');
  });
}

/**
 * Convert HTML Canvas to any requested format
 */
export async function convertCanvasToFormat(canvas: HTMLCanvasElement, format: SupportedFormat): Promise<Blob> {
  const normFormat = format.toLowerCase() as SupportedFormat;

  if (normFormat === 'ico') {
    return canvasToIcoBlob(canvas);
  }
  if (normFormat === 'tiff') {
    return canvasToTiffBlob(canvas);
  }
  if (normFormat === 'bmp') {
    return canvasToBmpBlob(canvas);
  }
  if (normFormat === 'svg') {
    return canvasToSvgBlob(canvas);
  }

  // Native Canvas formats
  let mimeType = 'image/png';
  let quality = 0.95;

  if (normFormat === 'jpg' || normFormat === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (normFormat === 'webp') {
    mimeType = 'image/webp';
  } else if (normFormat === 'gif') {
    mimeType = 'image/gif';
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to PNG
          canvas.toBlob((fallback) => resolve(fallback || new Blob([])), 'image/png');
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Load an image source into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = src;
  });
}

/**
 * Perform resizing and conversion on an image
 */
export async function processImageVariant(
  img: HTMLImageElement,
  originalFileName: string,
  targetWidth: number,
  targetHeight: number,
  targetFormat: SupportedFormat
): Promise<ConvertedVariant> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D Kontext nicht verfügbar');

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw background for non-transparent formats
  if (['jpg', 'jpeg', 'bmp'].includes(targetFormat.toLowerCase())) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await convertCanvasToFormat(canvas, targetFormat);
  const dataUrl = URL.createObjectURL(blob);

  // Filename formatting according to prompt specification:
  // e.g. testbild.png -> output/testbild-64x64.jpeg
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  const ext = targetFormat.toLowerCase();
  const variantFileName = `${baseName}-${targetWidth}x${targetHeight}.${ext}`;
  const relativePath = `output/${variantFileName}`;

  return {
    fileName: variantFileName,
    relativePath,
    width: targetWidth,
    height: targetHeight,
    format: targetFormat,
    blob,
    dataUrl,
    fileSize: blob.size,
  };
}

/**
 * Export variants as a ZIP archive with "output/" directory
 */
export async function createOutputZip(variants: ConvertedVariant[]): Promise<Blob> {
  const zip = new JSZip();
  const outputFolder = zip.folder('output');

  for (const variant of variants) {
    if (outputFolder) {
      outputFolder.file(variant.fileName, variant.blob);
    } else {
      zip.file(`output/${variant.fileName}`, variant.blob);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Save directly into user's file system using File System Access API if available
 */
export async function saveToDirectoryPicker(variants: ConvertedVariant[]): Promise<boolean> {
  if (!('showDirectoryPicker' in window)) {
    return false;
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    // Create "output" folder in the selected directory
    const outputDirHandle = await dirHandle.getDirectoryHandle('output', { create: true });

    for (const v of variants) {
      const fileHandle = await outputDirHandle.getFileHandle(v.fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(v.blob);
      await writable.close();
    }
    return true;
  } catch (err) {
    console.warn('Directory Picker abgebrochen oder nicht gewährt:', err);
    return false;
  }
}
