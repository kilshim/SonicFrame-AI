import { AudioTrack } from "../types";

// Helper to create a WAV file from an AudioBuffer
function bufferToWave(abuffer: AudioBuffer, len: number) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < len) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      // Clamp the value
      let s = Math.max(-1, Math.min(1, channels[i][pos]));
      // Convert float to 16-bit PCM
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(44 + offset, s, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 * Generates procedural audio based on prompt keywords using Web Audio API.
 * Now respects the requested duration.
 */
export const generateAudioFromPrompt = async (prompt: string, requestedDuration: number = 10): Promise<AudioTrack> => {
    return new Promise(async (resolve) => {
        // Simulate processing time
        await new Promise(r => setTimeout(r, 1500));

        // Use standard AudioContext, fallback for Safari if needed
        const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
        // Cap duration to 30s for performance in browser-based synthesis
        const duration = Math.min(requestedDuration, 30); 
        const sampleRate = 44100;
        const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
        
        const p = prompt.toLowerCase();
        
        // --- Sound Design Engine ---
        
        const masterGain = offlineCtx.createGain();
        masterGain.connect(offlineCtx.destination);
        
        // 1. Drone Layer (Always audible base)
        const osc1 = offlineCtx.createOscillator();
        const osc2 = offlineCtx.createOscillator();
        const droneGain = offlineCtx.createGain();
        
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        // Determine base frequency based on mood
        let baseFreq = 60; // Default Cinematic Low
        if (p.includes("tense") || p.includes("horror")) baseFreq = 45; // Sub-bass
        if (p.includes("happy") || p.includes("nature")) baseFreq = 110; // Higher, brighter
        
        osc1.frequency.setValueAtTime(baseFreq, 0);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, 0); // 5th
        osc2.detune.setValueAtTime(15, 0); // Detune for width

        // Filter movement
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 1;
        filter.frequency.setValueAtTime(200, 0);
        filter.frequency.exponentialRampToValueAtTime(800, duration / 2); // Swell up
        filter.frequency.exponentialRampToValueAtTime(200, duration); // Fade down

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(masterGain);
        
        droneGain.gain.setValueAtTime(0, 0);
        droneGain.gain.linearRampToValueAtTime(0.25, Math.min(2, duration/4)); // Fade in
        droneGain.gain.setValueAtTime(0.25, duration - Math.min(2, duration/4));
        droneGain.gain.linearRampToValueAtTime(0, duration); // Fade out

        osc1.start();
        osc2.start();

        // 2. Noise/Texture Layer
        const bufferSize = sampleRate * duration;
        const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = offlineCtx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        
        const noiseFilter = offlineCtx.createBiquadFilter();
        const noiseGain = offlineCtx.createGain();

        if (p.includes("rain") || p.includes("water")) {
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 800;
            noiseGain.gain.value = 0.15;
        } else if (p.includes("city") || p.includes("traffic")) {
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;
            noiseGain.gain.value = 0.05;
        } else {
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 500;
            noiseGain.gain.value = 0.05; // Subtle texture
        }

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseNode.start();

        // Render
        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = bufferToWave(renderedBuffer, bufferSize);
        const audioUrl = URL.createObjectURL(wavBlob);

        resolve({
            id: crypto.randomUUID(),
            url: audioUrl,
            name: "Generated_Cinematic_SFX.wav",
            duration: duration
        });
    });
};