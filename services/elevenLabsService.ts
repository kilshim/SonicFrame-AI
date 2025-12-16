import { AudioTrack } from "../types";
import { generateAudioFromPrompt as generateMockAudio } from "./mockAudioService";

const API_URL = "https://api.elevenlabs.io/v1/sound-generation";

export const generateSoundEffect = async (prompt: string, apiKey: string | null, duration: number): Promise<AudioTrack> => {
  // Trim key to avoid whitespace issues
  const cleanKey = apiKey ? apiKey.trim() : "";

  // 1. Explicitly use Mock Service if no key provided
  if (!cleanKey) {
    console.warn("No API Key provided. Using simulation.");
    return generateMockAudio(prompt, duration);
  }

  // Optimize prompt length for ElevenLabs
  // ElevenLabs works best with short, descriptive prompts under 200 chars
  const safePrompt = prompt.length > 200 ? prompt.substring(0, 200) : prompt;
  
  // ElevenLabs typically caps generation around 22 seconds for high quality.
  // We clamp the requested duration to ensure API stability.
  const safeDuration = Math.min(Math.max(duration, 0.5), 22);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": cleanKey,
      },
      body: JSON.stringify({
        text: safePrompt,
        duration_seconds: safeDuration, 
        prompt_influence: 0.5, 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || "Unknown Error";
      
      // Handle specific billing/quota errors explicitly
      if (response.status === 401) {
          throw new Error("Invalid ElevenLabs API Key. Please check your key.");
      }
      if (response.status === 402 || errorMessage.includes("quota") || errorMessage.includes("credit")) {
          throw new Error("ElevenLabs Credits Exhausted. Sound Generation requires available characters/credits.");
      }
      
      throw new Error(`ElevenLabs API Error: ${errorMessage}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);

    return {
      id: crypto.randomUUID(),
      url: audioUrl,
      name: `ElevenLabs_SFX_${Date.now()}.mp3`,
      duration: safeDuration,
    };
  } catch (error) {
    console.error("ElevenLabs Generation Failed:", error);
    throw error; // Propagate error to UI so user knows why it failed
  }
};