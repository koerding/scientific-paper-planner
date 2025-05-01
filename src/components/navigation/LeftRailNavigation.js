// FILE: src/components/navigation/LeftRailNavigation.js
import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/appStore';
import { isToggleSection, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import EnhancedTooltip from '../common/EnhancedTooltip';

// Map section IDs to simpler IDs for the rail
const sectionToRailId = {
  'question': 'rq',
  'hypothesis': 'H',
  'needsresearch': 'N',
  'exploratoryresearch': 'E',
  'audience': 'aud',
  'relatedpapers': 'ref',
  'experiment': 'exp',
  'existingdata': 'data',
  'theorysimulation': 'theory',
  'analysis': 'analysis',
  'process': 'proc',
  'abstract': 'abs'
};

// Map section IDs to display names for tooltips
const sectionToDisplayName = {
  'question': 'Research Question',
  'hypothesis': 'Hypothesis-Driven',
  'needsresearch': 'Needs-Based',
  'exploratoryresearch': 'Exploratory',
  'audience': 'Target Audience',
  'relatedpapers': 'Related Papers',
  'experiment': 'Experiment',
  'existingdata': 'Existing Data',
  'theorysimulation': 'Theory/Simulation',
  'analysis': 'Data Analysis',
  'process': 'Process & Timeline',
  'abstract': 'Abstract'
};

// Branch letters for approach toggle sections
const branchLetters = {
  'hypothesis': 'H',
  'needsresearch': 'N', 
  'exploratoryresearch': 'E'
};

// Data method letters
const dataMethodLetters = {
  'experiment': 'E',
  'existingdata': 'D',
  'theorysimulation': 'T'
};

/**
 * SectionIcon component to render each section's icon
 */
const SectionIcon = ({ sectionId, active, score, isCurrent, isApproach, isDataMethod, branchChoice, locked }) => {
  // Determine styling based on state
  const getStrokeColor = () => {
    if (active) return '#6366F1'; // indigo-500 for active section
    return '#D3D4DC'; // Default gray
  };

  const getFillColor = () => {
    if (!score) return 'none'; // No fill if not scored
    if (score >= 6) return '#10B981'; // green-500 for good scores
    return '#F59E0B'; // amber-500 for scores that need work
  };

  const getTextColor = () => {
    if (score) return 'white'; // White text on colored background
    return '#6B7280'; // gray-500 for default
  };

  // Get the display letter (for approach or data method sections)
  let displayText = '';
  if (isApproach) {
    displayText = branchLetters[sectionId] || '';
  } else if (isDataMethod) {
    displayText = dataMethodLetters[sectionId] || '';
  }

  // Add a slight pulse effect to the current section
  const currentClass = isCurrent ? 'ring-2 ring-indigo-300 ring-opacity-50' : '';
  
  // Add "locked" styling
  const lockedClass = locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110';

  return (
    <div className={`transition-all duration-200 ease-in-out ${lockedClass} ${currentClass}`}>
      <svg width="32" height="32" role="img" className="transition-transform">
        <circle 
          cx="16" 
          cy="16" 
          r="14"
          stroke={getStrokeColor()} 
          strokeWidth="2"
          fill={getFillColor()} 
        />
        {displayText && (
          <text 
            x="16" 
            y="20" 
            textAnchor="middle"
            fontSize="14" 
            fontWeight="700" 
            fill={getTextColor()}>
            {displayText}
          </text>
        )}
      </svg>
    </div>
  );
};

/**
 * Left rail navigation component
 */
const LeftRailNavigation = () => {
  // Get state from store
  const sections = useAppStore((state) => state.sections);
  const activeSection = useAppStore((state) => state.uiMode === 'write' ? Object.keys(state.sections).find(id => id === state.currentChatSectionId) : null);
  const scores = useAppStore((state) => state.scores);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const proMode = useAppStore((state) => state.proMode);
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  const setCurrentChatSectionId = useAppStore((state) => state.setCurrentChatSectionId);
  const setUiMode = useAppStore((state) => state.setUiMode);
  
  // Local state for tooltips
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Helper to determine if a section is locked
  const isSectionLocked = (sectionId) => {
    if (proMode) return false; // Nothing is locked in pro mode
    
    // Question is always unlocked
    if (sectionId === 'question') return false;
    
    // Simple sequential logic: 
    // If the previous section has a score >= 6, this section is unlocked
    const sectionOrder = [
      'question',
      'hypothesis', 'needsresearch', 'exploratoryresearch', // Only one of these is shown
      'audience',
      'relatedpapers',
      'experiment', 'existingdata', 'theorysimulation', // Only one of these is shown
      'analysis',
      'process',
      'abstract'
    ];
    
    const currentIndex = sectionOrder.indexOf(sectionId);
    if (currentIndex <= 0) return false; // Always unlock the first section
    
    // Check if this is an approach or data method section
    const isApproachSection = getApproachSectionIds().includes(sectionId);
    const isDataSection = getDataMethodSectionIds().includes(sectionId);
    
    // For approach sections, check if question has score
    if (isApproachSection) {
      return !scores['question'] || scores['question'] < 6;
    }
    
    // For audience, check if active approach has score
    if (sectionId === 'audience') {
      const activeApproach = activeToggles.approach;
      return !scores[activeApproach] || scores[activeApproach] < 6;
    }
    
    // For related papers, check if audience has score
    if (sectionId === 'relatedpapers') {
      return !scores['audience'] || scores['audience'] < 6;
    }
    
    // For data methods, check if related papers has score
    if (isDataSection) {
      return !scores['relatedpapers'] || scores['relatedpapers'] < 6;
    }
    
    // For analysis, check if active data method has score
    if (sectionId === 'analysis') {
      const activeDataMethod = activeToggles.dataMethod;
      return !scores[activeDataMethod] || scores[activeDataMethod] < 6;
    }
    
    // For process, check if analysis has score
    if (sectionId === 'process') {
      return !scores['analysis'] || scores['analysis'] < 6;
    }
    
    // For abstract, check if process has score
    if (sectionId === 'abstract') {
      return !scores['process'] || scores['process'] < 6;
    }
    
    return false;
  };
  
  // Handle navigation to a section
  const navigateToSection = (sectionId) => {
    // Don't navigate if section is locked or AI is busy
    if (isSectionLocked(sectionId) || isAnyAiLoading) return;
    
    // Switch to write mode if not already
    setUiMode('write');
    
    // Set the section as active
    setCurrentChatSectionId(sectionId);
    
    // Scroll to section (using element ID)
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Generate tooltip content
  const getTooltipContent = (sectionId) => {
    const displayName = sectionToDisplayName[sectionId] || sectionId;
    const sectionScore = scores[sectionId];
    const locked = isSectionLocked(sectionId);
    
    if (locked) {
      return `${displayName} — Locked (complete previous sections)`;
    }
    
    if (sectionScore) {
      const scoreRating = sectionScore >= 6 ? "Good" : "Needs work";
      return `${displayName} — ${sectionScore}/10 (${scoreRating})`;
    }
    
    if (activeSection === sectionId) {
      return `${displayName} — Currently editing`;
    }
    
    return `${displayName} — Not started`;
  };
  
  // Only show sections that should be visible based on active toggles
  const visibleSectionIds = Object.keys(sections).filter(sectionId => {
    // Always show question
    if (sectionId === 'question') return true;
    
    // For approach sections, only show the active one
    if (getApproachSectionIds().includes(sectionId)) {
      return sectionId === activeToggles.approach;
    }
    
    // For data method sections, only show the active one
    if (getDataMethodSectionIds().includes(sectionId)) {
      return sectionId === activeToggles.dataMethod;
    }
    
    // Show everything else
    return true;
  });
  
  // Sort sections in the correct order for display
  const orderedSectionIds = [
    'question',
    activeToggles.approach,
    'audience',
    'relatedpapers',
    activeToggles.dataMethod,
    'analysis',
    'process',
    'abstract'
  ].filter(id => visibleSectionIds.includes(id));
  
  return (
    <nav className="fixed left-0 top-10 bottom-0 w-14 sm:w-14 flex flex-col items-center pt-8 gap-5 z-10 bg-fafafd">
      {orderedSectionIds.map((sectionId) => {
        const isApproach = getApproachSectionIds().includes(sectionId);
        const isDataMethod = getDataMethodSectionIds().includes(sectionId);
        const locked = isSectionLocked(sectionId);
        
        return (
          <div key={sectionId} className="relative">
            <button
              className="focus:outline-none"
              onClick={() => navigateToSection(sectionId)}
              onMouseEnter={() => setActiveTooltip(sectionId)}
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={() => setActiveTooltip(sectionId)}
              onBlur={() => setActiveTooltip(null)}
              aria-label={getTooltipContent(sectionId)}
              disabled={locked || isAnyAiLoading}
              id={`nav-${sectionId}`}
            >
              <SectionIcon
                sectionId={sectionId}
                active={activeSection === sectionId}
                score={scores[sectionId]}
                isCurrent={activeSection === sectionId}
                isApproach={isApproach}
                isDataMethod={isDataMethod}
                branchChoice={activeToggles.approach}
                locked={locked}
              />
            </button>
            
            {activeTooltip === sectionId && (
              <EnhancedTooltip position="right" className="whitespace-nowrap">
                {getTooltipContent(sectionId)}
              </EnhancedTooltip>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default LeftRailNavigation;
