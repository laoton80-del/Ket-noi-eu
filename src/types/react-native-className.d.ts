import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    /** react-native-web: forwarded to the DOM as `class` on web builds */
    className?: string;
  }
}
