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
  let finalPrompt = replacePlaceholders(basePromptTemplate, allParams);
  
  // For instruction improvement, add specific guidance about tooltips,
  // linebreaks in feedback, and strikethrough for completed items
  if (promptType === 'instructionImprovement') {
    finalPrompt += `

IMPORTANT FEEDBACK FORMAT NOTE: When providing feedback, always use this exact structure with linebreaks between sections:

**Strengths:**
[list specific strengths]

**Weaknesses:**
[list specific areas for improvement]

**Comments:**
[specific actionable suggestions]

The linebreaks between sections are essential for readability.

INSTRUCTION FORMATTING: Use ~~strikethrough~~ for completed items instead of removing them. For example, if the original instruction has:
* Define your research question clearly.
* Explain why the question matters.

And the user has defined their question clearly but not explained why it matters, change it to:
* ~~Define your research question clearly.~~
* Explain why the question matters.

This helps users see their progress while keeping all original instructions visible.

CRITICAL TOOLTIP HANDLING: When processing text with special tooltip markers like [TOOLTIP_MARKER_0], [TOOLTIP_MARKER_1], etc.:
1. DO NOT modify these markers in any way
2. DO NOT remove these markers from the text
3. Simply leave them exactly as they appear

These markers will be replaced later with their actual content. Preserving them exactly is essential for proper tooltip rendering.
`;
  }
  
  return finalPrompt;
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
  let finalPrompt = replacePlaceholders(basePromptTemplate, allParams);
  
  // For instruction improvement, add specific guidance about preserving tooltips,
  // linebreaks in feedback, and using strikethrough instead of deletion
  if (taskType === 'instructionImprovement') {
    finalPrompt += `

IMPORTANT ADDITIONAL INSTRUCTION: 

1. When providing feedback in the "feedback" field, use linebreaks between the Strengths, Weaknesses, and Comments sections for better readability. For example:

"**Strengths:**
The question is well-defined and its significance is clearly articulated.

**Weaknesses:**
The broader scientific context and specific methodologies are not fully addressed.

**Comments:**
Consider discussing the theoretical implications of your question to enhance its impact."

2. CRITICAL: When updating instructions, DO NOT DELETE completed items. Instead, mark them with strikethrough like this: ~~completed item~~. For example, if the original instructions include:

* Define your research question
* Explain the significance
* Identify methodological approach

And the user has completed the first two, your editedInstructions should be:

* ~~Define your research question~~
* ~~Explain the significance~~
* Identify methodological approach

This way, users can see what they've accomplished while still having the original instructions visible.

3. CRITICAL TOOLTIP INSTRUCTIONS: When you see text containing special markers like [TOOLTIP_MARKER_0], [TOOLTIP_MARKER_1], etc.:

- DO NOT modify, remove, or change these markers in any way
- Always preserve them exactly as they appear
- These markers will be replaced with actual content later
- Failure to preserve these markers will break important functionality in the application
`;
