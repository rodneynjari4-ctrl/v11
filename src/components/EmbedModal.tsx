import React, { useState } from 'react';
import { X, Check, Copy, Globe, Sparkles, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'widget' | 'embed' | 'iframe'>('widget');

  if (!isOpen) return null;

  // Use the public Shared App URL for production embedding
  const publicOrigin = 'https://ais-pre-yuzi6mz2n65mjlj7o57dmr-606047717939.europe-west2.run.app';

  const widgetScriptCode = `<script src="${publicOrigin}/widget.js"></script>`;
  const embedScriptCode = `<script src="${publicOrigin}/embed.js"></script>`;

  const iframeHtmlCode = `<!-- VisionONE Voice AI Widget for WordPress HFCM -->
<div id="visionone-ai-root" style="position:fixed;bottom:20px;right:20px;z-index:99999999;width:270px;height:76px;background:transparent !important;transition:all 0.28s ease;">
  <iframe id="visionone-ai-frame" src="${publicOrigin}" allow="microphone *; autoplay *; clipboard-write *" allowtransparency="true" frameborder="0" style="width:100%;height:100%;border:none;background:transparent !important;background-color:transparent !important;"></iframe>
</div>
<script>
(function() {
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'VISIONONE_WIDGET_STATE') return;
    var el = document.getElementById('visionone-ai-root');
    if (!el) return;
    if (e.data.isOpen) {
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

  const copyToClipboard = (text: string, type: string) => {
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
              <p className="text-[11px] text-white/80 font-['Inter']">Zero white background • Full microphone access • Universal embedding</p>
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
          {/* Critical Tip Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold font-['Sora'] text-amber-900 text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Important for Embedding</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Google blocks iframes of the internal <code>ais-dev</code> URL due to Google account security headers. Always use the public Shared URL (<code>ais-pre</code>) or the direct script (<code>widget.js</code>), and click <strong>Share</strong> in AI Studio so Cloud Run publishes the public domain.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 gap-1 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('widget')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'widget'
                  ? 'bg-white text-[#111A3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Option 1: Direct Script (Recommended)
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'embed'
                  ? 'bg-white text-[#111A3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Option 2: Auto-Resizing Frame
            </button>
            <button
              onClick={() => setActiveTab('iframe')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'iframe'
                  ? 'bg-white text-[#111A3A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Option 3: Pure HTML
            </button>
          </div>

          {activeTab === 'widget' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Paste in WordPress HFCM plugin:</span>
                <button
                  onClick={() => copyToClipboard(widgetScriptCode, 'widget')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1D8DE6] hover:bg-[#1670b8] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {copiedType === 'widget' ? (
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
                <code>{widgetScriptCode}</code>
              </div>
              <p className="text-[10px] text-slate-500">
                ⭐ <strong>Best for WordPress:</strong> Injects the assistant directly into your website without an iframe. Immune to framing restrictions, has zero white background, and grants seamless hands-free microphone voice input!
              </p>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Paste in WordPress HFCM plugin:</span>
                <button
                  onClick={() => copyToClipboard(embedScriptCode, 'embed')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1D8DE6] hover:bg-[#1670b8] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {copiedType === 'embed' ? (
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
                <code>{embedScriptCode}</code>
              </div>
              <p className="text-[10px] text-slate-500">
                Creates an auto-resizing transparent iframe that expands on click and shrinks to a tiny 270x76 floating capsule when minimized.
              </p>
            </div>
          )}

          {activeTab === 'iframe' && (
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
                      <span>Copy HTML</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-['IBM_Plex_Mono'] text-[10px] leading-relaxed max-h-40 overflow-y-auto border border-slate-800 select-all whitespace-pre">
                <code>{iframeHtmlCode}</code>
              </div>
              <p className="text-[10px] text-slate-500">
                Self-contained HTML snippet with dynamic frame resizing script and transparent backgrounds.
              </p>
            </div>
          )}

          {/* 3 Step Setup Guide */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <h3 className="font-bold font-['Sora'] text-slate-800 text-[11px]">How to add in WordPress (HFCM Plugin):</h3>
            <ol className="space-y-1.5 text-[11px] text-slate-600 list-decimal list-inside">
              <li>Open your WordPress Admin &rarr; go to <strong>HFCM</strong> &rarr; <strong>Add New Snippet</strong>.</li>
              <li>Set <strong>Snippet Name</strong> to <em>VisionONE Voice AI</em>, <strong>Location</strong> to <em>Footer</em>, and <strong>Site Display</strong> to <em>Site Wide</em>.</li>
              <li>Paste the code into the <strong>Snippet / Code</strong> box and click <strong>Save</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CORS & Frame-Ancestors Enabled
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
