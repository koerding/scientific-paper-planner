// FILE: src/services/instructionImprovementService.js

/**
 * Enhanced service for improving instructions based on user progress
 * UPDATED: Removed direct call to update progression state. This is now handled by the store action.
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';
// REMOVED: import { updateSectionScore } from './progressionStateService'; // <-- REMOVED THIS LINE
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
  currentSections,
  userInputs,
  sectionContent,
  forceImprovement = false
) => {
  try {
    console.log("[Instruction Improvement] Starting batch instruction improvement process");
    console.time("instructionImprovementTime");

    // Identify sections with meaningful user content (not just placeholder)
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId];
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = originalSectionDef?.placeholder || '';

      return typeof content === 'string' &&
             content.trim() !== '' &&
             content !== placeholder; // Explicitly check not equal to placeholder
    });

    if (sectionsWithProgress.length === 0) {
      console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare the structured data for the API request
    const sectionsForAnalysis = sectionsWithProgress.map(sectionId => {
      const sectionDef = sectionContent.sections.find(s => s.id === sectionId);
      if (!sectionDef) return null;

      return {
        id: sectionId,
        title: sectionDef.title,
        userContent: userInputs[sectionId] || '',
        originalPlaceholder: sectionDef.placeholder || '', // Include placeholder for reference
        introText: sectionDef.introText || '',
        subsections: (sectionDef.subsections || []).map(subsection => ({
          id: subsection.id,
          title: subsection.title,
          instruction: subsection.instruction
        }))
      };
    }).filter(Boolean);

    if (sectionsForAnalysis.length === 0) {
      console.log("[Instruction Improvement] No valid sections found for analysis.");
      return { success: false, message: "No valid sections for analysis" };
    }

    // Build system prompt with rating instructions
    const systemPrompt = buildSystemPrompt('instructionImprovement');

    // Create the user prompt (same as before)
     const userPrompt = `
       I need you to evaluate the following research sections and provide feedback on each subsection.

       For each section, please assess whether the user has adequately addressed each subsection instruction.

       Return your response as a JSON object with the following structure:

       {
         "results": [
           {
             "id": "section_id",
             "overallFeedback": "Overall feedback for the entire section",
             "completionStatus": "complete" or "unstarted",
             "rating": number_between_1_and_10,
             "subsections": [
               {
                 "id": "subsection_id",
                 "isComplete": true/false,
                 "feedback": "Specific feedback on this subsection"
               },
               ...
             ]
           },
           ...
         ]
       }

       Criteria for evaluation:
       - A subsection is "complete" if the user has addressed the core requirements
       - Provide positive feedback for completed items
       - For incomplete items, suggest specific improvements
       - The overall section is "complete" if most key subsections are adequately addressed

       RATING SCALE (very important):
       Please include a "rating" field for each section with a number from 1-10 where:
       - 1 is truly embarrassing work. This would for example be the case if the user has not edited the template beyond a few words.
       - 5 is what a typical masters student should be able to produce. Clearly lacking in clarity or completeness.
       - 8 comparable in quality to what a leading professor could produce. But lacking in overall clarity and completeness when thinking deeply.
       - 10 is could not possibly be better

       Be honest but fair with ratings. Don't inflate ratings - use the full scale.

       Here are the sections to evaluate:

       ${JSON.stringify(sectionsForAnalysis, null, 2)}
     `;


    console.log(`[Instruction Improvement] Analyzing ${sectionsForAnalysis.length} sections with JSON structure.`);

    // Call OpenAI with JSON mode
    const response = await callOpenAI(
      userPrompt,
      "improve_instructions_structured",
      userInputs,
      currentSections,
      {
        temperature: 0.0,
        max_tokens: 3000
      },
      [],
      systemPrompt,
      true // Use JSON mode
    );

    console.log("[Instruction Improvement] Response received from OpenAI");

    // Extract the results from the response
    let analysisResults = [];

    if (response && response.results && Array.isArray(response.results)) {
      analysisResults = response.results;
    } else if (Array.isArray(response)) {
      analysisResults = response;
    } else {
      console.warn("[Instruction Improvement] Unexpected response format, using fallback");
      // analysisResults = createFallbackAnalysis(sectionsForAnalysis); // Fallback removed for clarity, handle error instead
      throw new Error("Invalid response format from OpenAI");
    }

    // REMOVED: Progression update logic is now handled in the Zustand store action
    // analysisResults.forEach(analysis => {
    //   if (analysis.id && typeof analysis.rating === 'number') {
    //     const rating = Math.round(analysis.rating);
    //     console.log(`[Instruction Improvement] Updating progression for ${analysis.id} with score ${rating}`);
    //     updateSectionScore(analysis.id, rating); // <-- REMOVED THIS CALL
    //   }
    // });

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
        errorMessage: error.message || "An error occurred while improving instructions"
    };
  }
};

// REMOVED: The following helper functions are no longer needed here as the transformation
// happens in the calling component or store action.
// function createFallbackAnalysis(...) { ... }
// function transformAnalysisToInstructions(...) { ... }
// function transformSingleAnalysisToInstructions(...) { ... }

/**
 * Updates section content object with improved instructions.
 * This function is NO LONGER THE RESPONSIBILITY of this service.
 * The component calling improveBatchInstructions should handle updating the store.
 * Kept here commented out for reference during transition if needed.
 */
// export const updateSectionWithImprovedInstructions = (currentSections, improvedData) => { ... }

// Export an alias for backwards compatibility if needed
export const improveInstruction = improveBatchInstructions;
