// FILE: src/components/navigation/LeftRailNavigation.js
// FIXED: Modified to show all sections but make unstarted ones non-clickable and grayed out
// ADDED: Visual distinction for sections that haven't been started yet

import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../../store/appStore';
import { getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import { isSectionVisible } from '../../logic/progressionLogic';

/**
 * Left rail navigation with mode-aware section switching and improved active state
 * MODIFIED: Shows all sections but makes unstarted ones non-clickable and grayed out
 * @param {Object} props - Component props
 * @returns {React.ReactElement} The left rail navigation component
 */
const LeftRailNavigation = () => {
  // Get necessary state from store
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const currentSectionId = useAppStore((state) => state.currentChatSectionId);
  const uiMode = useAppStore((state) => state.uiMode);
  const proMode = useAppStore((state) => state.proMode);
  const storeState = useAppStore((state) => state);
  
  // Get state updaters from store
  const handleSectionFocus = useAppStore((state) => state.setActiveSectionId);
  const setCurrentChatSectionId = useAppStore((state) => state.setCurrentChatSectionId);
  const setUiMode = useAppStore((state) => state.setUiMode);
  
  // Local state for tooltip
  const [showUnlockTooltip, setShowUnlockTooltip] = useState(false);
  const railRef = useRef(null);
  const tooltipAreaRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Get approach and data method sections
  const approachSections = getApproachSectionIds();
  const dataMethodSections = getDataMethodSectionIds();
  
  // Helper function to check if a section has been started
  const isSectionStarted = (sectionId) => {
    const section = sections[sectionId];
    if (!section) return false;
    
    // Get the section definition to compare against placeholder
    const sectionDef = storeState.sectionDefinitions?.find(def => def.id === sectionId);
    const placeholder = sectionDef?.placeholder || '';
    
    // A section is considered "started" if it has content different from the placeholder
    return section.content && section.content.trim() !== '' && section.content !== placeholder;
  };
  
  // Helper function to check if a section is accessible (clickable)
  const isSectionAccessible = (sectionId) => {
    // Pro mode makes everything accessible
    if (proMode) return true;
    
    // Check if section is visible according to progression logic
    return isSectionVisible(sectionId, storeState);
  };
  
  // Setup tooltip area at the bottom of the rail for non-pro mode
  useEffect(() => {
    if (railRef.current && !proMode) {
      const railHeight = railRef.current.offsetHeight;
      const tooltipAreaHeight = 100; // 100px detection area at bottom
      
      // Create or update tooltip area element
      if (!tooltipAreaRef.current) {
        tooltipAreaRef.current = document.createElement('div');
        tooltipAreaRef.current.style.position = 'absolute';
        tooltipAreaRef.current.style.left = '0';
        tooltipAreaRef.current.style.width = '100%';
        tooltipAreaRef.current.style.zIndex = '999';
        tooltipAreaRef.current.style.pointerEvents = 'none'; // Don't interfere with clicks
        
        railRef.current.appendChild(tooltipAreaRef.current);
      }
      
      // Update position and size
      tooltipAreaRef.current.style.bottom = '0';
      tooltipAreaRef.current.style.height = `${tooltipAreaHeight}px`;
      
      // Add mouse enter/leave event handlers to rail
      const handleMouseMove = (e) => {
        // Check if mouse is in the bottom area
        const railRect = railRef.current.getBoundingClientRect();
        const mouseY = e.clientY - railRect.top;
        
        if (mouseY > railRect.height - tooltipAreaHeight) {
          // Calculate tooltip position (to the right of cursor)
          setTooltipPosition({
            top: mouseY - 40, // 40px above mouse
            left: 80 // Positioned to the right
          });
          setShowUnlockTooltip(true);
        } else {
          setShowUnlockTooltip(false);
        }
      };
      
      const handleMouseLeave = () => {
        setShowUnlockTooltip(false);
      };
      
      railRef.current.addEventListener('mousemove', handleMouseMove);
      railRef.current.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        if (railRef.current) {
          railRef.current.removeEventListener('mousemove', handleMouseMove);
          railRef.current.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    }
  }, [railRef, proMode]);
  
  /**
   * Handle navigation with mode awareness and accessibility checks
   * @param {string} sectionId - The section ID to navigate to
   */
  const handleNavigation = (sectionId) => {
    // Check if section is accessible before allowing navigation
    if (!isSectionAccessible(sectionId)) {
      console.log(`Section ${sectionId} is not accessible yet`);
      return; // Don't navigate to inaccessible sections
    }
    
    // Log for debugging
    console.log(`Rail navigation: Clicked on section ${sectionId}`);
    
    // Always store the last section for reference
    localStorage.setItem('lastActiveSectionId', sectionId);
    
    // Update section focus
    handleSectionFocus(sectionId);
    
    // Also update chat context
    setCurrentChatSectionId(sectionId);
    
    // If we're in guide mode and switching sections, we want to
    // maintain the guide mode but show the new section's guide
    if (uiMode === 'guide') {
      // This will maintain guide mode but switch to the new section's guide
      setUiMode('guide');
    }
    
    // Find the section element and scroll to it
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
  };
  
  // Filter and sort navigation items - SHOW ALL SECTIONS but mark accessibility
  const generateNavItems = () => {
    if (!sections) return [];
    
    const navOrder = [
      'question',
      activeToggles.approach,
      'audience',
      'relatedpapers',
      activeToggles.dataMethod,
      'analysis',
      'process', 
      'abstract'
    ];
    
    return navOrder
      .filter(id => sections[id]) // Only filter out sections that don't exist in the store
      .map(id => ({
        id,
        // Simplify titles - remove "Research" prefix
        title: sections[id]?.title?.replace('Research ', '') || id,
        isActive: id === currentSectionId,
        isApproach: approachSections.includes(id),
        isDataMethod: dataMethodSections.includes(id),
        rating: sections[id]?.feedbackRating || null,
        isStarted: isSectionStarted(id),
        isAccessible: isSectionAccessible(id)
      }));
  };
  
  const navItems = generateNavItems();
  
  // Get current section title for the tooltip
  const currentSectionTitle = sections[currentSectionId]?.title?.replace('Research ', '') || 'current section';
  
  // Style adjustments for feedback ratings - solid color approach
  const getRatingColor = (rating) => {
    if (!rating) return '#d3d4dc'; // default grey
    if (rating <= 3) return '#ef4444'; // red-500
    if (rating <= 5) return '#f97316'; // orange-500
    if (rating <= 7) return '#facc15'; // yellow-400
    if (rating <= 9) return '#84cc16'; // lime-500
    return '#10B981'; // green-500
  };
  
  // Get button classes based on accessibility and started state
  const getButtonClasses = (item) => {
    const baseClasses = 'rail-btn transition-all duration-200';
    
    if (!item.isAccessible) {
      // Inaccessible sections - very grayed out and no hover effects
      return `${baseClasses} opacity-30 cursor-not-allowed text-gray-400`;
    }
    
    if (!item.isStarted) {
      // Accessible but not started - somewhat grayed out
      return `${baseClasses} opacity-60 text-gray-500 hover:opacity-80`;
    }
    
    // Started sections - normal appearance
    if (item.isActive) {
      return `${baseClasses} rail-btn-in-view`;
    }
    
    return `${baseClasses} hover:bg-gray-100`;
  };
  
  // Get tooltip text based on section state
  const getTooltipText = (item) => {
    if (!item.isAccessible) {
      return `Complete previous sections to unlock ${item.title}`;
    }
    
    if (!item.isStarted) {
      return `${item.title} - Click to start (${uiMode === 'guide' ? 'Guide' : 'Write'} Mode)`;
    }
    
    return `${item.title} (${uiMode === 'guide' ? 'Guide' : 'Write'} Mode)`;
  };

  return (
    <div 
      className="rail"
      role="navigation"
      aria-label="Section navigation"
      ref={railRef}
    >
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.id)}
          disabled={!item.isAccessible}
          className={getButtonClasses(item)}
          aria-current={item.isActive ? 'page' : undefined}
          title={getTooltipText(item)}
        >
          <div className="rail-icon">
            {/* Circle SVG with customized solid fill based on rating and accessibility */}
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                fill={item.isAccessible ? getRatingColor(item.rating) : '#e5e7eb'} 
                stroke={item.isActive ? "#4F46E5" : (item.isAccessible ? "#E5E7EB" : "#f3f4f6")} 
                strokeWidth={item.isActive ? "2" : "1"}
                opacity={item.isAccessible ? (item.isStarted ? 1 : 0.7) : 0.4}
              />
              {/* Add a lock icon for inaccessible sections */}
              {!item.isAccessible && (
                <g transform="translate(12,12) scale(0.6)" fill="#9ca3af">
                  <path d="M-4,-6 L-4,-4 L4,-4 L4,-4 L4,4 L-4,4 Z M-2,-6 L-2,-8 Q-2,-9 -1,-9 L1,-9 Q2,-9 2,-8 L2,-6"/>
                  <circle cx="0" cy="0" r="1"/>
                </g>
              )}
            </svg>
          </div>
          <span className={`truncate ${!item.isAccessible ? 'text-gray-400' : (!item.isStarted ? 'text-gray-500' : '')}`}>
            {item.title}
          </span>
        </button>
      ))}
      
      {/* Unlock tooltip for non-pro mode */}
      {showUnlockTooltip && !proMode && (
        <div 
          className="unlock-tooltip"
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            backgroundColor: '#1F2937',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            maxWidth: '220px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            pointerEvents: 'none',
            opacity: 0.95,
            whiteSpace: 'normal',
            lineHeight: 1.4
          }}
        >
          <div 
            style={{
              position: 'absolute',
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '0',
              height: '0',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '6px solid #1F2937'
            }}
          ></div>
          Complete your <strong>{currentSectionTitle}</strong> to unlock the next step.
        </div>
      )}
    </div>
  );
};

export default LeftRailNavigation;
