// FILE: src/logic/progressionLogic.js
// MODIFIED: Always show all sections regardless of progress state

import { getApproachSectionIds, getDataMethodSectionIds } from '../utils/sectionOrderUtils';

/**
 * This file overrides the default progression logic to always show all sections
 * regardless of completion status. The original logic determining section visibility
 * is modified to always return true.
 */

// Helper function to check if section has meaningful content
export const hasMeaningfulContent = (section) => {
  if (!section) return false;
  
  // Check if content exists and is not just the placeholder
  return section.content && 
         section.content.trim() !== '' && 
         (section.placeholder ? section.content !== section.placeholder : true);
};

// This function checks if a specific section is complete
export const isSectionComplete = (sectionId, state) => {
  const section = state.sections[sectionId];
  return hasMeaningfulContent(section);
};

// This function now always returns true to make all sections visible
export const isSectionVisible = (sectionId, state) => {
  // Always return true to show all sections
  return true;
};

// This function also always returns true to make all toggles visible
export const isToggleVisible = (toggleType, state) => {
  // Always return true to show all toggles
  return true;
};

// Get the next section ID in the progression
export const getNextSectionId = (currentSectionId, activeApproach, activeDataMethod) => {
  const sections = [
    'question',
    activeApproach,
    'audience',
    'relatedpapers',
    activeDataMethod,
    'analysis',
    'process',
    'abstract'
  ].filter(Boolean);
  
  const currentIndex = sections.indexOf(currentSectionId);
  if (currentIndex === -1 || currentIndex === sections.length - 1) {
    return null;
  }
  
  return sections[currentIndex + 1];
};

// Calculate the overall completion percentage
export const calculateCompletionPercentage = (state) => {
  if (!state || !state.sections) return 0;
  
  const sections = state.sections;
  const activeApproach = state.activeToggles?.approach;
  const activeDataMethod = state.activeToggles?.dataMethod;
  
  // Get all approach and data method section IDs
  const approachSectionIds = getApproachSectionIds();
  const dataMethodSectionIds = getDataMethodSectionIds();
  
  // Filter out inactive approach and data method sections
  const relevantSectionIds = Object.keys(sections).filter(id => {
    if (approachSectionIds.includes(id) && id !== activeApproach) {
      return false;
    }
    if (dataMethodSectionIds.includes(id) && id !== activeDataMethod) {
      return false;
    }
    return true;
  });
  
  // Count completed sections
  const completedSections = relevantSectionIds.filter(id => 
    isSectionComplete(id, state)
  ).length;
  
  // Calculate percentage
  return Math.round((completedSections / relevantSectionIds.length) * 100);
};

// Determine if the project is complete enough to export
export const isProjectReadyForExport = (state) => {
  if (!state || !state.sections) return false;
  
  // Calculate completion percentage
  const completionPercentage = calculateCompletionPercentage(state);
  
  // Project is ready if at least 50% complete
  return completionPercentage >= 50;
};

// Determine if all required sections are completed
export const areRequiredSectionsComplete = (state) => {
  if (!state || !state.sections) return false;
  
  // Define required sections
  const requiredSections = ['question', state.activeToggles?.approach];
  
  // Check if all required sections are complete
  return requiredSections.every(sectionId => 
    sectionId && isSectionComplete(sectionId, state)
  );
};
