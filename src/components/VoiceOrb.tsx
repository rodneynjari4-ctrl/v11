import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { VoiceState } from '../types';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface VoiceOrbProps {
  state: VoiceState;
  amplitude?: number;
  onRetry?: () => void;
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  amplitude = 0,
  onRetry,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas visualizer for ambient waveforms and particle waves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      phase += 0.038;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Base radius scaled down for compact embed
      const baseRadius = 40;
      const ampBoost = state === 'speaking' || state === 'listening' ? (amplitude || 0.4) * 16 : 4;

      // Draw subtle radiating waves
      if (state === 'listening' || state === 'speaking' || state === 'thinking') {
        const ringCount = 2;
        for (let i = ringCount; i >= 1; i--) {
          const ringProgress = (phase * 0.8 + i * 0.45) % 1;
          const currentRadius = baseRadius + ringProgress * 24 + (amplitude * 12);
          const alpha = (1 - ringProgress) * (state === 'listening' ? 0.35 : 0.22);

          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(1, currentRadius), 0, Math.PI * 2);
          ctx.strokeStyle = state === 'listening'
            ? `rgba(53, 166, 247, ${alpha})`
            : `rgba(29, 141, 230, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Draw oscillating undulating wave perimeter
      const points = 56;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        let offset = 0;

        if (state === 'idle') {
          offset = Math.sin(angle * 3 + phase) * 1.5;
        } else if (state === 'listening') {
          offset = Math.sin(angle * 4 + phase * 2.5) * (ampBoost * 0.7) +
                   Math.cos(angle * 2 - phase * 1.5) * 2;
        } else if (state === 'thinking') {
          offset = Math.sin(angle * 5 + phase * 3) * 2.5;
        } else if (state === 'speaking') {
          offset = Math.sin(angle * 4 + phase * 3.2) * (ampBoost * 0.8) +
                   Math.cos(angle * 3 + phase * 2) * 2.5;
        }

        const r = baseRadius + offset;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Radial gradient fill
      const grad = ctx.createRadialGradient(
        centerX - 8,
        centerY - 10,
        10,
        centerX,
        centerY,
        baseRadius + 14
      );

      if (state === 'error') {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        grad.addColorStop(0.6, 'rgba(220, 38, 38, 0.7)');
        grad.addColorStop(1, 'rgba(185, 28, 28, 0.2)');
      } else {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.25, '#35A6F7');
        grad.addColorStop(0.7, '#1D8DE6');
        grad.addColorStop(1, '#111A3A');
      }

      ctx.fillStyle = grad;
      ctx.shadowColor = state === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(53, 166, 247, 0.45)';
      ctx.shadowBlur = state === 'speaking' || state === 'listening' ? 16 : 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, amplitude]);

  const getStateTitle = () => {
    switch (state) {
      case 'idle':
        return 'How can I assist you?';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'VisionONE is speaking...';
      case 'error':
        return 'Microphone unavailable';
    }
  };

  const getStateSubtext = () => {
    switch (state) {
      case 'idle':
        return 'Tap orb to speak or type below';
      case 'listening':
        return 'Speak your question naturally';
      case 'thinking':
        return 'Consulting enterprise knowledge...';
      case 'speaking':
        return 'Tap orb or mic to interrupt';
      case 'error':
        return 'You can chat using the text input below';
    }
  };

  return (
    <div id="visionone-voice-orb-container" className="flex flex-col items-center justify-center select-none py-1">
      {/* Orb Canvas & Glass Container - Compact w-28 h-28 (112px) */}
      <div 
        onClick={onClick}
        className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
        title="Tap to speak"
      >
        {/* Ambient Outer Halo */}
        <div
          className={`absolute inset-2 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
            state === 'error'
              ? 'bg-red-400/20'
              : state === 'listening'
              ? 'bg-[#35A6F7]/30 scale-110'
              : state === 'speaking'
              ? 'bg-[#1D8DE6]/30 scale-110'
              : state === 'thinking'
              ? 'bg-[#35A6F7]/20 animate-pulse'
              : 'bg-[#1D8DE6]/15 group-hover:bg-[#1D8DE6]/25'
          }`}
        />

        {/* Orbiting ring for Thinking state */}
        {state === 'thinking' && (
          <div className="absolute inset-1 rounded-full border border-[#35A6F7]/40 border-t-transparent animate-spin pointer-events-none" />
        )}

        {/* Concentric subtle soundwave rings for Speaking state */}
        {state === 'speaking' && (
          <div className="absolute inset-0 rounded-full border border-[#1D8DE6]/30 animate-ping pointer-events-none opacity-30 duration-1000" />
        )}

        {/* Dynamic HTML5 Canvas rendering interactive waveforms */}
        <canvas
          ref={canvasRef}
          width={130}
          height={130}
          className="relative z-10 drop-shadow-md transition-transform duration-300"
        />

        {/* Inner Specular Highlight Lens */}
        <div className="absolute inset-6 rounded-full bg-gradient-to-b from-white/35 via-transparent to-transparent pointer-events-none z-20" />

        {/* Center state icon if error */}
        {state === 'error' && (
          <div className="absolute z-30 flex flex-col items-center justify-center text-white">
            <AlertCircle className="w-5 h-5 drop-shadow" />
          </div>
        )}
      </div>

      {/* State Text & Feedback - Compact */}
      <div className="text-center mt-1.5 px-3 min-h-[36px] flex flex-col items-center justify-center">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xs sm:text-sm font-semibold tracking-tight text-[#111A3A] flex items-center gap-1 font-['Sora']"
        >
          {getStateTitle()}
        </motion.p>
        <p className="text-[10px] sm:text-[11px] text-[#111A3A]/70 mt-0.5 max-w-xs font-['Inter'] leading-tight">
          {getStateSubtext()}
        </p>

        {state === 'error' && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-[#1D8DE6] hover:bg-[#35A6F7] shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Voice
          </button>
        )}
      </div>
    </div>
  );
};
