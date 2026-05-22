import { ArtisticStyle } from './types';

export const ARTISTIC_STYLES: ArtisticStyle[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Dark futuristic world illuminated by vivid magenta and teal neon, wet reflective streets, massive holograms, and dense retro-tech wire structures.',
    colors: ['#ff007f', '#00f0ff', '#120136', '#400082'],
    bannerGradient: 'from-fuchsia-600 via-purple-700 to-cyan-500',
    primaryTone: 'Atmospheric Cyber-Synth Drone',
    synthSettings: {
      baseFreq: 65.41, // C2 bass
      detune: 12,
      type: 'sawtooth',
      filterFreq: 350,
      resonance: 8,
    }
  },
  {
    id: 'watercolor',
    name: 'Ethereal Watercolor',
    description: 'Delicate hand-painted aesthetics with bleeding pigments, soft-blending pastel colors, visible cold-pressed paper canvas grain, and natural bleeding borders.',
    colors: ['#ffb4b4', '#bdf2ff', '#ffebbb', '#9cdba2'],
    bannerGradient: 'from-pink-200 via-amber-100 to-blue-200 text-slate-800',
    primaryTone: 'Heavenly Sine Octaves',
    synthSettings: {
      baseFreq: 261.63, // C4 warm middle
      detune: 4,
      type: 'sine',
      filterFreq: 800,
      resonance: 1,
    }
  },
  {
    id: 'cinematic',
    name: 'Cinematic 3D Realism',
    description: 'High-end film look featuring volumetric lighting, thick atmospheric haze, deep depth-of-field, realistic metallic reflection rays, and anamorphic lens flares.',
    colors: ['#cca43b', '#101820', '#d6d6d6', '#0f3057'],
    bannerGradient: 'from-[#0f3057] via-[#101820] to-[#cca43b]',
    primaryTone: 'Sub-Bass Cinematic Brass Power',
    synthSettings: {
      baseFreq: 55.00, // A1 sub orchestral
      detune: 18,
      type: 'triangle',
      filterFreq: 200,
      resonance: 4,
    }
  },
  {
    id: 'vangogh',
    name: 'Van Gogh Impressionism',
    description: 'Vibrant, thick impasto brushstrokes, swirling wind and cloud patterns in cobalt blue, golden wheat fields, and dramatic starlit sky spirals.',
    colors: ['#0d47a1', '#fbc02d', '#1565c0', '#f57f17'],
    bannerGradient: 'from-blue-800 via-amber-500 to-teal-700',
    primaryTone: 'Warbling Vibraphonic Chimes',
    synthSettings: {
      baseFreq: 196.00, // G3 resonance
      detune: 8,
      type: 'triangle',
      filterFreq: 650,
      resonance: 5,
    }
  },
  {
    id: 'claymation',
    name: 'Retro Claymation',
    description: 'Stop-motion clay aesthetics. Displays raw plastiline surfaces with subtle human fingerprint impressions, tactile depth, and a staggered stop-motion vibe.',
    colors: ['#d7ccc8', '#ff7043', '#8d6e63', '#4e342e'],
    bannerGradient: 'from-amber-700 via-orange-600 to-amber-900',
    primaryTone: 'Resonant Tactile Mallet Rhythm',
    synthSettings: {
      baseFreq: 130.81, // C3 basic chord
      detune: 2,
      type: 'square',
      filterFreq: 400,
      resonance: 12,
    }
  },
  {
    id: 'anime',
    name: 'Anime Cel-Shaded',
    description: 'Crisp hand-drawn outlines, bold cell shading, colorful high-contrast skies, aesthetic cumulus clouds, and dynamic motion speedlines.',
    colors: ['#29b6f6', '#ff7043', '#ec407a', '#26a69a'],
    bannerGradient: 'from-sky-400 via-pink-400 to-orange-300',
    primaryTone: 'Upbeat High-Fidelity Retro Arpeggio',
    synthSettings: {
      baseFreq: 220.00, // A3 upbeat
      detune: 6,
      type: 'sawtooth',
      filterFreq: 1200,
      resonance: 7,
    }
  }
];

