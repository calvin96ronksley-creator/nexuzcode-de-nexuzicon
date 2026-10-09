import { GalleryItem } from '../types';
import { initialDevicons } from './devicons';

const DB_NAME = 'NexusPixDB';
const DB_VERSION = 1;
const STORE_NAME = 'gallery_items';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('upvotes', 'upvotes', { unique: false });
        store.createIndex('viewCount', 'viewCount', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Initial seed local items (sample photography, banner, icons)
const initialSeedItems: GalleryItem[] = [
  {
    id: 'seed-local-1',
    title: 'Neon Cyberpunk Skyline',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1024&q=80',
    source: 'local',
    isSyncedToOnline: true,
    isLocalCached: true,
    format: 'jpg',
    dimensions: { width: 1024, height: 683 },
    fileSize: 412000,
    tags: ['wallpaper', 'cyberpunk', 'neon', 'city'],
    upvotes: 42,
    downvotes: 2,
    viewCount: 184,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    purposePreset: 'Hintergrund',
    notes: 'Lokales Originalbild mit aktivierter Cloud-Synchronisierung',
  },
  {
    id: 'seed-local-2',
    title: 'Minimalist Vector Mountain Icon',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=512&q=80',
    source: 'local',
    isSyncedToOnline: false,
    isLocalCached: true,
    format: 'png',
    dimensions: { width: 512, height: 512 },
    fileSize: 184000,
    tags: ['icon', 'nature', 'landscape', 'minimal'],
    upvotes: 29,
    downvotes: 1,
    viewCount: 96,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    purposePreset: 'Icon',
    notes: 'Lokales App-Icon',
  },
  {
    id: 'seed-local-3',
    title: 'Tech Header Glow Banner',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
    source: 'local',
    isSyncedToOnline: true,
    isLocalCached: true,
    format: 'webp',
    dimensions: { width: 1024, height: 384 },
    fileSize: 228000,
    tags: ['banner', 'gaming', 'retro', 'hardware'],
    upvotes: 56,
    downvotes: 3,
    viewCount: 230,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    purposePreset: 'Banner',
    notes: 'Social Media & Header Banner',
  },
  {
    id: 'seed-remote-1',
    title: 'Remote Aurora Borealis',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1024&q=80',
    remoteSourceUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7',
    source: 'remote',
    isSyncedToOnline: false,
    isLocalCached: true,
    format: 'jpg',
    dimensions: { width: 1024, height: 683 },
    fileSize: 380000,
    tags: ['remote-url', 'aurora', 'night', 'stars'],
    upvotes: 78,
    downvotes: 4,
    viewCount: 312,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    purposePreset: 'Hintergrund',
    notes: 'Von Remote-URL bezogen und dauerhaft lokal im Speicher abgelegt',
  },
];

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      let items: GalleryItem[] = request.result || [];
      // If store is completely empty, initialize with default seed + devicons
      if (items.length === 0) {
        items = [...initialSeedItems, ...initialDevicons];
        const writeTx = db.transaction(STORE_NAME, 'readwrite');
        const writeStore = writeTx.objectStore(STORE_NAME);
        for (const it of items) {
          writeStore.put(it);
        }
        await new Promise((res) => {
          writeTx.oncomplete = res;
        });
      }
      resolve(items);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateVote(
  id: string,
  direction: 'up' | 'down'
): Promise<GalleryItem | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as GalleryItem;
      if (!item) {
        resolve(null);
        return;
      }

      const prevVote = item.userVote;

      if (direction === 'up') {
        if (prevVote === 'up') {
          // Toggle off
          item.upvotes = Math.max(0, item.upvotes - 1);
          item.userVote = null;
        } else {
          item.upvotes += 1;
          if (prevVote === 'down') {
            item.downvotes = Math.max(0, item.downvotes - 1);
          }
          item.userVote = 'up';
        }
      } else {
        if (prevVote === 'down') {
          // Toggle off
          item.downvotes = Math.max(0, item.downvotes - 1);
          item.userVote = null;
        } else {
          item.downvotes += 1;
          if (prevVote === 'up') {
            item.upvotes = Math.max(0, item.upvotes - 1);
          }
          item.userVote = 'down';
        }
      }

      store.put(item);
      tx.oncomplete = () => resolve(item);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function recordView(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as GalleryItem;
      if (item) {
        item.viewCount = (item.viewCount || 0) + 1;
        store.put(item);
      }
      resolve();
    };

    getReq.onerror = () => resolve();
  });
}

