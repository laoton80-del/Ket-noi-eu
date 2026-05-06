import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const b2cTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2A67D1',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#0B1628',
    border: 'rgba(11, 22, 40, 0.12)',
    notification: '#E53935',
  },
};

export const b2bTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#00FF66',
    background: '#0A1628',
    card: '#0F2238',
    text: '#F4F1EA',
    border: 'rgba(0, 255, 102, 0.35)',
    notification: '#E53935',
  },
};

