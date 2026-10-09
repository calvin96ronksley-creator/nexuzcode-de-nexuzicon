import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Upload,
  Globe,
  Database,
  Cloud,
  CloudCheck,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  X,
  Tag as TagIcon,
  DownloadCloud,
} from 'lucide-react';
import { GalleryCard } from './GalleryCard';
import { ImageDetailModal } from './ImageDetailModal';
import { GalleryItem, ImageSource, PurposePreset } from '../../types';

interface GalleriesViewProps {
  items: GalleryItem[];
  onVote: (id: string, direction: 'up' | 'down') => void;
  onRecordView: (id: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onToggleSync: (id: string) => void;
  onDownloadToLocal: (item: GalleryItem) => void;
  onCacheRemoteUrl: (url: string, title?: string, tags?: string[]) => Promise<void>;
  onUploadLocalFile: (file: File, purpose?: PurposePreset) => Promise<void>;
  onDelete: (id: string) => void;
  onSendToConverter: (item: GalleryItem) => void;
}

type TabKey = 'all' | 'local' | 'online' | 'remote' | 'ai';
type SortOption = 'votes' | 'views' | 'newest' | 'name';

export const GalleriesView: React.FC<GalleriesViewProps> = ({
  items,
  onVote,
  onRecordView,
  onUpdateTags,
  onToggleSync,
  onDownloadToLocal,
  onCacheRemoteUrl,
  onUploadLocalFile,
  onDelete,
  onSendToConverter,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('votes');

  // Modal states
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<GalleryItem | null>(null);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteUrlInput, setRemoteUrlInput] = useState('');
  const [remoteTitleInput, setRemoteTitleInput] = useState('');
  const [remoteTagsInput, setRemoteTagsInput] = useState('');
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  // Hidden file input for uploading local images
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      item.tags.forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Filter & sort logic
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // Tab filter
      if (activeTab === 'local' && item.source !== 'local') return false;
      if (activeTab === 'online' && item.source !== 'online') return false;
      if (activeTab === 'remote' && item.source !== 'remote') return false;
      if (activeTab === 'ai' && item.source !== 'ai') return false;

      // Format filter
      if (selectedFormat !== 'all' && item.format.toLowerCase() !== selectedFormat.toLowerCase()) {
        return false;
      }

      // Purpose filter
      if (selectedPurpose !== 'all' && item.purposePreset !== selectedPurpose) {
        return false;
      }

      // Tag filter
      if (selectedTag && !item.tags.includes(selectedTag)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(query));
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTag && !matchesNotes) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'votes') {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        return scoreB - scoreA;
      }
      if (sortBy === 'views') {
        return b.viewCount - a.viewCount;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [items, activeTab, selectedFormat, selectedPurpose, selectedTag, searchQuery, sortBy]);

  // Statistics for OneDrive sync overview
  const syncStats = useMemo(() => {
    const localCount = items.filter((i) => i.source === 'local').length;
    const syncedCount = items.filter((i) => i.source === 'local' && i.isSyncedToOnline).length;
    const onlineDeviconsCount = items.filter((i) => i.source === 'online').length;
    const remoteCachedCount = items.filter((i) => i.source === 'remote' && i.isLocalCached).length;

    return { localCount, syncedCount, onlineDeviconsCount, remoteCachedCount };
  }, [items]);

  const handleOpenDetail = (item: GalleryItem) => {
    onRecordView(item.id);
    setSelectedItemForDetail(item);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        await onUploadLocalFile(e.target.files[i]);
      }
      e.target.value = '';
    }
  };

  const handleAddRemoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrlInput.trim()) return;

    setIsRemoteLoading(true);
    setRemoteError(null);
    try {
      const tags = remoteTagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

      await onCacheRemoteUrl(remoteUrlInput.trim(), remoteTitleInput.trim() || undefined, tags);
      setShowRemoteModal(false);
      setRemoteUrlInput('');
      setRemoteTitleInput('');
      setRemoteTagsInput('');
    } catch (err: any) {
      setRemoteError(err.message || 'Fehler beim Laden des Remote-Bildes');
    } finally {
      setIsRemoteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* OneDrive-style Cloud Sync & Platform Status Header Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Cloud Sync & Gallerien Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Aktiv
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zwei-Wege-Sync (OneDrive-Prinzip): Lokale Bilder online sichern & Online-Assets offline cachen.
            </p>
          </div>
        </div>

        {/* Sync Metric Counters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs w-full md:w-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Lokal:</span>
            <span className="font-semibold text-white">{syncStats.localCount}</span>
            <span className="text-[11px] text-sky-400">({syncStats.syncedCount} synchronisiert)</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">devicons Online:</span>
            <span className="font-semibold text-white">{syncStats.onlineDeviconsCount}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Remote gecached:</span>
            <span className="font-semibold text-white">{syncStats.remoteCachedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Alle Bilder ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'local'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3 h-3 text-emerald-400" />
            Lokale Galerie ({items.filter((i) => i.source === 'local').length})
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'online'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3 h-3 text-sky-400" />
            Online Galerie (devicons) ({items.filter((i) => i.source === 'online').length})
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'remote'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LinkIcon className="w-3 h-3 text-purple-400" />
            Remote URLs Galerie ({items.filter((i) => i.source === 'remote').length})
          </button>
        </div>

        {/* Fast Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Add Local File Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Lokales Bild laden
          </button>

          {/* Add Remote URL Button */}
          <button
            onClick={() => setShowRemoteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
            Remote URL cachen
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Bilder durchsuchen nach Titel, Tags oder Beschreibung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Format Filter */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Alle Formate</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG / JPEG</option>
              <option value="webp">WEBP</option>
              <option value="ico">ICO / ICON</option>
              <option value="svg">SVG</option>
              <option value="gif">GIF</option>
              <option value="tiff">TIFF</option>
            </select>

            {/* Purpose Filter */}
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Alle Verwendungszwecke</option>
              <option value="Hintergrund">Hintergrund</option>
              <option value="Banner">Banner</option>
              <option value="Icon">Icon</option>
              <option value="Social-Media-Post">Social-Media-Post</option>
            </select>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-slate-300 py-1 pr-2 focus:outline-none cursor-pointer"
              >
                <option value="votes" className="bg-slate-900">Beliebteste (Voting)</option>
                <option value="views" className="bg-slate-900">Meistgesehen (Aufrufe)</option>
                <option value="newest" className="bg-slate-900">Neueste Zuerst</option>
                <option value="name" className="bg-slate-900">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interactive Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
              <TagIcon className="w-3 h-3" />
              Tags:
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold shrink-0"
              >
                #{selectedTag}
                <X className="w-3 h-3" />
              </button>
            )}
            {allTags.slice(0, 15).map(([tag, count]) => {
              const isSelected = selectedTag === tag;
              if (isSelected) return null;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition shrink-0"
                >
                  #{tag} <span className="opacity-50 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">Keine Bilder gefunden</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Es gibt keine Bilder, die den aktuellen Filtern entsprechen. Lade ein lokales Bild hoch, füge eine Remote-URL hinzu oder erstelle neue Bilder mit der KI!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onVote={onVote}
              onOpenDetail={handleOpenDetail}
              onToggleSync={onToggleSync}
              onDownloadToLocal={onDownloadToLocal}
              onDelete={onDelete}
              onSendToConverter={onSendToConverter}
              onTagClick={(tag) => setSelectedTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItemForDetail && (
        <ImageDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onVote={onVote}
          onUpdateTags={onUpdateTags}
          onToggleSync={onToggleSync}
          onDownloadToLocal={onDownloadToLocal}
          onDelete={onDelete}
          onSendToConverter={onSendToConverter}
        />
      )}

      {/* Remote URL Caching Modal */}
      {showRemoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Remote Bild dauerhaft lokal cachen</h3>
              </div>
              <button
                onClick={() => setShowRemoteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Gib eine Bild-URL aus dem Web ein. NexusPix lädt das Bild herunter und speichert es dauerhaft in deinem lokalen Browser-Speicher (IndexedDB), sodass es auch offline verfügbar bleibt!
            </p>

            <form onSubmit={handleAddRemoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remote Bild-URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={remoteUrlInput}
                  onChange={(e) => setRemoteUrlInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Titel / Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="z.B. Mein Web-Icon, Wallpaper..."
                  value={remoteTitleInput}
                  onChange={(e) => setRemoteTitleInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (kommagetrennt)
                </label>
                <input
                  type="text"
                  placeholder="remote, logo, banner, nature..."
                  value={remoteTagsInput}
                  onChange={(e) => setRemoteTagsInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {remoteError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {remoteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRemoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isRemoteLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition"
                >
                  {isRemoteLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Wird gecached...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-3.5 h-3.5" />
                      Lokal Cachen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
