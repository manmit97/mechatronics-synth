'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useProjectStore } from '@/stores/project-store';
import { Activity, Layers, ArrowRight, Cpu, Sparkles, Box, GripVertical } from 'lucide-react';
import { playClickSound, playConnectSound } from '@/utils/audio';
import { ConceptLibraryToggle } from '@/components/chat/ConceptLibraryToggle';
import { ComponentLibraryToggle } from '@/components/chat/ComponentLibraryToggle';
import { useConceptLibraryStore } from '@/stores/concept-library-store';
import { useComponentLibraryStore } from '@/stores/component-library-store';

const Scene3D = dynamic(
  () => import('@/components/three/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => <SceneLoadingPlaceholder /> }
);

const LandingBackground3D = dynamic(
  () => import('@/components/three/LandingBackground3D'),
  { ssr: false }
);

function SceneLoadingPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-indigo-400 tracking-widest">INITIALIZING ENGINE...</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const showWorkspace = useProjectStore((s) => s.showWorkspace);
  const setShowWorkspace = useProjectStore((s) => s.setShowWorkspace);
  const show3DViewport = useProjectStore((s) => s.show3DViewport);
  const setShow3DViewport = useProjectStore((s) => s.setShow3DViewport);
  const setPillar = useProjectStore((s) => s.setPillar);

  // Resize logic for IDE-style chat window
  const [chatWidth, setChatWidth] = useState(460);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      // p-4 adds 16px padding on the left
      const newWidth = e.clientX - 16;
      if (newWidth >= 300 && newWidth <= window.innerWidth * 0.8) {
        setChatWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleStartDesigning = () => {
    playConnectSound();
    // Default to 'physical' pillar as a baseline to ensure the app works,
    // though the UI doesn't emphasize pillars upfront anymore.
    setPillar('physical');
    
    setTimeout(() => {
      setShowWorkspace(true);
    }, 400);
  };

  const handleBackToHome = () => {
    playClickSound(false);
    setShowWorkspace(false);
    useConceptLibraryStore.getState().closeLibrary();
    useComponentLibraryStore.getState().closeLibrary();
  };

  // ─── Workspace View (Configurator / Sim) ───────────────────────────────────
  if (showWorkspace) {
    return (
      <div className="flex-1 flex flex-col p-4 bg-mesh-workspace relative min-h-0 overflow-hidden">
        
        {/* Modern Header */}
        <div className="flex items-center justify-between px-6 py-3 glass-panel rounded-xl mb-4 relative z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToHome}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Return
            </button>
            <div className="w-px h-5 bg-white/10 mx-2" />
            
            {/* Centered or flex-start section for Catalogues */}
            <div className="flex items-center gap-2 mr-auto ml-2">
              <ConceptLibraryToggle />
              <ComponentLibraryToggle />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                playClickSound(false);
                setShow3DViewport(!show3DViewport);
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 ${
                show3DViewport 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              {show3DViewport ? 'Hide 3D View' : 'Show 3D View'}
            </button>

          </div>
        </div>

        {/* Split View Container */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-4">
          
          {/* Chat Panel Sidebar */}
          <div 
            className={`shrink-0 flex flex-col min-h-[300px] lg:min-h-0 glass-panel rounded-xl overflow-hidden relative ${
              show3DViewport 
                ? 'lg:flex-none' 
                : 'flex-1 w-full'
            }`}
            style={
              show3DViewport
                ? { width: `${chatWidth}px` }
                : {}
            }
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 z-20" />
            <ChatPanel isLandingPage />
            
            {/* IDE-style Drag Handle */}
            {show3DViewport && (
              <div 
                className="absolute top-0 right-0 w-3 h-full cursor-col-resize z-50 flex items-center justify-center hover:bg-[#60a5fa]/20 group transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  isDragging.current = true;
                  document.body.style.cursor = 'col-resize';
                }}
              >
                <div className="h-8 w-1 rounded-full bg-[#60a5fa]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          {/* 3D Viewport */}
          {show3DViewport && (
            <div className="flex-1 relative min-h-[300px] lg:min-h-0 flex flex-col glass-panel-light rounded-xl overflow-hidden border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex-1 relative z-10 w-full h-full bg-[#050505]/50">
                <Scene3D />
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ─── Landing Page Hero ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col relative select-none items-center justify-center overflow-y-auto min-h-0 bg-mesh-gradient">
      
      {/* Decorative Background Elements & 3D Scene */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]" />
        <LandingBackground3D />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center text-center px-6 py-20 pointer-events-none">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border-white/10 mb-8 animate-[fadeInUp_0.6s_ease-out_both]">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
            Next-Gen Engineering Platform
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 animate-[fadeInUp_0.6s_ease-out_both] [animation-delay:100ms]">
          <span className="text-white">Architect the Future of</span><br />
          <span className="text-gradient-accent">Mechatronics</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-[fadeInUp_0.6s_ease-out_both] [animation-delay:200ms]">
          Design, simulate, and synthesize complex physical automation systems in a seamless, AI-driven environment. No complex hardware required—just pure engineering potential.
        </p>

        {/* CTA Button */}
        <div className="animate-[fadeInUp_0.6s_ease-out_both] [animation-delay:300ms] pointer-events-auto">
          <button
            onClick={handleStartDesigning}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-white/5 backdrop-blur-md border border-white/10 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative">Start Designing</span>
            <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
        
        {/* Features/Stats Bar below CTA */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl animate-[fadeInUp_0.6s_ease-out_both] [animation-delay:400ms] pointer-events-auto">
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
             <Cpu className="w-6 h-6 text-indigo-400 mb-3" />
             <h3 className="text-white font-semibold mb-1">AI-Powered Engine</h3>
             <p className="text-xs text-gray-400">Automated component selection and validation.</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
             <Layers className="w-6 h-6 text-purple-400 mb-3" />
             <h3 className="text-white font-semibold mb-1">Multi-Domain</h3>
             <p className="text-xs text-gray-400">Mechanical, electrical, and software synthesis.</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
             <Activity className="w-6 h-6 text-emerald-400 mb-3" />
             <h3 className="text-white font-semibold mb-1">Real-Time Simulation</h3>
             <p className="text-xs text-gray-400">Instant visual and physical feedback loops.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
