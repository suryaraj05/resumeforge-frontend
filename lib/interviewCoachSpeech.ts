export type VoiceMode = "tt" | "tv" | "vt" | "vv";

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  onresult: ((ev: SpeechRecognitionResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: { 0?: { transcript: string } } };
};

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

export function speak(text: string, voiceURI?: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voiceURI) {
    const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === voiceURI);
    if (v) u.voice = v;
  }
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}
