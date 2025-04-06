// src/utils/promptUtils.js
import promptContent from '../data/promptContent.json';

/**
 * Check if a section ID is related to research approaches
 * @param {string} sectionId - The section ID to check
 * @param {object} sectionObj - Optional section object with additional metadata
 * @returns {boolean} - True if the section is related to research approaches
 */
export const isResearchApproachSection = (sectionId, sectionObj = null) => {
  // Direct match for only the 3 research approach sections
  if (sectionId === 'hypothesis' ||
      sectionId === 'needsresearch' ||
      sectionId === 'exploratoryresearch') {
    return true;
  }

  // Check if section title contains "approach"
  if (sectionObj?.title?.toLowerCase().includes('approach')) {
    return true;
  }

  return false;
};

/**
 * Get approach-specific guidance text for a given section
 * @param {string} sectionId - The section ID to get guidance for
 * @returns {string} - The guidance text or empty string if not applicable
 */
export const getApproachGuidance = (sectionId) => {
  // If the section is directly related to a research approach, get its specific guidance
  if (sectionId === 'hypothesis') {
    return promptContent.researchApproaches.approachGuidance.hypothesis || '';
  }
  if (sectionId === 'needsresearch') {
    return promptContent.researchApproaches.approachGuidance.needsresearch || '';
  }
  if (sectionId === 'exploratoryresearch') {
    return promptContent.researchApproaches.approachGuidance.exploratory || '';
  }

  return '';
};

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
 * @param {string} promptType - The type of system prompt to build (e.g., 'chat', 'documentImport').
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

  // Determine if we need to include research approach context
  const needsResearchContext = params.needsResearchContext || false;
  let contextText = '';
  if (needsResearchContext) {
    contextText = promptContent.researchApproaches.context || '';
  }

  // Add the context and other params for replacement
  const allParams = {
    ...params,
    researchApproachContext: contextText,
    // Ensure potentially missing params have default values for replacement
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
 * Build a main task prompt (for the 'user' role) based on the type and parameters.
 * Used for complex tasks like document import or instruction improvement.
 * @param {string} taskType - The type of task prompt (e.g., 'documentImport', 'instructionImprovement').
 * @param {object} params - Parameters to insert into the prompt template.
 * @returns {string} - The formatted task prompt string.
 */
export const buildTaskPrompt = (taskType, params = {}) => {
  // Get the base task prompt template
  const basePromptTemplate = promptContent.taskPrompts[taskType];
  if (!basePromptTemplate) {
    console.error(`Unknown task prompt type: ${taskType}`);
    return `System error: Unknown task prompt type ${taskType}`;
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
 * Get random questions for a specific research approach or section
 * @param {string} sectionId - The section ID or approach type ('hypothesis', 'needsresearch', 'exploratory', or 'general')
 * @param {number} count - Number of questions to return (default: 2)
 * @returns {Array<string>} - Array of randomly selected questions
 */
export const getRandomQuestionsForApproach = (sectionId, count = 2) => {
  // Map section IDs to question sets (just 3 approaches plus general)
  let questionSetKey = 'general'; // Default
  
  if (sectionId === 'hypothesis') {
    questionSetKey = 'hypothesis';
  } else if (sectionId === 'needsresearch') {
    questionSetKey = 'needsresearch';
  } else if (sectionId === 'exploratoryresearch') {
    questionSetKey = 'exploratory';
  }

  const questionSet = promptContent.researchApproaches.questions[questionSetKey];

  // If there are no questions, return empty array
  if (!questionSet || !questionSet.length) {
    console.warn(`No questions found for approach/section: ${questionSetKey}`);
    return [];
  }

  // Shuffle the questions and pick the requested number
  const shuffled = [...questionSet].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Generate a mock response for testing without API
 * @param {string} type - Response type ('chat', 'instructionImprovement', 'documentImport')
 * @param {string} sectionId - The section ID or approach type for context
 * @returns {string} - A formatted mock response string
 */
export const generateMockResponse = (type, sectionId) => {
  // Handle specific mock types first
  if (type === 'instructionImprovement') {
    return promptContent.mockResponses.instructionImprovement;
  }
  
  if (type === 'documentImport') {
    return promptContent.mockResponses.documentImport;
  }

  // For chat responses, determine the approach type
  let approachTypeKey = 'general'; // Default
  if (sectionId === 'hypothesis') {
    approachTypeKey = 'hypothesis';
  } else if (sectionId === 'needsresearch') {
    approachTypeKey = 'needsresearch';
  } else if (sectionId === 'exploratoryresearch') {
    approachTypeKey = 'exploratory';
  }

  // Get the response template
  let template;
  if (promptContent.mockResponses.chat && promptContent.mockResponses.chat[approachTypeKey]) {
     template = promptContent.mockResponses.chat[approachTypeKey];
  } else {
     // Fallback if specific template missing
     console.warn(`Mock response template missing for approach: ${approachTypeKey}. Using general fallback.`);
     template = promptContent.mockResponses.chat?.general ||
                `Let's discuss ${sectionId || 'your work'}. What's on your mind?`; // Absolute fallback
  }

  // Get random questions for this approach if needed by the template
  if (template.includes('{{question')) {
    const questions = getRandomQuestionsForApproach(approachTypeKey, 3);
    const questionParams = {};
    questions.forEach((q, i) => {
        questionParams[`question${i + 1}`] = q;
    });
    // Use replacePlaceholders to fill in questions
    template = replacePlaceholders(template, questionParams);
  }

  // Add other simple replacements if needed by templates
  template = replacePlaceholders(template, {
      hypothesis_aspect: 'aspect A',
      alternative_aspect: 'aspect B',
      stakeholder: 'the user group',
      sectionId: sectionId || 'the current section'
  });

  // Final cleanup of any remaining placeholders
  template = template.replace(/{{[^}]+}}/g, '');

  return template.trim();
};
