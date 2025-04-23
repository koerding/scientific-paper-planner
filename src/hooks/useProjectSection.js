// src/hooks/useProjectSection.js
import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useSectionState } from '../contexts/SectionContext';
import { useFeedback } from '../contexts/FeedbackContext';
import sectionContent from '../data/sectionContent.json';

export const useProjectSection = (sectionId) => {
  const { sections, setSectionContent } = useProject();
  const { isExpanded, toggleSection } = useSectionState();
  
  // Get feedback context functions, defaulting to empty functions if they don't exist
  const feedbackContext = useFeedback();
  const hasFeedback = feedbackContext?.hasFeedback || (() => false);
  const getFeedbackRating = feedbackContext?.getFeedbackRating || (() => null);
  const isEditedSinceFeedback = feedbackContext?.isEditedSinceFeedback || (() => false);
  const updateEditTimestamp = feedbackContext?.updateEditTimestamp || (() => {});
  const requestFeedback = feedbackContext?.requestFeedback;
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Get section content from project context
  const content = sections[sectionId] || '';
  
  // Find the original section definition for placeholder
  const sectionDef = sectionContent.sections.find(s => s.id === sectionId);
  const placeholder = sectionDef?.placeholder || '';
  
  // Check if content has been edited (not just placeholder)
  const hasBeenEdited = content !== placeholder && content.trim() !== '';
  
  // Get feedback status
  const sectionHasFeedback = hasFeedback(sectionId);
  const feedbackRating = getFeedbackRating(sectionId);
  const editedSinceFeedback = isEditedSinceFeedback(sectionId);
  
  // Update content
  const setContent = useCallback((newContent) => {
    setSectionContent(sectionId, newContent);
    updateEditTimestamp(sectionId);
  }, [sectionId, setSectionContent, updateEditTimestamp]);
  
  // Handle significant edit (for tracking purposes)
  const handleSignificantEdit = useCallback(() => {
    updateEditTimestamp(sectionId, true); // Mark as significant edit
  }, [sectionId, updateEditTimestamp]);
  
  // Request feedback for this section
  const handleRequestFeedback = useCallback(() => {
    if (typeof requestFeedback === 'function') {
      requestFeedback(sectionId);
    } else {
      console.warn(`No feedback request function available for section ${sectionId}`);
      // Fallback behavior - could trigger an event or show a toast notification
      window.dispatchEvent(new CustomEvent('feedbackRequested', { 
        detail: { sectionId } 
      }));
    }
  }, [sectionId, requestFeedback]);
  
  return {
    content,
    setContent,
    placeholder,
    isExpanded: isExpanded(sectionId),
    toggleSection: () => toggleSection(sectionId),
    hasBeenEdited,
    hasFeedback: sectionHasFeedback,
    feedbackRating,
    editedSinceFeedback,
    isEditing,
    setIsEditing,
    requestFeedback: handleRequestFeedback,
    handleSignificantEdit
  };
};
