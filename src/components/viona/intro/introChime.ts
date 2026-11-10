/** Drop assets/sound/intro-chime.mp3 into the repo and point this at the require to enable playback. */
export const INTRO_CHIME_SOURCE: number | null = null;

let introSoundEnabled = true;

export function isIntroSoundEnabled(): boolean {
  return introSoundEnabled;
}

export function setIntroSoundEnabled(enabled: boolean): void {
  introSoundEnabled = enabled;
}

export async function playIntroChime(reducedMotion: boolean): Promise<void> {
  if (reducedMotion || !introSoundEnabled || INTRO_CHIME_SOURCE == null) return;
  try {
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const sound = new Audio.Sound();
    await sound.loadAsync(INTRO_CHIME_SOURCE, { volume: 0.2, isLooping: false });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch {
    // Missing or blocked audio must not stop the intro.
  }
}
