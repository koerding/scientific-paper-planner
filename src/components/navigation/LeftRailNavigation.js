// FILE: src/components/navigation/LeftRailNavigation.js
// FIXED: Removed intersection observer to stop unwanted auto-scrolling/focus
// ADDED: Tooltip for unlocking sections when hovering bottom of rail in non-Pro mode

import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../../store/appStore';
import { getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';

/**
 * Left rail navigation with mode-aware section switching and improved active state
 * FIXED: Removed intersection observer that was causing unwanted scrolling/focusing
 * FIXED: Simplified to only respond to explicit user clicks
 * ADDED: Unlock hint tooltip when hovering bottom of rail in non-Pro mode
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the rail is visible
 * @returns {React.ReactElement} The left rail navigation component
 */
const LeftRailNavigation = ({ visible = true }) => {
  // Get necessary state from store
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const currentSectionId = useAppStore((state) => state.currentChatSectionId);
  const uiMode = useAppStore((state) => state.uiMode);
  const proMode = useAppStore((state) => state.proMode);
  
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
  
  // Setup tooltip area at the bottom of the rail
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
   * Handle navigation with mode awareness
   * When in guide mode, clicking a section should switch to that section's guide
   * @param {string} sectionId - The section ID to navigate to
   */
  const handleNavigation = (sectionId) => {
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
  
  // Filter and sort navigation items
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
      .filter(id => sections[id] && sections[id].isVisible !== false)
      .map(id => ({
        id,
        // Simplify titles - remove "Research" prefix
        title: sections[id]?.title?.replace('Research ', '') || id,
        isActive: id === currentSectionId,
        isApproach: approachSections.includes(id),
        isDataMethod: dataMethodSections.includes(id),
        rating: sections[id]?.feedbackRating || null
      }));
  };
  
  const navItems = generateNavItems();
  
  // Get current section title for the tooltip
  const currentSectionTitle = sections[currentSectionId]?.title?.replace('Research ', '') || 'current section';
  
  // Early return if not visible
  if (!visible) return null;
  
  // Style adjustments for feedback ratings - solid color approach
  const getRatingColor = (rating) => {
    if (!rating) return '#d3d4dc'; // default grey
    if (rating <= 3) return '#ef4444'; // red-500
    if (rating <= 5) return '#f97316'; // orange-500
    if (rating <= 7) return '#facc15'; // yellow-400
    if (rating <= 9) return '#84cc16'; // lime-500
    return '#10B981'; // green-500
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
          className={`rail-btn ${item.isActive ? 'rail-btn-in-view' : ''}`}
          aria-current={item.isActive ? 'page' : undefined}
          title={`${item.title} (${uiMode === 'guide' ? 'Guide' : 'Write'} Mode)`}
        >
          <div className="rail-icon">
            {/* Circle SVG with customized solid fill based on rating */}
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                fill={getRatingColor(item.rating)} 
                stroke={item.isActive ? "#4F46E5" : "#E5E7EB"} 
                strokeWidth={item.isActive ? "2" : "1"}
              />
              {/* Removed rating number text - now using solid color instead */}
            </svg>
          </div>
          <span className="truncate">{item.title}</span>
        </button>
      ))}
      
      {/* Unlock tooltip */}
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
