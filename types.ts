export interface VideoAnalysis {
  sceneDescription: string;
  suggestedAudioPrompts: string[]; // Changed to array for multiple options
  mood: string;
  detectedEvents: string[];
}

export interface AudioGenerationStatus {
  stage: 'idle' | 'analyzing' | 'generating' | 'ready' | 'error';
  progress: number;
  message: string;
}

export enum AppStep {
  UPLOAD = 0,
  ANALYSIS = 1,
  GENERATION = 2,
  RESULT = 3
}

export interface AudioTrack {
  id: string;
  url: string;
  name: string;
  duration: number;
}