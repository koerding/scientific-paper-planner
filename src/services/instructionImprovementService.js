// FILE: src/services/instructionImprovementService.js

/**
 * Enhanced service for improving instructions based on user progress
 * UPDATED: Increased max_tokens for the OpenAI API call.
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';
// Removed import for progressionStateService
import sectionContentData from '../data/sectionContent.json';

/**
 * Improves instructions for multiple sections using a structured JSON approach.
 * Each section's subsections are evaluated separately for completion status and feedback.
 * Now also includes a numerical rating from 1-10.
 *
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @param {Boolean} forceImprovement - Force improvement even if no significant changes
 * @returns {Promise<Object>} - Result with success flag and raw analysis data from AI
 */
export const improveBatchInstructions = async (
  currentSections, // Note: This prop might not be strictly needed if userInputs and sectionContent are sufficient
  userInputs,
  sectionContent,
  forceImprovement = false
) => {
  try {
    console.log("[Instruction Improvement] Starting batch instruction improvement process");
    console.time("instructionImprovementTime");

    // Prepare sections for analysis based on userInputs and sectionContent definitions
    const sectionsForAnalysis = Object.keys(userInputs)
      .map(sectionId => {
        const sectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
        const content = userInputs[sectionId];
        const placeholder = sectionDef?.placeholder || '';

        // Include section only if definition exists and content is meaningful
        if (sectionDef && typeof content === 'string' && content.trim() !== '' && content !== placeholder) {
          return {
            id: sectionId,
            title: sectionDef.title,
            userContent: content,
            originalPlaceholder: placeholder,
            introText: sectionDef.introText || '',
            // Pass only necessary subsection info (id, title, instruction)
            subsections: (sectionDef.subsections || []).map(subsection => ({
              id: subsection.id,
              title: subsection.title,
              instruction: subsection.instruction
            }))
          };
        }
        return null; // Exclude sections with no content or definition
      })
      .filter(Boolean); // Filter out null entries


    if (sectionsForAnalysis.length === 0) {
      console.log("[Instruction Improvement] No sections found with user progress to analyze.");
      // Return success:false but maybe not show alert? Or specific message.
       return { success: false, message: "No sections with content found to provide feedback on." };
    }


    // Build system prompt (unchanged)
    const systemPrompt = buildSystemPrompt('instructionImprovement');

    // Create the user prompt (unchanged structure, uses sectionsForAnalysis)
    const userPrompt = `
      I need you to evaluate the following research sections...
      Return your response as a JSON object with the following structure: { "results": [ ... ] } ...
      RATING SCALE (very important): ...
      Here are the sections to evaluate:
      ${JSON.stringify(sectionsForAnalysis, null, 2)}
    `; // Keep prompt structure as before

    console.log(`[Instruction Improvement] Analyzing ${sectionsForAnalysis.length} sections with JSON structure.`);

    // Call OpenAI with JSON mode and INCREASED max_tokens
    const response = await callOpenAI(
      userPrompt,
      "improve_instructions_structured",
      userInputs, // Pass all inputs for context if needed by API internally
      sectionContent?.sections || [], // Pass section definitions for context
      {
        temperature: 0.0,
        // --- INCREASED MAX_TOKENS ---
        max_tokens: 4096 // Increased from 3000
      },
      [],
      systemPrompt,
      true // Use JSON mode
    );

    console.log("[Instruction Improvement] Response received from OpenAI");

    // Extract results (unchanged, relies on openaiService parsing)
    let analysisResults = [];
    if (response && response.results && Array.isArray(response.results)) {
      analysisResults = response.results;
    } else if (Array.isArray(response)) { // Handle cases where API might return array directly
        analysisResults = response;
    }
     else {
      console.error("[Instruction Improvement] Unexpected response format:", response);
      throw new Error("Invalid or unexpected response format from OpenAI");
    }

    // Progression update logic is handled by the store action after this service returns

    console.log(`[Instruction Improvement] Successfully processed ${analysisResults.length} analysis results`);
    console.timeEnd("instructionImprovementTime");

    // Return the raw analysis data. The calling component will transform and update the store.
    return {
      success: true,
      improvedData: analysisResults // Return the direct results from AI
    };

  } catch (error) {
    console.error("Error improving instructions:", error);
    console.timeEnd("instructionImprovementTime");

    // Return error state
    return {
        success: false,
        improvedData: [],
        // Include error type if available, helpful for debugging JSON parse errors vs others
        errorMessage: error.message || "An error occurred while improving instructions",
        errorType: error.name || "UnknownError"
    };
  }
};


// Export an alias for backwards compatibility if needed
export const improveInstruction = improveBatchInstructions;
