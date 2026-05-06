import { Platform, type ViewStyle } from 'react-native';

type WebStyle = ViewStyle & {
  backdropFilter?: string;
  WebkitBackdropFilter?: string;
  boxShadow?: string;
  transitionProperty?: string;
  transitionDuration?: string;
};

const WEB_GLASS: WebStyle = {
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
};

const WEB_NEON_GREEN: WebStyle = {
  boxShadow: '0 0 10px #00FF66, 0 0 20px #00FF66',
};

const WEB_NEON_PURPLE: WebStyle = {
  boxShadow: '0 0 10px #A855F7, 0 0 20px #A855F7',
};

const WEB_HOVER_TRANSITION: WebStyle = {
  transitionProperty: 'box-shadow, transform, border-color, background-color',
  transitionDuration: '180ms',
};

export const webGlassStyle: ViewStyle = (Platform.OS === 'web' ? WEB_GLASS : {}) as ViewStyle;
export const webNeonGlowStyle: ViewStyle = (Platform.OS === 'web' ? WEB_NEON_GREEN : {}) as ViewStyle;
export const webNeonPurpleStyle: ViewStyle = (Platform.OS === 'web' ? WEB_NEON_PURPLE : {}) as ViewStyle;
export const webHoverStyle: ViewStyle = (Platform.OS === 'web' ? WEB_HOVER_TRANSITION : {}) as ViewStyle;

