// audio.js — all sound synthesised with WebAudio, zero asset files. Import is DOM-free: the
// AudioContext is created only inside unlock(), called from the first real user gesture.

const PAD_NOTES = [110, 123.47, 146.83, 164.81, 196.00];

function noiseBuffer(ac) {
  const len = Math.floor(ac.sampleRate * 1.2);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let s = 1234567;
  for (let i = 0; i < len; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    data[i] = (s / 2147483648) - 1;
  }
  return buf;
}

export function createAudio() {
  let ac = null;
  let master = null;
  let padGain = null;
  let padFilter = null;
  let padA = null, padB = null;
  let warnGain = null;
  let noise = null;
  let muted = false;

  function tone(freq, type, dur, vol, when = 0, glideTo = 0) {
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function hiss(dur, vol, hp) {
    if (!ac) return;
    const t0 = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noise;
    const f = ac.createBiquadFilter();
    f.type = hp ? 'highpass' : 'lowpass';
    f.frequency.value = hp ? 1400 : 320;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  return {
    unlock() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.75;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      master.connect(comp).connect(ac.destination);
      noise = noiseBuffer(ac);

      padFilter = ac.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 620;
      padGain = ac.createGain();
      padGain.gain.value = 0.045;
      padFilter.connect(padGain).connect(master);
      padA = ac.createOscillator();
      padA.type = 'sine';
      padA.frequency.value = PAD_NOTES[0];
      padB = ac.createOscillator();
      padB.type = 'triangle';
      padB.frequency.value = PAD_NOTES[0] * 1.005;
      padA.connect(padFilter);
      padB.connect(padFilter);
      padA.start();
      padB.start();
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = ac.createGain();
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain).connect(padFilter.frequency);
      lfo.start();

      const warn = ac.createOscillator();
      warn.type = 'sawtooth';
      warn.frequency.value = 110;
      const warnFilter = ac.createBiquadFilter();
      warnFilter.type = 'lowpass';
      warnFilter.frequency.value = 240;
      warnGain = ac.createGain();
      warnGain.gain.value = 0;
      warn.connect(warnFilter).connect(warnGain).connect(master);
      warn.start();
      const trem = ac.createOscillator();
      trem.frequency.value = 9;
      const tremGain = ac.createGain();
      tremGain.gain.value = 0.02;
      trem.connect(tremGain).connect(warnGain.gain);
      trem.start();
    },
    setWave(i) {
      if (!ac) return;
      const f = PAD_NOTES[Math.min(PAD_NOTES.length - 1, Math.max(0, i))];
      padA.frequency.setTargetAtTime(f, ac.currentTime, 0.4);
      padB.frequency.setTargetAtTime(f * 1.005, ac.currentTime, 0.4);
    },
    gateChime() {
      tone(523.25, 'sine', 0.28, 0.18, 0);
      tone(659.25, 'sine', 0.30, 0.16, 0.07);
      tone(783.99, 'sine', 0.42, 0.15, 0.14);
      hiss(0.30, 0.05, true);
    },
    dazzle() {
      tone(880, 'sine', 0.22, 0.12, 0, 220);
      hiss(0.20, 0.11, true);
    },
    hawkWarn(on) {
      if (!ac || !warnGain) return;
      warnGain.gain.setTargetAtTime(on ? 0.05 : 0, ac.currentTime, 0.05);
    },
    hawkHit() {
      hiss(0.32, 0.22, false);
      tone(92, 'sawtooth', 0.30, 0.16, 0, 58);
      tone(138, 'square', 0.18, 0.07, 0);
    },
    waveClear() {
      tone(523.25, 'triangle', 0.22, 0.13, 0);
      tone(659.25, 'triangle', 0.22, 0.13, 0.12);
      tone(783.99, 'triangle', 0.22, 0.13, 0.24);
      tone(1046.5, 'triangle', 0.45, 0.14, 0.36);
    },
    win() {
      [261.63, 329.63, 392.00, 523.25].forEach((f, i) => tone(f, 'sine', 1.6, 0.10, i * 0.13));
      tone(659.25, 'triangle', 2.2, 0.07, 0.5);
    },
    lose() {
      tone(392, 'sine', 0.6, 0.12, 0, 261.63);
      tone(311.13, 'sine', 0.7, 0.10, 0.25, 196);
      tone(196, 'triangle', 1.2, 0.09, 0.5, 110);
    },
    setMuted(m) {
      muted = !!m;
      if (master && ac) master.gain.setTargetAtTime(muted ? 0 : 0.75, ac.currentTime, 0.05);
    },
  };
}
