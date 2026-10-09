import React from 'react';
import {
  Eye,
  ThumbsUp,
  ThumbsDown,
  CloudUpload,
  CloudCheck,
  Download,
  Database,
  Globe,
  Sparkles,
  Maximize2,
  Trash2,
  Tag as TagIcon,
  Layers,
} from 'lucide-react';
import { GalleryItem } from '../../types';

interface GalleryCardProps {
  item: GalleryItem;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onOpenDetail: (item: GalleryItem) => void;
  onToggleSync?: (id: string) => void;
  onDownloadToLocal?: (item: GalleryItem) => void;
  onCacheRemote?: (item: GalleryItem) => void;
  onDelete?: (id: string) => void;
  onSendToConverter?: (item: GalleryItem) => void;
  onTagClick?: (tag: string) => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
  item,
  onVote,
  onOpenDetail,
  onToggleSync,
  onDownloadToLocal,
  onDelete,
  onSendToConverter,
  onTagClick,
}) => {
  const netVotes = item.upvotes - item.downvotes;

  const sourceBadge = () => {
    switch (item.source) {
      case 'local':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Database className="w-2.5 h-2.5" />
            Lokal
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Globe className="w-2.5 h-2.5" />
            Online (devicons)
          </span>
        );
      case 'remote':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Globe className="w-2.5 h-2.5" />
            Remote {item.isLocalCached && '• Gecached'}
          </span>
        );
      case 'ai':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/15 text-pink-400 border border-pink-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            KI Studio
          </span>
        );
    }
  };

  const purposeBadge = () => {
    if (!item.purposePreset || item.purposePreset === 'Standard') return null;
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
        {item.purposePreset}
      </span>
    );
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 shadow-md hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden">
      {/* Top Media Container */}
      <div
        onClick={() => onOpenDetail(item)}
        className="relative w-full aspect-square bg-slate-950/60 overflow-hidden cursor-pointer flex items-center justify-center p-3 select-none"
      >
        <img
          src={item.url}
          alt={item.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover overlay with quick preview */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-medium border border-slate-700 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            Vorschau & Details
          </span>
        </div>

        {/* Badges on top of thumbnail */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {sourceBadge()}
          {purposeBadge()}
        </div>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900/90 text-slate-300 border border-slate-700/80 uppercase">
            {item.format}
          </span>
        </div>

        {/* Resolution tag */}
        <div className="absolute bottom-2 left-2.5 z-10">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950/80 text-slate-400 border border-slate-800 backdrop-blur-xs">
            {item.dimensions.width}×{item.dimensions.height}
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onOpenDetail(item)}
              className="text-sm font-semibold text-white truncate cursor-pointer hover:text-indigo-400 transition"
              title={item.title}
            >
              {item.title}
            </h3>
            {/* Sync Badge / OneDrive action */}
            {item.source === 'local' && onToggleSync && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSync(item.id);
                }}
                className={`p-1 rounded-lg border transition ${
                  item.isSyncedToOnline
                    ? 'bg-sky-950/50 border-sky-800 text-sky-400 hover:bg-sky-900/60'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-700'
                }`}
                title={
                  item.isSyncedToOnline
                    ? 'In Online-Galerie synchronisiert (OneDrive-Modus)'
                    : 'In Online-Galerie hochladen'
                }
              >
                {item.isSyncedToOnline ? (
                  <CloudCheck className="w-3.5 h-3.5" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {item.source === 'online' && onDownloadToLocal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadToLocal(item);
                }}
                className="p-1 rounded-lg border bg-slate-800/60 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-700 transition"
                title="In Lokale Galerie herunterladen (OneDrive-Sync)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 border border-slate-700/60 transition"
              >
                <TagIcon className="w-2.5 h-2.5 opacity-60" />
                #{tag}
              </button>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Voting & Views Footer */}
        <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
          {/* Voting Box */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onVote(item.id, 'up')}
              className={`p-1 rounded transition ${
                item.userVote === 'up'
                  ? 'text-indigo-400 bg-indigo-950/60 font-bold'
                  : 'text-slate-400 hover:text-indigo-300'
              }`}
              title="Gefällt mir (Upvote)"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <span
              className={`px-1 font-mono text-[11px] font-semibold ${
                netVotes > 0
                  ? 'text-indigo-300'
                  : netVotes < 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {netVotes}
            </span>
            <button
              onClick={() => onVote(item.id, 'down')}
              className={`p-1 rounded transition ${
                item.userVote === 'down'
                  ? 'text-rose-400 bg-rose-950/60 font-bold'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
              title="Gefällt mir nicht (Downvote)"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Count */}
          <div
            className="flex items-center gap-1.5 text-[11px] text-slate-400"
            title={`${item.viewCount} Mal angesehen`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{item.viewCount}</span>
          </div>

          {/* Action icon: Send to Converter */}
          <div className="flex items-center gap-1">
            {onSendToConverter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToConverter(item);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                title="Im Konverter skalieren / umwandeln"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
