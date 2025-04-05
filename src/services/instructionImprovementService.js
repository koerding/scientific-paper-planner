// FILE: src/services/instructionImprovementService.js

/**
 * Service for improving instructions based on user progress
 * REFACTORED: Uses centralized prompt content via promptUtils.
 * SIMPLIFIED: Uses more lenient completion status with only red/green options.
 */
import { callOpenAI } from './openaiService';
import {
  isResearchApproachSection,
  buildSystemPrompt,
  buildTaskPrompt, // Added buildTaskPrompt
  generateMockResponse // Added generateMockResponse
} from '../utils/promptUtils';

/**
 * Improves instructions for multiple sections, separating instructions and feedback.
 * Uses a simplified approach with more lenient completion assessment.
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @param {Function} apiCallFunction - Function to call the API
 * @returns {Promise<Object>} - Result with success flag and improved instructions/feedback
 */
export const improveBatchInstructions = async (
  currentSections, // These are the sections from the main state, potentially already modified
  userInputs,
  sectionContent, // This is the static definition, used to get original instructions
  apiCallFunction = callOpenAI
) => {
  try {
    // Identify sections with meaningful user content based on userInputs
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId];
      // Find the original placeholder from the static sectionContent definitions
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = originalSectionDef?.placeholder || '';
      // Check if content exists, is a string, is not empty, and is different from the placeholder
      return typeof content === 'string' && content.trim() !== '' && content !== placeholder;
    });

    if (sectionsWithProgress.length === 0) {
      console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data using original instructions from static sectionContent definitions
    const sectionsDataForPrompt = sectionsWithProgress.map(sectionId => {
      // Get the original section definition from the static content
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!originalSectionDef || !originalSectionDef.instructions?.text) {
        console.warn(`Original section definition or instructions text missing for ID ${sectionId}. Skipping.`);
        return null; // Skip if original definition is missing
      }
      const userContent = userInputs[sectionId] || ''; // Get current user input

      // Determine if this section needs research approach context
      const needsResearchContext = isResearchApproachSection(sectionId, originalSectionDef);

      return {
        id: sectionId,
        title: originalSectionDef.title, // Use original title
        originalInstructionsText: originalSectionDef.instructions.text, // Use original instructions
        userContent, // Current user content
        needsResearchContext // Flag for prompt building
      };
    }).filter(data => data !== null); // Filter out any nulls from skipped sections

    if (sectionsDataForPrompt.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // Determine if any section needs the research context for the system prompt
    const needsOverallResearchContext = sectionsDataForPrompt.some(section => section.needsResearchContext);

    // Build the system prompt using promptUtils
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext: needsOverallResearchContext,
      // No section-specific guidance needed at the system level for batch processing
      approachGuidance: ''
    });


    // Build the main task prompt using promptUtils
    // Pass the prepared section data as a JSON string parameter
    const mainTaskPrompt = buildTaskPrompt('instructionImprovement', {
        sectionsData: JSON.stringify(sectionsDataForPrompt, null, 2) // Pretty print for readability if needed by AI
    });


    // Use fallback if needed (check environment variable or API key status)
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const USE_FALLBACK = !apiKey || process.env.REACT_APP_USE_FALLBACK === 'true';

    let response;
    if (USE_FALLBACK) {
        console.warn("[Instruction Improvement] Using FALLBACK mode.");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        response = generateMockResponse('instructionImprovement'); // Get mock JSON array string
    } else {
        console.log("[Instruction Improvement] Sending batch request to OpenAI");
        // Use the currentSections from state for context if the API call needs it (though maybe not necessary now)
        const sectionsForApiContext = currentSections || [];

        // Call the API with our prompts generated by promptUtils
        response = await apiCallFunction(
          mainTaskPrompt,             // The detailed task prompt from promptUtils
          "improve_instructions_batch",// Context type
          userInputs,                 // Pass current user inputs for potential context
          sectionsForApiContext,      // Pass current sections state if needed by API call logic
          {
            max_tokens: 2500,
            temperature: 0.2 // Lower temperature for more consistent formatting
          },
          [],                         // No chat history needed for this task
          systemPrompt                // The system prompt from promptUtils
        );
    }


    // Parse the response - with simplified error handling
    let improvedData;
    try {
      // Clean any potential markdown formatting that might remain
      const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
      improvedData = JSON.parse(cleanResponse);

      if (!Array.isArray(improvedData)) {
        throw new Error("Response is not a JSON array");
      }

      // Validate and sanitize the completion status (very lenient)
      improvedData.forEach(item => {
        if (item.completionStatus !== "unstarted") {
          item.completionStatus = "complete"; // Default to complete if not explicitly unstarted
        }
        // Ensure required fields exist
        if (!item.id || typeof item.editedInstructions === 'undefined' || typeof item.feedback === 'undefined') {
            console.warn("Received incomplete item from AI:", item);
            // Decide how to handle incomplete items, e.g., filter them out or mark as error
        }
      });

      // Optional: Filter out items that didn't parse correctly or miss fields
      improvedData = improvedData.filter(item => item.id && typeof item.editedInstructions === 'string' && typeof item.feedback === 'string');

      console.log(`[Instruction Improvement] Successfully parsed ${improvedData.length} improved sections`);
    } catch (error) {
      console.error("Error parsing instruction improvement response:", error);
      console.log("Raw response:", response); // Log raw response on error
      return {
        success: false,
        message: `Failed to parse response: ${error.message}`
      };
    }

    // Return success with the parsed and validated data
    return {
      success: true,
      improvedData // This is the array of { id, editedInstructions, feedback, completionStatus }
    };
  } catch (error) {
    console.error("Error improving batch instructions:", error);
    return {
      success: false,
      message: error.message || "An error occurred while improving instructions"
    };
  }
};

