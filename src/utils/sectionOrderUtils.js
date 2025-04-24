// FILE: src/utils/sectionOrderUtils.js

/**
 * Utility functions for section ordering and filtering
 * Expanded to support the new in-card toggle design
 */

// Define section IDs for different approaches
export const getApproachSectionIds = () => [
  'hypothesis',
  'needsresearch',
  'exploratoryresearch'
];

// Define section IDs for different data methods
export const getDataMethodSectionIds = () => [
  'experiment',
  'existingdata',
  'theorysimulation'
];

/**
 * Returns visible sections in the correct display order
 * @param {Array} allSections - Array of all section objects
 * @param {string} activeApproach - Currently active approach ID
 * @param {string} activeDataMethod - Currently active data method ID
 * @returns {Array} Filtered and sorted sections
 */
export const getVisibleSectionsInDisplayOrder = (
  allSections = [],
  activeApproach = 'hypothesis',
  activeDataMethod = 'experiment'
) => {
  if (!Array.isArray(allSections) || allSections.length === 0) {
    return [];
  }

  // Define the display order of section IDs
  const sectionDisplayOrder = [
    'question',
    // Approach section IDs - will be filtered to active one
    'hypothesis',
    'needsresearch',
    'exploratoryresearch',
    'audience',
    'relatedpapers',
    // Data method section IDs - will be filtered to active one
    'experiment',
    'existingdata',
    'theorysimulation',
    'analysis',
    'process',
    'abstract'
  ];
  
  // Filter to include only the active approach and data method
  const approachSectionIds = getApproachSectionIds();
  const dataMethodSectionIds = getDataMethodSectionIds();
  
  // Create a map for faster lookups
  const sectionMap = allSections.reduce((map, section) => {
    if (section && section.id) {
      map[section.id] = section;
    }
    return map;
  }, {});
  
  // Return sections in the specified order, including only visible ones
  return sectionDisplayOrder
    .map(id => sectionMap[id])
    .filter(section => {
      if (!section) return false;
      
      // Always include non-approach, non-data method sections
      if (!approachSectionIds.includes(section.id) && !dataMethodSectionIds.includes(section.id)) {
        return true;
      }
      
      // Only include the active approach section
      if (approachSectionIds.includes(section.id)) {
        return section.id === activeApproach;
      }
      
      // Only include the active data method section
      if (dataMethodSectionIds.includes(section.id)) {
        return section.id === activeDataMethod;
      }
      
      return false;
    });
};

/**
 * Gets the next visible section ID based on current section and active toggles
 * @param {string} currentSectionId - Currently active section ID
 * @param {string} activeApproach - Currently active approach 
 * @param {string} activeDataMethod - Currently active data method
 * @returns {string|null} - The next section ID or null if at the end
 */
export const getNextVisibleSectionId = (
  currentSectionId,
  activeApproach = 'hypothesis',
  activeDataMethod = 'experiment'
) => {
  // Simplified display order (only includes sections that could be visible)
  const visibleSectionOrder = [
    'question',
    activeApproach, // Only the active approach is visible
    'audience',
    'relatedpapers',
    activeDataMethod, // Only the active data method is visible
    'analysis',
    'process',
    'abstract'
  ];
  
  const currentIndex = visibleSectionOrder.indexOf(currentSectionId);
  
  if (currentIndex === -1 || currentIndex >= visibleSectionOrder.length - 1) {
    return null; // Current section not found or already at the last section
  }
  
  return visibleSectionOrder[currentIndex + 1];
};

/**
 * Determines if a section is a toggle section
 * @param {string} sectionId - Section ID to check
 * @returns {boolean} - True if it's a toggle section
 */
export const isToggleSection = (sectionId) => {
  return getApproachSectionIds().includes(sectionId) || 
         getDataMethodSectionIds().includes(sectionId);
};

/**
 * Gets the toggle group for a section ID
 * @param {string} sectionId - Section ID to check
 * @returns {string|null} - 'approach', 'dataMethod', or null
 */
export const getToggleGroup = (sectionId) => {
  if (getApproachSectionIds().includes(sectionId)) {
    return 'approach';
  }
  if (getDataMethodSectionIds().includes(sectionId)) {
    return 'dataMethod';
  }
  return null;
};
