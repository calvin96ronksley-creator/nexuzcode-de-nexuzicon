/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Images,
  Sparkles,
  Layers,
  Cloud,
  CheckCircle,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { GalleriesView } from './components/galleries/GalleriesView';
import { AIStudioView } from './components/ai/AIStudioView';
import { BatchConverterView } from './components/converter/BatchConverterView';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import {
  cacheRemoteImageLocally,
  deleteGalleryItem,
  downloadOnlineToLocal,
  getAllGalleryItems,
  recordView,
  saveGalleryItem,
  toggleSyncOnline,
  updateVote,
} from './services/storage';
import { ConvertedVariant, GalleryItem, PurposePreset } from './types';

type MainViewTab = 'galleries' | 'ai-studio' | 'converter';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainViewTab>('galleries');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cross-view item sharing (e.g. Gallery -> Batch Converter)
  const [itemForConverter, setItemForConverter] = useState<{
    url: string;
    title: string;
    format: string;
  } | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const loaded = await getAllGalleryItems();
        setItems(loaded);
      } catch (err) {
        console.error('Fehler beim Laden der Galerie aus IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Voting
  const handleVote = async (id: string, direction: 'up' | 'down') => {
    try {
      const updated = await updateVote(id, direction);
      if (updated) {
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      }
    } catch (err) {
      console.error('Fehler beim Abstimmen:', err);
    }
  };

  // Handle View Counter
  const handleRecordView = async (id: string) => {
    try {
      await recordView(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, viewCount: item.viewCount + 1 } : item))
      );
    } catch (err) {
      console.error('Fehler beim Zählen der Aufrufe:', err);
    }
  };

  // Handle Tags Update
  const handleUpdateTags = async (id: string, newTags: string[]) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, tags: newTags };
    await saveGalleryItem(updated);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    showToast('Tags aktualisiert ✓');
  };

  // Handle OneDrive-like Cloud Sync toggle
  const handleToggleSync = async (id: string) => {
    try {
      const updated = await toggleSyncOnline(id);
      if (updated) {
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        showToast(
          updated.isSyncedToOnline
            ? 'Bild erfolgreich mit Online-Galerie synchronisiert (OneDrive-Modus)'
            : 'Synchronisierung mit Online-Galerie getrennt'
        );
      }
    } catch (err) {
      console.error('Fehler beim Synchronisieren:', err);
    }
  };

  // Handle Download from Online to Local Galerie
  const handleDownloadToLocal = async (onlineItem: GalleryItem) => {
    try {
      const localItem = await downloadOnlineToLocal(onlineItem);
      setItems((prev) => [localItem, ...prev]);
      showToast(`'${onlineItem.title}' in Lokale Galerie heruntergeladen & offline gespeichert!`);
    } catch (err) {
      console.error('Fehler beim Herunterladen in lokale Galerie:', err);
    }
  };

  // Handle Remote URL permanent caching
  const handleCacheRemoteUrl = async (url: string, title?: string, tags?: string[]) => {
    const cachedItem = await cacheRemoteImageLocally(url, title, tags);
    setItems((prev) => [cachedItem, ...prev]);
    showToast('Remote Bild erfolgreich heruntergeladen und dauerhaft lokal zwischengespeichert!');
  };

  // Handle Local File Upload from user's disk
  const handleUploadLocalFile = async (file: File, purpose: PurposePreset = 'Standard') => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';

      const img = new Image();
      img.onload = async () => {
        const newItem: GalleryItem = {
          id: `local-upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url: base64Data,
          source: 'local',
          isSyncedToOnline: false,
          isLocalCached: true,
          format: ext,
          dimensions: {
            width: img.naturalWidth || 512,
            height: img.naturalHeight || 512,
          },
          fileSize: file.size,
          tags: ['lokal', ext, purpose.toLowerCase()],
          upvotes: 0,
          downvotes: 0,
          viewCount: 1,
          createdAt: new Date().toISOString(),
          purposePreset: purpose,
          notes: 'Vom lokalen Dateisystem hochgeladen',
        };

        await saveGalleryItem(newItem);
        setItems((prev) => [newItem, ...prev]);
        showToast(`'${file.name}' in Lokale Galerie importiert!`);
      };
      img.src = base64Data;
    };
    reader.readAsDataURL(file);
  };

  // Handle Item Deletion
  const handleDeleteItem = async (id: string) => {
    await deleteGalleryItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Bild aus Galerie entfernt.');
  };

  // Cross-Navigation: Send an item into Batch Converter
  const handleSendToConverter = (item: GalleryItem) => {
    setItemForConverter({
      url: item.url,
      title: item.title,
      format: item.format,
    });
    setActiveTab('converter');
    showToast(`'${item.title}' an den Batch-Konverter übergeben!`);
  };

  // Import Converted Variants from Batch Converter into Local Gallery
  const handleImportConvertedToGallery = async (variants: ConvertedVariant[]) => {
    for (const v of variants) {
      const newItem: GalleryItem = {
        id: `converted-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: v.fileName.replace(/\.[^/.]+$/, ''),
        url: v.dataUrl,
        source: 'local',
        isSyncedToOnline: false,
        isLocalCached: true,
        format: v.format,
        dimensions: { width: v.width, height: v.height },
        fileSize: v.fileSize,
        tags: ['konvertiert', `${v.width}x${v.height}`, v.format],
        upvotes: 0,
        downvotes: 0,
        viewCount: 1,
        createdAt: new Date().toISOString(),
        purposePreset: 'Icon',
        notes: `Batch-konvertiert zu ${v.relativePath}`,
      };
      await saveGalleryItem(newItem);
      setItems((prev) => [newItem, ...prev]);
    }
    showToast(`${variants.length} konvertierte Varianten in die Lokale Galerie übernommen!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-indigo-400 animate-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Images className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">NexusPix</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  STUDIO PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Gallerien • Cloud-Sync • KI-Generator • Batch-Konverter
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('galleries')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'galleries'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Images className="w-4 h-4" />
              Gallerien Hub
            </button>
            <button
              onClick={() => setActiveTab('ai-studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ai-studio'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              KI-Studio & Chatbot
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'converter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Batch Konverter & Resizer
            </button>
          </nav>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2.5">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab('galleries');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold ${
                activeTab === 'galleries' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              <Images className="w-4 h-4" />
              Gallerien Hub (Lokal, devicons, Remote)
            </button>
            <button
              onClick={() => {
                setActiveTab('ai-studio');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold ${
                activeTab === 'ai-studio' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              KI-Studio & Chatbot
            </button>
            <button
              onClick={() => {
                setActiveTab('converter');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold ${
                activeTab === 'converter' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Batch Konverter & Resizer (QFileDialog)
            </button>
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Initialisiere NexusPix PWA Datenbank...</span>
          </div>
        ) : (
          <>
            {activeTab === 'galleries' && (
              <GalleriesView
                items={items}
                onVote={handleVote}
                onRecordView={handleRecordView}
                onUpdateTags={handleUpdateTags}
                onToggleSync={handleToggleSync}
                onDownloadToLocal={handleDownloadToLocal}
                onCacheRemoteUrl={handleCacheRemoteUrl}
                onUploadLocalFile={handleUploadLocalFile}
                onDelete={handleDeleteItem}
                onSendToConverter={handleSendToConverter}
              />
            )}

            {activeTab === 'ai-studio' && (
              <AIStudioView
                onSaveToGallery={async (newItem) => {
                  await saveGalleryItem(newItem);
                  setItems((prev) => [newItem, ...prev]);
                  showToast(`'${newItem.title}' in Galerie gesichert!`);
                }}
                onSendToConverter={handleSendToConverter}
              />
            )}

            {activeTab === 'converter' && (
              <BatchConverterView
                initialItemToConvert={itemForConverter}
                onImportToLocalGallery={handleImportConvertedToGallery}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">NexusPix Studio PWA</span>
            <span>•</span>
            <span>Online & Offline Bild-Suite</span>
            <span>•</span>
            <span className="text-indigo-400">devicons.nexuzcode.de</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Formate: PNG, JPG, JPEG, ICO, SVG, GIF, WEBP, TIFF, BMP</span>
            <span>•</span>
            <span>Skalierung: 8x8 bis 1024x1024</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
