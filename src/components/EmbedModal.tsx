import React, { useState } from 'react';
import { X, Check, Copy, Code2, Globe, Sparkles, CheckCircle2 } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<'script' | 'iframe' | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'iframe'>('script');

  if (!isOpen) return null;

  // Determine current origin or production fallback
  const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://ais-pre-yuzi6mz2n65mjlj7o57dmr-606047717939.europe-west2.run.app';

  const scriptCode = `<script src="${origin}/embed.js"></script>`;

  const iframeHtmlCode = `<!-- VisionONE Voice AI Widget for WordPress HFCM -->
<div id="visionone-ai-root" style="position:fixed;bottom:20px;right:20px;z-index:99999999;width:270px;height:76px;background:transparent !important;transition:all 0.28s ease;">
  <iframe id="visionone-ai-frame" src="${origin}" allow="microphone *; autoplay *; clipboard-write *" allowtransparency="true" style="width:100%;height:100%;border:none;background:transparent !important;background-color:transparent !important;"></iframe>
</div>
<script>
(function() {
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'VISIONONE_WIDGET_STATE') return;
    var el = document.getElementById('visionone-ai-root');
    if (!el) return;
    if (e.data.isClosedCompletely) {
      el.style.display = 'none';
    } else if (e.data.isOpen) {
      var isMobile = window.innerWidth <= 480;
      el.style.display = 'block';
      el.style.width = isMobile ? '100vw' : '395px';
      el.style.height = isMobile ? '100dvh' : '670px';
      el.style.bottom = isMobile ? '0' : '20px';
      el.style.right = isMobile ? '0' : '20px';
    } else {
      el.style.display = 'block';
      el.style.width = '270px';
      el.style.height = '76px';
      el.style.bottom = '20px';
      el.style.right = '20px';
    }
  });
})();
</script>`;

  const copyToClipboard = (text: string, type: 'script' | 'iframe') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#111A3A] via-[#1D8DE6] to-[#35A6F7] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-['Sora'] leading-tight">WordPress HFCM Embed Code</h2>
              <p className="text-[11px] text-white/80 font-['Inter']">Zero white background • Auto-resizing • Complete close</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-['Inter'] text-[#111A3A]">
          {/* Explanation Banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold font-['Sora'] text-blue-900 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#1D8DE6]" />
              <span>Why this solves the WordPress issue</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Standard iframes on WordPress stay at a fixed width/height and have default white backgrounds. Our workaround uses dynamic responsive messaging: when closed, the frame shrinks to the exact button size with 100% transparency. When closed completely, it hides entirely!
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 gap-1 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'script'
                  ? 'bg-white text-[#111A3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Option 1: 1-Line Script (Recommended)
            </button>
            <button
              onClick={() => setActiveTab('iframe')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'iframe'
                  ? 'bg-white text-[#111A3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Option 2: Pure HTML Snippet
            </button>
          </div>

          {activeTab === 'script' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Paste in WordPress HFCM plugin:</span>
                <button
                  onClick={() => copyToClipboard(scriptCode, 'script')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1D8DE6] hover:bg-[#1670b8] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {copiedType === 'script' ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-['IBM_Plex_Mono'] text-[11px] overflow-x-auto border border-slate-800 select-all">
                <code>{scriptCode}</code>
              </div>
              <p className="text-[10px] text-slate-500">
                This loads the official lightweight loader that automatically configures transparency, permissions, and smooth resizing.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Paste into HFCM Snippet content:</span>
                <button
                  onClick={() => copyToClipboard(iframeHtmlCode, 'iframe')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1D8DE6] hover:bg-[#1670b8] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {copiedType === 'iframe' ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy HTML Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-['IBM_Plex_Mono'] text-[10px] leading-relaxed max-h-44 overflow-y-auto border border-slate-800 select-all whitespace-pre">
                <code>{iframeHtmlCode}</code>
              </div>
              <p className="text-[10px] text-slate-500">
                Pure HTML + JS with no external script dependency. Handles live resizing between widget open and closed states.
              </p>
            </div>
          )}

          {/* 3 Step Setup Guide */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <h3 className="font-bold font-['Sora'] text-slate-800 text-[11px]">How to add in WordPress (HFCM Plugin):</h3>
            <ol className="space-y-1.5 text-[11px] text-slate-600 list-decimal list-inside">
              <li>Open your WordPress Admin &rarr; go to <strong>HFCM</strong> &rarr; <strong>Add New Snippet</strong>.</li>
              <li>Set <strong>Snippet Name</strong> to <em>VisionONE Voice AI</em>, <strong>Location</strong> to <em>Footer</em>, and <strong>Site Display</strong> to <em>Site Wide</em>.</li>
              <li>Paste the copied code into the <strong>Snippet / Code</strong> box and click <strong>Save</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Tested with Header and Footer Code Manager (HFCM)
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
