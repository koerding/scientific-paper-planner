
// FILE: src/components/navigation/LeftRailNavigation.js
// FIXED: Lowered z-index to prevent overlapping modals and splash screens

import React, { useEffect, useRef } from 'react';
import useAppStore from '../../store/appStore';
import { getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';

/**
 * Left rail navigation with mode-aware section switching and improved active state
 * FIXED: Made rail wider for longer text
 * FIXED: Improved circle indicators to use solid colors instead of numbers
 * FIXED: Simplified section titles (removed "Research" prefix)
 * FIXED: Ensured rails are clickable and properly navigate to sections
 * ENHANCED: Better scroll spy with optimized rootMargin
 * ENHANCED: Improved hover and focus states
 * FIXED: Lowered z-index to prevent overlapping modals and splash screens
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
  
  // Get state updaters from store
  const handleSectionFocus = useAppStore((state) => state.setActiveSectionId);
  const setCurrentChatSectionId = useAppStore((state) => state.setCurrentChatSectionId);
  const setUiMode = useAppStore((state) => state.setUiMode);
  
  // Get approach and data method sections
  const approachSections = getApproachSectionIds();
  const dataMethodSections = getDataMethodSectionIds();
  
  // Refs for intersection observer
  const observerRef = useRef(null);
  
  // Set up intersection observer for scroll spy
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    
    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer with optimized rootMargin for faster feedback
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry && visibleEntry.target) {
          const sectionId = visibleEntry.target.id.replace('section-', '');
          if (sectionId && sectionId !== currentSectionId) {
            handleSectionFocus(sectionId);
          }
        }
      },
      {
        root: null,
        // Optimized rootMargin for snappier response
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1
      }
    );
    
    // Observe all section elements
    document.querySelectorAll('[id^="section-"]').forEach(section => {
      observerRef.current.observe(section);
    });
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sections, currentSectionId, handleSectionFocus]);
  
  /**
   * Handle navigation with mode awareness
   * When in guide mode, clicking a section should switch to that section's guide
   * @param {string} sectionId - The section ID to navigate to
   */
  const handleNavigation = (sectionId) => {
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
      // We're calling setUiMode with 'guide' again to trigger the logic
      // that focuses the correct section in guide mode
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
      style={{ zIndex: 20 }} // FIXED: Lowered z-index to stay behind modals
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
    </div>
  );
};

export default LeftRailNavigation;
