// FILE: src/hooks/useImprovementLogic.js

import { useState, useCallback } from 'react';
import { 
  improveBatchInstructions, 
  updateSectionWithImprovedInstructions 
} from '../services/instructionImprovementService';
import { trackInstructionImprovement } from '../utils/analyticsUtils';

/**
 * Hook for managing instruction improvement logic
 * UPDATED: Modified handleMagic to support specific section improvement
 */
export const useImprovementLogic = (userInputs, sectionContent) => {
  // State for improvement logic
  const [localSectionContent, setLocalSectionContent] = useState(() => {
    try {
      return JSON.parse(JSON.stringify(sectionContent));
    } catch (e) {
      console.error("Failed to parse initial sectionContent", e);
      return { sections: [] };
    }
  });
  
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  const [lastImprovementTime, setLastImprovementTime] = useState(Date.now());
  const [editEvents, setEditEvents] = useState([]);
  const [significantEditsMade, setSignificantEditsMade] = useState(false);

  // Handle magic (improving instructions)
  const handleMagic = useCallback(async (targetSectionId = null) => {
    if (improvingInstructions) return false;
    
    // Track the improvement in analytics
    trackInstructionImprovement(targetSectionId || 'all');
    
    // Reset improvement state
    setLastImprovementTime(Date.now());
    setSignificantEditsMade(false);
    setEditEvents([]);
    
    // Start the improvement process
    setImprovingInstructions(true);
    try {
      // If a specific section was requested, only improve that one
      let sectionsToImprove = localSectionContent.sections;
      
      if (targetSectionId) {
        // Filter to include only the target section
        sectionsToImprove = localSectionContent.sections.filter(
          section => section && section.id === targetSectionId
        );
        
        if (sectionsToImprove.length === 0) {
          console.warn(`[handleMagic] Target section "${targetSectionId}" not found`);
          setImprovingInstructions(false);
          return false;
        }
        
        console.log(`[handleMagic] Improving specific section: ${targetSectionId}`);
      } else {
        console.log(`[handleMagic] Improving all sections with content`);
      }
      
      const result = await improveBatchInstructions(
        sectionsToImprove,
        userInputs,
        sectionContent
      );

      if (result.success && result.improvedData && result.improvedData.length > 0) {
        // Update the instruction content
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent,
          result.improvedData
        );
        setLocalSectionContent(updatedSections);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[handleMagic] Error during improvement process:", error);
      return false;
    } finally {
      setImprovingInstructions(false);
    }
  }, [improvingInstructions, localSectionContent, sectionContent, userInputs]);

  // Edit tracking functions
  const handleEdit = useCallback((sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'edit' }]);
  }, []);

  const handleSignificantEdit = useCallback((sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'significant' }]);
    setSignificantEditsMade(true);
  }, []);

  return {
    // State
    localSectionContent,
    improvingInstructions,
    lastImprovementTime,
    significantEditsMade,
    
    // Methods
    handleMagic,
    handleEdit,
    handleSignificantEdit
  };
};
