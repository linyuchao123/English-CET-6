'use client';

import { useEffect, useMemo, useState } from 'react';

export type Accent = 'en-US' | 'en-GB';

const preferredVoices: Record<Accent, string[]> = {
  'en-US': ['Samantha', 'Ava', 'Google US English', 'Microsoft Aria', 'Alex'],
  'en-GB': ['Daniel', 'Serena', 'Google UK English Female', 'Microsoft Sonia', 'Kate'],
};

export function usePronunciation() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [accent, setAccent] = useState<Accent>('en-US');
  const [rate, setRate] = useState(0.92);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setSupported(true);
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith('en')));
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const selectedVoice = useMemo(() => {
    const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(accent.toLowerCase()));
    for (const name of preferredVoices[accent]) {
      const preferred = matching.find((voice) => voice.name.includes(name));
      if (preferred) return preferred;
    }
    return matching.find((voice) => voice.localService) ?? matching[0] ?? voices[0] ?? null;
  }, [accent, voices]);

  function speak(word: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.voice = selectedVoice;
    utterance.lang = accent;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => onEnd && window.setTimeout(onEnd, 420);
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }

  function cancel() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  return { accent, setAccent, rate, setRate, selectedVoice, speak, cancel, supported };
}
