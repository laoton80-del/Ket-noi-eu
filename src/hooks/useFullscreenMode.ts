import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};

function getActiveFullscreenElement(doc: Document): Element | null {
  const augmented = doc as FullscreenDocument;
  return (
    doc.fullscreenElement ??
    augmented.webkitFullscreenElement ??
    augmented.mozFullScreenElement ??
    augmented.msFullscreenElement ??
    null
  );
}

function isFullscreenSupported(root: FullscreenElement): boolean {
  return (
    typeof root.requestFullscreen === 'function' ||
    typeof root.webkitRequestFullscreen === 'function' ||
    typeof root.mozRequestFullScreen === 'function' ||
    typeof root.msRequestFullscreen === 'function'
  );
}

async function requestDocumentFullscreen(doc: Document): Promise<void> {
  const root = doc.documentElement as FullscreenElement;
  if (typeof root.requestFullscreen === 'function') {
    await root.requestFullscreen();
    return;
  }
  if (typeof root.webkitRequestFullscreen === 'function') {
    await root.webkitRequestFullscreen();
    return;
  }
  if (typeof root.mozRequestFullScreen === 'function') {
    await root.mozRequestFullScreen();
    return;
  }
  if (typeof root.msRequestFullscreen === 'function') {
    await root.msRequestFullscreen();
  }
}

async function exitDocumentFullscreen(doc: FullscreenDocument): Promise<void> {
  if (typeof doc.exitFullscreen === 'function') {
    await doc.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === 'function') {
    await doc.webkitExitFullscreen();
    return;
  }
  if (typeof doc.mozCancelFullScreen === 'function') {
    await doc.mozCancelFullScreen();
    return;
  }
  if (typeof doc.msExitFullscreen === 'function') {
    await doc.msExitFullscreen();
  }
}

export type FullscreenModeState = Readonly<{
  isWeb: boolean;
  isSupported: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}>;

/** Web-only browser fullscreen; safe no-op on native and unsupported browsers. */
export function useFullscreenMode(): FullscreenModeState {
  const isWeb = Platform.OS === 'web';
  const [isSupported, setIsSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isWeb || typeof document === 'undefined') {
      setIsSupported(false);
      setIsFullscreen(false);
      return;
    }

    const doc = document;
    const root = doc.documentElement as FullscreenElement;
    setIsSupported(isFullscreenSupported(root));
    setIsFullscreen(Boolean(getActiveFullscreenElement(doc)));

    const onChange = () => {
      setIsFullscreen(Boolean(getActiveFullscreenElement(doc)));
    };

    doc.addEventListener('fullscreenchange', onChange);
    doc.addEventListener('webkitfullscreenchange', onChange);
    doc.addEventListener('mozfullscreenchange', onChange);
    doc.addEventListener('MSFullscreenChange', onChange);

    return () => {
      doc.removeEventListener('fullscreenchange', onChange);
      doc.removeEventListener('webkitfullscreenchange', onChange);
      doc.removeEventListener('mozfullscreenchange', onChange);
      doc.removeEventListener('MSFullscreenChange', onChange);
    };
  }, [isWeb]);

  const toggleFullscreen = useCallback(() => {
    if (!isWeb || typeof document === 'undefined') return;

    const doc = document as FullscreenDocument;
    void (async () => {
      try {
        if (getActiveFullscreenElement(doc)) {
          await exitDocumentFullscreen(doc);
        } else {
          await requestDocumentFullscreen(doc);
        }
      } catch {
        // User gesture or browser policy may reject fullscreen transitions.
      }
    })();
  }, [isWeb]);

  return {
    isWeb,
    isSupported,
    isFullscreen,
    toggleFullscreen,
  };
}
