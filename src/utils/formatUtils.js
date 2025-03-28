/**
 * Utility functions for formatting
 */

/**
 * Counts words in a text string
 * @param {string} text - The text to count words for
 * @returns {number} - The word count
 */
export const countWords = (text) => {
  return text ? text.trim().split(/\s+/).filter(word => word !== '').length : 0;
};

/**
 * Formats the instructions for display
 * @param {Object} section - The section object containing instructions
 * @returns {string} - Formatted instructions
 */
export const formatInstructions = (section) => {
  return section.instructions.description;
};
