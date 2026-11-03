// Flat smoky tokens, mirroring wstech.tech's dark and light glass themes.
export interface Theme {
  name: 'dark' | 'light';
  cardFrom: string;
  cardTo: string;
  rim: string;
  highlight: string;
  primary: string;
  secondary: string;
  muted: string;
  chipBorder: string;
  sweep: string;
}

export const DARK: Theme = {
  name: 'dark',
  cardFrom: '#262626',
  cardTo: '#141414',
  rim: 'rgba(255,255,255,.12)',
  highlight: 'rgba(255,255,255,.14)',
  primary: '#ececec',
  secondary: '#a0a0a0',
  muted: '#8f8f8f',
  chipBorder: 'rgba(255,255,255,.18)',
  sweep: 'rgba(255,255,255,.5)',
};

export const LIGHT: Theme = {
  name: 'light',
  cardFrom: '#f5f5f5',
  cardTo: '#e7e7e7',
  rim: 'rgba(0,0,0,.10)',
  highlight: 'rgba(255,255,255,.9)',
  primary: '#111111',
  secondary: '#444444',
  muted: '#555555',
  chipBorder: 'rgba(0,0,0,.15)',
  sweep: 'rgba(0,0,0,.22)',
};

export const THEMES: readonly Theme[] = [DARK, LIGHT];
