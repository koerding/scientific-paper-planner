// src/utils/promptUtils.js
import promptContent from '../data/promptContent.json';

/**
 * Check if a section ID is related to research approaches
 * @param {string} sectionId - The section ID to check
 * @param {object} sectionObj - Optional section object with additional metadata
 * @returns {boolean} - True if the section is related to research approaches
 */
export const isResearchApproachSection = (sectionId, sectionObj = null) => {
  // Direct match for known research approach sections
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
 * Get approach-specific guidance for a given section
 * @param {string} sectionId - The section ID to get guidance for
 * @returns {string} - The guidance text or empty string if not applicable
 */
export const getApproachGuidance = (sectionId) => {
  // If the section is directly related to a research approach, get its specific guidance
  if (sectionId === 'hypothesis' || 
      sectionId === 'needsresearch' || 
      sectionId === 'exploratoryresearch') {
    return promptContent.researchApproaches.approachGuidance[sectionId] || '';
  }
  
  return '';
};

/**
 * Build a system prompt for the chat AI based on the type and parameters
 * @param {string} promptType - The type of prompt to build (socraticChat, regularChat, etc.)
 * @param {object} params - Parameters to insert into the prompt template
 * @returns {string} - The formatted system prompt
 */
export const buildSystemPrompt = (promptType, params = {}) => {
  // Get the base prompt template
  const basePrompt = promptContent.systemPrompts[promptType];
  if (!basePrompt) {
    console.error(`Unknown prompt type: ${promptType}`);
    return '';
  }
  
  // Determine if we need to include research approach context
  const needsResearchContext = params.needsResearchContext || false;
  
  // Start with the base prompt
  let prompt = basePrompt;
  
  // Add or remove research approach context
  if (needsResearchContext) {
    prompt = prompt.replace('{{researchApproachContext}}', promptContent.researchApproaches.context);
  } else {
    prompt = prompt.replace('{{researchApproachContext}}', '');
  }
  
  // Replace all other parameters in the template
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key}}}`;
    if (prompt.includes(placeholder)) {
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value || '');
    }
  }
  
  // Clean up any remaining placeholders
  prompt = prompt.replace(/{{[^}]+}}/g, '');
  
  return prompt;
};

/**
 * Get random questions for a specific research approach or section
 * @param {string} sectionId - The section ID or approach type
 * @param {number} count - Number of questions to return (default: 2)
 * @returns {Array<string>} - Array of randomly selected questions
 */
export const getRandomQuestionsForApproach = (sectionId, count = 2) => {
  // Determine the question set to use
  let questionSet;
  if (sectionId === 'hypothesis' || 
      sectionId === 'needsresearch' || 
      sectionId === 'exploratoryresearch') {
    questionSet = promptContent.researchApproaches.questions[sectionId];
  } else {
    questionSet = promptContent.researchApproaches.questions.general;
  }
  
  // If there are no questions, return empty array
  if (!questionSet || !questionSet.length) {
    return [];
  }
  
  // Shuffle the questions and pick the requested number
  const shuffled = [...questionSet].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Generate a mock response for testing without API
 * @param {string} type - Response type (socraticPrompt, regularChat, instructionImprovement)
 * @param {string} sectionId - The section ID or approach type
 * @returns {string} - A formatted mock response
 */
export const generateMockResponse = (type, sectionId) => {
  // For instruction improvement, return the predefined mock response
  if (type === 'improve_instructions_batch' || type === 'instructionImprovement') {
    return promptContent.mockResponses.instructionImprovement;
  }
  
  // Determine the appropriate template for chat responses
  let responseType = type || 'regularChat';
  if (responseType === '__SOCRATIC_PROMPT__') {
    responseType = 'socraticPrompt';
  }
  
  let approachType = 'general';
  if (sectionId === 'hypothesis' || 
      sectionId === 'needsresearch' || 
      sectionId === 'exploratoryresearch') {
    approachType = sectionId;
  }
  
  // Get the response template
  let template = promptContent.mockResponses[responseType][approachType];
  
  // If template not found, use general
  if (!template) {
    template = promptContent.mockResponses[responseType].general;
  }
  
  // If still no template, return a basic response
  if (!template) {
    return `I'd love to discuss your ${sectionId} section. What aspects are you finding most challenging?`;
  }
  
  // Get random questions for this approach
  const questions = getRandomQuestionsForApproach(approachType, 3);
  
  // Replace placeholders with actual questions
  let response = template;
  if (questions.length > 0) response = response.replace('{{question1}}', questions[0]);
  if (questions.length > 1) response = response.replace('{{question2}}', `\n\nAlso, ${questions[1]}`);
  if (questions.length > 2) response = response.replace('{{question3}}', `\n\nAnd I'm curious: ${questions[2]}`);
  
  // Remove any unfilled placeholders
  response = response.replace(/{{question\d+}}/g, '');
  
  return response;
};
