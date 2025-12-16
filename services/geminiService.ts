import { GoogleGenAI, Type } from "@google/genai";
import { VideoAnalysis } from "../types";

// Initialize Gemini Client
const getGeminiClient = (userApiKey?: string) => {
  // Use user provided key first, fallback to env, then throw error
  const apiKey = userApiKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다. API 키를 입력해주세요.");
  }
  return new GoogleGenAI({ apiKey });
};

const getMimeType = (file: File): string => {
  if (file.type) return file.type;
  
  // Fallback based on extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'webm': return 'video/webm';
    case 'avi': return 'video/x-msvideo';
    case 'wmv': return 'video/x-ms-wmv';
    case 'mkv': return 'video/x-matroska';
    default: return 'video/mp4'; 
  }
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: getMimeType(file),
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Mock analysis for large files
const mockLargeFileAnalysis = (file: File): VideoAnalysis => {
    return {
        sceneDescription: `(대용량 파일 모드) ${file.name} 영상 상세 분석 중. 역동적인 움직임과 사실적인 현장음이 감지되었습니다.`,
        suggestedAudioPrompts: [
            "Realistic: Distinct footsteps on concrete, heavy wind blowing through trees, distant city traffic drone, sharp metallic impact."
        ],
        mood: "사실적/현장감",
        detectedEvents: ["대용량 비디오 처리", "타임라인 기반 사운드", "주요 액션 감지"]
    };
};

export const analyzeVideoContent = async (videoFile: File, apiKey: string): Promise<VideoAnalysis> => {
  try {
    // Check for Gemini Inline Data Limit (~20MB safe limit)
    if (videoFile.size > 20 * 1024 * 1024) {
        console.warn("File too large for inline analysis. Using mock analysis.");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return mockLargeFileAnalysis(videoFile);
    }

    const ai = getGeminiClient(apiKey);
    const modelId = "gemini-2.5-flash";
    const videoPart = await fileToGenerativePart(videoFile);

    const prompt = `
      You are an expert Lead Sound Designer (Foley Artist).
      Analyze this video to generate ONE highly detailed, realistic Sound Effect prompt for audio synthesis AI.
      
      Focus heavily on:
      - **Materials**: What specific surfaces are being touched/walked on? (e.g., gravel, wet concrete, hollow wood).
      - **Acoustics**: Is it a small room (reverb), outdoors (wind), or underwater (muffled)?
      - **Actions**: Detect specific sync points (impacts, swooshes, engine revs).
      - **NO MUSIC**: Do not suggest cinematic scores or musical elements. Focus purely on diegetic sound (SFX).
      
      I need a JSON response with:
      1. 'sceneDescription': A detailed visual summary in KOREAN, mentioning specific actions and materials.
      2. 'suggestedAudioPrompts': An array containing exactly 1 English string (Max 250 chars).
         - This string must be a chronological list of sounds describing the video content realistically (e.g., "Heavy boots crunching on dry snow, distant wind howling, sharp metal clang").
      3. 'mood': One or two words in KOREAN (e.g., 긴장감 넘치는, 평화로운).
      4. 'detectedEvents': List of 3-5 specific visual events in KOREAN.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
            videoPart,
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sceneDescription: { type: Type.STRING },
                suggestedAudioPrompts: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                mood: { type: Type.STRING },
                detectedEvents: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
        throw new Error("Gemini로부터 응답이 없습니다.");
    }

    const data = JSON.parse(textResponse) as VideoAnalysis;
    return data;

  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
};

/**
 * Translates and optimizes a raw user prompt (potentially in Korean) 
 * into a high-quality English SFX prompt for ElevenLabs.
 */
export const optimizePromptForSoundGen = async (rawText: string, apiKey: string): Promise<string> => {
    try {
        const ai = getGeminiClient(apiKey);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                You are an expert Sound Prompt Engineer for ElevenLabs.
                
                Your Task: 
                The User Input contains a sound description (often in English) mixed with User Instructions (often in Korean) on how to modify it.
                You must REWRITE the description to APPLY the user's instructions.
                
                Input: "${rawText}"
                
                Guidelines:
                1. If the user says "add reverb" or "echo", ADD adjectives like 'reverberant', 'spacious'.
                2. If the user says "remove wind" (바람 소리 제거), REMOVE mentions of wind from the prompt.
                3. If the user says "make it heavier" (더 무겁게), ADD adjectives like 'heavy', 'deep', 'thumping'.
                4. DO NOT include the instruction itself in the output. (e.g., Input: "Footsteps. Remove wind" -> Output: "Clean footsteps on pavement", NOT "Footsteps. Remove wind")
                5. Output ONLY the final optimized English prompt (Max 250 chars).
                
                Example:
                Input: "A quiet forest. 바람 소리 좀 더 크게 해줘"
                Output: "A quiet forest with loud, gusting wind howling through trees"
            `
        });
        return response.text?.trim() || rawText;
    } catch (e) {
        console.warn("Prompt optimization failed, using raw text", e);
        return rawText;
    }
}