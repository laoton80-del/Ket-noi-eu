import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { vionaCinematicTokens as cine } from '../design/vionaCinematicTokens';

export const b2cTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: cine.color.accentGold,
    background: cine.color.backgroundShell,
    card: cine.color.surfaceNavy,
    text: cine.color.textOnDark,
    border: cine.color.line,
    notification: cine.color.safety,
  },
};

export const b2bTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: cine.universe.business.accent,
    background: cine.color.backgroundShell,
    card: cine.color.surfaceNavy,
    text: cine.color.textOnDark,
    border: cine.universe.business.wash,
    notification: cine.color.safety,
  },
};

