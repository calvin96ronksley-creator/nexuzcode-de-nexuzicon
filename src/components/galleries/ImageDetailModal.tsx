import React, { useState } from 'react';
import {
  X,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CloudUpload,
  CloudCheck,
  Download,
  Layers,
  Tag as TagIcon,
  Plus,
  Trash2,
  Calendar,
  HardDrive,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { GalleryItem } from '../../types';

interface ImageDetailModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onUpdateTags: (id: string, newTags: string[]) => void;
  onToggleSync?: (id: string) => void;
  onDownloadToLocal?: (item: GalleryItem) => void;
  onDelete?: (id: string) => void;
  onSendToConverter?: (item: GalleryItem) => void;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  item,
  onClose,
  onVote,
  onUpdateTags,
  onToggleSync,
  onDownloadToLocal,
  onDelete,
  onSendToConverter,
}) => {
  const [newTagInput, setNewTagInput] = useState('');

  if (!item) return null;

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !item.tags.includes(clean)) {
      onUpdateTags(item.id, [...item.tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(
      item.id,
      item.tags.filter((t) => t !== tagToRemove)
    );
  };

  const netVotes = item.upvotes - item.downvotes;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}.${item.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image Display */}
        <div className="md:w-3/5 bg-slate-950 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-800 min-h-[300px]">
          <img
            src={item.url}
            alt={item.title}
            className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg select-none"
          />
        </div>

        {/* Right: Info & Actions */}
        <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-indigo-950/70 text-indigo-400 border border-indigo-800/50">
                  {item.format}
                </span>
                {item.purposePreset && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                    {item.purposePreset}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {item.source === 'local'
                    ? 'Lokale Galerie'
                    : item.source === 'online'
                    ? 'Online devicons'
                    : item.source === 'remote'
                    ? 'Remote URL'
                    : 'KI Studio'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">{item.title}</h2>
              {item.notes && (
                <p className="text-xs text-slate-400 mt-1 italic">{item.notes}</p>
              )}
            </div>

            {/* Voting & Popularity Metriken */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onVote(item.id, 'up')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                    item.userVote === 'up'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-semibold">{item.upvotes}</span>
                </button>
                <button
                  onClick={() => onVote(item.id, 'down')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                    item.userVote === 'down'
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-xs font-semibold">{item.downvotes}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-white">{item.viewCount}</span>
                  <span className="text-slate-500 text-[11px]">Aufrufe</span>
                </div>
              </div>
            </div>

            {/* File Info Matrix */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Abmessungen</span>
                <span className="font-mono text-slate-200 font-medium">
                  {item.dimensions.width} × {item.dimensions.height} px
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Dateigröße</span>
                <span className="font-mono text-slate-200 font-medium">
                  {(item.fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Hinzugefügt</span>
                <span className="text-slate-200 font-medium">
                  {new Date(item.createdAt).toLocaleDateString('de-DE')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Netto-Beliebtheit</span>
                <span className="font-semibold text-indigo-400">
                  {netVotes > 0 ? `+${netVotes}` : netVotes} Punkte
                </span>
              </div>
            </div>

            {/* Tags Management */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Tags ({item.tags.length})
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-24 overflow-y-auto">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400 text-slate-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Neuer Tag (z.B. icon, react, banner)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Hinzufügen
                </button>
              </form>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            {/* OneDrive-like cloud sync action */}
            {item.source === 'local' && onToggleSync && (
              <button
                onClick={() => onToggleSync(item.id)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  item.isSyncedToOnline
                    ? 'bg-sky-950/60 border-sky-800 text-sky-300 hover:bg-sky-900/60'
                    : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
                }`}
              >
                {item.isSyncedToOnline ? (
                  <>
                    <CloudCheck className="w-4 h-4 text-sky-400" />
                    In Online-Galerie synchronisiert (Klicken zum Trennen)
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    In Online Galerie hochladen (OneDrive Sync)
                  </>
                )}
              </button>
            )}

            {/* Download Online to Local */}
            {item.source === 'online' && onDownloadToLocal && (
              <button
                onClick={() => onDownloadToLocal(item)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                In Lokale Galerie herunterladen & offline sichern
              </button>
            )}

            {/* Remote image caching */}
            {item.source === 'remote' && onDownloadToLocal && (
              <button
                onClick={() => onDownloadToLocal(item)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <HardDrive className="w-4 h-4" />
                In Lokale Galerie kopieren
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              {onSendToConverter && (
                <button
                  onClick={() => {
                    onSendToConverter(item);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 transition"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Konverter / Resizer
                </button>
              )}
            </div>

            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Dieses Bild wirklich aus der Galerie entfernen?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/30 text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Aus Galerie löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
