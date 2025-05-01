// FILE: src/components/navigation/LeftRailNavigation.js
import React from 'react';
import useAppStore from '../../store/appStore';
import { getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';

const LeftRailNavigation = ({ visible = true }) => {
  // Get necessary state from store
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const currentSectionId = useAppStore((state) => state.currentChatSectionId);
  const uiMode = useAppStore((state) => state.uiMode);
  
  // Get state updaters from store
  const handleSectionFocus = useAppStore((state) => state.setActiveSectionId);
  const setCurrentChatSectionId = useAppStore((state) => state.setCurrentChatSectionId);
  
  // Get approach and data method sections
  const approachSections = getApproachSectionIds();
  const dataMethodSections = getDataMethodSectionIds();
  
  // Handle navigation - preserve current UI mode when navigating
  const handleNavigation = (sectionId) => {
    // Update section focus without changing mode
    handleSectionFocus(sectionId);
    
    // Also update chat context
    setCurrentChatSectionId(sectionId);
    
    // Store last section for guide mode
    localStorage.setItem('lastActiveSectionId', sectionId);
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
        title: sections[id]?.title || id,
        isActive: id === currentSectionId,
        isApproach: approachSections.includes(id),
        isDataMethod: dataMethodSections.includes(id),
        rating: sections[id]?.feedbackRating || null
      }));
  };
  
  const navItems = generateNavItems();
  
  // Early return if not visible
  if (!visible) return null;
  
  // Style adjustments for feedback ratings
  const getRatingColor = (rating) => {
    if (!rating) return '#d3d4dc'; // default grey
    if (rating <= 3) return '#ef4444'; // red-500
    if (rating <= 5) return '#f97316'; // orange-500
    if (rating <= 7) return '#facc15'; // yellow-400
    if (rating <= 9) return '#84cc16'; // lime-500
    return '#10B981'; // green-500
  };
  
  return (
    <div className="rail">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.id)}
          className={`rail-btn ${item.isActive ? 'rail-btn-in-view' : ''}`}
          aria-current={item.isActive ? 'page' : undefined}
        >
          <div className="rail-icon">
            {/* Circle SVG with customized fill based on rating */}
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                fill={item.isActive ? "#EFF6FF" : "white"} 
                stroke={getRatingColor(item.rating)} 
                strokeWidth={item.rating ? "2" : "1"}
              />
              {item.rating && (
                <text 
                  x="12" 
                  y="13" 
                  fontSize="8" 
                  textAnchor="middle" 
                  fill="#374151"
                  fontWeight="bold"
                >
                  {item.rating}
                </text>
              )}
            </svg>
          </div>
          <span className="truncate">{item.title}</span>
        </button>
      ))}
    </div>
  );
};

export default LeftRailNavigation;
