// src/hooks/useProjectSection.js
import { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useSectionState } from '../contexts/SectionContext';
import { useFeedback } from '../contexts/FeedbackContext';

/**
 * Custom hook for working with individual project sections
 * Combines data and functionality from multiple contexts
 * @param {string} sectionId - ID of the section to work with
 * @returns {Object} Section data and methods
 */
export function useProjectSection(sectionId) {
  // Get data and actions from context providers
  const { state: projectState, actions: projectActions } = useProject();
  const sectionState = useSectionState();
  const feedback = useFeedback();
  
  // Local state
  const [isEditing, setIsEditing] = useState(false);
  
  // Get section content from project state
  const content = projectState.sections[sectionId] || '';
  
  // Get original section structure from sectionContent
  const originalSection = projectState.sectionContent?.sections?.find(s => s.id === sectionId);
  const placeholder = originalSection?.placeholder || '';
  
  // Check if section has been edited (not just placeholder)
  const hasBeenEdited = content !== '' && content !== placeholder;
  
  // Update edit timestamp when content changes
  useEffect(() => {
    if (hasBeenEdited) {
      feedback.updateEditTimestamp(sectionId);
    }
  }, [content, hasBeenEdited, sectionId, feedback]);
  
  // Set the content for this section
  const setContent = (newContent) => {
    projectActions.setSectionContent(sectionId, newContent);
  };
  
  // Handle significant edit that should trigger edit timestamp update
  const handleSignificantEdit = () => {
    if (hasBeenEdited) {
      feedback.updateEditTimestamp(sectionId);
    }
  };
  
  // Request AI feedback for this section
  const requestFeedback = async () => {
    if (!hasBeenEdited) return;
    
    feedback.setLoading(true);
    
    try {
      // This would normally call an API for feedback
      // For now, just simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create mock feedback data
      const mockFeedback = {
        overallFeedback: `Great work on your ${originalSection?.title || 'section'}!`,
        rating: Math.floor(Math.random() * 6) + 5, // Random rating between 5-10
        subsections: originalSection?.subsections?.map(subsection => ({
          id: subsection.id,
          isComplete: Math.random() > 0.3, // 70% chance of being complete
          feedback: Math.random() > 0.3 
            ? "You've addressed this point well." 
            : "Consider adding more detail here."
        })) || []
      };
      
      feedback.setFeedback(sectionId, mockFeedback);
      return true;
    } catch (error) {
      console.error('Error getting feedback:', error);
      return false;
    } finally {
      feedback.setLoading(false);
    }
  };
  
  return {
    // Content state
    content,
    setContent,
    placeholder,
    hasBeenEdited,
    
    // Section state
    isExpanded: sectionState.isExpanded(sectionId),
    toggleSection: () => sectionState.toggleSection(sectionId),
    expandSection: () => sectionState.expandSection(sectionId),
    collapseSection: () => sectionState.collapseSection(sectionId),
    
    // Feedback state
    hasFeedback: feedback.hasFeedback(sectionId),
    feedbackRating: feedback.getFeedbackRating(sectionId),
    editedSinceFeedback: feedback.isEditedSinceFeedback(sectionId),
    feedbackDetails: feedback.feedback[sectionId],
    lastFeedbackTime: feedback.lastFeedbackTimes[sectionId],
    
    // Actions
    requestFeedback,
    handleSignificantEdit,
    
    // Local editing state
    isEditing,
    setIsEditing
  };
}
