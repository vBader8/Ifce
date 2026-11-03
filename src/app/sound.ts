/** Synthesized page-turn sound (no audio files needed, works offline). */
let ctx: AudioContext | null = null;

export function playFlip() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    const c = ctx;
    if (c.state === 'suspended') void c.resume();
    const dur = 0.42;
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      // rustle: noise with an envelope that swells then fades
      data[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * t), 1.6) * (0.6 + 0.4 * Math.random());
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(900, c.currentTime);
    bp.frequency.exponentialRampToValueAtTime(3200, c.currentTime + dur);
    const gain = c.createGain();
    gain.gain.value = 0.16;
    src.connect(bp).connect(gain).connect(c.destination);
    src.start();
  } catch {
    /* audio is optional */
  }
}