/**
 * Updates section content array with improved instructions AND feedback.
 * This function now takes the *current* sections array (from state) and updates it.
 * @param {Array} currentSections - The current array of section objects from state.
 * @param {Array} improvedData - Array of objects { id, editedInstructions, feedback, completionStatus } from the API.
 * @returns {Array} - A new array with updated section content. Returns the original array if inputs are invalid.
 */
export const updateSectionsWithImprovedInstructions = (currentSections, improvedData) => {
  // Validate inputs
  if (!Array.isArray(currentSections)) {
    console.error("Invalid currentSections: Expected an array");
    return currentSections || []; // Return original or empty array
  }

  if (!Array.isArray(improvedData)) {
    console.error("Invalid improvedData: Expected an array");
    return [...currentSections]; // Return a shallow copy of the original
  }

  // Create a deep copy to avoid modifying the original state directly
  let updatedSections;
  try {
    updatedSections = JSON.parse(JSON.stringify(currentSections));
  } catch(e) {
    console.error("Error creating deep copy of sections:", e);
    return [...currentSections]; // Return shallow copy on error
  }


  // Update each section based on the improved data
  improvedData.forEach(improvement => {
    if (!improvement?.id) return; // Skip if improvement object is invalid

    // Find the section in our deep copy
    const sectionIndex = updatedSections.findIndex(s => s?.id === improvement.id);

    if (sectionIndex === -1) {
      console.warn(`Section not found in current state: ${improvement.id}. Cannot apply improvement.`);
      return; // Skip if section doesn't exist in the current state
    }

    const section = updatedSections[sectionIndex];
    if (!section) return; // Should not happen if findIndex worked, but safety check

    // Initialize instructions object if it doesn't exist
    if (!section.instructions) {
      section.instructions = {};
    }

    // Update the instruction text, feedback, and completion status
    // Use the improved data, falling back to existing data only if necessary (though shouldn't be needed)
    section.instructions.text = improvement.editedInstructions || section.instructions.text || '';
    section.instructions.feedback = improvement.feedback || ''; // Store feedback
    // Ensure completion status is only "complete" or "unstarted"
    section.completionStatus = (improvement.completionStatus === "unstarted") ? "unstarted" : "complete";

  });

  // Return the new array with updated sections
  return updatedSections;
};
