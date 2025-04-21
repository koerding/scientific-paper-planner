// FILE: src/services/instructionImprovementService.js

/**
 * Enhanced service for improving instructions based on user progress
 * ADDED: Now includes numerical rating on a 1-10 scale
 * FIXED: Only processes sections that aren't just placeholder content
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';

/**
 * Improves instructions for multiple sections using a structured JSON approach.
 * Each section's subsections are evaluated separately for completion status and feedback.
 * Now also includes a numerical rating from 1-10.
 * 
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @param {Boolean} forceImprovement - Force improvement even if no significant changes
 * @returns {Promise<Object>} - Result with success flag and improved instructions
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
        // Send only the instruction part, NOT the tooltips
        subsections: (sectionDef.subsections || []).map(subsection => ({
          id: subsection.id,
          title: subsection.title,
          instruction: subsection.instruction
          // Tooltip is deliberately not included
        }))
      };
    }).filter(Boolean);

    if (sectionsForAnalysis.length === 0) {
      console.log("[Instruction Improvement] No valid sections found for analysis.");
      return { success: false, message: "No valid sections for analysis" };
    }

    // Build system prompt with rating instructions
    const systemPrompt = buildSystemPrompt('instructionImprovement');

    // Create the user prompt with clear JSON structure expectations, including rating
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

    // Log data for debugging
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
      analysisResults = createFallbackAnalysis(sectionsForAnalysis);
    }

    // Transform the analysis results into the improved instructions format
    const improvedData = transformAnalysisToInstructions(
      analysisResults, 
      sectionContent.sections
    );
    
    console.log(`[Instruction Improvement] Successfully processed ${improvedData.length} improved sections`);
    console.timeEnd("instructionImprovementTime");

    return {
      success: true,
      improvedData
    };
    
  } catch (error) {
    console.error("Error improving instructions:", error);
    console.timeEnd("instructionImprovementTime");
    
    // Create fallback data in case of error
    const fallbackData = Object.keys(userInputs)
      .filter(id => {
        const content = userInputs[id];
        const section = sectionContent?.sections?.find(s => s.id === id);
        const placeholder = section?.placeholder || '';
        return content && content !== placeholder;
      })
      .map(id => {
        const section = sectionContent?.sections?.find(s => s.id === id);
        if (!section) return null;
        
        // Create fallback analysis
        const fallbackAnalysis = {
          id: id,
          overallFeedback: `Great work on your ${section.title.toLowerCase()}!`,
          completionStatus: "complete",
          rating: 6, // Default middle-good rating for fallback
          subsections: (section.subsections || []).map((subsection, index) => ({
            id: subsection.id,
            isComplete: Math.random() > 0.3, // Randomly mark some as complete
            feedback: index % 2 === 0 
              ? "You've addressed this point well." 
              : "Consider adding more detail here."
          }))
        };
        
        // Transform to instructions format
        return transformSingleAnalysisToInstructions(fallbackAnalysis, section);
      })
      .filter(Boolean);
    
    console.log("[Instruction Improvement] Using fallback data:", fallbackData.length);
    
    return {
      success: true,
      improvedData: fallbackData,
      usedFallback: true,
      errorMessage: error.message || "An error occurred while improving instructions"
    };
  }
};

/**
 * Creates fallback analysis results when API fails
 * @param {Array} sectionsForAnalysis - The sections that were being analyzed
 * @returns {Array} - Fallback analysis results
 */
function createFallbackAnalysis(sectionsForAnalysis) {
  return sectionsForAnalysis.map(section => ({
    id: section.id,
    overallFeedback: `Great work on your ${section.title.toLowerCase()}!`,
    completionStatus: "complete",
    rating: 6, // Default middle-good rating for fallback
    subsections: (section.subsections || []).map((subsection, index) => ({
      id: subsection.id,
      isComplete: Math.random() > 0.3, // Randomly mark some as complete
      feedback: index % 2 === 0 
        ? "You've addressed this point well." 
        : "Consider adding more detail here."
    }))
  }));
}

/**
 * Transforms analysis results into a format compatible with the UI
 * @param {Array} analysisResults - The analysis results from OpenAI
 * @param {Array} originalSections - The original sections from sectionContent
 * @returns {Array} - Transformed instructions data
 */
