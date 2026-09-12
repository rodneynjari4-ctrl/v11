import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { VoiceState } from '../types';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface VoiceOrbProps {
  state: VoiceState;
  amplitude?: number; // 0.0 to 1.0
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
      phase += 0.035;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Base radius
      const baseRadius = 68;
      const ampBoost = state === 'speaking' || state === 'listening' ? (amplitude || 0.45) * 28 : 6;

      // Draw subtle radiating waves
      if (state === 'listening' || state === 'speaking' || state === 'thinking') {
        const ringCount = 3;
        for (let i = ringCount; i >= 1; i--) {
          const ringProgress = (phase * 0.8 + i * 0.35) % 1;
          const currentRadius = baseRadius + ringProgress * 42 + (amplitude * 18);
          const alpha = (1 - ringProgress) * (state === 'listening' ? 0.35 : 0.25);

          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(1, currentRadius), 0, Math.PI * 2);
          ctx.strokeStyle = state === 'listening'
            ? `rgba(53, 166, 247, ${alpha})`
            : `rgba(29, 141, 230, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw oscillating undulating wave perimeter
      const points = 64;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        let offset = 0;

        if (state === 'idle') {
          offset = Math.sin(angle * 3 + phase) * 2;
        } else if (state === 'listening') {
          offset = Math.sin(angle * 4 + phase * 2.5) * (ampBoost * 0.75) +
                   Math.cos(angle * 2 - phase * 1.5) * 3;
        } else if (state === 'thinking') {
          offset = Math.sin(angle * 6 + phase * 3) * 4;
        } else if (state === 'speaking') {
          offset = Math.sin(angle * 5 + phase * 3.2) * (ampBoost * 0.85) +
                   Math.cos(angle * 3 + phase * 2) * 4;
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

      // Gradient fill for outer wave
      const grad = ctx.createRadialGradient(
        centerX - 10,
        centerY - 15,
        15,
        centerX,
        centerY,
        baseRadius + 20
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
      ctx.shadowColor = state === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(53, 166, 247, 0.5)';
      ctx.shadowBlur = state === 'speaking' || state === 'listening' ? 24 : 14;
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
        return 'How can I help you?';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'VisionONE is responding...';
      case 'error':
        return 'Something went wrong.';
    }
  };

  const getStateSubtext = () => {
    switch (state) {
      case 'idle':
        return 'Ask about ERP, Payroll, eTIMS, or M-Pesa integration';
      case 'listening':
        return 'Speak naturally, I am listening...';
      case 'thinking':
        return 'Analyzing VisionONE enterprise knowledge...';
      case 'speaking':
        return 'Tap microphone at any time to interrupt';
      case 'error':
        return 'Please try again or use the text input';
    }
  };

  return (
    <div id="visionone-voice-orb-container" className="flex flex-col items-center justify-center select-none py-3">
      {/* Orb Canvas & Glass Container */}
      <div 
        onClick={onClick}
        className="relative w-52 h-52 flex items-center justify-center cursor-pointer group"
      >
        {/* Ambient Outer Halo */}
        <div
          className={`absolute inset-4 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
            state === 'error'
              ? 'bg-red-400/25'
              : state === 'listening'
              ? 'bg-[#35A6F7]/35 scale-110'
              : state === 'speaking'
              ? 'bg-[#1D8DE6]/35 scale-115'
              : state === 'thinking'
              ? 'bg-[#35A6F7]/25 animate-pulse'
              : 'bg-[#1D8DE6]/20'
          }`}
        />

        {/* Orbiting ring for Thinking state */}
        {state === 'thinking' && (
          <div className="absolute inset-2 rounded-full border border-[#35A6F7]/40 border-t-transparent animate-spin pointer-events-none" />
        )}

        {/* Concentric subtle soundwave rings for Speaking state */}
        {state === 'speaking' && (
          <div className="absolute inset-1 rounded-full border border-[#1D8DE6]/30 animate-ping pointer-events-none opacity-40 duration-1000" />
        )}

        {/* Dynamic HTML5 Canvas rendering interactive waveforms */}
        <canvas
          ref={canvasRef}
          width={208}
          height={208}
          className="relative z-10 drop-shadow-lg transition-transform duration-300"
        />

        {/* Inner Specular Highlight Lens */}
        <div className="absolute inset-10 rounded-full bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none z-20" />

        {/* Center state icon if error */}
        {state === 'error' && (
          <div className="absolute z-30 flex flex-col items-center justify-center text-white">
            <AlertCircle className="w-8 h-8 drop-shadow" />
          </div>
        )}
      </div>

      {/* State Text & Feedback */}
      <div className="text-center mt-3 px-4 min-h-[48px] flex flex-col items-center justify-center">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-semibold tracking-tight text-[#111A3A] flex items-center gap-1.5 font-['Sora']"
        >
          {getStateTitle()}
        </motion.p>
        <p className="text-xs text-[#111A3A]/70 mt-0.5 max-w-xs font-['Inter']">
          {getStateSubtext()}
        </p>

        {state === 'error' && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white bg-[#1D8DE6] hover:bg-[#35A6F7] shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Voice Assistant
          </button>
        )}
      </div>
    </div>
  );
};
