// src/hooks/useProjectSection.js
import { useState, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useSectionState } from '../contexts/SectionContext';
import sectionContent from '../data/sectionContent.json';
 
/**
 * Hook for managing a single section's state and behaviors
 * @param {string} sectionId - The ID of the section
 * @param {function} onRequestFeedback - Optional callback for feedback requests
 */
export const useProjectSection = (sectionId, onRequestFeedback) => {
  const { sections, setSectionContent } = useProject();
  const { isExpanded, toggleSection } = useSectionState();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Get section content from project context
  const content = sections[sectionId] || '';
  
  // Find the original section definition for placeholder
  const sectionDef = sectionContent.sections.find(s => s.id === sectionId);
  const placeholder = sectionDef?.placeholder || '';
  
  // Check if content has been edited (not just placeholder)
  const hasBeenEdited = content !== placeholder && content.trim() !== '';
  
  // These would normally come from FeedbackContext, but for now we'll simulate them
  // or get them from props passed to SectionCard
  const hasFeedback = false; // Will be passed as props
  const feedbackRating = null; // Will be passed as props
  const editedSinceFeedback = false; // Will be passed as props
  
  // Update content
  const setContent = useCallback((newContent) => {
    setSectionContent(sectionId, newContent);
    // Normally we'd call updateEditTimestamp here
  }, [sectionId, setSectionContent]);
  
  // Handle significant edit (for tracking purposes)
  const handleSignificantEdit = useCallback(() => {
    // We'd update a timestamp or dispatch an event here
    console.log(`Significant edit detected for section ${sectionId}`);
    window.dispatchEvent(new CustomEvent('significantEdit', { 
      detail: { sectionId } 
    }));
  }, [sectionId]);
  
  // Request feedback for this section
  const handleRequestFeedback = useCallback(() => {
    console.log(`Requesting feedback for section ${sectionId}`);
    if (typeof onRequestFeedback === 'function') {
      onRequestFeedback(sectionId);
    } else {
      // Fallback - dispatch an event
      window.dispatchEvent(new CustomEvent('feedbackRequested', { 
        detail: { sectionId } 
      }));
    }
  }, [sectionId, onRequestFeedback]);
  
  return {
    content,
    setContent,
    placeholder,
    isExpanded: isExpanded(sectionId),
    toggleSection: () => toggleSection(sectionId),
    hasBeenEdited,
    hasFeedback,
    feedbackRating,
    editedSinceFeedback,
    isEditing,
    setIsEditing,
    requestFeedback: handleRequestFeedback,
    handleSignificantEdit
  };
};