export async function toggleSyncOnline(id: string): Promise<GalleryItem | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as GalleryItem;
      if (!item) {
        resolve(null);
        return;
      }

      item.isSyncedToOnline = !item.isSyncedToOnline;
      store.put(item);
      tx.oncomplete = () => resolve(item);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function downloadOnlineToLocal(onlineItem: GalleryItem): Promise<GalleryItem> {
  const localCopy: GalleryItem = {
    ...onlineItem,
    id: `downloaded-local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    source: 'local',
    isSyncedToOnline: true,
    isLocalCached: true,
    createdAt: new Date().toISOString(),
    notes: `Heruntergeladen von Online-Plattform (devicons) am ${new Date().toLocaleDateString('de-DE')}`,
  };

  await saveGalleryItem(localCopy);
  return localCopy;
}

export async function cacheRemoteImageLocally(remoteUrl: string, title?: string, tags?: string[]): Promise<GalleryItem> {
  // Use proxy to avoid CORS and get blob
  const proxyUrl = `/api/proxy-remote?url=${encodeURIComponent(remoteUrl)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Fehler beim Herunterladen der Remote-URL (${res.status})`);
  }

  const blob = await res.blob();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const mime = blob.type || 'image/png';
      let format = 'png';
      if (mime.includes('jpeg') || mime.includes('jpg')) format = 'jpg';
      else if (mime.includes('webp')) format = 'webp';
      else if (mime.includes('svg')) format = 'svg';
      else if (mime.includes('gif')) format = 'gif';

      const img = new Image();
      img.onload = async () => {
        const item: GalleryItem = {
          id: `remote-cached-${Date.now()}`,
          title: title || `Remote Bild #${Math.floor(Math.random() * 9000 + 1000)}`,
          url: base64Data,
          remoteSourceUrl: remoteUrl,
          source: 'remote',
          isSyncedToOnline: false,
          isLocalCached: true,
          format,
          dimensions: {
            width: img.naturalWidth || 800,
            height: img.naturalHeight || 600,
          },
          fileSize: blob.size,
          tags: tags && tags.length > 0 ? tags : ['remote', 'gecached', format],
          upvotes: 0,
          downvotes: 0,
          viewCount: 1,
          createdAt: new Date().toISOString(),
          purposePreset: 'Hintergrund',
          notes: `Permanenter lokaler Cache der Remote-URL: ${remoteUrl}`,
        };

        await saveGalleryItem(item);
        resolve(item);
      };

      img.onerror = () => {
        // Fallback dimensions if image element cannot measure
        const item: GalleryItem = {
          id: `remote-cached-${Date.now()}`,
          title: title || `Remote Bild`,
          url: base64Data,
          remoteSourceUrl: remoteUrl,
          source: 'remote',
          isSyncedToOnline: false,
          isLocalCached: true,
          format,
          dimensions: { width: 512, height: 512 },
          fileSize: blob.size,
          tags: tags && tags.length > 0 ? tags : ['remote', 'gecached'],
          upvotes: 0,
          downvotes: 0,
          viewCount: 1,
          createdAt: new Date().toISOString(),
          purposePreset: 'Standard',
        };
        saveGalleryItem(item).then(() => resolve(item));
      };

      img.src = base64Data;
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen des Bild-Blobs'));
  });
}
