import React, { useEffect, useRef, useState } from 'react';
import { ArtisticStyle, StoryboardScene, VideoGenerationSettings } from '../types';
import { ARTISTIC_STYLES } from '../data';
import { synthInstance } from './AudioEngine';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Sparkles, 
  Tv, Cpu, Film, Layers, SkipBack, SkipForward, ArrowRight, Video,
  Sliders
} from 'lucide-react';

interface CinemaPlayerProps {
  settings: VideoGenerationSettings;
  scenes: StoryboardScene[];
  themeSummary: string;
}

export default function CinemaPlayer({
  settings,
  scenes,
  themeSummary,
}: CinemaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0 to 60 seconds
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [fpsCounter, setFpsCounter] = useState<number>(settings.fps);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isRenderMode, setIsRenderMode] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);

  // Color Correction Configuration Parameters
  const [showColorGrading, setShowColorGrading] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [autoToneStatus, setAutoToneStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastFpsUpdateRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  // Audio state syncing
  const style = ARTISTIC_STYLES.find(s => s.id === settings.styleId) || ARTISTIC_STYLES[0];

  // Images Preloading cache
  const imgCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Sync settings change or scene change to timeline stop
    setProgress(0);
    setIsPlaying(false);
    synthInstance.stop();
    setAutoToneStatus(null);
  }, [settings.styleId, settings.aspectRatio]);

  // Handle Mute status sync
  useEffect(() => {
    synthInstance.toggleMute(isMuted);
  }, [isMuted]);

  // Clean up synthesizer on unmount
  useEffect(() => {
    return () => {
      synthInstance.stop();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Preload storyboard scene images when they are generated
  useEffect(() => {
    scenes.forEach(scene => {
      if (scene.imageUrl && !imgCacheRef.current[scene.imageUrl]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.src = scene.imageUrl;
        img.onload = () => {
          imgCacheRef.current[scene.imageUrl!] = img;
        };
      }
    });
  }, [scenes]);

  // Playhead interval controls
  useEffect(() => {
    if (isPlaying) {
      if (!isMuted) {
        synthInstance.start(style);
      }
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = now;
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setProgress(prev => {
          const nextVal = prev + delta;
          if (nextVal >= 60) {
            setIsPlaying(false);
            synthInstance.stop();
            return 60;
          }
          return nextVal;
        });

        // Trigger loop frame rendering
        renderCanvasFrame();
        requestRef.current = requestAnimationFrame(tick);
      };
      requestRef.current = requestAnimationFrame(tick);
    } else {
      synthInstance.stop();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      renderCanvasFrame(); // Render single static frame
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, style]);

  // Synchronize Scene Index according to progress
  useEffect(() => {
    // 4 scenes, 15 seconds each.
    const activeIndex = Math.min(Math.floor(progress / 15), 3);
    setCurrentSceneIndex(activeIndex);
    synthInstance.updateTimeProgress(progress, style);
  }, [progress, style]);

  // Simulate High-Resolution Render Process (renders up to 100%)
  const handleTriggerRecompileResolution = () => {
    if (isRenderMode) return;
    setIsPlaying(false);
    setIsRenderMode(true);
    setRenderProgress(0);

    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRenderMode(false);
          setProgress(0);
          return 100;
        }
        // Speed up simulation
        return prev + 4;
      });
    }, 120);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(false);
    synthInstance.stop();
  };

  const handleSkipToScene = (index: number) => {
    setProgress(index * 15);
  };

  // Programmatically calculates/adjusts target contrast & brightness parameters matching frame luminosity
  const handleAutoTone = () => {
    let avgLuminance = 128; // fallback to balanced midtones
    let source = 'Dynamic Stylesheet';

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let sumLuminance = 0;
          let validSamples = 0;

          // Highly optimized grid sample strategy (every 40th pixel indices)
          for (let idx = 0; idx < data.length; idx += 40) {
            const rx = data[idx];
            const gx = data[idx + 1];
            const bx = data[idx + 2];
            const ax = data[idx + 3];

            // Filter out empty background pixels
            if (ax > 12) {
              const lumValue = (0.299 * rx + 0.587 * gx + 0.114 * bx);
              sumLuminance += lumValue;
              validSamples++;
            }
          }

          if (validSamples > 0) {
            avgLuminance = sumLuminance / validSamples;
            source = 'Active Viewport Frame';
          }
        }
      } catch (err) {
        // Cross-origin image drawing/loading constraints. Safe heuristics fallback:
        const stylePalette = style.colors || [];
        if (stylePalette.length > 0) {
          let paletteSum = 0;
          stylePalette.forEach(hexColor => {
            const cleanHex = hexColor.replace('#', '');
            let r = 127, g = 127, b = 127;
            if (cleanHex.length === 3) {
              r = parseInt(cleanHex[0] + cleanHex[0], 16);
              g = parseInt(cleanHex[1] + cleanHex[1], 16);
              b = parseInt(cleanHex[2] + cleanHex[2], 16);
            } else if (cleanHex.length === 6) {
              r = parseInt(cleanHex.slice(0, 2), 16);
              g = parseInt(cleanHex.slice(2, 4), 16);
              b = parseInt(cleanHex.slice(4, 6), 16);
            }
            paletteSum += (0.299 * r + 0.587 * g + 0.114 * b);
          });
          avgLuminance = paletteSum / stylePalette.length;
          source = 'Art Scene Palette';
        }
      }
    }

    // Custom non-linear movie-grade correction profile
    const relativeLuminosity = avgLuminance / 255;
    let targetBrightness = 100;
    let targetContrast = 100;
    let targetSaturation = 105;

    if (relativeLuminosity < 0.35) {
      // Dark visual asset: Increase shadows perception, restore contrast and chroma range
      const offsetFactor = 0.35 - relativeLuminosity;
      targetBrightness = Math.round(112 + offsetFactor * 65);
      targetContrast = Math.round(108 + offsetFactor * 50);
      targetSaturation = Math.round(105 + offsetFactor * 25);
    } else if (relativeLuminosity > 0.65) {
      // Bright highkey frame: Reduce brightness highlights slightly, compress contrast ranges
      const overFactor = relativeLuminosity - 0.65;
      targetBrightness = Math.round(98 - overFactor * 45);
      targetContrast = Math.round(110 + overFactor * 55);
      targetSaturation = Math.round(100 - overFactor * 20);
    } else {
      // Nominal balance: Add optimal premium cinematic punch
      targetBrightness = 102;
      targetContrast = 108;
      targetSaturation = 105;
    }

    // Update with sanitised bounds (clamp standard ranges)
    setBrightness(Math.max(50, Math.min(150, targetBrightness)));
    setContrast(Math.max(50, Math.min(150, targetContrast)));
    setSaturation(Math.max(0, Math.min(200, targetSaturation)));

    const displayPercentage = Math.round(relativeLuminosity * 100);
    setAutoToneStatus(`LUM: ${displayPercentage}% via ${source === 'Active Viewport Frame' ? 'PIXEL' : 'HEURISTIC'}`);
  };

  // -----------------------------------------------------------------
  // PROCEDURAL CANVAS RENDER ENGINE FOR THE MOVIE STREAM
  // Applies Ken Burns effects & Style-aware overlay filters dynamically
  // -----------------------------------------------------------------
  const renderCanvasFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Calculate relative elapsed time inside current scene (0 to 15 seconds)
    const sceneIdx = Math.min(Math.floor(progress / 15), 3);
    const sceneTime = progress % 15;
    const scenePercent = sceneTime / 15; // 0 to 1 progress inside this scene

    const activeScene = scenes[sceneIdx] || scenes[0];
    const stylesColors = style.colors;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // 2. Obtain background source or draw elegant dynamic background gradient
    const imageCached = activeScene?.imageUrl ? imgCacheRef.current[activeScene.imageUrl] : null;

    ctx.save();
    
    // Apply camera Ken Burns panning & zoom based on sceneTime
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;
    let rotation = 0;

    // Dynamic scale/translate profiles matching storyboard instructions
    if (sceneIdx === 0) {
      // Genesis: Slow deep zoom-in
      scale = 1.0 + (scenePercent * 0.15);
    } else if (sceneIdx === 1) {
      // Action: Panning right/up sweep
      translateX = - (scenePercent * 40);
      translateY = - (scenePercent * 20);
      scale = 1.08;
    } else if (sceneIdx === 2) {
      // Climax Climax: Rotary orbital and subtle camera shake
      scale = 1.20 - (scenePercent * 0.1);
      rotation = (scenePercent * 1.5) * (Math.PI / 180);
      if (isPlaying) {
        // Subtle organic vibration adding tension
        translateX = (Math.sin(performance.now() * 0.05) * 2);
        translateY = (Math.cos(performance.now() * 0.05) * 2);
      }
    } else {
      // Calm horizon: Slow back-zoom and dimming
      scale = 1.15 - (scenePercent * 0.15);
    }

    // Apply translations
    ctx.translate(width / 2 + translateX, height / 2 + translateY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    if (imageCached) {
      // Draw actual AI-generated picture perfectly fitted
      ctx.drawImage(imageCached, 0, 0, width, height);
    } else {
      // Alternate procedural scenery block based on style colors
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, stylesColors[2] || '#0f172a');
      gradient.addColorStop(0.5, stylesColors[0] || '#1e1b4b');
      gradient.addColorStop(1, stylesColors[3] || '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stylized abstract central landscape representation
      ctx.fillStyle = `${stylesColors[1]}20`; // transparent center soft light
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, height / 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Render simple abstract vector lines corresponding to the creative theme
      ctx.strokeStyle = `${stylesColors[0]}40`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height * (0.3 + i * 0.1));
        ctx.bezierCurveTo(
          width * 0.25, height * (0.2 + Math.sin(progress + i) * 0.1),
          width * 0.75, height * (0.5 - Math.cos(progress - i) * 0.1),
          width, height * (0.3 + i * 0.1)
        );
        ctx.stroke();
      }
    }

    ctx.restore();

    // 3. STYLE-SPECIFIC ACTIVE PARTICLE AND VECTOR SYSTEMS (Overlays)
    ctx.save();
    const tickTime = performance.now() * 0.001;

    switch (settings.styleId) {
      case 'cyberpunk': {
        // Neon green perspective tracking lattice grids + neon digital light trails
        ctx.strokeStyle = '#00f0ff40';
        ctx.lineWidth = 1.5;
        // Perspective vertical rays
        for (let i = -10; i <= 20; i++) {
          ctx.beginPath();
          ctx.moveTo(width / 2 + (i * 25), height * 0.6);
          ctx.lineTo(width / 2 + (i * 120), height);
          ctx.stroke();
        }
        // Moving horizontal lines
        const yOffset = (tickTime * 80) % 120;
        for (let y = height * 0.6; y < height; y += 25) {
          const dy = y + yOffset;
          if (dy < height) {
            ctx.beginPath();
            ctx.moveTo(0, dy);
            ctx.lineTo(width, dy);
            ctx.stroke();
          }
        }
        // Rain particles
        ctx.strokeStyle = '#ff007f30';
        ctx.lineWidth = 1;
        for (let i = 0; i < 25; i++) {
          const rx = (Math.sin(i * 1234.56 + tickTime * 0.5) * 0.5 + 0.5) * width;
          const ry = ((i * 37 + tickTime * 450) % height);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + 15);
          ctx.stroke();
        }
        break;
      }

      case 'watercolor': {
        // Bleeding circles expanding slowly and textured light spots
        ctx.fillStyle = `${stylesColors[1]}25`;
        for (let i = 0; i < 4; i++) {
          const waveRadius = 40 + Math.sin(tickTime + (i * Math.PI / 2)) * 15;
          const wx = width * (0.2 + (i * 0.2)) + Math.sin(tickTime + i) * 20;
          const wy = height * (0.4 + (Math.cos(i) * 0.1)) + Math.cos(tickTime - i) * 15;
          ctx.beginPath();
          ctx.arc(wx, wy, waveRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Paper grain vignette overlay effect
        ctx.fillStyle = 'rgba(255, 235, 187, 0.05)';
        ctx.rect(0, 0, width, height);
        ctx.fill();

        // Edge vignette blurring
        const borderGlow = ctx.createRadialGradient(width/2, height/2, height*0.3, width/2, height/2, width*0.6);
        borderGlow.addColorStop(0, 'rgba(0,0,0,0)');
        borderGlow.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
        ctx.fillStyle = borderGlow;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'cinematic': {
        // Floating cinematic bokeh ash loops
        ctx.fillStyle = 'rgba(204, 164, 59, 0.25)';
        for (let i = 0; i < 18; i++) {
          const particleX = (Math.sin(i * 45.67 + tickTime * 0.1) * 0.5 + 0.5) * width + (Math.sin(tickTime + i) * 10);
          const particleY = ((i * 17 - tickTime * 35) % height + height) % height;
          const particleSize = 2 + (Math.sin(i + tickTime) * 1.5) + (i % 3);
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Anamorphic horizontal blue flare line
        const gr = ctx.createLinearGradient(0, height / 2.3, width, height / 2.3);
        gr.addColorStop(0, 'rgba(0, 240, 255, 0)');
        gr.addColorStop(0.3, 'rgba(0, 240, 255, 0.1)');
        gr.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gr.addColorStop(0.7, 'rgba(0, 240, 255, 0.1)');
        gr.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, height / 2.3 - 2, width, 4);
        break;
      }

      case 'vangogh': {
        // Thick swirly impasto patterns drawn with vectors
        ctx.strokeStyle = '#fbc02d50';
        ctx.lineWidth = 3;
        for (let centerIdx = 0; centerIdx < 3; centerIdx++) {
          const cx = width * (0.3 + centerIdx * 0.2) + Math.sin(tickTime + centerIdx) * 10;
          const cy = height * 0.35 + Math.cos(tickTime - centerIdx) * 8;
          ctx.beginPath();
          for (let deg = 0; deg < 360; deg += 10) {
            const rad = deg * Math.PI / 180;
            const dynamicRadius = 35 + (deg * 0.1) + Math.sin(tickTime * 2 + deg * 0.05) * 6;
            const px = cx + Math.cos(rad) * dynamicRadius;
            const py = cy + Math.sin(rad) * dynamicRadius * 0.6; // squash
            if (deg === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        break;
      }

      case 'claymation': {
        // tactile clay thumbprints, jerky framerate (handles block updates)
        // Draw small tactile lines mimicking fingerprints on clay modeling
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const cx = (i * 0.2 + 0.1) * width;
          ctx.arc(cx, height * 0.5, 40, tickTime % 1.5, (tickTime % 1.5) + 1.2);
          ctx.stroke();
        }
        break;
      }

      case 'anime': {
        // High speed zoom wind streaks around border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 15; i++) {
          const angle = (i * 24) * Math.PI / 180;
          const offsetDist = 180 + Math.sin(tickTime * 12 + i) * 60;
          const sx = width / 2 + Math.cos(angle) * offsetDist;
          const sy = height / 2 + Math.sin(angle) * offsetDist;
          const ex = sx + Math.cos(angle) * 80;
          const ey = sy + Math.sin(angle) * 80;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();

    // 4. TRANSITION EFFECTS CROSSING BETWEEN SCENES (Fades etc)
    const transitionWidthS = 1.0; // 1s visual blend range
    if (sceneTime < transitionWidthS && progress > 1) {
      // Transition IN from previous scene
      const progressAlpha = sceneTime / transitionWidthS; // 0 to 1
      ctx.fillStyle = `rgba(18, 1, 54, ${1 - progressAlpha})`; // flash of deep dramatic shade
      ctx.fillRect(0, 0, width, height);
    } else if (sceneTime > (15 - transitionWidthS) && progress < 59) {
      // Transition OUT directly to next scene
      const rem = 15 - sceneTime;
      const progressAlpha = rem / transitionWidthS; // 1 to 0
      ctx.fillStyle = `rgba(18, 1, 54, ${1 - progressAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Direct Time Indicators overlay in viewport corners
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    
    // Bottom-right watermark watermark
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText("VEO 4K ENGINE • CINEMATIC RENDERING", 15, height - 15);

    // Frame stats
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.fillText(`${settings.resolution} • HDR • ${settings.fps} FPS`, width - 110, height - 15);

    // Track real FPS count
    if (isPlaying) {
      frameCountRef.current++;
      const curNow = performance.now();
      if (curNow - lastFpsUpdateRef.current >= 1000) {
        setFpsCounter(Math.round((frameCountRef.current * 1000) / (curNow - lastFpsUpdateRef.current)));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = curNow;
      }
    }
  };

  // Convert timeline duration to formatted string MM:SS
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Setup actual size depending on aspect ratio setting
  const getAspectRatioClasses = () => {
    switch (settings.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[500px] w-auto mx-auto';
      case '1:1':
        return 'aspect-[1/1] max-w-[450px] mx-auto';
      case '16:9':
      default:
        return 'aspect-[16/9] w-full';
    }
  };

  const getCanvasDimensions = () => {
    switch (settings.aspectRatio) {
      case '9:16': return { width: 360, height: 640 };
      case '1:1': return { width: 500, height: 500 };
      case '16:9':
      default:
        return { width: 854, height: 480 };
    }
  };

  const sizes = getCanvasDimensions();

  return (
    <div id="cinema-studio-card" className="bg-[#151515]/40 border border-white/10 rounded-none overflow-hidden shadow-2xl space-y-4 p-4 lg:p-6 p-y-5">
      
      {/* Viewport & Scene Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cinema Monitor */}
        <div id="cinema-monitor-container" className="lg:col-span-8 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
              </span>
              <h2 className="font-serif italic text-sm text-slate-200 flex items-center gap-1.5">
                Live 4K Cinema Viewport
              </h2>
            </div>
            
            {/* Resolution indicator label */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowColorGrading(!showColorGrading)}
                className={`text-[9px] font-mono px-2.5 py-1 rounded-none border uppercase tracking-widest transition-all cursor-pointer ${
                  showColorGrading 
                    ? 'bg-[#cca43b] text-black font-semibold border-[#cca43b]' 
                    : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                COLOR GRADE
              </button>
              <span className="text-[9px] bg-[#0A0A0A] text-slate-300 font-mono px-2 py-0.5 rounded-none border border-white/10 uppercase tracking-widest">
                {settings.aspectRatio} Aspect
              </span>
              <span className="text-[9px] bg-white/5 text-white font-mono px-2 py-0.5 rounded-none border border-white/20 font-bold uppercase tracking-widest">
                {settings.resolution} ULTRA HD
              </span>
            </div>
          </div>

          {/* Interactive Dynamic Canvas Box */}
          <div className="relative bg-[#0A0A0A] rounded-none border border-white/10 overflow-hidden flex items-center justify-center">
            {isRenderMode ? (
              <div id="render-loader" className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col items-center justify-center space-y-4">
                <Film className="h-10 w-10 text-white animate-spin" />
                <div className="text-center space-y-1 max-w-[280px]">
                  <p className="text-slate-100 font-serif italic text-sm uppercase tracking-wider">Compiling AI Video Matrice</p>
                  <p className="text-slate-400 font-mono text-[9px] tracking-wider uppercase opacity-60">Combining 4K high-dynamic keyframes, audio harmonics and stop-motion parameters...</p>
                </div>
                {/* Visual Progress gauge */}
                <div className="w-11/12 max-w-xs bg-slate-900 h-1.5 rounded-none overflow-hidden border border-white/10">
                  <div 
                    className="bg-white h-full transition-all duration-300 ease-out"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
                <span className="text-white font-mono text-xs font-bold">{renderProgress}% COMPLETE</span>
              </div>
            ) : null}

            {/* Simulated overlay filters */}
            <canvas
              ref={canvasRef}
              width={sizes.width}
              height={sizes.height}
              id="cinema-canvas"
              className={`block bg-slate-900 ${getAspectRatioClasses()} transition-all shadow-[0_4px_30px_rgba(0,0,0,0.8)]`}
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
              }}
            />

            {/* Floating Color Correction Overlay Controls */}
            {showColorGrading && (
              <div className="absolute top-4 left-4 z-30 bg-black/90 backdrop-blur-md border border-white/15 p-4 w-64 space-y-4 shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-[#cca43b] font-bold">
                    <Sliders className="h-3 w-3 text-[#cca43b]" />
                    COLOR CORRECTION
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoTone}
                      title="Auto-calculate optimal settings based on average image luminosity"
                      className="text-[8px] font-mono px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 font-bold uppercase cursor-pointer tracking-wider transition-all select-none"
                    >
                      AUTO-TONE
                    </button>
                    <button 
                      onClick={() => {
                        setBrightness(100);
                        setContrast(100);
                        setSaturation(100);
                        setAutoToneStatus(null);
                      }}
                      className="text-[8px] font-mono tracking-wider hover:text-white text-white/40 uppercase cursor-pointer transition-colors"
                    >
                      RESET
                    </button>
                  </div>
                </div>

                {autoToneStatus && (
                  <div className="bg-emerald-500/10 border border-emerald-500/15 text-[8.5px] font-mono text-emerald-400 p-1.5 uppercase tracking-wide flex justify-between animate-fade-in">
                    <span>{autoToneStatus}</span>
                    <span className="text-emerald-500 font-semibold text-[7.5px]">OPTIMIZED</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* Brightness Component */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-white/50 uppercase tracking-widest">
                      <span>BRIGHTNESS</span>
                      <span className="text-white font-bold">{brightness}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={brightness} 
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-[#cca43b] h-[2px] bg-neutral-800 appearance-none cursor-pointer focus:outline-none"
                    />
                  </div>

                  {/* Contrast Component */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-white/50 uppercase tracking-widest">
                      <span>CONTRAST</span>
                      <span className="text-white font-bold">{contrast}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={contrast} 
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-[#cca43b] h-[2px] bg-neutral-800 appearance-none cursor-pointer focus:outline-none"
                    />
                  </div>

                  {/* Saturation Component */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-white/50 uppercase tracking-widest">
                      <span>SATURATION</span>
                      <span className="text-white font-bold">{saturation}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={saturation} 
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full accent-[#cca43b] h-[2px] bg-neutral-800 appearance-none cursor-pointer focus:outline-none"
                    />
                  </div>
                </div>

                {/* Info Tip Watermark */}
                <div className="text-[8px] font-mono text-white/30 uppercase tracking-widest pt-1">
                  * Hardware accelerated CSS filters
                </div>
              </div>
            )}

            {/* Display status watermark */}
            {(!isPlaying && progress === 0 && !isRenderMode) && (
              <button 
                onClick={handleTogglePlay}
                className="absolute inset-0 z-10 bg-black/75 hover:bg-black/60 transition-colors flex flex-col items-center justify-center text-white cursor-pointer group"
              >
                <div className="p-4 bg-white text-[#0A0A0A] rounded-none group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <Play className="h-5 w-5 fill-black" />
                </div>
                <span className="mt-4 font-serif italic text-sm tracking-wider uppercase text-slate-300 group-hover:text-white">
                  Click to Stream Dynamic Preview
                </span>
              </button>
            )}
          </div>

          {/* Player controls */}
          <div className="space-y-3 bg-[#0A0A0A]/60 p-3.5 rounded-none border border-white/10">
            {/* Seek control timeline bar */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-white font-bold min-w-[55px]">{formatTime(progress)}</span>
              <div className="relative flex-1 group">
                {/* Background timeline */}
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="0.05"
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="w-full accent-white h-1 bg-neutral-800 rounded-none appearance-none cursor-pointer focus:outline-none transition-colors"
                />
                
                {/* Scene markers dot indicators */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex justify-between px-1">
                  <div className="w-1 h-1 rounded-none bg-slate-950 border border-white/30" />
                  <div className="w-1 h-1 rounded-none bg-slate-950 border border-white/30" />
                  <div className="w-1 h-1 rounded-none bg-slate-950 border border-white/30" />
                  <div className="w-1 h-1 rounded-none bg-slate-950 border border-white/30" />
                  <div className="w-1 h-1 rounded-none bg-slate-950 border border-white/30" />
                </div>
              </div>
              <span className="font-mono text-xs text-slate-500">1:00.00</span>
            </div>

            {/* Standard control triggers */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  id="play-pause-btn"
                  className="p-2.5 bg-[#151515] hover:bg-[#252525] border border-white/15 rounded-none text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title={isPlaying ? "Pause Scene" : "Start Playback"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-slate-200" />}
                </button>
                <button
                  onClick={handleReset}
                  id="rewind-btn"
                  className="p-2.5 bg-[#151515] hover:bg-[#252525] border border-white/15 rounded-none text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="Rewind playhead"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-6 bg-white/10" />
                
                {/* Multi speaker ambient tracker toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  id="mute-btn"
                  className={`p-2.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest border ${
                    !isMuted 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#151515] hover:bg-[#252525] border-white/15 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle synthesiser mood background sound track"
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Harmonic Synth</span>
                </button>
              </div>

              {/* Quick-Scene Navigation */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((sceneNum, i) => {
                  const isActive = currentSceneIndex === i;
                  return (
                    <button
                      key={sceneNum}
                      onClick={() => handleSkipToScene(i)}
                      className={`px-3 py-1 text-[10px] font-mono transition-colors rounded-none cursor-pointer border ${
                        isActive 
                          ? 'bg-white text-[#0A0A0A] font-bold border-white' 
                          : 'bg-[#151515] hover:bg-[#252525] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      CH0{sceneNum}
                    </button>
                  );
                })}
              </div>

              {/* Resolution Recompile tool */}
              <button
                onClick={handleTriggerRecompileResolution}
                id="render-4k-trigger"
                className="px-4 py-2 bg-white text-black hover:bg-neutral-200 font-serif italic text-xs rounded-none transition-all flex items-center gap-1.5 cursor-pointer font-bold uppercase select-none"
              >
                Synthesize 4K
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Matrix panel */}
        <div id="telemetry-matrix" className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6 pt-5 lg:pt-0">
          <div className="space-y-4 flex-1">
            <div className="border-b border-white/10 pb-2">
              <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 block">
                Workspace Signal Tracker
              </h3>
            </div>

            {/* Script Chapter list */}
            <div className="space-y-3">
              <div className="bg-[#151515]/30 p-4 rounded-none border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-[#cca43b] font-bold tracking-wider uppercase">
                    ACTIVE CHAPTER 0{currentSceneIndex + 1}/04
                  </span>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                    {currentSceneIndex * 15}s - {(currentSceneIndex + 1) * 15}s
                  </span>
                </div>
                <h4 className="font-serif italic text-md text-white mb-2 truncate">
                  {scenes[currentSceneIndex]?.title || "Awaiting Director Storyboard"}
                </h4>
                <p className="font-sans text-xs text-white/60 leading-relaxed line-clamp-4">
                  {scenes[currentSceneIndex]?.prompt || "Generate a storyboard using the prompt engine above to expand this cinema playback timeline."}
                </p>
              </div>

              {/* Camera directions visual index */}
              <div className="bg-[#151515]/20 p-3 rounded-none border border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/50 tracking-widest uppercase">
                  CAMERA DIRECTION VECTOR
                </div>
                <p className="font-serif text-xs text-white/70 italic leading-relaxed">
                  &ldquo;{scenes[currentSceneIndex]?.cameraMovement || "N/A - Start storyboard orchestration."}&rdquo;
                </p>
              </div>

              {/* Synthesizer Matrix Indicator */}
              <div className="bg-[#151515]/30 p-3.5 rounded-none border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-[#cca43b] font-mono">
                  <span>Acoustic Wave Core</span>
                  <span className="text-white font-mono text-[8px] tracking-normal font-bold">
                    {!isMuted && isPlaying ? "ACTIVE SWEEP" : "MUTE / STANDBY"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-white/40">
                  <div>FREQ: {style.synthSettings.baseFreq} Hz</div>
                  <div>TIMBRE: {style.synthSettings.type}</div>
                  <div>LFO SPEED: {!isMuted && isPlaying ? "DYNAMIC" : "LOCKED"}</div>
                  <div>PHASING: {style.synthSettings.detune} ct</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-none p-4 mt-4 space-y-1">
            <p className="text-[9px] text-[#cca43b] font-mono font-bold uppercase tracking-widest">Directors Visual Synopsis</p>
            <p className="text-[11px] text-white/60 font-serif italic leading-relaxed">
              {themeSummary || "Specify your film description in the creative control board below to start orchestration."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
