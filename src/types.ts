export type ImageSource = 'local' | 'online' | 'remote' | 'ai';

export type PurposePreset = 'Hintergrund' | 'Banner' | 'Icon' | 'Social-Media-Post' | 'Standard';

export interface GalleryItem {
  id: string;
  title: string;
  url: string; // Data URL, Blob URL or Remote URL
  thumbnailUrl?: string;
  source: ImageSource;
  remoteSourceUrl?: string;
  isSyncedToOnline: boolean;
  isLocalCached: boolean;
  format: string; // 'png' | 'jpg' | 'jpeg' | 'ico' | 'svg' | 'gif' | 'webp' | 'tiff'
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number; // bytes
  tags: string[];
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  viewCount: number;
  createdAt: string;
  purposePreset?: PurposePreset;
  aiPrompt?: string;
  notes?: string;
}

export type DimensionPreset =
  | '8x8'
  | '16x16'
  | '32x32'
  | '64x64'
  | '128x128'
  | '256x256'
  | '512x512'
  | '1024x1024'
  | 'original';

export type SupportedFormat =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'ico'
  | 'svg'
  | 'gif'
  | 'webp'
  | 'tiff'
  | 'bmp';

export interface ConvertedVariant {
  fileName: string;
  relativePath: string; // e.g. "output/testbild-64x64.jpeg"
  width: number;
  height: number;
  format: SupportedFormat;
  blob: Blob;
  dataUrl: string;
  fileSize: number;
}

export interface BatchFileItem {
  id: string;
  file?: File;
  name: string;
  originalFormat: string;
  originalDimensions: {
    width: number;
    height: number;
  };
  originalSize: number;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
  variants: ConvertedVariant[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedPrompt?: string;
  timestamp: string;
}
