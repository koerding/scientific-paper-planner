// FILE: src/utils/sectionOrderUtils.js

/**
 * This file serves as the central configuration for section display order
 * It provides utilities for working with the visual order of sections
 * which may differ from their order in the sectionContent.json file
 */

/**
 * Master definition of section display order
 * This is the order sections should appear in the UI
 * 
 * Categories:
 * - fixed: always shown sections
 * - approach: research approach sections (only one shown based on toggle)
 * - dataMethod: data acquisition sections (only one shown based on toggle)
 */
const sectionDisplayOrder = [
  // Fixed sections that always appear in this order
  { id: 'question', category: 'fixed' },
  
  // Research approach sections - only one will be shown based on the active approach
  { id: 'hypothesis', category: 'approach' },
  { id: 'needsresearch', category: 'approach' },
  { id: 'exploratoryresearch', category: 'approach' },
  
  // More fixed sections
  { id: 'audience', category: 'fixed' },
  { id: 'relatedpapers', category: 'fixed' },
  
  // Data acquisition method sections - only one will be shown based on active method
  { id: 'experiment', category: 'dataMethod' },
  { id: 'existingdata', category: 'dataMethod' },
  { id: 'theorysimulation', category: 'dataMethod' },
  
  // Remaining fixed sections
  { id: 'analysis', category: 'fixed' },
  { id: 'process', category: 'fixed' },
  { id: 'abstract', category: 'fixed' }
];

/**
 * Gets all approach section IDs
 * @returns {Array<string>} Array of approach section IDs
 */
export const getApproachSectionIds = () => 
  sectionDisplayOrder
    .filter(item => item.category === 'approach')
    .map(item => item.id);

/**
 * Gets all data method section IDs
 * @returns {Array<string>} Array of data method section IDs
 */
export const getDataMethodSectionIds = () => 
  sectionDisplayOrder
    .filter(item => item.category === 'dataMethod')
    .map(item => item.id);

/**
 * Gets all section IDs in display order
 * @returns {Array<string>} Array of all section IDs in display order
 */
export const getAllSectionIds = () => 
  sectionDisplayOrder.map(item => item.id);

/**
 * Determines if a section should be displayed based on the active approach and data method
 * @param {string} sectionId - The ID of the section to check
 * @param {string} activeApproach - The currently active approach
 * @param {string} activeDataMethod - The currently active data method
 * @returns {boolean} - True if the section should be displayed
 */
export const shouldDisplaySection = (sectionId, activeApproach, activeDataMethod) => {
  // Find the section in the display order
  const sectionItem = sectionDisplayOrder.find(item => item.id === sectionId);
  if (!sectionItem) return false; // Section not found in display order
  
  // Check if it's a non-selected approach section
  if (sectionItem.category === 'approach' && sectionId !== activeApproach) {
    return false;
  }
  
  // Check if it's a non-selected data method section
  if (sectionItem.category === 'dataMethod' && sectionId !== activeDataMethod) {
    return false;
  }
  
  // All other sections should be displayed
  return true;
};

/**
 * Gets the next visible section ID in the display order
 * @param {string} currentSectionId - The current section ID
 * @param {string} activeApproach - The currently active approach
 * @param {string} activeDataMethod - The currently active data method
 * @returns {string|null} - The next section ID or null if there is none
 */
export const getNextVisibleSectionId = (currentSectionId, activeApproach, activeDataMethod) => {
  // Find the current section's index in the display order
  const currentIndex = sectionDisplayOrder.findIndex(item => item.id === currentSectionId);
  if (currentIndex === -1) return null; // Current section not found
  
  // Look for the next visible section
  for (let i = currentIndex + 1; i < sectionDisplayOrder.length; i++) {
    const nextSectionId = sectionDisplayOrder[i].id;
    if (shouldDisplaySection(nextSectionId, activeApproach, activeDataMethod)) {
      return nextSectionId;
    }
  }
  
  // No next visible section found
  return null;
};

/**
 * Gets the previous visible section ID in the display order
 * @param {string} currentSectionId - The current section ID
 * @param {string} activeApproach - The currently active approach
 * @param {string} activeDataMethod - The currently active data method
 * @returns {string|null} - The previous section ID or null if there is none
 */
export const getPreviousVisibleSectionId = (currentSectionId, activeApproach, activeDataMethod) => {
  // Find the current section's index in the display order
  const currentIndex = sectionDisplayOrder.findIndex(item => item.id === currentSectionId);
  if (currentIndex === -1) return null; // Current section not found
  
  // Look for the previous visible section
  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevSectionId = sectionDisplayOrder[i].id;
    if (shouldDisplaySection(prevSectionId, activeApproach, activeDataMethod)) {
      return prevSectionId;
    }
  }
  
  // No previous visible section found
  return null;
};

/**
 * Gets a filtered array of sections in display order
 * Only includes sections that should be displayed based on the active approach and data method
 * 
 * @param {Array} allSections - Array of all section objects
 * @param {string} activeApproach - The currently active approach
 * @param {string} activeDataMethod - The currently active data method
 * @returns {Array} - Filtered array of sections in display order
 */
export const getVisibleSectionsInDisplayOrder = (allSections, activeApproach, activeDataMethod) => {
  return sectionDisplayOrder
    .filter(item => shouldDisplaySection(item.id, activeApproach, activeDataMethod))
    .map(item => allSections.find(section => section.id === item.id))
    .filter(Boolean); // Remove any undefined sections (shouldn't happen if allSections is complete)
};

// Export the raw display order for advanced use cases
export const displayOrder = sectionDisplayOrder;
