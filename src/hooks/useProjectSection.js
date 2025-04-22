// FILE: src/hooks/useProjectSection.js
import { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useSectionState } from '../contexts/SectionContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { useUI } from '../contexts/UIContext';

/**
 * Custom hook for working with individual project sections
 * Combines data and functionality from multiple contexts
 * @param {string} sectionId - ID of the section to work with
 * @returns {Object} Section data and methods
 */
export function useProjectSection(sectionId) {
  // Get data and actions from context providers
  const { 
    sections, 
    setSectionContent,
    sectionContent
  } = useProject();
  
  const {
    isExpanded,
    toggleSection,
    expandSection,
    collapseSection
  } = useSectionState();
  
  const {
    hasFeedback,
    getFeedbackRating,
    isEditedSinceFeedback,
    feedback,
    lastFeedbackTimes,
    updateEditTimestamp,
    setFeedback,
    setLoading: setFeedbackLoading
  } = useFeedback();
  
  const { 
    loading,
    setLoading,
    clearLoading
  } = useUI();
  
  // Local state
  const [isEditing, setIsEditing] = useState(false);
  
  // Get section content from project state
  const content = sections[sectionId] || '';
  
  // Get original section structure from sectionContent
  const originalSection = sectionContent?.sections?.find(s => s.id === sectionId);
  const placeholder = originalSection?.placeholder || '';
  const maxLength = originalSection?.maxLength || 3000;
  const inputPlaceholder = originalSection?.inputPlaceholder || 'Start writing...';
  
  // Check if section has been edited (not just placeholder)
  const hasBeenEdited = content !== '' && content !== placeholder;
  
  // Update edit timestamp when content changes
  useEffect(() => {
    if (hasBeenEdited) {
      updateEditTimestamp(sectionId);
    }
  }, [content, hasBeenEdited, sectionId, updateEditTimestamp]);
  
  // Set the content for this section
  const setContent = (newContent) => {
    setSectionContent(sectionId, newContent);
  };
  
  // Handle significant edit that should trigger edit timestamp update
  const handleSignificantEdit = () => {
    if (hasBeenEdited) {
      updateEditTimestamp(sectionId, Date.now());
    }
  };
  
  // Request AI feedback for this section
  const requestFeedback = async () => {
    if (!hasBeenEdited) return;
    
    // Set loading state
    setFeedbackLoading(true);
    setLoading('improvement');
    
    try {
      // In a real implementation, this would call the OpenAI API
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
      
      setFeedback(sectionId, mockFeedback);
      return true;
    } catch (error) {
      console.error('Error getting feedback:', error);
      return false;
    } finally {
      setFeedbackLoading(false);
      clearLoading('improvement');
    }
  };
  
  return {
    // Content state
    content,
    setContent,
    placeholder,
    maxLength,
    inputPlaceholder,
    hasBeenEdited,
    
    // Section state
    isExpanded: isExpanded(sectionId),
    toggleSection: () => toggleSection(sectionId),
    expandSection: () => expandSection(sectionId),
    collapseSection: () => collapseSection(sectionId),
    
    // Feedback state
    hasFeedback: hasFeedback(sectionId),
    feedbackRating: getFeedbackRating(sectionId),
    editedSinceFeedback: isEditedSinceFeedback(sectionId),
    feedbackData: feedback[sectionId],
    lastFeedbackTime: lastFeedbackTimes[sectionId],
    
    // Loading state
    loading: loading.improvement,
    
    // Actions
    requestFeedback,
    handleSignificantEdit,
    
    // Local editing state
    isEditing,
    setIsEditing
  };
}
