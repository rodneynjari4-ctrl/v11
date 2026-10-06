import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceState } from '../types';
import { AlertCircle, RefreshCw, Sparkles, Heart } from 'lucide-react';

interface VoiceOrbProps {
  state: VoiceState;
  amplitude?: number;
  onRetry?: () => void;
  onClick?: () => void;
  hasStarted?: boolean;
}

const REACTION_PHRASES = [
  "Hi! I'm OneBot 👋",
  "I'm listening! 🎙️",
  "At your service! ✨",
  "Ready to assist! 🚀",
  "Ask me anything! 💡",
  "VisionONE ready! 🌐",
  "Boop! Hello! 😊",
  "All ears! 🎧",
];

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  amplitude = 0,
  onRetry,
  onClick,
  hasStarted = false,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [lookDirection, setLookDirection] = useState<'center' | 'left' | 'right'>('center');
  const [isTapped, setIsTapped] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapReaction, setTapReaction] = useState<string | null>(null);
  const [isWaving, setIsWaving] = useState(false);

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';
  const isError = state === 'error';

  // Natural organic blinking and curious looking around loop
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    let unblinkTimeout: ReturnType<typeof setTimeout>;
    let lookTimeout: ReturnType<typeof setTimeout>;

    const triggerBlink = () => {
      setIsBlinking(true);
      unblinkTimeout = setTimeout(() => {
        setIsBlinking(false);
        const nextInterval = 2500 + Math.random() * 3200;
        blinkTimeout = setTimeout(triggerBlink, nextInterval);
      }, 120);
    };

    const triggerLook = () => {
      const dirs: Array<'center' | 'left' | 'right'> = ['center', 'left', 'right', 'center'];
      const nextDir = dirs[Math.floor(Math.random() * dirs.length)];
      setLookDirection(nextDir);
      lookTimeout = setTimeout(triggerLook, 3500 + Math.random() * 2500);
    };

    blinkTimeout = setTimeout(triggerBlink, 2000);
    lookTimeout = setTimeout(triggerLook, 3000);

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(unblinkTimeout);
      clearTimeout(lookTimeout);
    };
  }, []);

  // Friendly spontaneous greeting wave every now and then when idle
  useEffect(() => {
    if (state === 'idle') {
      const waveTimer = setTimeout(() => {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1400);
      }, 3500);
      return () => clearTimeout(waveTimer);
    }
  }, [state]);

  const handleRobotTap = () => {
    setIsTapped(true);
    setIsWaving(true);
    setTapCount((prev) => prev + 1);

    const randomPhrase = REACTION_PHRASES[Math.floor(Math.random() * REACTION_PHRASES.length)];
    setTapReaction(randomPhrase);

    setTimeout(() => {
      setIsTapped(false);
    }, 550);

    setTimeout(() => {
      setIsWaving(false);
    }, 1500);

    setTimeout(() => {
      setTapReaction(null);
    }, 2200);

    if (onClick) {
      onClick();
    }
  };

  const getStateTitle = () => {
    switch (state) {
      case 'idle':
        return !hasStarted ? 'Meet OneBot • Tap to Talk' : 'OneBot is Ready';
      case 'listening':
        return 'OneBot is Listening...';
      case 'thinking':
        return 'OneBot is Thinking...';
      case 'speaking':
        return 'OneBot is Speaking';
      case 'error':
        return 'Microphone Access Needed';
    }
  };

  const getStateSubtext = () => {
    switch (state) {
      case 'idle':
        return !hasStarted
          ? 'Tap OneBot or the Mic below to talk hands-free'
          : 'Speak anytime • Auto turn-taking active';
      case 'listening':
        return 'Speak freely • Tap Send or pause when finished';
      case 'thinking':
        return 'Analyzing with VisionONE ERP Intelligence...';
      case 'speaking':
        return 'Tap Stop or tap OneBot to interrupt anytime';
      case 'error':
        return 'Please allow microphone permissions in your browser';
    }
  };

  // Clamped amplitude scale for fluid dynamic motion (0.0 to 1.0)
  const ampScale = Math.min(1, Math.max(0, amplitude));
  const audioPulse = isListening ? ampScale : isSpeaking ? 0.35 + Math.sin(Date.now() / 240) * 0.25 : 0.05;

  // Eye gaze offset calculation
  const gazeOffsetX = lookDirection === 'left' ? -3 : lookDirection === 'right' ? 3 : 0;

  return (
    <div
      id="visionone-robot-container"
      className="flex flex-col items-center justify-center select-none py-1 relative w-full"
    >
      {/* Floating Interactive Speech Reaction Bubble */}
      <AnimatePresence>
        {tapReaction && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.75 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            className="absolute -top-8 z-30 px-3.5 py-1 rounded-full bg-[#111A3A]/95 text-white text-[11px] font-semibold font-['Sora'] border border-[#35A6F7]/50 shadow-xl flex items-center gap-1.5 pointer-events-none backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#35A6F7] animate-ping" />
            <span>{tapReaction}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Ambient Sparkles / Cyber Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
        {/* Top-right sparkle */}
        <motion.div
          animate={{
            y: [-4, 4, -4],
            opacity: [0.3, 0.85, 0.3],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 right-6 sm:right-8 text-[#52BAFF]"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>

        {/* Top-left soft star */}
        <motion.div
          animate={{
            y: [3, -5, 3],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 0.85, 1],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute top-4 left-6 sm:left-8 text-[#35A6F7]"
        >
          <span className="text-xs">✦</span>
        </motion.div>

        {/* Bottom-right sparkle */}
        <motion.div
          animate={{
            y: [-3, 3, -3],
            opacity: [0.2, 0.65, 0.2],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="absolute bottom-6 right-8 sm:right-10 text-[#52BAFF]"
        >
          <span className="text-[10px]">✧</span>
        </motion.div>
      </div>

      {/* Main Interactive Robot Avatar Card */}
      <div
        onClick={handleRobotTap}
        className="relative w-34 h-34 sm:w-40 sm:h-40 flex items-center justify-center cursor-pointer group touch-manipulation focus:outline-none"
        title="Tap OneBot to interact, interrupt, or toggle voice"
        role="button"
        tabIndex={0}
        aria-label="OneBot interactive assistant avatar"
      >
        {/* Dynamic Fluid Aura Glow Halo */}
        <motion.div
          animate={{
            scale: isListening
              ? [1.02, 1.16 + ampScale * 0.28, 1.02]
              : isSpeaking
              ? [1, 1.14, 1]
              : [1, 1.06, 1],
            opacity: isListening
              ? [0.45, 0.75 + ampScale * 0.2, 0.45]
              : isSpeaking
              ? [0.4, 0.7, 0.4]
              : 0.28,
          }}
          transition={{
            duration: isListening ? 1.2 : isSpeaking ? 1.6 : 3.0,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-colors duration-300 ${
            isError
              ? 'bg-rose-500/40'
              : isListening
              ? 'bg-gradient-to-tr from-[#1D8DE6]/55 via-[#35A6F7]/65 to-emerald-400/40'
              : isSpeaking
              ? 'bg-gradient-to-tr from-[#1D8DE6]/50 via-[#52BAFF]/60 to-[#111A3A]/40'
              : isThinking
              ? 'bg-gradient-to-tr from-[#35A6F7]/45 via-[#52BAFF]/55 to-[#1D8DE6]/40'
              : 'bg-[#1D8DE6]/25 group-hover:bg-[#1D8DE6]/45'
          }`}
        />

        {/* Ambient Expanding Concentric Radar Ripples when Listening or Speaking */}
        {(isListening || isSpeaking) && (
          <>
            <motion.div
              animate={{
                scale: [0.92, 1.42],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: isListening ? 1.2 : 1.6,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full border-2 border-[#35A6F7]/50 pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [0.92, 1.6],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: isListening ? 1.2 : 1.6,
                delay: 0.4,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full border border-[#1D8DE6]/40 pointer-events-none"
            />
          </>
        )}

        {/* Orbiting Thinking Cyber Gyro Ring */}
        {isThinking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.0, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1 rounded-full border-2 border-transparent border-t-[#35A6F7] border-r-[#52BAFF]/60 border-b-[#1D8DE6]/30 pointer-events-none shadow-sm"
          />
        )}

        {/* Floating Robot Body & Head Container with Physics & Spring Tap Reactions */}
        <motion.div
          animate={{
            y: isListening
              ? [0, -3 - ampScale * 4, 0]
              : isSpeaking
              ? [0, -4, 0]
              : [0, -6, 0],
            rotate: isThinking
              ? [0, 5, -5, 0]
              : isTapped
              ? tapCount % 2 === 0
                ? [-8, 8, -4, 0]
                : [8, -8, 4, 0]
              : isListening
              ? [-1.5, 1.5, -1.5]
              : [0, 1.8, -1.8, 0],
            scale: isTapped
              ? [1, 0.9, 1.14, 0.98, 1]
              : 1,
          }}
          transition={{
            y: {
              duration: isListening ? 1.4 : isSpeaking ? 1.6 : 3.0,
              repeat: Infinity,
              ease: "easeInOut",
            },
            rotate: {
              duration: isThinking ? 2.2 : isTapped ? 0.45 : 4.0,
              repeat: isTapped ? 1 : Infinity,
              ease: "easeInOut",
            },
            scale: {
              duration: 0.45,
              ease: "easeOut",
            },
          }}
          className="relative w-full h-full flex items-center justify-center drop-shadow-2xl"
        >
          {/* Scalable High-Performance Vector Robot SVG */}
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Metallic Head Gradient */}
              <linearGradient id="onebot-chassis" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#253768" />
                <stop offset="35%" stopColor="#1E2C58" />
                <stop offset="70%" stopColor="#111A3A" />
                <stop offset="100%" stopColor="#090E20" />
              </linearGradient>

              {/* Visor Glass Gradient with Specular Depth */}
              <linearGradient id="onebot-visor" x1="40" y1="45" x2="120" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#050814" />
                <stop offset="50%" stopColor="#080F26" />
                <stop offset="100%" stopColor="#0B1432" />
              </linearGradient>

              {/* Eye Glow Radial Gradient */}
              <radialGradient id="onebot-eye-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#6FD1FF" />
                <stop offset="75%" stopColor="#35A6F7" />
                <stop offset="100%" stopColor="#1D8DE6" />
              </radialGradient>

              {/* Antenna Core Glow */}
              <radialGradient id="antenna-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#6FD1FF" />
                <stop offset="85%" stopColor="#35A6F7" />
                <stop offset="100%" stopColor="#1D8DE6" />
              </radialGradient>

              {/* Cheerful Soft Blush Glow */}
              <radialGradient id="blush-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#35A6F7" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#35A6F7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#35A6F7" stopOpacity="0" />
              </radialGradient>

              {/* Thruster Jet Gradient */}
              <linearGradient id="thruster-beam" x1="80" y1="130" x2="80" y2="152" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#52BAFF" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1D8DE6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#111A3A" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 1. Antenna Stem, Signal Pulses & Glowing Tip */}
            <g id="robot-antenna">
              {/* Antenna Stem */}
              <rect
                x="77"
                y="16"
                width="6"
                height="18"
                rx="3"
                fill="#1E2C58"
                stroke="#35A6F7"
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />

              {/* Concentric Signal Arcs above antenna when Listening or Thinking */}
              {(isListening || isThinking || isSpeaking) && (
                <>
                  <motion.path
                    d="M 68 10 Q 80 2 92 10"
                    stroke="#52BAFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    animate={{
                      opacity: [0.2, 0.95, 0.2],
                      y: [0, -4, 0],
                      scale: [0.95, 1.08, 0.95],
                    }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    style={{ originX: '80px', originY: '10px' }}
                  />
                  <motion.path
                    d="M 63 5 Q 80 -4 97 5"
                    stroke="#35A6F7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    animate={{
                      opacity: [0.1, 0.75, 0.1],
                      y: [0, -6, 0],
                    }}
                    transition={{ duration: 1.1, delay: 0.25, repeat: Infinity, ease: "easeInOut" }}
                    style={{ originX: '80px', originY: '5px' }}
                  />
                </>
              )}

              {/* Antenna Glowing Orb */}
              <motion.circle
                cx="80"
                cy="14"
                r="8"
                fill="url(#antenna-glow)"
                animate={{
                  scale: isListening
                    ? [1, 1.28 + ampScale * 0.2, 1]
                    : isSpeaking
                    ? [1, 1.18, 1]
                    : [1, 1.08, 1],
                }}
                transition={{ duration: isListening ? 0.7 : 1.5, repeat: Infinity }}
                className="drop-shadow-[0_0_10px_rgba(82,186,255,0.9)]"
              />
            </g>

            {/* 2. Side Ear Audio Sensors (react dynamically to microphone amplitude) */}
            <g id="robot-ears">
              {/* Left Ear */}
              <motion.g
                animate={{
                  x: isListening ? -2 - ampScale * 6 : 0,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
              >
                <rect
                  x="18"
                  y="54"
                  width="15"
                  height="40"
                  rx="7.5"
                  fill="#162248"
                  stroke="#35A6F7"
                  strokeWidth="1.6"
                />
                {/* Glowing LED audio bar inside left ear */}
                <motion.rect
                  x="22"
                  y="62"
                  width="4"
                  height="24"
                  rx="2"
                  fill="#52BAFF"
                  animate={{
                    opacity: isListening ? 0.4 + ampScale * 0.6 : 0.45,
                    scaleY: isListening ? 0.6 + ampScale * 0.6 : 0.7,
                  }}
                  style={{ originY: '74px' }}
                />
              </motion.g>

              {/* Right Ear */}
              <motion.g
                animate={{
                  x: isListening ? 2 + ampScale * 6 : 0,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
              >
                <rect
                  x="127"
                  y="54"
                  width="15"
                  height="40"
                  rx="7.5"
                  fill="#162248"
                  stroke="#35A6F7"
                  strokeWidth="1.6"
                />
                {/* Glowing LED audio bar inside right ear */}
                <motion.rect
                  x="134"
                  y="62"
                  width="4"
                  height="24"
                  rx="2"
                  fill="#52BAFF"
                  animate={{
                    opacity: isListening ? 0.4 + ampScale * 0.6 : 0.45,
                    scaleY: isListening ? 0.6 + ampScale * 0.6 : 0.7,
                  }}
                  style={{ originY: '74px' }}
                />
              </motion.g>
            </g>

            {/* 3. Main Robot Head Chassis with Metallic Bevel */}
            <g id="robot-chassis">
              <rect
                x="28"
                y="32"
                width="104"
                height="88"
                rx="36"
                fill="url(#onebot-chassis)"
                stroke="#35A6F7"
                strokeWidth="2.2"
                strokeOpacity="0.55"
              />
              {/* Metallic top gloss reflection highlight */}
              <path
                d="M 40 42 C 55 35, 105 35, 120 42 C 106 48, 54 48, 40 42 Z"
                fill="#FFFFFF"
                opacity="0.14"
              />
            </g>

            {/* 4. Digital Visor Screen Display */}
            <g id="robot-visor">
              <rect
                x="40"
                y="46"
                width="80"
                height="60"
                rx="22"
                fill="url(#onebot-visor)"
                stroke="#1D8DE6"
                strokeWidth="1.8"
                strokeOpacity="0.6"
              />
              {/* Visor curved specular glass sheen */}
              <path
                d="M 45 52 C 65 47, 95 47, 115 52 C 95 57, 65 57, 45 52 Z"
                fill="#FFFFFF"
                opacity="0.16"
              />

              {/* Thinking Cyber Scanning Laser Beam */}
              {isThinking && (
                <motion.rect
                  x="43"
                  y="48"
                  width="20"
                  height="56"
                  rx="10"
                  fill="url(#onebot-eye-glow)"
                  opacity="0.22"
                  animate={{ x: [0, 54, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </g>

            {/* 5. Expressive Digital Eyes & Facial Expressions */}
            <g id="robot-eyes">
              {/* Idle / Listening / Tapped Eyes */}
              {!isSpeaking && !isError && (
                <>
                  {/* Left Eye */}
                  <motion.g
                    animate={{
                      scaleY: isBlinking ? 0.1 : 1,
                      x: gazeOffsetX,
                    }}
                    transition={{ duration: 0.08 }}
                    style={{ originX: '61px', originY: '71px' }}
                  >
                    {isThinking ? (
                      /* Thinking rotating cyber radar ring */
                      <motion.circle
                        cx="61"
                        cy="71"
                        r="8.5"
                        stroke="#52BAFF"
                        strokeWidth="3"
                        strokeDasharray="14 6"
                        fill="none"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ originX: '61px', originY: '71px' }}
                      />
                    ) : isTapped ? (
                      /* Tapped playful star or wide happy pupil */
                      <g>
                        <rect
                          x="52"
                          y="61"
                          width="18"
                          height="20"
                          rx="9"
                          fill="url(#onebot-eye-glow)"
                          className="drop-shadow-[0_0_8px_rgba(82,186,255,0.95)]"
                        />
                        <circle cx="58" cy="67" r="3.5" fill="#FFFFFF" />
                        <circle cx="64" cy="74" r="2" fill="#FFFFFF" opacity="0.9" />
                      </g>
                    ) : (
                      /* Friendly rounded cyan pill eye with sparkle */
                      <>
                        <rect
                          x="53"
                          y="62"
                          width="16"
                          height={isListening ? "19" : "17"}
                          rx="8"
                          fill="url(#onebot-eye-glow)"
                          className="drop-shadow-[0_0_7px_rgba(82,186,255,0.9)]"
                        />
                        {/* Eye pupil white gleam */}
                        <circle cx="58" cy="67" r="3" fill="#FFFFFF" />
                        <circle cx="63" cy="73" r="1.5" fill="#FFFFFF" opacity="0.85" />
                      </>
                    )}
                  </motion.g>

                  {/* Right Eye */}
                  <motion.g
                    animate={{
                      scaleY: isBlinking || (isTapped && tapCount % 3 === 0) ? 0.1 : 1,
                      x: gazeOffsetX,
                    }}
                    transition={{ duration: 0.08 }}
                    style={{ originX: '99px', originY: '71px' }}
                  >
                    {isThinking ? (
                      <motion.circle
                        cx="99"
                        cy="71"
                        r="8.5"
                        stroke="#52BAFF"
                        strokeWidth="3"
                        strokeDasharray="14 6"
                        fill="none"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ originX: '99px', originY: '71px' }}
                      />
                    ) : (
                      <>
                        <rect
                          x="91"
                          y="62"
                          width="16"
                          height={isListening ? "19" : "17"}
                          rx="8"
                          fill="url(#onebot-eye-glow)"
                          className="drop-shadow-[0_0_7px_rgba(82,186,255,0.9)]"
                        />
                        <circle cx="96" cy="67" r="3" fill="#FFFFFF" />
                        <circle cx="101" cy="73" r="1.5" fill="#FFFFFF" opacity="0.85" />
                      </>
                    )}
                  </motion.g>
                </>
              )}

              {/* Speaking Joyful Crescent Smiling Eyes (^ ^) */}
              {isSpeaking && (
                <>
                  <motion.path
                    d="M 52 74 Q 61 60 70 74"
                    stroke="#52BAFF"
                    strokeWidth="4.2"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="drop-shadow-[0_0_8px_rgba(82,186,255,0.95)]"
                  />
                  <motion.path
                    d="M 90 74 Q 99 60 108 74"
                    stroke="#52BAFF"
                    strokeWidth="4.2"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="drop-shadow-[0_0_8px_rgba(82,186,255,0.95)]"
                  />
                </>
              )}

              {/* Error Concerned Eyes */}
              {isError && (
                <>
                  <circle cx="61" cy="71" r="7.5" fill="#F87171" />
                  <circle cx="99" cy="71" r="7.5" fill="#F87171" />
                  <path d="M 72 90 Q 80 84 88 90" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </>
              )}
            </g>

            {/* 6. Soft Cyber Cheeks (glow warmer when listening or happy) */}
            <motion.circle
              cx="51"
              cy="87"
              r="7"
              fill="url(#blush-glow)"
              animate={{
                opacity: isListening || isSpeaking || isTapped ? 0.9 : 0.5,
                scale: isTapped ? 1.25 : 1,
              }}
              style={{ originX: '51px', originY: '87px' }}
            />
            <motion.circle
              cx="109"
              cy="87"
              r="7"
              fill="url(#blush-glow)"
              animate={{
                opacity: isListening || isSpeaking || isTapped ? 0.9 : 0.5,
                scale: isTapped ? 1.25 : 1,
              }}
              style={{ originX: '109px', originY: '87px' }}
            />

            {/* 7. Expressive Visor Mouth / Dynamic Audio Equalizer Waveform */}
            <g id="robot-mouth">
              {isListening && (
                /* Dynamic Real-Time Voice Waveform inside visor screen */
                <g className="translate-y-1">
                  {[-14, -7, 0, 7, 14].map((xOffset, idx) => {
                    const weight = [0.45, 0.95, 1.3, 0.9, 0.45][idx];
                    const height = Math.max(3.5, Math.min(16, 4 + ampScale * 18 * weight));
                    return (
                      <motion.line
                        key={idx}
                        x1={80 + xOffset}
                        y1={92 - height / 2}
                        x2={80 + xOffset}
                        y2={92 + height / 2}
                        stroke="#52BAFF"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_5px_rgba(82,186,255,0.85)]"
                      />
                    );
                  })}
                </g>
              )}

              {isSpeaking && (
                /* Animated speaking waveform mouth */
                <motion.path
                  d="M 69 91 Q 74 86, 80 91 T 91 91"
                  stroke="#52BAFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={{
                    d: [
                      "M 69 91 Q 74 86, 80 91 T 91 91",
                      "M 69 91 Q 74 97, 80 91 T 91 91",
                      "M 69 91 Q 74 86, 80 91 T 91 91",
                    ],
                  }}
                  transition={{ duration: 0.32, repeat: Infinity, ease: "easeInOut" }}
                  className="drop-shadow-[0_0_7px_rgba(82,186,255,0.9)]"
                />
              )}

              {state === 'idle' && (
                /* Friendly digital smile */
                <path
                  d="M 72 90 Q 80 97 88 90"
                  stroke="#35A6F7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
              )}
            </g>

            {/* 8. Floating Magnetic Levitating Paws / Friendly Waving Arm */}
            <g id="robot-paws">
              {/* Left Paw (levitates gently) */}
              <motion.rect
                x="35"
                y="119"
                width="24"
                height="13"
                rx="6.5"
                fill="#162248"
                stroke="#35A6F7"
                strokeWidth="1.4"
                animate={{
                  y: isSpeaking ? [0, -3, 0] : isTapped ? [-4, 2, 0] : [0, 3, 0],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Right Paw - ADORABLE WAVING GESTURE when tapped or greeting! */}
              <motion.g
                animate={{
                  y: isWaving ? [-8, -14, -8] : isSpeaking ? [0, -3, 0] : [0, 3, 0],
                  rotate: isWaving
                    ? [-12, 28, -14, 24, 0]
                    : isTapped
                    ? [0, 18, -10, 0]
                    : 0,
                }}
                transition={{
                  y: { duration: isWaving ? 0.6 : 1.8, repeat: isWaving ? 2 : Infinity, ease: "easeInOut" },
                  rotate: { duration: isWaving ? 0.7 : 0.45, repeat: isWaving ? 2 : 1, ease: "easeInOut" },
                }}
                style={{ originX: '112px', originY: '125px' }}
              >
                <rect
                  x="101"
                  y="119"
                  width="24"
                  height="13"
                  rx="6.5"
                  fill="#162248"
                  stroke="#35A6F7"
                  strokeWidth="1.4"
                />
                {/* Cute paw cyber palm accent */}
                <circle cx="113" cy="125.5" r="2.5" fill="#52BAFF" opacity="0.8" />
              </motion.g>

              {/* Levitating Thruster Jet Glow Field beneath robot */}
              <ellipse
                cx="80"
                cy="138"
                rx="28"
                ry="5.5"
                fill="#1D8DE6"
                opacity={0.22 + audioPulse * 0.35}
                className="blur-xs"
              />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* State Text & Feedback - Clear Typography & Mobile Accessibility */}
      <div className="text-center mt-1 px-3 min-h-[38px] flex flex-col items-center justify-center">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xs sm:text-sm font-semibold tracking-tight text-[#111A3A] flex items-center gap-1.5 font-['Sora']"
        >
          {getStateTitle()}
        </motion.p>
        <p className="text-[10px] sm:text-[11px] text-[#111A3A]/70 mt-0.5 max-w-xs font-['Inter'] leading-tight">
          {getStateSubtext()}
        </p>

        {isError && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold text-white bg-[#1D8DE6] hover:bg-[#35A6F7] shadow-sm transition-colors cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Voice
          </button>
        )}
      </div>
    </div>
  );
};

