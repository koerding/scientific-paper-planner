// FILE: src/utils/promptUtils.js
// REFACTORED: Removed all research approach related code

import promptContent from '../data/promptContent.json';

/**
 * Replaces placeholders in a string with values from a parameters object.
 * @param {string} template - The string containing placeholders like {{key}}.
 * @param {object} params - An object where keys match placeholder names.
 * @returns {string} - The string with placeholders replaced.
 */
const replacePlaceholders = (template, params = {}) => {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key}}}`;
    // Use a loop for global replacement to handle multiple occurrences
    while (result.includes(placeholder)) {
      result = result.replace(placeholder, value || '');
    }
  }
  // Clean up any remaining, unreplaced placeholders
  result = result.replace(/{{[^}]+}}/g, '');
  return result;
};

/**
 * Build a system prompt for the chat AI based on the type and parameters.
 * This focuses specifically on the 'system' role message content.
 * @param {string} promptType - The type of system prompt to build (e.g., 'chat', 'instructionImprovement').
 * @param {object} params - Parameters to insert into the prompt template.
 * @returns {string} - The formatted system prompt string.
 */
export const buildSystemPrompt = (promptType, params = {}) => {
  // Get the base system prompt template
  const basePromptTemplate = promptContent.systemPrompts[promptType];
  if (!basePromptTemplate) {
    console.error(`Unknown system prompt type: ${promptType}`);
    return `System error: Unknown prompt type ${promptType}`;
  }

  // Add params for replacement with defaults for common parameters
  const allParams = {
    ...params,
    // Default values for common parameters
    sectionTitle: params.sectionTitle || '',
    instructionsText: params.instructionsText || '',
    feedbackText: params.feedbackText || '',
    userContent: params.userContent || '',
    documentTextSnippet: params.documentText ? params.documentText.substring(0, 500) : ''
  };

  // Replace placeholders in the base template
  return replacePlaceholders(basePromptTemplate, allParams);
};

/**
 * Build a user task prompt for the OpenAI API
 * @param {string} taskType - The type of task prompt to build
 * @param {object} params - Parameters for the prompt
 * @returns {string} - The formatted task prompt
 */
export const buildTaskPrompt = (taskType, params = {}) => {
  // Get the base task prompt template
  const basePromptTemplate = promptContent.taskPrompts[taskType];
  if (!basePromptTemplate) {
    console.error(`Unknown task prompt type: ${taskType}`);
    return `Error: Unknown task prompt type ${taskType}`;
  }

  // Add any standard parameters needed, like timestamp
  const allParams = {
    ...params,
    isoTimestamp: new Date().toISOString()
  };

  // Replace placeholders
  return replacePlaceholders(basePromptTemplate, allParams);
};

/**
 * Generate a mock response for structured instruction improvement
 * Used for testing without making API calls
 * @param {Array} sectionsForAnalysis - The sections being analyzed
 * @returns {Array} - Mock analysis results
 */
export const generateMockStructuredAnalysis = (sectionsForAnalysis) => {
  return sectionsForAnalysis.map(section => ({
    id: section.id,
    overallFeedback: `Great work on your ${section.title.toLowerCase()}! You've made excellent progress.`,
    completionStatus: "complete",
    subsections: (section.subsections || []).map((subsection, index) => ({
      id: subsection.id,
      isComplete: index % 3 !== 0, // Mark 2/3 of subsections as complete for testing
      feedback: index % 3 !== 0
        ? "You've addressed this point effectively with clear examples."
        : "Consider elaborating further on this aspect to strengthen your work."
    }))
  }));
};
