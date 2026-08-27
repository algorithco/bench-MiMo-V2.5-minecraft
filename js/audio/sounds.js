(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  var ctx = null;
  var masterGain = null;
  var volume = 0.5;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn("Web Audio not available");
    }
  }

  function resume() {
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  }

  function createOscillator(type, freq, startTime, duration) {
    if (!ctx) return null;
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.start(startTime);
    osc.stop(startTime + duration);
    return osc;
  }

  function createNoise(startTime, duration) {
    if (!ctx) return null;
    var bufferSize = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.start(startTime);
    source.stop(startTime + duration);
    return source;
  }

  function playBreak() {
    if (!ctx) return;
    resume();
    var now = ctx.currentTime;

    var noise = createNoise(now, 0.12);
    if (noise) {
      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
    }

    var osc = createOscillator("square", 150, now, 0.08);
    if (osc) {
      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain2);
      gain2.connect(masterGain);
    }
  }

  function playPlace() {
    if (!ctx) return;
    resume();
    var now = ctx.currentTime;

    var osc = createOscillator("sine", 200, now, 0.06);
    if (osc) {
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.connect(gain);
      gain.connect(masterGain);
    }

    var noise = createNoise(now, 0.05);
    if (noise) {
      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.25, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      noise.connect(filter);
      filter.connect(gain2);
      gain2.connect(masterGain);
    }
  }

  function playStep(blockType) {
    if (!ctx) return;
    resume();
    var now = ctx.currentTime;

    var freqs = {
      GRASS: 600,
      DIRT: 400,
      STONE: 900,
      SAND: 700,
      WOOD: 500,
      LEAVES: 300
    };

    var freq = freqs[blockType] || 500;

    var noise = createNoise(now, 0.06);
    if (noise) {
      var filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 2;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
    }

    var osc = createOscillator("sine", freq * 0.5, now, 0.04);
    if (osc) {
      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain2);
      gain2.connect(masterGain);
    }
  }

  function playJump() {
    if (!ctx) return;
    resume();
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(masterGain);

    var noise = createNoise(now, 0.1);
    if (noise) {
      var filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;

      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      noise.connect(filter);
      filter.connect(gain2);
      gain2.connect(masterGain);
    }
  }

  function playDeath() {
    if (!ctx) return;
    resume();
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(masterGain);

    var noise = createNoise(now, 0.6);
    if (noise) {
      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(gain2);
      gain2.connect(masterGain);
    }

    var osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(100, now);
    osc2.frequency.exponentialRampToValueAtTime(20, now + 1);
    osc2.start(now);
    osc2.stop(now + 1);

    var gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.2, now);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 1);

    osc2.connect(gain3);
    gain3.connect(masterGain);
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain) {
      masterGain.gain.value = volume;
    }
  }

  function getVolume() {
    return volume;
  }

  window.VoxelGame.Sounds = {
    init: init,
    resume: resume,
    playBreak: playBreak,
    playPlace: playPlace,
    playStep: playStep,
    playJump: playJump,
    playDeath: playDeath,
    setVolume: setVolume,
    getVolume: getVolume
  };
})();
