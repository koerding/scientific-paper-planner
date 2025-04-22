// FILE: src/hooks/useSectionState.js

/**
 * Custom hook for managing section state (minimized, focused, etc.)
 * Now listens for global section state change events
 */
import { useState, useEffect } from 'react';
import { getSectionMinimizedState, setSectionMinimizedState } from '../services/sectionStateService';

/**
 * Hook to manage state for a single section card
 * @param {string} sectionId - The section ID
 * @param {object} options - Additional options
 * @returns {object} Section state and functions
 */
const useSectionState = (sectionId, options = {}) => {
  // Get the last feedback time from options (for editedSinceFeedback tracking)
  const { lastFeedbackTime = 0 } = options;
  
  // State for this section
  const [isMinimized, setIsMinimized] = useState(() => getSectionMinimizedState(sectionId));
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lastEditTimestamp, setLastEditTimestamp] = useState(0);
  const [editedSinceFeedback, setEditedSinceFeedback] = useState(false);
  
  // Effect to listen for global section state changes
  useEffect(() => {
    const handleSectionStatesChanged = (event) => {
      const detail = event.detail || {};
      
      // If all sections were expanded (e.g., from document import)
      if (detail.allSectionsExpanded) {
        setIsMinimized(false);
        console.log(`[useSectionState] ${sectionId} expanded due to allSectionsExpanded event`);
      }
      
      // If this specific section was changed
      else if (detail.sectionId === sectionId) {
        setIsMinimized(detail.isMinimized);
        console.log(`[useSectionState] ${sectionId} state updated to ${detail.isMinimized ? 'minimized' : 'expanded'}`);
      }
      
      // If all section states were reset
      else if (detail.reset || detail.allSectionsReset) {
        // Default to minimized, except for the question section
        const defaultState = sectionId !== 'question';
        setIsMinimized(defaultState);
        console.log(`[useSectionState] ${sectionId} reset to ${defaultState ? 'minimized' : 'expanded'}`);
      }
    };
    
    // Listen for section state change events
    window.addEventListener('sectionStatesChanged', handleSectionStatesChanged);
    
    // Clean up
    return () => {
      window.removeEventListener('sectionStatesChanged', handleSectionStatesChanged);
    };
  }, [sectionId]);
  
  // Effect to update editedSinceFeedback when appropriate
  useEffect(() => {
    if (lastEditTimestamp && lastFeedbackTime && lastEditTimestamp > lastFeedbackTime) {
      setEditedSinceFeedback(true);
    } else if (!lastEditTimestamp || !lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastEditTimestamp, lastFeedbackTime]);
  
  // Reset editedSinceFeedback when new feedback is received
  useEffect(() => {
    if (lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastFeedbackTime]);
  
  // Effect to listen for document import events specifically
  useEffect(() => {
    const handleDocumentImported = (event) => {
      if (event.detail?.expandAllSections) {
        // Ensure the section is expanded (not minimized)
        setIsMinimized(false);
        console.log(`[useSectionState] ${sectionId} expanded due to document import`);
      }
    };
    
    window.addEventListener('documentImported', handleDocumentImported);
    
    return () => {
      window.removeEventListener('documentImported', handleDocumentImported);
    };
  }, [sectionId]);
  
  // Toggle minimized state
  const toggleMinimized = (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    const newState = !isMinimized;
    
    // Update local state
    setIsMinimized(newState);
    
    // Update in localStorage via service
    setSectionMinimizedState(sectionId, newState);
    
    return newState;
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
    toggleMinimized
  };
};

export default useSectionState;
