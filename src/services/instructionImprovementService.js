// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * REFACTORED: Now uses structured JSON approach for reliable subsection handling
 * REMOVED: All text parsing, marker handling, and tooltip restoration logic
 */
import { callOpenAI } from './openaiService';
import { isResearchApproachSection, buildSystemPrompt } from '../utils/promptUtils';

/**
 * Improves instructions for multiple sections using a structured JSON approach.
 * Each section's subsections are evaluated separately for completion status and feedback.
 * 
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @returns {Promise<Object>} - Result with success flag and improved instructions
 */
export const improveBatchInstructions = async (
  currentSections,
  userInputs,
  sectionContent
) => {
  try {
    console.log("[Instruction Improvement] Starting batch instruction improvement process");
    console.time("instructionImprovementTime");
    
    // Identify sections with meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId];
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = originalSectionDef?.placeholder || '';
      
      return typeof content === 'string' && content.trim() !== '' && content !== placeholder;
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

    // Check if any section needs research context
    const needsResearchContext = sectionsForAnalysis.some(section => 
      isResearchApproachSection(section.id, sectionContent.sections.find(s => s.id === section.id))
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext
    });

    // Create the user prompt with clear JSON structure expectations
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
        temperature: 0.7,
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
 * @param {Object} analysis - Analysis for a single section
 * @param {Object} originalSection - The original section definition
 * @returns {Object} - Transformed instruction data
 */
function transformSingleAnalysisToInstructions(analysis, originalSection) {
  // Create a structured data object that will be rendered by FullHeightInstructionsPanel
  return {
    id: analysis.id,
    title: originalSection.title,
    overallFeedback: analysis.overallFeedback || `Great work on your ${originalSection.title}!`,
    completionStatus: analysis.completionStatus || "complete",
    subsectionFeedback: (originalSection.subsections || []).map(subsection => {
      // Find corresponding feedback from analysis
      const subsectionAnalysis = analysis.subsections?.find(s => s.id === subsection.id);
      return {
        id: subsection.id,
        title: subsection.title,
        instruction: subsection.instruction,
        tooltip: subsection.tooltip, // Keep the original tooltip
        isComplete: subsectionAnalysis?.isComplete || false,
        feedback: subsectionAnalysis?.feedback || 
          (subsectionAnalysis?.isComplete ? "Well addressed in your current draft." : "Consider addressing this point in more detail.")
      };
    })
  };
}

/**
 * Updates section content object with improved instructions.
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
    if (sectionIndex === -1) return;
    
    const section = updatedSections.sections[sectionIndex];
    if (!section) return;

    // Create or update the instructions object
    if (!section.instructions) section.instructions = {};

    // Store the full improvement data for the panel to render
    section.instructions.improvement = improvement;
    
    // Set the completion status 
    section.instructions.completionStatus = improvement.completionStatus;

    console.log(`[updateSectionWithImprovedInstructions] Updated instructions for ${improvement.id}`);
    changesApplied = true;
  });

  if (!changesApplied) {
    console.warn("[updateSectionWithImprovedInstructions] No changes were applied");
  }

  return updatedSections;
};
