import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'viona.intro.soundEnabled';
const CHIME = require('../../../../assets/sound/intro-chime.m4a');

type ChimeSound = {
  setVolumeAsync: (volume: number) => Promise<unknown>;
  stopAsync: () => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
  playAsync: () => Promise<unknown>;
  setOnPlaybackStatusUpdate: (cb: (status: { isLoaded: boolean; didJustFinish?: boolean }) => void) => void;
};

let active: ChimeSound | null = null;
let playClaimed = false;

export async function readIntroSoundEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw !== '0';
  } catch {
    return true;
  }
}

export async function setIntroSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Preference stays in memory for this launch if storage is unavailable.
  }
}

export async function stopIntroChime(): Promise<void> {
  const sound = active;
  active = null;
  if (!sound) return;
  try {
    await sound.setVolumeAsync(0.04);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await sound.stopAsync();
    await sound.unloadAsync();
  } catch {
    // Stopping a finished sound is not a failure.
  }
}

/** Plays once at ambient volume. Missing audio or a mute switch must not throw. */
export async function playIntroChime(reducedMotion: boolean): Promise<void> {
  if (reducedMotion || playClaimed || !(await readIntroSoundEnabled())) return;
  playClaimed = true;
  try {
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const sound = new Audio.Sound();
    active = sound;
    await sound.loadAsync(CHIME, { volume: 0.22, isLooping: false, shouldPlay: false });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (active === sound) active = null;
        void sound.unloadAsync();
      }
    });
    await sound.playAsync();
  } catch {
    active = null;
  }
}
