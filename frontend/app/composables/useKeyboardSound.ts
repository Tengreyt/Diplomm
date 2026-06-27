const keyboardSoundStorageKey = "typing-arena-keyboard-sound";

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!import.meta.client) return null;
  audioContext ??= new AudioContext({ latencyHint: "interactive" });
  return audioContext;
};

const hashKey = (key: string) => {
  let hash = 0;
  for (const character of key) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
};

const getKeyFrequency = (key: string) => {
  if (key === "Space") return 150;
  if (key === "Backspace") return 178;
  return 205 + (hashKey(key) % 12) * 7;
};

export const useKeyboardSound = () => {
  const isKeyboardSoundEnabled = useState("keyboard-sound-enabled", () => false);

  onMounted(() => {
    isKeyboardSoundEnabled.value = localStorage.getItem(keyboardSoundStorageKey) === "true";
  });

  const setKeyboardSoundEnabled = async (enabled: boolean) => {
    isKeyboardSoundEnabled.value = enabled;
    if (!import.meta.client) return;

    localStorage.setItem(keyboardSoundStorageKey, String(enabled));
    if (enabled) {
      await getAudioContext()?.resume();
    }
  };

  const toggleKeyboardSound = () => setKeyboardSoundEnabled(!isKeyboardSoundEnabled.value);

  const playKeySound = (key: string) => {
    if (!isKeyboardSoundEnabled.value) return;

    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      void context.resume().then(() => playKeySound(key));
      return;
    }
    if (context.state !== "running") return;

    const startedAt = context.currentTime;
    const frequency = getKeyFrequency(key);
    const tone = context.createOscillator();
    const overtone = context.createOscillator();
    const toneGain = context.createGain();
    const overtoneGain = context.createGain();
    const output = context.createGain();

    tone.type = "sine";
    tone.frequency.setValueAtTime(frequency, startedAt);
    tone.frequency.exponentialRampToValueAtTime(frequency * 0.78, startedAt + 0.045);

    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(frequency * 2.04, startedAt);
    overtone.frequency.exponentialRampToValueAtTime(frequency * 1.72, startedAt + 0.025);

    toneGain.gain.setValueAtTime(0.0001, startedAt);
    toneGain.gain.exponentialRampToValueAtTime(0.12, startedAt + 0.003);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.06);
    overtoneGain.gain.setValueAtTime(0.0001, startedAt);
    overtoneGain.gain.exponentialRampToValueAtTime(0.035, startedAt + 0.002);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.028);
    output.gain.value = 0.42;

    tone.connect(toneGain).connect(output);
    overtone.connect(overtoneGain).connect(output);
    output.connect(context.destination);

    tone.start(startedAt);
    overtone.start(startedAt);
    tone.stop(startedAt + 0.065);
    overtone.stop(startedAt + 0.035);
  };

  return {
    isKeyboardSoundEnabled,
    toggleKeyboardSound,
    playKeySound
  };
};
