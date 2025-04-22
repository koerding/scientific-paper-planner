// FILE: src/hooks/useSectionState.js
import { useState, useEffect } from 'react';
import { getSectionMinimizedState, setSectionMinimizedState } from '../services/sectionStateService';

/**
 * Hook for managing section state (minimized, focus, hover, edit tracking)
 */
export const useSectionState = (sectionId, initialState = {}) => {
  const [isMinimized, setIsMinimized] = useState(() => getSectionMinimizedState(sectionId));
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lastEditTimestamp, setLastEditTimestamp] = useState(null);
  const [editedSinceFeedback, setEditedSinceFeedback] = useState(false);
  const [significantChange, setSignificantChange] = useState(false);
  
  // Effect to update editedSinceFeedback
  useEffect(() => {
    if (lastEditTimestamp && initialState.lastFeedbackTime && 
        lastEditTimestamp > initialState.lastFeedbackTime) {
      setEditedSinceFeedback(true);
    } else if (!lastEditTimestamp || !initialState.lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastEditTimestamp, initialState.lastFeedbackTime]);
  
  // Reset logic for section state on global events
  useEffect(() => {
    const handleProjectReset = () => {
      console.log(`[useSectionState] Resetting state for section ${sectionId}`);
      setLastEditTimestamp(null);
      setSignificantChange(false);
      setEditedSinceFeedback(false);
    };
    
    // Handle document imports by expanding the section
    const handleExpandAfterImport = (event) => {
      if (event.detail?.expandAllSections) {
        console.log(`[useSectionState] Expanding section ${sectionId} after import`);
        setIsMinimized(false);
        setSectionMinimizedState(sectionId, false);
      }
    };
    
    // Add event listeners for reset events
    window.addEventListener('projectStateReset', handleProjectReset);
    window.addEventListener('projectDataLoaded', handleProjectReset);
    window.addEventListener('documentImported', handleExpandAfterImport);
    
    return () => {
      window.removeEventListener('projectStateReset', handleProjectReset);
      window.removeEventListener('projectDataLoaded', handleProjectReset);
      window.removeEventListener('documentImported', handleExpandAfterImport);
    };
  }, [sectionId]);

  // Listen for changes in the section's minimized state from other components
  useEffect(() => {
    const handleSectionStatesChanged = (e) => {
      // If this is a specific section event and it matches this section
      if (e?.detail?.sectionId === sectionId) {
        setIsMinimized(e.detail.isMinimized);
      } 
      // Handle global expand/collapse events
      else if (e?.detail?.allSectionsExpanded || e?.detail?.source === 'documentImport') {
        setIsMinimized(false);
      }
      // Otherwise check if it's a global change
      else {
        // Check if state has changed and update if needed
        const newState = getSectionMinimizedState(sectionId);
        if (newState !== isMinimized) {
          setIsMinimized(newState);
        }
      }
    };
    
    window.addEventListener('sectionStatesChanged', handleSectionStatesChanged);
    
    return () => {
      window.removeEventListener('sectionStatesChanged', handleSectionStatesChanged);
    };
  }, [sectionId, isMinimized]);
  
  // Toggle minimized state
  const toggleMinimized = (e) => {
    if (e) e.stopPropagation();
    const newState = !isMinimized;
    setIsMinimized(newState);
    setSectionMinimizedState(sectionId, newState);
  };
  
  return {
    isMinimized, 
    setIsMinimized,
    isFocused, 
    setIsFocused,
    isHovered, 
    setIsHovered,
    lastEditTimestamp, 
    setLastEditTimestamp,
    editedSinceFeedback, 
    setEditedSinceFeedback,
    significantChange,
    setSignificantChange,
    toggleMinimized
  };
};

export default useSectionState;
