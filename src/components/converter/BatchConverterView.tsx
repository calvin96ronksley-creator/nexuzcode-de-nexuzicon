import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FolderOpen,
  Play,
  Download,
  Trash2,
  Check,
  CheckCircle2,
  FileImage,
  Layers,
  Archive,
  FolderTree,
  Eye,
  AlertCircle,
  RefreshCw,
  FolderDown,
  Sparkles,
} from 'lucide-react';
import { BatchFileItem, ConvertedVariant, SupportedFormat } from '../../types';
import {
  createOutputZip,
  loadImage,
  processImageVariant,
  saveToDirectoryPicker,
} from '../../services/imageConverter';

interface BatchConverterViewProps {
  initialItemToConvert?: { url: string; title: string; format: string } | null;
  onImportToLocalGallery?: (variants: ConvertedVariant[]) => void;
}

const ALL_FORMATS: SupportedFormat[] = [
  'png',
  'jpg',
  'jpeg',
  'ico',
  'svg',
  'gif',
  'webp',
  'tiff',
  'bmp',
];

const STANDARD_SIZES: { label: string; width: number; height: number }[] = [
  { label: '8x8', width: 8, height: 8 },
  { label: '16x16', width: 16, height: 16 },
  { label: '32x32', width: 32, height: 32 },
  { label: '64x64', width: 64, height: 64 },
  { label: '128x128', width: 128, height: 128 },
  { label: '256x256', width: 256, height: 256 },
  { label: '512x512', width: 512, height: 512 },
  { label: '1024x1024', width: 1024, height: 1024 },
];

