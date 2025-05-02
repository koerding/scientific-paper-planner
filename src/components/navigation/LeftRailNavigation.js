// FILE: src/components/navigation/LeftRailNavigation.js
// FIXED: Removed intersection observer to stop unwanted auto-scrolling/focus

import React from 'react';
import useAppStore from '../../store/appStore';
import { getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';

/**
 * Left rail navigation with mode-aware section switching and improved active state
 * FIXED: Removed intersection observer that was causing unwanted scrolling/focusing
 * FIXED: Simplified to only respond to explicit user clicks
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
