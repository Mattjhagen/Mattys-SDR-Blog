import { BlogPost, SolarBandCondition, ClubNetInfo, ContactedHam } from '../types/blog';

// Clean initial state with zero mock posts or mock contacts
export const INITIAL_POSTS: BlogPost[] = [];

export const INITIAL_CONTACTS: ContactedHam[] = [];

export const SOLAR_CONDITIONS: SolarBandCondition[] = [
  { band: '80m', mhz: '3.5 - 4.0 MHz', day: 'Poor', night: 'Good' },
  { band: '40m', mhz: '7.0 - 7.3 MHz', day: 'Fair', night: 'Good' },
  { band: '30m', mhz: '10.1 - 10.15 MHz', day: 'Good', night: 'Good' },
  { band: '20m', mhz: '14.0 - 14.35 MHz', day: 'Good', night: 'Fair' },
  { band: '17m', mhz: '18.068 - 18.168 MHz', day: 'Good', night: 'Poor' },
  { band: '15m', mhz: '21.0 - 21.45 MHz', day: 'Good', night: 'Poor' },
  { band: '10m', mhz: '28.0 - 29.7 MHz', day: 'Fair', night: 'Poor' },
  { band: '6m', mhz: '50.0 - 54.0 MHz', day: 'Fair', night: 'Poor' }
];

export const CLUB_NETS: ClubNetInfo[] = [];
