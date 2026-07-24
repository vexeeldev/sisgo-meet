export interface User {
  name: string;
  role?: any;
  role_name?: string;
  [key: string]: any;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  return JSON.parse(stored) as User;
}

/** Generate a consistent avatar background color from a name string */
export function stringToColor(str: string): string {
  const colors = [
    '#1a73e8', '#0f9d58', '#f29900', '#d93025',
    '#7627bb', '#00897b', '#e37400', '#c2185b',
    '#1565c0', '#2e7d32',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const palettes = [
  { from: '#3f2b96', to: '#281c5f', circle: 'bg-[#5c40d6]' }, // Purple
  { from: '#0f4d44', to: '#0a3630', circle: 'bg-[#156d61]' }, // Teal
  { from: '#0b3d91', to: '#082b66', circle: 'bg-[#1254b0]' }, // Blue
  { from: '#b32e14', to: '#7d200e', circle: 'bg-[#d63f1e]' }, // Red
  { from: '#b05b0c', to: '#7d4008', circle: 'bg-[#d17015]' }, // Orange
  { from: '#145a32', to: '#0e3f23', circle: 'bg-[#1e8449]' }, // Green
  { from: '#880e4f', to: '#5e0a37', circle: 'bg-[#ad1457]' }, // Pink
];

export function getUserColors(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || 'Guest').length; i++) {
    hash = (name || 'Guest').charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
}
