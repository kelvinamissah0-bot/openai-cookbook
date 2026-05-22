import React, { useState, useEffect } from 'react';
import { ARTISTIC_STYLES, PRESET_EXAMPLES, PresetVideo } from './data';
import { ArtisticStyle, StoryboardScene, VideoGenerationSettings } from './types';
import CinemaPlayer from './components/CinemaPlayer';
import { synthInstance } from './components/AudioEngine';
import { 
  Sparkles, Library, Film, Cpu, Key, Play, AlertCircle, HelpCircle, 
  Settings, Check, Compass, Sliders, Music, RefreshCw, Layers, ArrowUpRight
} from 'lucide-react';

export default function App() {
  // Main settings state
  const [prompt, setPrompt] = useState<string>(
    'Bioluminescent brutalist waterfalls cascading through a futuristic skyscraper core, magenta and violet neon'
  );
  const [selectedStyleId, setSelectedStyleId] = useState<'cyberpunk' | 'watercolor' | 'cinematic' | 'vangogh' | 'claymation' | 'anime'>('cyberpunk');
  const [resolution, setResolution] = useState<'4K' | '1080p' | '720p'>('4K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [fps, setFps] = useState<24 | 30 | 60>(24);
  const [motionComplexity, setMotionComplexity] = useState<number>(85);
  
  // Interactive navigation
  const [activeTab, setActiveTab] = useState<'workspace' | 'gallery' | 'laboratory'>('workspace');
  
  // Auth state status
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isQuotaLimited, setIsQuotaLimited] = useState<boolean>(false);
  
  // Storyboard and visual frames compilation states
  const [themeSummary, setThemeSummary] = useState<string>(
    'A high-speed neon cybernetic narrative traversing heavy metal skyscrapers and dynamic reflecting pools. Characterized by high-end fuchsia and cyan contrast with atmospheric synthesizer notes.'
  );
  const [scenes, setScenes] = useState<StoryboardScene[]>([
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
  ]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [storyboardGenerationStage, setStoryboardGenerationStage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Load backend API keys status
  useEffect(() => {
    fetch('/api/auth-status')
      .then((res) => res.json())
      .then((data) => setHasApiKey(data.hasApiKey))
      .catch(() => setHasApiKey(false));
  }, []);

  // Quick Preset Selection Trigger
  const handleApplyPreset = (preset: PresetVideo) => {
    setPrompt(preset.prompt);
    setSelectedStyleId(preset.styleId);
    setThemeSummary(preset.themeSummary);
    setScenes(preset.scenes.map(scene => ({
      ...scene,
      isGenerating: false,
    })));
    setErrorDetails(null);
  };

  // -----------------------------------------------------------------
  // ORCHESTRATE COMPILATION FLOW (Calls backend to layout storyboard & generate 4K frames)
  // -----------------------------------------------------------------
  const handleSynthesizeSequence = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setStoryboardGenerationStage('Drafting Cinematic Storyboard Scripture (Gemini-3.5-Flash)...');
    setErrorDetails(null);
    setIsQuotaLimited(false);

    try {
      // 1. Generate core 4-scene narrative structures matching layout rules
      const storyboardRes = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyleId,
          aspectRatio,
          fps,
          resolution,
        }),
      });

      if (!storyboardRes.ok) {
        throw new Error('Error interacting with cinematic core engine pipeline.');
      }

      const rawStoryboardData = await storyboardRes.json();
      const updatedTheme = rawStoryboardData.themeSummary || 'Completed high-definition montage sequence.';
      const initialScenes = rawStoryboardData.scenes || [];

      setThemeSummary(updatedTheme);
      
      // Initialize states to "generating frames"
      const configuredScenes: StoryboardScene[] = initialScenes.map((scene: any) => ({
        ...scene,
        isGenerating: true,
        imageUrl: undefined,
        error: undefined,
      }));
      setScenes(configuredScenes);

      // Play matching synthesiser tone as scenes start downloading
      const styleConfig = ARTISTIC_STYLES.find(s => s.id === selectedStyleId);
      if (styleConfig) {
        synthInstance.start(styleConfig);
        setTimeout(() => synthInstance.stop(), 3000); // quick preview sound on start
      }

      // 2. Fire independent parallel requests to render the ultra 4K high fidelity frames
      setStoryboardGenerationStage('Generating Style Matrice Textures (Gemini-2.5-Image)...');

      const frameRequests = configuredScenes.map(async (scene) => {
        try {
          const frameRes = await fetch('/api/generate-frame', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: scene.prompt,
              style: selectedStyleId,
              aspectRatio,
            }),
          });

          if (!frameRes.ok) {
            throw new Error(`Frame compiling error on Scene ${scene.id}`);
          }

          const frameData = await frameRes.json();
          if (!frameData.success || frameData.isFallback) {
            setIsQuotaLimited(true);
          }
          
          setScenes(currentScenes => 
            currentScenes.map(s => 
              s.id === scene.id 
                ? { 
                    ...s, 
                    isGenerating: false, 
                    imageUrl: frameData.success && frameData.imageUrl 
                      ? frameData.imageUrl 
                      : getStylizedBackupImage(selectedStyleId, scene.id),
                    error: frameData.success ? undefined : frameData.reason 
                  }
                : s
            )
          );
        } catch (sceneErr: any) {
          console.error(`Failed to compile scene ${scene.id}:`, sceneErr);
          setScenes(currentScenes =>
            currentScenes.map(s =>
              s.id === scene.id
                ? {
                    ...s,
                    isGenerating: false,
                    imageUrl: getStylizedBackupImage(selectedStyleId, scene.id),
                    error: sceneErr.message || 'Compiling failure'
                  }
                : s
            )
          );
        }
      });

      // Wait for all scenes to settle rendering
      await Promise.all(frameRequests);
      setStoryboardGenerationStage('');
      setIsGenerating(false);

    } catch (err: any) {
      console.error('Sequence core compilation failed:', err);
      setErrorDetails(err.message || 'Cinematic compilation stalled. Default presets configured.');
      setIsGenerating(false);
      setStoryboardGenerationStage('');
    }
  };

  // Safe fallback imagery corresponding to styles in case image model fails / keys are missing
  const getStylizedBackupImage = (styleId: string, sceneId: number): string => {
    const fallbacks: Record<string, string[]> = {
      cyberpunk: [
        'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=800&q=80',
      ],
      watercolor: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1579783928121-7d1ca60b435a?auto=format&fit=crop&w=800&q=80',
      ],
      cinematic: [
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      ],
      vangogh: [
        'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=800&q=80',
      ],
      claymation: [
        'https://images.unsplash.com/photo-1560942485-b2a11cc13456?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=800&q=80',
      ],
      anime: [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      ]
    };

    const sceneIdIdx = (sceneId - 1) % 4;
    return fallbacks[styleId]?.[sceneIdIdx] || fallbacks.cyberpunk[0];
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#F0F0F0] font-sans flex overflow-x-hidden flex-col md:flex-row" id="editorial-app-layout">
      
      {/* ----------------- SIDEBAR CONTROLLERS (320px) ----------------- */}
      <aside className="w-full md:w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-white/10 flex flex-col p-6 bg-[#0A0A0A] overflow-y-auto" id="editorial-aside">
        {/* Brand Logo */}
        <div className="mb-8" id="sidebar-logo">
          <h1 className="text-2xl font-editorial italic tracking-tight font-light flex items-center justify-between">
            <span>KINETIC.AI</span>
            <span className="text-[9px] align-middle px-1.5 py-0.5 border border-white/20 rounded text-amber-500 font-mono italic uppercase tracking-widest font-sans">v4.2</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-1 font-sans">
            The Future of Cinematic Synthesis
          </p>
        </div>

        {/* API Authentication Status Panel */}
        <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg space-y-2 text-xs" id="api-status-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${hasApiKey ? (isQuotaLimited ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500') : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-white/70 font-sans">
                {hasApiKey 
                  ? (isQuotaLimited ? 'Sandbox Free Tier Active' : 'Gemini 4K Pipeline Active') 
                  : 'No API Key - Demo Studio Active'}
              </span>
            </div>
            <span className="text-[9px] font-mono text-white/30" title="Manage keys in Settings sidebar">INFO</span>
          </div>
          {isQuotaLimited && (
            <div className="text-[9px] font-mono text-amber-400 uppercase tracking-wider leading-relaxed bg-amber-500/10 border border-amber-500/15 p-1 px-1.5 rounded">
              ⚠️ Quota Exceeded (429). High-Fidelity local style matrix applied automatically.
            </div>
          )}
        </div>

        {/* Controls block */}
        <div className="flex-1 space-y-6" id="sidebar-controls">
          
          {/* Section: Visual Style Archetypes (Custom Styles Selector) */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.2em] text-white/40 block mb-3 font-mono font-semibold">
              01 // DESIGN ARCHETYPE
            </label>
            <div className="grid grid-cols-2 gap-2" id="stylistic-microgrid">
              {ARTISTIC_STYLES.map((style: ArtisticStyle) => {
                const isActive = style.id === selectedStyleId;
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyleId(style.id);
                      // Trigger preview note dynamically
                      synthInstance.start(style);
                      setTimeout(() => synthInstance.stop(), 500);
                    }}
                    className={`p-3 border rounded text-left transition-all relative flex flex-col justify-end min-h-[75px] cursor-pointer group hover:bg-white/5 ${
                      isActive 
                        ? 'border-white bg-white/10 shadow-[0_4px_12px_rgba(255,255,255,0.08)]' 
                        : 'border-white/15 bg-transparent'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-mono mb-1">
                      {style.id.substring(0, 4)}
                    </span>
                    <span className="text-xs font-editorial italic font-medium tracking-tight text-white block">
                      {style.name.split(' ')[0]}
                    </span>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Matrix Parameters */}
          <div className="space-y-4" id="matrix-sliders">
            <label className="text-[9px] uppercase tracking-[0.2em] text-white/40 block border-b border-white/10 pb-1.5 font-mono font-semibold">
              02 // HARMONIC CONTROLS
            </label>
            
            {/* Motion Complexity Selector */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/60">
                <span className="font-mono">Motion Speed</span>
                <span className="font-mono font-bold text-white">{motionComplexity}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={motionComplexity}
                onChange={(e) => setMotionComplexity(parseInt(e.target.value))}
                className="w-full accent-white h-[1px] bg-white/20 cursor-pointer"
              />
            </div>

            {/* Target Settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono block">FPS Rate</span>
                <select 
                  value={fps} 
                  onChange={(e) => setFps(parseInt(e.target.value) as any)}
                  className="w-full bg-neutral-900 border border-white/10 p-1.5 text-xs text-slate-200 outline-none rounded"
                >
                  <option value={24}>24 Cinematic</option>
                  <option value={30}>30 Broadcast</option>
                  <option value={60}>60 Pure Rate</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono block">Resolution</span>
                <select 
                  value={resolution} 
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-white/10 p-1.5 text-xs text-slate-200 outline-none rounded"
                >
                  <option value="4K">4K UHD Master</option>
                  <option value="1080p">1080p Fine</option>
                  <option value="720p">720p Standard</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono block">Theater Aspect</span>
              <div className="grid grid-cols-3 gap-1">
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1 text-[10px] font-mono border rounded ${
                      aspectRatio === ratio 
                        ? 'border-white bg-white/10 text-white' 
                        : 'border-white/10 bg-transparent text-white/40 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Synthesizer Information Module */}
          <div className="p-3 bg-neutral-950/60 rounded border border-white/5 space-y-1 text-[11px] leading-relaxed" id="audiosynth-status">
            <h4 className="font-mono text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Music className="h-3.5 w-3.5 text-orange-400" />
              03 // Synthesizer Timbre
            </h4>
            <div className="text-white/60 font-editorial italic text-xs">
              {ARTISTIC_STYLES.find(s => s.id === selectedStyleId)?.primaryTone || 'System Sound'}
            </div>
            <p className="text-[10px] text-white/30">
              Web Audio oscillators detune at peak playhead (35s) to represent film tension climax.
            </p>
          </div>

        </div>

        {/* Compile trigger at bottom */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-3" id="sidebar-synthesize-action">
          <button
            onClick={handleSynthesizeSequence}
            disabled={isGenerating}
            className={`w-full py-4 font-editorial italic text-lg transition-colors cursor-pointer text-center tracking-tight flex items-center justify-center gap-2 ${
              isGenerating
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <span>Synthesize Sequence</span>
            )}
          </button>
          
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest opacity-35 font-mono">
              {isGenerating ? 'Active GPU Grid Connection' : 'Estimated Generation: ~45s'}
            </p>
          </div>
        </div>
      </aside>

      {/* ----------------- MAIN STUDIO WORKSPACE ----------------- */}
      <main className="flex-1 min-h-screen flex flex-col bg-[#050505]" id="editorial-main">
        {/* Dynamic Studio Header */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-[#080808]">
          <div className="flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-widest font-mono font-medium">
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`pb-1 transition-all ${activeTab === 'workspace' ? 'border-b border-white text-white font-bold' : 'text-white/40 hover:text-white'}`}
            >
              Workspace
            </button>
            <button 
              onClick={() => setActiveTab('gallery')}
              className={`pb-1 transition-all ${activeTab === 'gallery' ? 'border-b border-white text-white font-bold' : 'text-white/40 hover:text-white'}`}
            >
              Cinematic Presets
            </button>
            <button 
              onClick={() => setActiveTab('laboratory')}
              className={`pb-1 transition-all ${activeTab === 'laboratory' ? 'border-b border-white text-white font-bold' : 'text-white/40 hover:text-white'}`}
            >
              VIM-Lab
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[10px] font-mono text-white/30 uppercase tracking-widest">
              State: Active Mode // 60s Frame
            </span>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[11px] font-mono text-white bg-white/5">
              AI
            </div>
          </div>
        </header>

        {/* Inner Content Area */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col gap-6 max-w-7xl mx-auto w-full" id="workspace-viewport-interior">
          
          {/* Top Banner indicating load stages */}
          {storyboardGenerationStage && (
            <div className="p-3 bg-white/10 border border-white/20 text-xs font-mono text-white rounded-lg animate-pulse flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
              <span>{storyboardGenerationStage}</span>
            </div>
          )}

          {errorDetails && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold uppercase tracking-wider">Pipeline Anomaly Detected</p>
                <p className="opacity-80">{errorDetails}</p>
                <p className="text-[10px] opacity-60">High-fidelity backup timeline has been applied for direct exploration.</p>
              </div>
            </div>
          )}

          {/* Tab Content Router */}
          {activeTab === 'laboratory' ? (
            <div className="bg-neutral-950 border border-white/10 rounded-xl p-8 space-y-6" id="lab-tab-panel">
              <h2 className="text-3xl font-editorial italic font-light">Laboratory Control Core</h2>
              <p className="text-sm text-white/60 font-sans leading-relaxed max-w-2xl">
                Fine-tune manual frequency waveforms for custom cinematic sound design and adjust temporal camera curves.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-lg space-y-4">
                  <h3 className="font-mono text-xs uppercase text-amber-500 tracking-wider">Acoustic Synthesizer Matrix</h3>
                  <div className="space-y-3 text-xs font-sans text-white/70">
                    <p>Configure LFO amplitude triggers to map with high motion scenes on the canvas.</p>
                    <div className="space-y-2 pt-2 text-[11px] font-mono">
                      <div>Filter resonance: High Pass 12db</div>
                      <div>Sample length: 60.00s Continuous</div>
                      <div>Render driver: Web Audio API (Oversampled)</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-lg space-y-4">
                  <h3 className="font-mono text-xs uppercase text-emerald-400 tracking-wider">4K High-Dynamic Layout Info</h3>
                  <div className="space-y-3 text-xs font-sans text-white/70">
                    <p>The cinema canvas scales to 3840 x 2160 resolution internally utilizing dynamic spline filters during render compiling.</p>
                    <div className="space-y-2 pt-2 text-[11px] font-mono">
                      <div>Canvas format: WebGL/2D Context fallback</div>
                      <div>Vignette shading: Atmospheric Radial Blend</div>
                      <div>Chroma standard: Rec. 2020 UHD Standard</div>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('workspace')} 
                className="mt-6 px-4 py-2 bg-white text-black text-xs font-semibold hover:bg-neutral-200 uppercase tracking-widest font-mono rounded"
              >
                ← Return to Cinema Engine
              </button>
            </div>
          ) : activeTab === 'gallery' ? (
            <div className="space-y-6" id="gallery-tab-panel">
              <div className="space-y-2">
                <h2 className="text-3xl font-editorial italic text-white tracking-tight font-light">Curated Cinematic Presets Drawer</h2>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Instant interactive previews packed with physical assets and synthetic soundscape mappings</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_EXAMPLES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      handleApplyPreset(preset);
                      setActiveTab('workspace');
                    }}
                    className="p-6 bg-neutral-900/90 border border-white/10 rounded-xl text-left hover:border-white/30 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-editorial text-xl italic font-medium group-hover:text-amber-400 transition-colors">
                          {preset.title}
                        </h3>
                        <span className="text-[9px] font-mono bg-white/10 text-white border border-white/15 px-2 py-0.5 rounded uppercase tracking-wider">
                          {preset.styleId}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed font-sans line-clamp-2">
                        {preset.shortDescription}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-4 w-full flex items-center justify-between text-[11px] font-mono text-white/40 group-hover:text-white transition-colors">
                      <span>Click to deploy keyframes</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Workspace Active Tab
            <div className="space-y-6" id="workspace-interior-core">
              
              {/* Cinematic Presets Shelf / Examples Quick Load Drawer - DIRECT response to "Can you give me examples" */}
              <div id="quick-examples-drawer" className="bg-neutral-950 border border-white/10 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono font-semibold flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-emerald-400" />
                    Cinematic Presets & Keyframe Examples
                  </span>
                  <span className="text-[10px] text-white/30 font-serif italic">
                    Click to load preset narrative track instantly
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRESET_EXAMPLES.map((preset) => {
                    const isStyleActive = preset.styleId === selectedStyleId;
                    return (
                      <button
                        key={preset.id}
                        id={`example-badge-${preset.id}`}
                        onClick={() => handleApplyPreset(preset)}
                        className="p-3 bg-white/5 border border-white/10 hover:border-white/40 rounded-lg text-left transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-2 text-xs"
                      >
                        <div>
                          <h4 className="font-editorial italic font-semibold text-white/90 group-hover:text-white line-clamp-1">
                            {preset.title}
                          </h4>
                          <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5 font-mono">
                            {preset.styleId} look
                          </p>
                        </div>
                        <span className="text-[10px] text-amber-500/80 group-hover:text-amber-400 transition-colors inline-flex items-center gap-1 font-mono">
                          Deploy Sequence &rarr;
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Central Dynamic Cinema Monitor Component */}
              <div id="cinema-frame-wrapper">
                <CinemaPlayer
                  settings={{
                    prompt,
                    styleId: selectedStyleId,
                    resolution,
                    aspectRatio,
                    fps,
                    durationSeconds: 60,
                  }}
                  scenes={scenes}
                  themeSummary={themeSummary}
                />
              </div>

              {/* Detailed 4-Scene Storyboard Strip View */}
              <div className="space-y-4" id="scenes-storyboard-strip">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-sky-400" />
                    Interactive Keyframe Timeline Script (1 Minute total sequence)
                  </h3>
                  <span className="text-[10px] text-white/40 font-mono">
                    4 Scenes x 15s Each
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="scenes-deck-row">
                  {scenes.map((scene, idx) => {
                    return (
                      <div 
                        key={scene.id} 
                        id={`scene-strip-card-${scene.id}`}
                        className="bg-neutral-900/60 border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/25"
                      >
                        {/* Upper image frame preview box */}
                        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden border-b border-white/5">
                          {scene.isGenerating ? (
                            <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center space-y-2 text-center p-2 z-10">
                              <RefreshCw className="h-5 w-5 text-amber-400 animate-spin" />
                              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Synthesizing...</span>
                            </div>
                          ) : null}

                          {scene.imageUrl ? (
                            <img 
                              src={scene.imageUrl} 
                              alt={scene.title}
                              className="w-full h-full object-cover select-none pointer-events-none" 
                            />
                          ) : (
                            <div className="text-center p-3 text-white/20">
                              <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <span className="text-[10px] font-mono uppercase block">Timeline Entry {scene.id}</span>
                            </div>
                          )}

                          {/* Scene Timestamp Badge */}
                          <div className="absolute bottom-2 left-2 bg-black/80 border border-white/15 px-2 py-0.5 text-[9px] font-mono rounded select-none text-white/80">
                            {scene.timeRange}
                          </div>
                        </div>

                        {/* Text explanation context block */}
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="font-editorial italic font-medium text-sm text-slate-100 line-clamp-1">
                              {scene.id}. {scene.title}
                            </h4>
                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-3 font-sans" title={scene.prompt}>
                              {scene.prompt}
                            </p>
                          </div>

                          <div className="border-t border-white/5 pt-2 mt-2 space-y-1 text-[10px] text-white/45 font-mono">
                            <div className="truncate"><span className="text-white/30">Camera:</span> {scene.cameraMovement}</div>
                            <div><span className="text-white/30">Render Speed:</span> {scene.estimatedComplexity}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linguistic Underlined Narrative Prompt Input */}
              <div id="linguistic-narrative-container" className="pt-6 border-t border-white/15">
                <div className="h-32 flex flex-col md:flex-row gap-6 md:items-end justify-between">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.25em] text-white/30 block font-mono font-semibold">
                      linguistic narrative input (prompts synthesis engine)
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={prompt}
                        id="prompt-narrative-input"
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your 1-minute cinematic journey..." 
                        className="w-full bg-transparent border-b border-white/30 pb-3 font-editorial text-lg lg:text-xl text-white outline-none focus:border-white transition-colors duration-300 italic"
                      />
                      <div className="absolute right-0 bottom-4 text-[9px] text-white/30 font-mono">
                        {prompt.length}/500 chars
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-end">
                    <div className="text-right">
                      <span className="text-[36px] font-editorial italic text-white/90 leading-none">1:00.00</span>
                      <span className="block text-[9px] uppercase tracking-widest text-[#F0F0F0]/30 font-mono">Duration limit</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Dynamic workspace footer */}
        <footer className="h-12 border-t border-white/10 flex items-center px-6 lg:px-10 justify-between text-[10px] uppercase tracking-widest text-white/30 font-mono">
          <div className="flex gap-6">
            <span>System: Optimal</span>
            <span>Engine: v4.2-Lumen</span>
          </div>
          <div className="hidden sm:inline-block">
            © 2026 Kinetic Multimedia Systems
          </div>
        </footer>
      </main>

    </div>
  );
}
