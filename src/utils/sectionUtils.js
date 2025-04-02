/**
 * Utility functions for section-related operations
 */

// Format timestamp for chat messages
export const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Check if a section has content beyond placeholder
export const hasSectionContent = (sectionId, userInputs, section) => {
  if (sectionId === 'philosophy') {
    return userInputs.philosophy && userInputs.philosophy.length > 0;
  }
  
  // Get section content and placeholder
  const content = userInputs[sectionId] || '';
  const placeholder = section?.placeholder || '';
  
  // If content is completely empty, it's not completed
  if (!content || content.trim() === '') return false;
  
  // If content is exactly the placeholder, it's not completed
  if (content === placeholder) return false;
  
  // Otherwise, consider it completed (even if just slightly modified)
  return true;
};

// Get the current section object based on sectionId
export const getSectionById = (sections, sectionId) => {
  return sections.find(s => s.id === sectionId) || null;
};

// Count words in text
export const countWords = (text) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Format instructions with proper line breaks
export const formatInstructions = (text) => {
  if (!text) return '';
  return text.split('\n\n').map((paragraph, i, arr) => (
    `<p key=${i} class="mb-${i === arr.length - 1 ? '0' : '3'}">${paragraph}</p>`
  )).join('');
};
