export type ArtisticStyleId = 'cyberpunk' | 'watercolor' | 'cinematic' | 'vangogh' | 'claymation' | 'anime';

export interface ArtisticStyle {
  id: ArtisticStyleId;
  name: string;
  description: string;
  colors: string[];
  bannerGradient: string;
  primaryTone: string;
  synthSettings: {
    baseFreq: number;
    detune: number;
    type: 'sawtooth' | 'sine' | 'square' | 'triangle';
    filterFreq: number;
    resonance: number;
  };
}

export interface StoryboardScene {
  id: number;
  timeRange: string;
  title: string;
  prompt: string;
  cameraMovement: string;
  visualDescription: string;
  estimatedComplexity: string;
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

export interface VideoGenerationSettings {
  prompt: string;
  styleId: ArtisticStyleId;
  resolution: '4K' | '1080p' | '720p';
  aspectRatio: '16:9' | '9:16' | '1:1';
  fps: 24 | 30 | 60;
  durationSeconds: number; // 60 seconds (1 minute)
}

export interface StoryboardResponse {
  themeSummary: string;
  scenes: StoryboardScene[];
}
