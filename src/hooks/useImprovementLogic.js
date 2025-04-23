// FILE: src/hooks/useImprovementLogic.js

import { useState, useCallback, useEffect } from 'react';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions // This function might also be simplified/removed if UI uses store directly
} from '../services/instructionImprovementService'; // Adjust path if needed
import { trackInstructionImprovement } from '../utils/analyticsUtils'; // Adjust path if needed
import useAppStore from '../store/appStore'; // Import store to potentially read sectionContent

// Removed import for progressionStateService

/**
 * Hook for managing instruction improvement logic
 * Focuses on calling the API and processing results,
 * leaving state updates (including score/progression) to the store actions.
 */
export const useImprovementLogic = (sectionContent) => { // Pass sectionContent definition directly if needed
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  const [lastImprovementTime, setLastImprovementTime] = useState(Date.now());
  // Edit tracking state might be removed if not used elsewhere or moved to store
  const [editEvents, setEditEvents] = useState([]);
  const [significantEditsMade, setSignificantEditsMade] = useState(false);

  // NOTE: Persistence logic via localStorage is removed as Zustand handles it.
  //       Reset logic via event listeners is removed as store reset handles it.

  const handleMagic = useCallback(async (targetSectionId = null) => {
    if (improvingInstructions) return { success: false, message: "Improvement already in progress" };

    // Read necessary state directly from the store *inside* the action if possible
    // Or receive necessary state (like userInputs) as arguments
    const userInputs = useAppStore.getState().sections; // Get current content state
    const allSections = useAppStore.getState().sections; // Get all sections state

    // Simple validation: Check if target section exists and has content
     const sectionData = allSections[targetSectionId];
     if (targetSectionId && (!sectionData || sectionData.content === (sectionData.placeholder || '') || sectionData.content.trim() === '')) {
        return { success: false, message: "Section has no content to review" };
     }


    trackInstructionImprovement(targetSectionId || 'all');

    // Reset local state related to edit tracking if needed
    setLastImprovementTime(Date.now());
    setSignificantEditsMade(false);
    setEditEvents([]);

    setImprovingInstructions(true);
    try {
      // Prepare sections for analysis based on targetSectionId
       let sectionsToAnalyzeConfig = [];
       if(targetSectionId && allSections[targetSectionId]) {
           const section = allSections[targetSectionId];
           sectionsToAnalyzeConfig.push({
                id: section.id,
                title: section.title,
                userContent: section.content || '',
                originalPlaceholder: section.placeholder || '',
                introText: section.introText || '', // Assuming introText is part of section state
                subsections: section.originalInstructions || [] // Use original instructions from store
           });
       } else {
           // Logic to select multiple sections if targetSectionId is null (if needed)
           // sectionsToAnalyzeConfig = Object.values(allSections)... filter ... map ...
           // For now, only handle single section improvement requests via this hook
           if (!targetSectionId) {
              setImprovingInstructions(false);
              return { success: false, message: "Batch improvement request not supported here." };
           }
       }

        if (sectionsToAnalyzeConfig.length === 0) {
           setImprovingInstructions(false);
           return { success: false, message: "Target section not found or invalid" };
        }

      // Call the service function (which calls OpenAI)
       const result = await improveBatchInstructions(
         sectionsToAnalyzeConfig, // Pass the prepared config
         Object.entries(userInputs).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {}), // Pass content of all sections
         sectionContent, // Pass the raw section definitions
         true // Force improvement on explicit call
       );


      if (result.success && result.improvedData && result.improvedData.length > 0) {
        // **IMPORTANT:** Instead of updating state here, just return the results.
        // The calling component (VerticalPaperPlannerApp) will use these results
        // to call the `updateSectionFeedback` action in the store.
        // REMOVED: No longer calls updateSectionScore here
        return { success: true, feedbackData: result.improvedData[0] }; // Return feedback for the single section
      } else {
           return { success: false, message: result.message || "Improvement failed" };
      }

    } catch (error) {
      return { success: false, message: error.message || "An error occurred" };
    } finally {
      setImprovingInstructions(false);
    }
  }, [improvingInstructions, sectionContent]); // Add dependencies if needed

  // Edit tracking functions - might be removed if unused or moved
  const handleEdit = useCallback((sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'edit' }]);
  }, []);

  const handleSignificantEdit = useCallback((sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'significant' }]);
    setSignificantEditsMade(true);
  }, []);

  // Reset function (less critical now as store reset handles main state)
  const resetImprovementState = useCallback(() => {
    setLastImprovementTime(Date.now());
    setEditEvents([]);
    setSignificantEditsMade(false);
  }, []);

  return {
    // State
    improvingInstructions, // Loading state specific to this hook's operation
    // lastImprovementTime, // Potentially remove if unused
    // significantEditsMade, // Potentially remove if unused

    // Methods
    handleMagic, // Now returns feedback data instead of updating state directly
    // handleEdit, // Potentially remove
    // handleSignificantEdit, // Potentially remove
    resetImprovementState // Resets only local state of this hook
  };
};
