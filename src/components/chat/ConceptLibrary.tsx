'use client';

import { useState } from 'react';
import { Library, X, Search, ChevronRight, Activity, Cog, Workflow, Cpu, Layers, Truck, Plane, Monitor, Anchor, LucideIcon } from 'lucide-react';
import { useConceptLibraryStore } from '@/stores/concept-library-store';
import { useProjectStore } from '@/stores/project-store';
import { usePathname } from 'next/navigation';
import { CONCEPTS_CATALOGUE, MechatronicsDomain } from '@/data/mechatronics-library';
import { playClickSound } from '@/utils/audio';

// Props removed, using global store

const DOMAINS: { id: MechatronicsDomain | 'All'; label: string; icon: LucideIcon }[] = [
  { id: 'All', label: 'ALL CONCEPTS', icon: Library },
  { id: 'Industrial', label: 'INDUSTRIAL', icon: Cog },
  { id: 'Medical', label: 'MEDICAL', icon: Activity },
  { id: 'Aerospace', label: 'AEROSPACE', icon: Plane },
  { id: 'Consumer', label: 'CONSUMER', icon: Monitor },
  { id: 'Defense', label: 'DEFENSE', icon: Truck },
  { id: 'Research', label: 'RESEARCH', icon: Cpu },
  { id: 'Agriculture', label: 'AGRICULTURE', icon: Workflow },
  { id: 'Logistics', label: 'LOGISTICS', icon: Layers },
  { id: 'Automotive', label: 'AUTOMOTIVE', icon: Truck },
  { id: 'Marine', label: 'MARINE', icon: Anchor },
];

import { useChatStore } from '@/stores/chat-store';

