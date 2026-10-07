export type BlogCategory = 
  | 'All'
  | 'SDR & DSP'
  | 'HF & DX Field'
  | 'Antenna Builds'
  | 'Satellites & Space'
  | 'Digital & FT8'
  | 'Club Events & Nets';

export interface CommentItem {
  id: string;
  callsign: string;
  name: string;
  timestamp: string;
  message: string;
  rstReport?: string; // e.g., "599", "57"
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown supported
  authorCallsign: string;
  authorName: string;
  authorQth: string; // e.g. "Seattle, WA"
  publishedAt: string; // YYYY-MM-DD
  readTimeMinutes: number;
  category: Exclude<BlogCategory, 'All'>;
  band: string; // e.g. "20m (14.060 MHz)"
  frequencyHz?: number;
  qthGrid: string; // e.g. "CN87us"
  rigEquipment: string; // e.g. "RTL-SDR v4 · QFH Antenna"
  coverImage: string;
  tags: string[];
  featured?: boolean;
  qsoCount?: number;
  likes: number;
  comments: CommentItem[];
  isDraft?: boolean;
}

export interface SolarBandCondition {
  band: string;
  day: 'Good' | 'Fair' | 'Poor';
  night: 'Good' | 'Fair' | 'Poor';
  mhz: string;
}

export interface ClubNetInfo {
  name: string;
  dayOfWeek: string;
  timeLocal: string;
  frequency: string;
  offset: string;
  tone: string;
  mode: string;
  netControlCall: string;
  echolinkNode?: string;
  description: string;
}
