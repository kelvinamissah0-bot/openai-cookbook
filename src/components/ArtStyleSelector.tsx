import React from 'react';
import { ArtisticStyle, ArtisticStyleId } from '../types';
import { ARTISTIC_STYLES } from '../data';
import { Check, Sparkles, Volume2, Info } from 'lucide-react';

interface ArtStyleSelectorProps {
  selectedStyleId: ArtisticStyleId;
  onSelectStyle: (id: ArtisticStyleId) => void;
}

export default function ArtStyleSelector({
  selectedStyleId,
  onSelectStyle,
}: ArtStyleSelectorProps) {
  return (
    <div id="style-selector-section" className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="font-sans font-medium text-sm tracking-wide text-slate-300 uppercase flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" id="sparkle-icon" />
          1. Select Customizable Artistic Style
        </h3>
        <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
          Veo-3.1 Compatible
        </span>
      </div>

      <div id="styles-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ARTISTIC_STYLES.map((style: ArtisticStyle) => {
          const isSelected = style.id === selectedStyleId;
          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              onClick={() => onSelectStyle(style.id)}
              className={`group relative text-left p-4 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/80 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/40'
              }`}
            >
              {/* Dynamic top hover accent line matching style id */}
              <div
                id={`accent-line-${style.id}`}
                className={`absolute top-0 left-0 right-0 h-1 transition-transform duration-500 scale-x-0 group-hover:scale-x-100 ${
                  style.id === 'cyberpunk' ? 'bg-fuchsia-500' :
                  style.id === 'watercolor' ? 'bg-teal-300' :
                  style.id === 'cinematic' ? 'bg-amber-500' :
                  style.id === 'vangogh' ? 'bg-blue-500' :
                  style.id === 'claymation' ? 'bg-orange-500' :
                  'bg-sky-400'
                }`}
              />

              <div className="flex justify-between items-start mb-2" id={`style-header-${style.id}`}>
                <h4 className="font-sans font-semibold text-slate-100 group-hover:text-white transition-colors">
                  {style.name}
                </h4>
                {isSelected ? (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full p-1" id={`check-selected-${style.id}`}>
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded" id={`style-id-badge-${style.id}`}>
                    {style.id}
                  </span>
                )}
              </div>

              <p className="font-sans text-xs text-slate-400 line-clamp-2 md:line-clamp-3 mb-4 group-hover:text-slate-300 leading-relaxed transition-colors">
                {style.description}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-slate-800/60 pt-3" id={`style-footer-${style.id}`}>
                {/* Visual Color Swabs */}
                <div className="flex gap-1" id={`color-palette-${style.id}`}>
                  {style.colors.map((color, cIdx) => (
                    <span
                      key={cIdx}
                      className="w-3 h-3 rounded-full border border-black/30"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Synthesis timbre marker */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono" id={`synth-timbre-${style.id}`}>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="max-w-[100px] truncate">{style.synthSettings.type} waves</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Visual Prompt Guidance */}
      <div id="artistic-guidelines" className="bg-slate-900/30 border border-slate-800/80 p-3.5 rounded-xl flex items-start gap-3">
        <Info className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" id="info-icon" />
        <div className="space-y-1">
          <p className="text-slate-200 font-sans font-medium text-xs">Aesthetic Style Synthesis Rules</p>
          <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
            The stylistic matrices control lighting density and texture mapping. Selection applies custom 
            render filters to our canvas viewport playback and generates style-specific storyboard text coordinates.
          </p>
        </div>
      </div>
    </div>
  );
}