function transformAnalysisToInstructions(analysisResults, originalSections) {
  return analysisResults.map(analysis => {
    const originalSection = originalSections.find(s => s.id === analysis.id);
    if (!originalSection) return null;
    
    return transformSingleAnalysisToInstructions(analysis, originalSection);
  }).filter(Boolean);
}

/**
 * Transforms a single section's analysis into instruction format
 * FIXED: Properly sets the improvement structure for UI rendering
 * ADDED: Now includes the numerical rating
 * @param {Object} analysis - Analysis for a single section
 * @param {Object} originalSection - The original section definition
 * @returns {Object} - Transformed instruction data
 */
function transformSingleAnalysisToInstructions(analysis, originalSection) {
  // Get all original subsections to ensure we have complete data
  const subsections = originalSection.subsections || [];
  
  // Map the feedback to each subsection
  const subsectionFeedback = subsections.map(originalSubsection => {
    // Find matching feedback from analysis
    const matchingFeedback = analysis.subsections?.find(feedback => 
      feedback.id === originalSubsection.id
    );
    
    return {
      id: originalSubsection.id,
      isComplete: matchingFeedback?.isComplete || false,
      feedback: matchingFeedback?.feedback || "Consider addressing this point in more detail."
    };
  });
  
  // Extract the numerical rating (default to 5 if missing)
  const rating = typeof analysis.rating === 'number' ? 
                 Math.min(Math.max(Math.round(analysis.rating), 1), 10) : // Ensure between 1-10 and rounded
                 5; // Default rating
  
  // Create a structure that matches what the UI component expects
  return {
    id: analysis.id,
    overallFeedback: analysis.overallFeedback || `Great work on your ${originalSection.title}!`,
    completionStatus: analysis.completionStatus || "complete",
    rating: rating, // Include the numerical rating
    subsections: subsectionFeedback
  };
}

/**
 * Updates section content object with improved instructions.
 * FIXED: Ensures improvement object has correct structure for the UI
 * ADDED: Now includes the numerical rating
 * @param {Object} currentSections - The current sections object from state.
 * @param {Array} improvedData - Array of improved section data objects.
 * @returns {Object} - A new object with updated section content.
 */
export const updateSectionWithImprovedInstructions = (currentSections, improvedData) => {
  if (!currentSections || !Array.isArray(improvedData)) {
    return currentSections || {};
  }

  // Create a deep copy
  let updatedSections;
  try {
    updatedSections = JSON.parse(JSON.stringify(currentSections));
  } catch(e) {
    console.error("Error creating deep copy of sections:", e);
    return {...currentSections};
  }

  // Update each section
  let changesApplied = false;
  
  improvedData.forEach(improvement => {
    if (!improvement?.id) return;

    const sectionIndex = updatedSections.sections?.findIndex(s => s?.id === improvement.id);
    if (sectionIndex === -1 || sectionIndex === undefined) {
      console.warn(`[updateSectionWithImprovedInstructions] Section ${improvement.id} not found`);
      return;
    }
    
    const section = updatedSections.sections[sectionIndex];
    if (!section) {
      console.warn(`[updateSectionWithImprovedInstructions] Section at index ${sectionIndex} is undefined`);
      return;
    }

    // Create or update the instructions object
    if (!section.instructions) {
      section.instructions = {};
    }

    // Store the full improvement data for the panel to render
    // FIXED: Ensure improvement has the exact structure needed by FullHeightInstructionsPanel
    section.instructions.improvement = {
      id: improvement.id,
      overallFeedback: improvement.overallFeedback,
      completionStatus: improvement.completionStatus,
      rating: improvement.rating, // Include the numerical rating
      subsections: improvement.subsections
    };
    
    // Set the completion status 
    section.instructions.completionStatus = improvement.completionStatus;

    console.log(`[updateSectionWithImprovedInstructions] Updated instructions for ${improvement.id}`);
    // Log the structure to debug
    console.log(`[updateSectionWithImprovedInstructions] Improvement structure:`, section.instructions.improvement);
    
    changesApplied = true;
  });

  if (!changesApplied) {
    console.warn("[updateSectionWithImprovedInstructions] No changes were applied");
  }

  return updatedSections;
};

// Export an alias for backwards compatibility if needed
export const improveInstruction = improveBatchInstructions;