export function ConceptLibrary() {
  const { isOpen, closeLibrary } = useConceptLibraryStore();
  const { setPendingPrompt, openDrawer } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<MechatronicsDomain | 'All'>('All');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  
  const pathname = usePathname();
  const showWorkspace = useProjectStore((s) => s.showWorkspace);
  const isWorkspaceView = pathname === '/' && showWorkspace;

  if (!isOpen) return null;

  const filteredConcepts = CONCEPTS_CATALOGUE.filter((c) => {
    const matchesDomain = activeDomain === 'All' || c.domain === activeDomain;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const selectedConcept = CONCEPTS_CATALOGUE.find((c) => c.id === selectedConceptId);

  return (
    <div className={`absolute inset-x-0 bottom-0 z-50 flex bg-[#121212]/95 backdrop-blur-sm animate-fade-in text-white ${isWorkspaceView ? 'top-[80px]' : 'top-0'}`}>
      {/* Left Panel: Catalog Browser */}
      <div className="flex-1 flex flex-col border-r border-[#374151]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#374151] bg-[#1a1b1e]">
          <Library className="w-4 h-4 text-[#60a5fa]" />
          <span className="text-sm font-semibold tracking-wider text-[#60a5fa]">
            CONCEPTS CATALOGUE
          </span>
          <span className="text-xs text-[#6b7280] ml-2 font-medium">
            ({CONCEPTS_CATALOGUE.length} FULL-SYSTEM TEMPLATES)
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 py-2 border-b border-[#374151] bg-[#1e1f22] space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, e.g. 'Quadcopter', 'Robot Arm', 'LiDAR'..."
              className="w-full pl-8 pr-3 py-2 bg-[#111] border border-[#374151] rounded text-sm text-[#f3f4f6] placeholder:text-[#4b5563] focus:outline-none focus:border-[#60a5fa] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
            {DOMAINS.map((domain) => {
              const isActive = activeDomain === domain.id;
              const Icon = domain.icon;
              return (
                <button
                  key={domain.id}
                  onClick={() => { playClickSound(true); setActiveDomain(domain.id); setSelectedConceptId(null); }}
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#374151] text-[#f3f4f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {domain.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Concept Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
            {filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                onClick={() => { playClickSound(true); setSelectedConceptId(concept.id); }}
                className={`p-3 rounded-lg border transition-all cursor-pointer group hover:bg-[#1a1b1e] ${
                  selectedConceptId === concept.id
                    ? 'border-[#60a5fa] bg-[#1a1b1e] shadow-[0_0_15px_rgba(96,165,250,0.15)]'
                    : 'border-[#374151] bg-[#111]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-bold font-sans tracking-wide text-white group-hover:text-[#60a5fa] transition-colors">
                    {concept.name}
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded border border-[#374151] text-[#9ca3af] uppercase bg-[#1e1f22] font-semibold">
                    {concept.domain}
                  </div>
                </div>
                <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed mb-3">
                  {concept.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {concept.useCases.slice(0, 2).map((uc, i) => (
                    <span key={i} className="text-xs text-[#9ca3af] bg-[#000] px-2 py-1 rounded">
                      {uc}
                    </span>
                  ))}
                  {concept.useCases.length > 2 && (
                    <span className="text-xs text-[#9ca3af] bg-[#000] px-2 py-1 rounded">
                      +{concept.useCases.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {filteredConcepts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Library className="w-8 h-8 text-[#374151] mb-3" />
                <span className="text-sm font-semibold text-[#6b7280]">
                  NO CONCEPTS FOUND
                </span>
                <span className="text-xs text-[#4b5563] mt-1">
                  Try adjusting your search parameters
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Detail View */}
      {selectedConcept ? (
        <div className="w-[320px] bg-[#1a1b1e] border-l border-[#374151] flex flex-col animate-fade-in relative">
          <button
            onClick={() => { playClickSound(false); closeLibrary(); }}
            className="absolute top-3 right-3 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors p-1 bg-[#111] rounded border border-[#374151] z-10"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex-1 overflow-y-auto p-5">
            <div className="w-16 h-16 rounded-xl bg-[#111] border border-[#374151] flex items-center justify-center mb-5 shadow-inner">
               <Cpu className="w-8 h-8 text-[#60a5fa]" />
            </div>
            
            <div className="text-xs font-semibold tracking-widest text-[#60a5fa] uppercase mb-1">
              {selectedConcept.domain} // CONCEPT
            </div>
            <h2 className="text-xl font-bold mb-4">{selectedConcept.name}</h2>
            
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2 border-b border-[#374151] pb-1">System Overview</h3>
                <p className="text-sm text-[#d1d5db] leading-relaxed">
                  {selectedConcept.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2 border-b border-[#374151] pb-1">Target Use Cases</h3>
                <ul className="space-y-1.5">
                  {selectedConcept.useCases.map((uc, i) => (
                    <li key={i} className="text-sm text-[#d1d5db] flex items-start gap-2">
                      <span className="text-[#60a5fa] mt-0.5">▸</span> {uc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#111] border border-[#374151] rounded p-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1">
                   <div className="w-2 h-2 rounded-full bg-[#facc15] animate-pulse-dot" />
                </div>
                <h3 className="text-xs font-semibold text-[#facc15] uppercase tracking-widest mb-1.5">AI Initiation Prompt</h3>
                <p className="text-sm text-[#6b7280] italic">
                  "{selectedConcept.prompt}"
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-[#374151] bg-[#1e1f22]">
            <button
              onClick={() => {
                playClickSound(true);
                setPendingPrompt(selectedConcept.prompt);
                closeLibrary();
                openDrawer();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#60a5fa]/10 hover:bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/50 hover:border-[#60a5fa] px-4 py-3 rounded text-sm font-bold tracking-wider transition-all"
            >
              INITIALIZE SYSTEM
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-[320px] bg-[#1a1b1e] border-l border-[#374151] flex flex-col items-center justify-center p-6 text-center relative">
          <button
            onClick={() => { playClickSound(false); closeLibrary(); }}
            className="absolute top-3 right-3 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors p-1 bg-[#111] rounded border border-[#374151] z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-full border border-[#374151] flex items-center justify-center mb-4 bg-[#111]">
            <Layers className="w-5 h-5 text-[#4b5563]" />
          </div>
          <span className="text-sm font-medium text-[#9ca3af] uppercase tracking-wider">
            Select a concept<br/>to view specs
          </span>
        </div>
      )}
    </div>
  );
}
