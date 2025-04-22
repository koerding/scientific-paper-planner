// FILE: src/utils/sectionUtils.js

/**
 * Utility functions for working with section content
 */

/**
 * Checks if content is just the placeholder or empty
 * @param {string} content - The section content
 * @param {string} placeholder - The placeholder text
 * @returns {boolean} - True if content is placeholder or empty
 */
export const isPlaceholderContent = (content, placeholder) => {
  return content === placeholder || content.trim() === '';
};

/**
 * Gets a preview of the text content for minimized cards
 * @param {string} textValue - The full text content
 * @returns {string} - A short preview of the text
 */
export const getPreviewText = (textValue) => {
  if (!textValue || textValue.trim() === '') {
    return 'No content yet...';
  }
  
  // Get the first non-empty line
  const firstLine = textValue.split('\n').find(line => line.trim() !== '') || '';
  if (firstLine.length > 50) {
    return firstLine.substring(0, 50) + '...';
  }
  return firstLine;
};

/**
 * Gets the appropriate color class for the feedback button based on state
 * @param {boolean} hasEditedContent - Whether the section has been edited
 * @param {boolean} loading - Whether the section is loading
 * @param {number} feedbackRating - The feedback rating (1-10)
 * @returns {string} - CSS class for button color
 */
export const getFeedbackButtonColor = (hasEditedContent, loading, feedbackRating) => {
  if (!hasEditedContent) return 'bg-gray-400 text-white cursor-not-allowed'; // Gray when content not edited
  if (loading) return 'bg-purple-300 text-white cursor-wait'; // Light purple when loading
  
  // Default state (not yet rated)
  if (!feedbackRating) return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
  
  // Color based on rating (1=red, 10=green)
  if (feedbackRating <= 3) return 'bg-red-500 text-white hover:bg-red-600';
  if (feedbackRating <= 5) return 'bg-orange-500 text-white hover:bg-orange-600';
  if (feedbackRating <= 7) return 'bg-yellow-500 text-white hover:bg-yellow-600';
  if (feedbackRating <= 9) return 'bg-lime-500 text-white hover:bg-lime-600';
  return 'bg-green-600 text-white hover:bg-green-700'; // Use our standard green-600 color
};

/**
 * Gets a label for the feedback button based on state
 * @param {boolean} hasEditedContent - Whether section has been edited
 * @param {boolean} loading - Whether section is loading
 * @param {boolean} hasFeedback - Whether section has received feedback
 * @param {boolean} editedSinceFeedback - Whether content was edited since last feedback
 * @param {number} feedbackRating - The feedback rating (1-10)
 * @returns {string} - Text label for the button
 */
export const getFeedbackLabel = (hasEditedContent, loading, hasFeedback, editedSinceFeedback, feedbackRating) => {
  if (!hasEditedContent) return "Add content first";
  if (loading) return "Processing...";
  
  // If not rated yet or edited after feedback
  if (!hasFeedback) return "Ready for feedback";
  
  // If edited since feedback
  if (editedSinceFeedback) return "Get new feedback";
  
  // Otherwise show the rating with descriptive text
  if (!feedbackRating) return "Get new feedback";
  
  if (feedbackRating <= 3) return `Needs work (${feedbackRating}/10)`;
  if (feedbackRating <= 5) return `Average (${feedbackRating}/10)`;
  if (feedbackRating <= 7) return `Good (${feedbackRating}/10)`;
  if (feedbackRating <= 9) return `Very good (${feedbackRating}/10)`;
  return `Excellent (${feedbackRating}/10)`;
};

/**
 * Gets the color for rating indicator dots
 * @param {number} feedbackRating - The feedback rating (1-10)
 * @returns {string} - CSS class for the indicator color
 */
export const getRatingIndicatorColor = (feedbackRating) => {
  if (!feedbackRating) return 'bg-gray-300';
  
  if (feedbackRating <= 3) return 'bg-red-500';
  if (feedbackRating <= 5) return 'bg-orange-500';
  if (feedbackRating <= 7) return 'bg-yellow-500';
  if (feedbackRating <= 9) return 'bg-lime-500';
  return 'bg-green-600'; 
};