export const BatchConverterView: React.FC<BatchConverterViewProps> = ({
  initialItemToConvert,
  onImportToLocalGallery,
}) => {
  // File list state
  const [fileItems, setFileItems] = useState<BatchFileItem[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<SupportedFormat>('jpeg');

  // Selected multi-sizes for resizing (defaults to popular icon/banner sizes)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['64x64', '128x128', '256x256']);
  const [includeOriginalSize, setIncludeOriginalSize] = useState(false);
  const [customSizeEnabled, setCustomSizeEnabled] = useState(false);
  const [customWidth, setCustomWidth] = useState(48);
  const [customHeight, setCustomHeight] = useState(48);

  // Status & Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalConvertedCount, setTotalConvertedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Drag overlay state
  const [isDragOver, setIsDragOver] = useState(false);

  // Native file input ref (QFileDialog trigger)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming item sent from Gallery or AI Studio
  useEffect(() => {
    if (initialItemToConvert) {
      loadImage(initialItemToConvert.url)
        .then((img) => {
          const item: BatchFileItem = {
            id: `init-${Date.now()}`,
            name: `${initialItemToConvert.title}.${initialItemToConvert.format}`,
            originalFormat: initialItemToConvert.format,
            originalDimensions: {
              width: img.naturalWidth || 512,
              height: img.naturalHeight || 512,
            },
            originalSize: 150000,
            previewUrl: initialItemToConvert.url,
            status: 'idle',
            progress: 0,
            variants: [],
          };
          setFileItems((prev) => [item, ...prev]);
        })
        .catch((e) => console.error('Fehler beim Laden des Init-Bildes:', e));
    }
  }, [initialItemToConvert]);

  // Process dropped/selected files
  const handleAddFiles = async (files: FileList | File[]) => {
    const newItems: BatchFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|ico|webp|svg|gif|tiff|bmp)$/i)) {
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      try {
        const img = await loadImage(previewUrl);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';

        newItems.push({
          id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          name: file.name,
          originalFormat: ext,
          originalDimensions: {
            width: img.naturalWidth || 0,
            height: img.naturalHeight || 0,
          },
          originalSize: file.size,
          previewUrl,
          status: 'idle',
          progress: 0,
          variants: [],
        });
      } catch (err) {
        console.error('Konnte Bild nicht laden:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      setFileItems((prev) => [...prev, ...newItems]);
      setStatusMessage(`${newItems.length} Datei(en) hinzugefügt.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Open file dialog (QFileDialog behavior)
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Toggle size selection
  const toggleSize = (sizeKey: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeKey) ? prev.filter((s) => s !== sizeKey) : [...prev, sizeKey]
    );
  };

  // Batch conversion execution
  const runBatchConversion = async () => {
    if (fileItems.length === 0 || isProcessing) return;

    // Collect all target dimensions to resize to
    const targetDimensions: { width: number; height: number; label: string }[] = [];

    STANDARD_SIZES.forEach((s) => {
      if (selectedSizes.includes(s.label)) {
        targetDimensions.push(s);
      }
    });

    if (customSizeEnabled && customWidth > 0 && customHeight > 0) {
      targetDimensions.push({
        width: customWidth,
        height: customHeight,
        label: `${customWidth}x${customHeight}`,
      });
    }

    if (targetDimensions.length === 0 && !includeOriginalSize) {
      alert('Bitte wähle mindestens eine Ausgabe-Größe (z.B. 64x64) aus!');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Konvertierung & Skalierung läuft...');

    const updatedItems = [...fileItems];
    let allGeneratedVariants: ConvertedVariant[] = [];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      item.status = 'processing';
      setFileItems([...updatedItems]);

      try {
        const img = await loadImage(item.previewUrl);
        const itemVariants: ConvertedVariant[] = [];

        // Build list of sizes for this specific file
        const fileTargetSizes = [...targetDimensions];
        if (includeOriginalSize) {
          fileTargetSizes.push({
            width: item.originalDimensions.width || 512,
            height: item.originalDimensions.height || 512,
            label: `${item.originalDimensions.width}x${item.originalDimensions.height}`,
          });
        }

        // Avoid duplicate sizes
        const uniqueSizes = Array.from(
          new Map(fileTargetSizes.map((s) => [`${s.width}x${s.height}`, s])).values()
        );

        for (const dim of uniqueSizes) {
          const variant = await processImageVariant(
            img,
            item.name,
            dim.width,
            dim.height,
            selectedFormat
          );
          itemVariants.push(variant);
        }

        item.variants = itemVariants;
        item.status = 'done';
        allGeneratedVariants.push(...itemVariants);
      } catch (err: any) {
        console.error('Fehler bei Item:', item.name, err);
        item.status = 'error';
        item.errorMessage = err.message || 'Konvertierungsfehler';
      }

      setFileItems([...updatedItems]);
    }

    setIsProcessing(false);
    setTotalConvertedCount(allGeneratedVariants.length);
    setStatusMessage(`Fertig! ${allGeneratedVariants.length} Bilddateien im 'output/' Pfad bereitgestellt.`);
  };

  // Collect all generated variants across all files
  const allVariants = fileItems.flatMap((item) => item.variants);

  // Download all as ZIP with "output/" directory
  const handleDownloadAllZip = async () => {
    if (allVariants.length === 0) return;
    const zipBlob = await createOutputZip(allVariants);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `nexuspix-output-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Save directly to folder via File System Access API
  const handleDirectDiskSave = async () => {
    if (allVariants.length === 0) return;
    const success = await saveToDirectoryPicker(allVariants);
    if (success) {
      alert('Erfolg! Alle Dateien wurden im Unterordner "output" deines ausgewählten Pfads gespeichert!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
        multiple
        accept="image/*,.png,.jpg,.jpeg,.ico,.webp,.svg,.gif,.tiff,.bmp"
        className="hidden"
      />

      {/* Header Info */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Batch Bild-Konverter & Skalierer Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag & Drop oder Doppelklick auf freien Tabellenplatz (QFileDialog). Mehrfachgrößen &
              Speicherung in <code className="text-amber-400 font-mono">output/[dateiname]-[größe].[ext]</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={openFileDialog}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            Dateien auswählen (QFileDialog)
          </button>
          {fileItems.length > 0 && (
            <button
              onClick={() => setFileItems([])}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
              title="Tabelle leeren"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversion Options & Resizing Controls Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Format selection (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                1. Ziel-Dateiformat (Alle Typen unterstützt):
              </label>
              <span className="text-[11px] font-mono text-indigo-400 uppercase font-bold">
                .{selectedFormat}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {ALL_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`py-2 px-1 text-xs font-mono font-semibold uppercase rounded-xl border transition text-center ${
                    selectedFormat === fmt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Unterstützt echte Windows ICO (mit Resource-Header), TIFF (Baseline RGB), BMP, WEBP, SVG-Wrapper und standard PNG/JPEG.
            </p>
          </div>

          {/* Size / Resizing Matrix (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                2. Größen- & Skalierungs-Optionen (Mehrfachauswahl möglich!):
              </label>
              <button
                onClick={() => {
                  if (selectedSizes.length === STANDARD_SIZES.length) {
                    setSelectedSizes([]);
                  } else {
                    setSelectedSizes(STANDARD_SIZES.map((s) => s.label));
                  }
                }}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                {selectedSizes.length === STANDARD_SIZES.length
                  ? 'Alle abwählen'
                  : 'Alle auswählen'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STANDARD_SIZES.map((s) => {
                const isSelected = selectedSizes.includes(s.label);
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => toggleSize(s.label)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono border transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>

            {/* Custom size & original toggle */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeOriginalSize}
                  onChange={(e) => setIncludeOriginalSize(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Originalgröße ebenfalls exportieren</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customSizeEnabled}
                  onChange={(e) => setCustomSizeEnabled(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Benutzerdefinierte Größe:</span>
              </label>

              {customSizeEnabled && (
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs text-center"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs text-center"
                  />
                  <span>px</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output path & start action bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Ausgabe-Pfad: <strong className="text-white">output/[dateiname]-[breite]x[höhe].{selectedFormat}</strong>
            </span>
          </div>

          <button
            onClick={runBatchConversion}
            disabled={fileItems.length === 0 || isProcessing}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50 transition"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Konvertiere Dateien...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                {fileItems.length} Datei(en) jetzt stapelweise konvertieren
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Table Widget with Drag-and-Drop & Double-Click Support */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDoubleClick={(e) => {
          // Double-clicking on free space inside widget opens file dialog (QFileDialog behavior)
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('input')) {
            openFileDialog();
          }
        }}
        className={`relative rounded-3xl bg-slate-900 border transition-all duration-200 overflow-hidden shadow-xl min-h-[350px] flex flex-col ${
          isDragOver
            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/90'
            : 'border-slate-800'
        }`}
      >
        {/* Table Header Bar */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Dateien-Tabelle (QFileDialog Widget)</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300">
              {fileItems.length} Dateien
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Tipp: Doppelklick auf freien Platz öffnet die Dateiauswahl
          </span>
        </div>

        {/* Empty State / Drag Zone */}
        {fileItems.length === 0 ? (
          <div
            onClick={openFileDialog}
            className="flex-1 flex flex-col items-center justify-center p-12 text-center cursor-pointer hover:bg-slate-950/30 transition select-none group"
          >
            <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition duration-300">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="mt-4 text-sm font-semibold text-white">
              Bilder hier hineinziehen (Drag & Drop)
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              oder <strong className="text-amber-400 underline">doppelklicken / klicken</strong>, um
              den Dateiauswahldialog (QFileDialog) zu öffnen.
            </p>
            <span className="mt-3 text-[11px] text-slate-500">
              PNG, JPG, JPEG, WEBP, ICO, SVG, GIF, TIFF, BMP unterstützt
            </span>
          </div>
        ) : (
          /* Table of dropped / chosen files */
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-medium">
                  <th className="py-3 px-4 w-14">Vorschau</th>
                  <th className="py-3 px-4">Dateiname</th>
                  <th className="py-3 px-4">Original Format</th>
                  <th className="py-3 px-4">Original Auflösung</th>
                  <th className="py-3 px-4">Größe</th>
                  <th className="py-3 px-4">Status & Varianten</th>
                  <th className="py-3 px-4 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {fileItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition duration-150"
                  >
                    {/* Thumbnail */}
                    <td className="py-2.5 px-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 font-medium text-white max-w-[200px] truncate">
                      {item.name}
                    </td>

                    {/* Original Format */}
                    <td className="py-2.5 px-4 font-mono uppercase text-slate-400">
                      {item.originalFormat}
                    </td>

                    {/* Original Dimensions */}
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {item.originalDimensions.width} × {item.originalDimensions.height} px
                    </td>

                    {/* File Size */}
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {(item.originalSize / 1024).toFixed(1)} KB
                    </td>

                    {/* Status / Output Preview */}
                    <td className="py-2.5 px-4">
                      {item.status === 'idle' && (
                        <span className="text-slate-400 text-[11px]">Bereit zur Konvertierung</span>
                      )}
                      {item.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-400 text-[11px]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Wird verarbeitet...
                        </span>
                      )}
                      {item.status === 'done' && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.variants.length} Variante(n) in 'output/'
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.variants.map((v) => (
                              <a
                                key={v.fileName}
                                href={v.dataUrl}
                                download={v.fileName}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-indigo-300 hover:text-white"
                                title={`Klicken zum direkten Download: ${v.relativePath}`}
                              >
                                {v.width}x{v.height}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <span className="text-rose-400 text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {item.errorMessage}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setFileItems((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Aus Liste entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Drop zone overlay during active dragging */}
        {isDragOver && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-indigo-400 z-30 pointer-events-none">
            <Upload className="w-12 h-12 text-indigo-300 animate-bounce" />
            <h4 className="mt-2 text-base font-bold text-white">Dateien hier loslassen!</h4>
            <p className="text-xs text-indigo-200">
              NexusPix lädt alle Bilder sofort in die Tabelle zur Konvertierung.
            </p>
          </div>
        )}
      </div>

      {/* Batch Export Options & Output Delivery */}
      {allVariants.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  Konvertierung abgeschlossen: {allVariants.length} Dateien generiert
                </h4>
                <p className="text-xs text-slate-400">
                  Alle Bilder sind formatiert und mit dem Präfix <code className="text-amber-400">output/</code> vorbereitet.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Gesamtgröße: {(allVariants.reduce((acc, v) => acc + v.fileSize, 0) / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Download as ZIP with output/ folder */}
            <button
              onClick={handleDownloadAllZip}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
            >
              <Archive className="w-4 h-4" />
              ZIP Archiv mit 'output/' Ordner herunterladen
            </button>

            {/* Direct Local Disk Save (File System Access API) */}
            <button
              onClick={handleDirectDiskSave}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Speichert direkt im Dateisystem in einen 'output'-Ordner"
            >
              <FolderDown className="w-4 h-4 text-amber-400" />
              Direkt im Ordnerpfad speichern (Directory Picker)
            </button>

            {/* Import into Local PWA Gallery */}
            {onImportToLocalGallery && (
              <button
                onClick={() => onImportToLocalGallery(allVariants)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Alle in die Lokale Galerie übernehmen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
