// FILE: src/utils/debugUtils.js

/**
 * Helper utility to log section data structure in a clean, organized way
 * UPDATED: Added validation for the rating field
 */

export const logSectionData = (section, label = "Section Data") => {
  // Skip if no section or in production mode
  if (!section || process.env.NODE_ENV === 'production') return;
  
  // Create a simplified version of the section for logging
  const simplifiedSection = {
    id: section.id,
    title: section.title,
    hasInstructions: !!section.instructions,
    hasImprovement: section.instructions?.improvement ? true : false,
    completionStatus: section.instructions?.completionStatus
  };
  
  // If there's improvement data, add more details
  if (section.instructions?.improvement) {
    simplifiedSection.improvement = {
      overallFeedback: section.instructions.improvement.overallFeedback,
      rating: section.instructions.improvement.rating, // Include the rating
      subsectionsCount: Array.isArray(section.instructions.improvement.subsections) ? 
                        section.instructions.improvement.subsections.length : 'not an array',
      // Sample the first subsection if available
      sampleSubsection: Array.isArray(section.instructions.improvement.subsections) && 
                        section.instructions.improvement.subsections.length > 0 ?
                        section.instructions.improvement.subsections[0] : 'no subsections'
    };
  }
  
  // Log the simplified structure
  console.group(`📋 ${label}`);
  console.log(simplifiedSection);
  console.groupEnd();
  
  return simplifiedSection;
};

/**
 * Check if the improvement data has the correct structure
 * UPDATED: Now validates the rating field
 */
export const validateImprovementData = (section) => {
  if (!section) return { valid: false, reason: 'Section is null or undefined' };
  if (!section.instructions) return { valid: false, reason: 'No instructions object' };
  if (!section.instructions.improvement) return { valid: false, reason: 'No improvement data' };
  
  const improvement = section.instructions.improvement;
  
  // Check essential fields
  if (!improvement.overallFeedback) return { valid: false, reason: 'Missing overallFeedback' };
  if (!improvement.subsections) return { valid: false, reason: 'Missing subsections array' };
  if (!Array.isArray(improvement.subsections)) return { valid: false, reason: 'subsections is not an array' };
  
  // Check rating (optional but should be a number between 1-10 if present)
  if (improvement.rating !== undefined) {
    const rating = improvement.rating;
    if (typeof rating !== 'number') {
      return { valid: false, reason: 'rating is not a number', details: `Found type: ${typeof rating}` };
    }
    if (rating < 1 || rating > 10) {
      return { valid: false, reason: 'rating is outside valid range (1-10)', details: `Found value: ${rating}` };
    }
  }
  
  // Check subsections structure
  const subsectionIssues = improvement.subsections
    .map((subsection, index) => {
      if (!subsection.id) return `Subsection ${index} missing id`;
      if (typeof subsection.isComplete !== 'boolean') return `Subsection ${index} (${subsection.id}) isComplete is not boolean`;
      if (!subsection.feedback) return `Subsection ${index} (${subsection.id}) missing feedback`;
      return null;
    })
    .filter(Boolean);
  
  if (subsectionIssues.length > 0) {
    return { valid: false, reason: 'Subsection issues', details: subsectionIssues };
  }
  
  return { valid: true };
};

/**
 * Add debug class to page to allow visual inspection of feedback panel
 */
export const addDebugHighlight = () => {
  if (process.env.NODE_ENV === 'production') return;
  
  const style = document.createElement('style');
  style.textContent = `
    .section-instruction-panel {
      border: 2px dashed red !important;
    }
    .section-instruction-panel::before {
      content: "Instruction Panel";
      background: red;
      color: white;
      position: absolute;
      top: 0;
      right: 0;
      padding: 2px 5px;
      font-size: 10px;
    }
    .instructions-content {
      border: 1px dashed blue !important;
    }
    .text-purple-700 {
      border: 1px solid purple !important;
    }
  `;
  document.head.appendChild(style);
};
