import { GalleryItem } from '../types';

// Helper to create clean inline SVG Data URLs for devicons
function svgDataUrl(svgContent: string): string {
  const encoded = encodeURIComponent(svgContent.trim());
  return `data:image/svg+xml;utf8,${encoded}`;
}

export const initialDevicons: GalleryItem[] = [
  {
    id: 'devicon-react',
    title: 'React.js',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" width="512" height="512">
        <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
        <g stroke="#61dafb" stroke-width="1" fill="none">
          <ellipse rx="11" ry="4.2"/>
          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
        </g>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1040,
    tags: ['devicon', 'react', 'frontend', 'javascript', 'ui'],
    upvotes: 142,
    downvotes: 4,
    viewCount: 620,
    createdAt: '2026-09-01T10:00:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Official React UI Icon',
  },
  {
    id: 'devicon-typescript',
    title: 'TypeScript',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <rect width="128" height="128" rx="16" fill="#3178c6"/>
        <path fill="#ffffff" d="M72.3 84.8c1.7 1.8 4 2.8 6.7 2.8 2.6 0 4.5-.8 5.7-2.3 1.2-1.5 1.8-3.4 1.8-5.6 0-2.3-.7-4.2-2.1-5.7-1.4-1.5-3.8-3.1-7.1-4.7-4.4-2.1-7.7-4.5-9.8-7.1-2.1-2.6-3.2-5.9-3.2-9.8 0-4.7 1.7-8.5 5-11.4 3.3-2.9 7.7-4.4 13.2-4.4 4.5 0 8.4 1 11.7 3.1 3.3 2.1 5.6 5.2 6.8 9.3l-9.2 4.4c-.8-2.5-2-4.3-3.8-5.3-1.8-1-4-1.5-6.5-1.5-2.5 0-4.4.6-5.7 1.9-1.3 1.3-1.9 2.9-1.9 4.9 0 1.9.7 3.4 2 4.6 1.3 1.2 3.6 2.6 6.8 4.1 4.7 2.2 8.2 4.7 10.4 7.4 2.2 2.7 3.3 6.1 3.3 10.2 0 5.2-1.8 9.3-5.3 12.3-3.5 3-8.3 4.5-14.4 4.5-5.2 0-9.8-1.3-13.8-4-4-2.7-6.7-6.6-8.1-11.8l9.8-3.9zM22 47.5h35.2v9.3H45.4v46.9H33.8V56.8H22v-9.3z"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1220,
    tags: ['devicon', 'typescript', 'types', 'programming', 'code'],
    upvotes: 128,
    downvotes: 3,
    viewCount: 489,
    createdAt: '2026-09-02T12:00:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - TypeScript Standard Emblem',
  },
  {
    id: 'devicon-python',
    title: 'Python',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <path fill="#387eb8" d="M63.5 4c-16.1 0-25.5 7-25.5 17.5v12.2h26.2v3.5H23.5C12.3 37.2 4 45.4 4 60.8c0 14.8 9.3 22.8 21.6 22.8h8.7v-12.8c0-12.6 10.8-23.7 23.4-23.7h26.2V32.9C83.9 16 75.3 4 63.5 4zm-7.6 7.4c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5 2-4.5 4.5-4.5z"/>
        <path fill="#ffe052" d="M64.5 124c16.1 0 25.5-7 25.5-17.5V94.3H63.8v-3.5h40.7c11.2 0 19.5-8.2 19.5-23.6 0-14.8-9.3-22.8-21.6-22.8h-8.7v12.8c0 12.6-10.8 23.7-23.4 23.7H44.1v14.2c0 16.9 8.6 28.9 20.4 28.9zm7.6-7.4c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1480,
    tags: ['devicon', 'python', 'ai', 'data', 'backend'],
    upvotes: 115,
    downvotes: 2,
    viewCount: 450,
    createdAt: '2026-09-03T14:30:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Python Dual Tone Mascot',
  },
  {
    id: 'devicon-docker',
    title: 'Docker',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <path fill="#2496ed" d="M125 55.4c-2.4-.9-7.3-1.6-12.7.7-1.1.5-2.2 1.2-3.1 2-2.1-4.7-6.2-7.8-11.4-8.7-1.7-.3-3.4-.3-5.1-.1l-1.9.4.6 1.9c1.9 6.2.8 11.2-2.7 14.8-2.6 2.6-6.4 4.1-10.7 4.1H4.8C2.2 70.5 0 72.7 0 75.3c1.7 18.2 14.3 35.1 40 37.1 36.3 2.8 61.2-12.3 71.9-42.5 5.8.5 10.9-1.9 14.4-6.8 1.1-1.6 1.7-3.4 1.7-5.2 0-.9-.3-1.7-.8-2.3l-2.2-.2zm-86.4-1.7h11.2v11.2H38.6V53.7zm14.3 0h11.2v11.2H52.9V53.7zm14.3 0h11.2v11.2H67.2V53.7zm-28.6-14.3h11.2v11.2H38.6V39.4zm14.3 0h11.2v11.2H52.9V39.4zm14.3 0h11.2v11.2H67.2V39.4zm-28.6-14.3h11.2v11.2H38.6V25.1zm14.3 0h11.2v11.2H52.9V25.1zm14.3 0h11.2v11.2H67.2V25.1z"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1610,
    tags: ['devicon', 'docker', 'devops', 'container', 'cloud'],
    upvotes: 98,
    downvotes: 1,
    viewCount: 390,
    createdAt: '2026-09-04T09:15:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Docker Container Whale',
  },
  {
    id: 'devicon-vite',
    title: 'Vite Bundler',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <defs>
          <linearGradient id="vite-a" x1="5.6%" x2="94.4%" y1="11.4%" y2="88.6%">
            <stop offset="0%" stop-color="#41d1ff"/>
            <stop offset="100%" stop-color="#bd34fe"/>
          </linearGradient>
          <linearGradient id="vite-b" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#ffea83"/>
            <stop offset="8.3%" stop-color="#ffdd35"/>
            <stop offset="100%" stop-color="#ffa800"/>
          </linearGradient>
        </defs>
        <path fill="url(#vite-a)" d="M121.2 18.3L67.1 118.9c-1.3 2.4-4.8 2.4-6.1 0L6.8 18.3c-1.4-2.6.7-5.8 3.7-5.5l52.6 6.3c.6.1 1.2.1 1.8 0l52.6-6.3c3-.3 5.1 2.9 3.7 5.5z"/>
        <path fill="url(#vite-b)" d="M83.8 14.8L44.5 62.5h19.6l-14.7 48.6 44.4-53.7H74.3l9.5-42.6z"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1350,
    tags: ['devicon', 'vite', 'build', 'tool', 'fast'],
    upvotes: 165,
    downvotes: 2,
    viewCount: 710,
    createdAt: '2026-09-05T08:00:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Lightning Vite Tool Icon',
  },
  {
    id: 'devicon-tailwind',
    title: 'Tailwind CSS',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <path fill="#38bdf8" d="M64 25.6C44.8 25.6 33.6 35.2 30.4 54.4c7.2-9.6 15.6-13.2 25.2-10.8 5.5 1.4 9.4 5.3 13.8 9.7C76.5 60.5 85.9 70 102.4 70c19.2 0 30.4-9.6 33.6-28.8-7.2 9.6-15.6 13.2-25.2 10.8-5.5-1.4-9.4-5.3-13.8-9.7C89.9 35.1 80.5 25.6 64 25.6zM25.6 57.6C6.4 57.6-4.8 67.2-8 86.4c7.2-9.6 15.6-13.2 25.2-10.8 5.5 1.4 9.4 5.3 13.8 9.7 7.1 7.2 16.5 16.7 33 16.7 19.2 0 30.4-9.6 33.6-28.8-7.2 9.6-15.6 13.2-25.2 10.8-5.5-1.4-9.4-5.3-13.8-9.7-7.1-7.2-16.5-16.7-33-16.7z"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1180,
    tags: ['devicon', 'tailwind', 'css', 'design', 'styling'],
    upvotes: 139,
    downvotes: 5,
    viewCount: 540,
    createdAt: '2026-09-06T15:20:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Tailwind CSS Wave Emblem',
  },
  {
    id: 'devicon-rust',
    title: 'Rust Lang',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <rect width="128" height="128" rx="20" fill="#000000"/>
        <path fill="#f74c00" d="M64 24a40 40 0 100 80 40 40 0 000-80zm0 10a30 30 0 110 60 30 30 0 010-60zm-15 15h14c6 0 10 3 10 9 0 4-3 7-7 8l8 13h-7l-7-12h-5v12h-6v-30zm6 5v8h8c3 0 5-1 5-4s-2-4-5-4h-8z"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1110,
    tags: ['devicon', 'rust', 'systems', 'memory-safe', 'fast'],
    upvotes: 180,
    downvotes: 1,
    viewCount: 820,
    createdAt: '2026-09-07T11:00:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Rust Systems Gear Icon',
  },
  {
    id: 'devicon-linux',
    title: 'Linux Penguin',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">
        <circle cx="64" cy="64" r="60" fill="#facc15"/>
        <path fill="#1e293b" d="M64 22c-15 0-25 14-25 29 0 7 2 15 5 21-8 6-14 18-14 29 0 7 8 13 22 13h24c14 0 22-6 22-13 0-11-6-23-14-29 3-6 5-14 5-21 0-15-10-29-25-29z"/>
        <ellipse cx="64" cy="74" rx="18" ry="24" fill="#ffffff"/>
        <circle cx="56" cy="44" r="4" fill="#ffffff"/>
        <circle cx="72" cy="44" r="4" fill="#ffffff"/>
        <circle cx="56" cy="44" r="2" fill="#000000"/>
        <circle cx="72" cy="44" r="2" fill="#000000"/>
        <polygon points="64,48 58,56 70,56" fill="#f97316"/>
      </svg>
    `),
    source: 'online',
    isSyncedToOnline: true,
    isLocalCached: false,
    format: 'svg',
    dimensions: { width: 512, height: 512 },
    fileSize: 1290,
    tags: ['devicon', 'linux', 'os', 'open-source', 'kernel'],
    upvotes: 210,
    downvotes: 4,
    viewCount: 950,
    createdAt: '2026-09-08T16:45:00.000Z',
    purposePreset: 'Icon',
    notes: 'devicons.nexuzcode.de - Tux Linux Vector',
  },
];