export interface PresetVideo {
  id: string;
  title: string;
  shortDescription: string;
  prompt: string;
  styleId: 'cyberpunk' | 'watercolor' | 'cinematic' | 'vangogh' | 'claymation' | 'anime';
  themeSummary: string;
  scenes: {
    id: number;
    timeRange: string;
    title: string;
    prompt: string;
    cameraMovement: string;
    visualDescription: string;
    estimatedComplexity: string;
    imageUrl: string;
  }[];
}

export const PRESET_EXAMPLES: PresetVideo[] = [
  {
    id: 'cybermetropolis',
    title: 'Kinetic Neon Metropolis',
    shortDescription: 'Futuristic skyscrapers, neon water waterfalls, cybernetic haze.',
    prompt: 'Bioluminescent brutalist waterfalls cascading through a futuristic skyscraper core, magenta and violet neon',
    styleId: 'cyberpunk',
    themeSummary: 'A high-speed neon cybernetic narrative traversing heavy metal skyscrapers and dynamic reflecting pools. Characterized by high-end fuchsia and cyan contrast with atmospheric synthesizer notes.',
    scenes: [
      {
        id: 1,
        timeRange: '0:00 - 0:15',
        title: 'Bioluminescent Spires',
        prompt: 'Futuristic monumental towers styled in dark monolithic metal panels with pink fluorescent line work, towering cybernetic sky-bridges, detailed cyberpunk style.',
        cameraMovement: 'Slow vertical crane-up shot revealing hyper-scale heights as the synth frequencies hum.',
        visualDescription: 'Vivid fluorescent magenta traces light up wide structures, contrasting heavily with the dark night backdrop.',
        estimatedComplexity: 'Ultra 4K Render Engine',
        imageUrl: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        timeRange: '0:15 - 0:30',
        title: 'Neon Cascades',
        prompt: 'Giant liquid waterfalls of bioluminescent blue and purple water pouring between concrete buildings, highly detailed reflective steam fog.',
        cameraMovement: 'Panning right horizontal track, looking down into reflecting ponds representing light scattering.',
        visualDescription: 'Vibrant neon streams ripple through skyscraper canyon walls while synthetic air currents build rhythmic tension.',
        estimatedComplexity: 'Dynamic Particle Simpler',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        timeRange: '0:30 - 0:45',
        title: 'The Rain Reflect Sanctuary',
        prompt: 'Wet asphalt street reflecting giant magenta holograms, wires running overhead, atmospheric neon lights, 4K rendering standards.',
        cameraMovement: 'Dramatic low-angle tracking glide through a grid of power cords, shaking softly during sound waves.',
        visualDescription: 'Droplets fall in synchronized patterns. Holographic models slowly sweep back and forth above the street floor.',
        estimatedComplexity: 'Ultra 4K Raytracer',
        imageUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 4,
        timeRange: '0:45 - 1:00',
        title: 'Terminal Dawn Horizon',
        prompt: 'Tokyo style cyberpunk skyline, sun slowly rising over dense layers of geometric grids, warm gold and violet light scattering.',
        cameraMovement: 'Very slow pullback into cinematic wide viewport frame leaving spacious quiet space.',
        visualDescription: 'Luminous sky transitions to deep gold and violet. The futuristic metropolis gently fades into beautiful dawn haze.',
        estimatedComplexity: 'Low Compute Polish',
        imageUrl: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'etherealwater',
    title: 'Pastel Watercolor Lily Dream',
    shortDescription: 'Delicate hand-painted pigments, bleeding pastel rivers, and paper lanterns.',
    prompt: 'Spiraling pastel waves of an ethereal dreamscape where floating watercolor paper lilies carry soft amber flames',
    styleId: 'watercolor',
    themeSummary: 'A slow-breathing contemplative canvas with soft bleeding margins, cold-pressed paper textures, and elegant high-pitched sine oscillators humming over the scenic landscape.',
    scenes: [
      {
        id: 1,
        timeRange: '0:00 - 0:15',
        title: 'Fluid Pigment Genesis',
        prompt: 'Introductory watercolor wash rendering soft organic floral shapes, pastel pink and sky blue colors, hand-painted paper canvas.',
        cameraMovement: 'Gentle forward zoom with dynamic edge bleed expansion matching wet ink on textured parchment.',
        visualDescription: 'Soft floral motifs diffuse into wet paper boundaries with natural bleeding ink.',
        estimatedComplexity: 'Pigment Diffusion Grid',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        timeRange: '0:15 - 0:30',
        title: 'Amber Ripple Stream',
        prompt: 'Close up of smooth watercolor waves flowing with gold sparkles, delicate warm amber lanterns floating quietly on soft water pools.',
        cameraMovement: 'Slow panoramic pan following the floating elements with subtle water lens distortion.',
        visualDescription: 'Golden water sparkles ripple through pastel hues while smooth sine frequencies oscillate.',
        estimatedComplexity: 'Organic Wash Vectorizer',
        imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        timeRange: '0:30 - 0:45',
        title: 'The Whirling Ink Vortex',
        prompt: 'A magnificent abstract spiral of blooming paint washes, deep cerulean and coral pink pigments blending seamlessly together on canvas.',
        cameraMovement: 'Rotating orbit sweep expanding outwards to show a vast multi-layered artistic canvas.',
        visualDescription: 'The dynamic paint washes form a gorgeous central vortex representing peak narrative tension.',
        estimatedComplexity: 'Fluid Flow Rasterizer',
        imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 4,
        timeRange: '0:45 - 1:00',
        title: 'Sunset Textures Fading',
        prompt: 'Tranquil sunset skyline with soft clouds, handdrawn pencil elements outlines, golden hour watercolor vignette framing.',
        cameraMovement: 'Slow zoom out into a calm double-matte frame leaving elegant negative space.',
        visualDescription: 'The landscape integrates into warm golden paper textures, leaving a serene, resting sketch outline of the voyage.',
        estimatedComplexity: 'Artistic Matte Postprocessing',
        imageUrl: 'https://images.unsplash.com/photo-1579783928121-7d1ca60b435a?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'cosmicsails',
    title: 'Chronicles of Lunar Silence',
    shortDescription: 'Monolithic volumetric ruins, stardust flare flares, anamorphic cinema look.',
    prompt: 'A silent astronaut hovering near an ancient brutalist relic on a frozen moon, illuminated by cold cosmic flares, 4K anamorphic style',
    styleId: 'cinematic',
    themeSummary: 'A dark, brooding sci-fi masterpiece. Heavy cinematic black levels contrast against warm brass oscillators and anamorphic flares across the lunar desert.',
    scenes: [
      {
        id: 1,
        timeRange: '0:00 - 0:15',
        title: 'Volumetric Void Dawn',
        prompt: 'Astronaut standing on the edge of a pristine crater landscape, giant dark planetary bodies looming in background, stardust cosmic rays.',
        cameraMovement: 'Slow cinematic dolly forward with deep focus lens, capturing volumetric light scattering.',
        visualDescription: 'Atmospheric light beams cut through lunar dust, emphasizing cold metallic space textures.',
        estimatedComplexity: 'Atmospheric Raymarcher',
        imageUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        timeRange: '0:15 - 0:30',
        title: 'Artifact Activation',
        prompt: 'Brutalist monolith of reflective metal on flat salt plains, glowing blue cyber lines activating on the structure, volumetric haze.',
        cameraMovement: 'Low angle perspective pan looking up at the high-scale tower as light beams illuminate.',
        visualDescription: 'The structure radiates cold blue vectors, casting crisp long shadows over the barren plains.',
        estimatedComplexity: 'Volumetric Depth Renderer',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        timeRange: '0:30 - 0:45',
        title: 'Cosmic Flare Collision',
        prompt: 'A brilliant starlight storm with exploding white energy particles colliding against cosmic dust, anamorphic blue flare lens.',
        cameraMovement: '180 degree rotation sweep tracking around the glowing core under cinematic horizontal glare.',
        visualDescription: 'Light particles explode in gorgeous streaks representing maximum film tension and musical chorus peaks.',
        estimatedComplexity: 'Particulate Physics Rasterizer',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 4,
        timeRange: '0:45 - 1:00',
        title: 'The Silent Horizon Pull',
        prompt: 'Wide cinematic landscape, astronauts footprint in the dust, slow particles fading, sunset warm metallic flare.',
        cameraMovement: 'Extremely slow camera pan and pull back leaving a spacious, calm horizontal layout.',
        visualDescription: 'Deep shadows cover the dunes while subtle starlights reflect in the vacuum of space.',
        estimatedComplexity: 'Cinematic Matte Polish',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'vangoghele',
    title: 'The Impasto Wind Vortex',
    shortDescription: 'Swirling blue oil swirls and dynamic golden wheat lines.',
    prompt: 'A sweeping whirlwind of dark cobalt stars over a golden wheat field of animated sunflowers, thick oil brushstrokes, Van Gogh style',
    styleId: 'vangogh',
    themeSummary: 'Vivid color contrasts and undulating organic strokes. Warbling chime synthesizers translate the tactile brushstrokes into acoustic space.',
    scenes: [
      {
        id: 1,
        timeRange: '0:00 - 0:15',
        title: 'Canvas Textures Awaken',
        prompt: 'Impasto paint strokes close-up, thick textured blue oil layers, swirling galaxy wind lines, classic oil paint style look.',
        cameraMovement: 'Extremely detailed macro shot tracking slowly across textured cobalt paint grooves.',
        visualDescription: 'Thick hand-painted ripples emerge in beautiful cobalt, capturing the tactile physical texture.',
        estimatedComplexity: 'Impasto Texture Shader',
        imageUrl: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        timeRange: '0:15 - 0:30',
        title: 'The Swirling sky',
        prompt: 'Vast country sky styled with spiraling stars, glowing golden moon with yellow brush work, deep Prussian blue landscape colors.',
        cameraMovement: 'Slow clockwise camera rotation tracking the central star spiral with dreamlike gravity.',
        visualDescription: 'Swirling oil brushstrokes flow rhythmically, with celestial bodies emitting circular rays of light.',
        estimatedComplexity: 'Brushstroke Flow Simulator',
        imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        timeRange: '0:30 - 0:45',
        title: 'Golden Field Vortex',
        prompt: 'Golden sunflower field waving rapidly in a storm, swirling blue sky overhead, high motion yellow and blue contrast paint brushstrokes.',
        cameraMovement: 'Dolly down tracking through golden stems, shaking softly relative to the windy sky vortex.',
        visualDescription: 'Rich colors clash as high-contrast blue and yellow brushstrokes populate the rotating field.',
        estimatedComplexity: 'High Contrast Canvas Rasterizer',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 4,
        timeRange: '0:45 - 1:00',
        title: 'The Sleeping Cosmos',
        prompt: 'Quiet night landscape with hills, twinkling yellow brush stars fading into deep quiet Prussian blue horizon line.',
        cameraMovement: 'Slow vertical crane-down settling behind quiet hills into dark elegant framing.',
        visualDescription: 'Vibrant strokes settle down into midnight shades, leaving a soft impressionist starlight glow.',
        estimatedComplexity: 'Vignette Canvas Blender',
        imageUrl: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }
];

