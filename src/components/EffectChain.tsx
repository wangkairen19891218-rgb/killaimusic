import React, { useState, useEffect } from 'react';
import { Plus, X, Settings, Power, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import * as Tone from 'tone';

interface EffectConfig {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
  order: number;
}

interface EffectChainProps {
  effects: EffectConfig[];
  onEffectsChange: (effects: EffectConfig[]) => void;
  className?: string;
}

// Effect presets and parameter definitions
const EFFECT_TYPES = {
  reverb: {
    name: 'Reverb',
    parameters: {
      roomSize: { min: 0, max: 1, default: 0.3, step: 0.01, unit: '' },
      decay: { min: 0.1, max: 10, default: 1.5, step: 0.1, unit: 's' },
      wet: { min: 0, max: 1, default: 0.3, step: 0.01, unit: '' }
    }
  },
  delay: {
    name: 'Delay',
    parameters: {
      delayTime: { min: 0, max: 1, default: 0.25, step: 0.01, unit: 's' },
      feedback: { min: 0, max: 0.95, default: 0.3, step: 0.01, unit: '' },
      wet: { min: 0, max: 1, default: 0.3, step: 0.01, unit: '' }
    }
  },
  chorus: {
    name: 'Chorus',
    parameters: {
      frequency: { min: 0.1, max: 10, default: 1.5, step: 0.1, unit: 'Hz' },
      delayTime: { min: 2, max: 20, default: 3.5, step: 0.1, unit: 'ms' },
      depth: { min: 0, max: 1, default: 0.7, step: 0.01, unit: '' },
      wet: { min: 0, max: 1, default: 0.5, step: 0.01, unit: '' }
    }
  },
  distortion: {
    name: 'Distortion',
    parameters: {
      distortion: { min: 0, max: 1, default: 0.4, step: 0.01, unit: '' },
      oversample: { min: 0, max: 3, default: 1, step: 1, unit: 'x' },
      wet: { min: 0, max: 1, default: 1, step: 0.01, unit: '' }
    }
  },
  filter: {
    name: 'Filter',
    parameters: {
      frequency: { min: 20, max: 20000, default: 1000, step: 1, unit: 'Hz' },
      Q: { min: 0.1, max: 30, default: 1, step: 0.1, unit: '' },
      gain: { min: -40, max: 40, default: 0, step: 0.1, unit: 'dB' },
      type: { min: 0, max: 3, default: 0, step: 1, unit: '' } // 0: lowpass, 1: highpass, 2: bandpass, 3: notch
    }
  },
  compressor: {
    name: 'Compressor',
    parameters: {
      threshold: { min: -60, max: 0, default: -24, step: 1, unit: 'dB' },
      ratio: { min: 1, max: 20, default: 4, step: 0.1, unit: ':1' },
      attack: { min: 0, max: 1, default: 0.003, step: 0.001, unit: 's' },
      release: { min: 0, max: 1, default: 0.1, step: 0.01, unit: 's' },
      knee: { min: 0, max: 40, default: 30, step: 1, unit: 'dB' }
    }
  },
  eq: {
    name: 'EQ',
    parameters: {
      lowGain: { min: -20, max: 20, default: 0, step: 0.1, unit: 'dB' },
      midGain: { min: -20, max: 20, default: 0, step: 0.1, unit: 'dB' },
      highGain: { min: -20, max: 20, default: 0, step: 0.1, unit: 'dB' },
      lowFreq: { min: 20, max: 500, default: 200, step: 1, unit: 'Hz' },
      midFreq: { min: 200, max: 5000, default: 1000, step: 1, unit: 'Hz' },
      highFreq: { min: 1000, max: 20000, default: 5000, step: 1, unit: 'Hz' }
    }
  },
  limiter: {
    name: 'Limiter',
    parameters: {
      threshold: { min: -20, max: 0, default: -3, step: 0.1, unit: 'dB' },
      lookAhead: { min: 0, max: 0.1, default: 0.005, step: 0.001, unit: 's' }
    }
  }
};

const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass', 'notch'];

export const EffectChain: React.FC<EffectChainProps> = ({
  effects,
  onEffectsChange,
  className = ''
}) => {
  const [expandedEffect, setExpandedEffect] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addEffect = (type: string) => {
    const effectType = EFFECT_TYPES[type as keyof typeof EFFECT_TYPES];
    if (!effectType) return;

    const newEffect: EffectConfig = {
      id: `${type}_${Date.now()}`,
      type,
      name: effectType.name,
      enabled: true,
      parameters: Object.fromEntries(
        Object.entries(effectType.parameters).map(([key, config]) => [
          key,
          config.default
        ])
      ),
      order: effects.length
    };

    onEffectsChange([...effects, newEffect]);
    setShowAddMenu(false);
  };

  const removeEffect = (effectId: string) => {
    const updatedEffects = effects
      .filter(effect => effect.id !== effectId)
      .map((effect, index) => ({ ...effect, order: index }));
    onEffectsChange(updatedEffects);
  };

  const toggleEffect = (effectId: string) => {
    const updatedEffects = effects.map(effect =>
      effect.id === effectId
        ? { ...effect, enabled: !effect.enabled }
        : effect
    );
    onEffectsChange(updatedEffects);
  };

  const updateEffectParameter = (effectId: string, parameter: string, value: number) => {
    const updatedEffects = effects.map(effect =>
      effect.id === effectId
        ? {
            ...effect,
            parameters: {
              ...effect.parameters,
              [parameter]: value
            }
          }
        : effect
    );
    onEffectsChange(updatedEffects);
  };

  const moveEffect = (effectId: string, direction: 'up' | 'down') => {
    const currentIndex = effects.findIndex(effect => effect.id === effectId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= effects.length) return;

    const updatedEffects = [...effects];
    [updatedEffects[currentIndex], updatedEffects[newIndex]] = 
    [updatedEffects[newIndex], updatedEffects[currentIndex]];

    // Update order values
    updatedEffects.forEach((effect, index) => {
      effect.order = index;
    });

    onEffectsChange(updatedEffects);
  };

  const resetEffect = (effectId: string) => {
    const effect = effects.find(e => e.id === effectId);
    if (!effect) return;

    const effectType = EFFECT_TYPES[effect.type as keyof typeof EFFECT_TYPES];
    if (!effectType) return;

    const resetParameters = Object.fromEntries(
      Object.entries(effectType.parameters).map(([key, config]) => [
        key,
        config.default
      ])
    );

    updateEffectParameters(effectId, resetParameters);
  };

  const updateEffectParameters = (effectId: string, parameters: Record<string, number>) => {
    const updatedEffects = effects.map(effect =>
      effect.id === effectId
        ? { ...effect, parameters }
        : effect
    );
    onEffectsChange(updatedEffects);
  };

  const formatParameterValue = (value: number, parameter: string, effectType: string) => {
    const paramConfig = EFFECT_TYPES[effectType as keyof typeof EFFECT_TYPES]?.parameters[parameter];
    if (!paramConfig) return value.toString();

    if (parameter === 'type' && effectType === 'filter') {
      return FILTER_TYPES[Math.floor(value)] || 'lowpass';
    }

    const formattedValue = paramConfig.step < 1 ? value.toFixed(2) : Math.round(value).toString();
    return `${formattedValue}${paramConfig.unit}`;
  };

  const renderParameterControl = (effect: EffectConfig, parameterName: string) => {
    const effectType = EFFECT_TYPES[effect.type as keyof typeof EFFECT_TYPES];
    if (!effectType) return null;

    const paramConfig = effectType.parameters[parameterName];
    if (!paramConfig) return null;

    const value = effect.parameters[parameterName] ?? paramConfig.default;

    return (
      <div key={parameterName} className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground capitalize">
            {parameterName.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <span className="text-sm text-muted-foreground">
            {formatParameterValue(value, parameterName, effect.type)}
          </span>
        </div>
        <input
          type="range"
          min={paramConfig.min}
          max={paramConfig.max}
          step={paramConfig.step}
          value={value}
          onChange={(e) => updateEffectParameter(effect.id, parameterName, parseFloat(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    );
  };

  const sortedEffects = [...effects].sort((a, b) => a.order - b.order);

  return (
    <div className={`effect-chain space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
        <h3 className="text-lg font-semibold text-foreground">Effect Chain</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="p-2">
                <div className="text-sm font-medium text-foreground mb-2">Add Effect</div>
                {Object.entries(EFFECT_TYPES).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => addEffect(type)}
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded transition-colors"
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Effects List */}
      <div className="space-y-2">
        {sortedEffects.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground bg-card border border-border rounded-lg">
            No effects added. Click the + button to add an effect.
          </div>
        ) : (
          sortedEffects.map((effect, index) => (
            <div
              key={effect.id}
              className={`bg-card border border-border rounded-lg transition-all ${
                effect.enabled ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {/* Effect Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleEffect(effect.id)}
                    className={`p-1 rounded transition-colors ${
                      effect.enabled
                        ? 'text-green-500 hover:text-green-600'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Power size={16} />
                  </button>
                  
                  <div>
                    <h4 className="font-medium text-foreground">{effect.name}</h4>
                    <p className="text-sm text-muted-foreground">Position: {index + 1}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveEffect(effect.id, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  
                  <button
                    onClick={() => moveEffect(effect.id, 'down')}
                    disabled={index === sortedEffects.length - 1}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                  
                  <button
                    onClick={() => resetEffect(effect.id)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Reset to defaults"
                  >
                    <RotateCcw size={16} />
                  </button>
                  
                  <button
                    onClick={() => setExpandedEffect(
                      expandedEffect === effect.id ? null : effect.id
                    )}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings size={16} />
                  </button>
                  
                  <button
                    onClick={() => removeEffect(effect.id)}
                    className="p-1 rounded text-red-500 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Effect Parameters */}
              {expandedEffect === effect.id && (
                <div className="px-3 pb-3 border-t border-border">
                  <div className="pt-3 space-y-4">
                    {Object.keys(EFFECT_TYPES[effect.type as keyof typeof EFFECT_TYPES]?.parameters || {}).map(
                      parameterName => renderParameterControl(effect, parameterName)
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Effect Chain Info */}
      {sortedEffects.length > 0 && (
        <div className="p-3 bg-muted/50 border border-border rounded-lg">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Total Effects: {sortedEffects.length}</span>
              <span>Active: {sortedEffects.filter(e => e.enabled).length}</span>
            </div>
            <div className="mt-1 text-xs">
              Signal Flow: Input → {sortedEffects.map(e => e.name).join(' → ')} → Output
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EffectChain;