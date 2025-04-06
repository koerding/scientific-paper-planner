// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses OpenAI's native JSON mode for reliable parsing
 */
import { callOpenAI } from './openaiService';
import { isResearchApproachSection, buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

// Basic validation for improved instructions
const validateImprovedInstructions = (data) => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.editedInstructions === 'string' && 
      item.editedInstructions.length >= 50 &&
      typeof item.feedback === 'string' && 
      item.feedback.length >= 10 &&
      (item.completionStatus === 'complete' || item.completionStatus === 'unstarted')
    );
  });
};

/**
 * Improves instructions for multiple sections, separating instructions and feedback.
 * Uses OpenAI's native JSON mode for reliable parsing.
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @returns {Promise<Object>} - Result with success flag and improved instructions/feedback
 */
export const improveBatchInstructions = async (
  currentSections,
  userInputs,
  sectionContent
) => {
  try {
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

    // Prepare data for analysis
    const sectionsDataForPrompt = sectionsWithProgress.map(sectionId => {
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!originalSectionDef || !originalSectionDef.instructions?.text) {
        console.warn(`Original section definition or instructions missing for ID ${sectionId}. Skipping.`);
        return null;
      }
      
      const userContent = userInputs[sectionId] || '';
      const needsResearchContext = isResearchApproachSection(sectionId, originalSectionDef);

      return {
        id: sectionId,
        title: originalSectionDef.title,
        originalInstructionsText: originalSectionDef.instructions.text,
        userContent,
        needsResearchContext
      };
    }).filter(data => data !== null);

    if (sectionsDataForPrompt.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // Check if any section needs research context
    const needsOverallResearchContext = sectionsDataForPrompt.some(section => section.needsResearchContext);

    // Build system and task prompts
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext: needsOverallResearchContext,
      approachGuidance: ''
    });

    const taskPrompt = buildTaskPrompt('instructionImprovement', {
      sectionsData: JSON.stringify(sectionsDataForPrompt, null, 2)
    });

    // Call OpenAI with JSON mode
    const response = await callOpenAI(
      taskPrompt,
      "improve_instructions_batch",
      userInputs,
      currentSections,
      { 
        temperature: 0.2,
        max_tokens: 2500
      },
      [],
      systemPrompt,
      true // Use JSON mode
    );
    
    // Validate the response
    if (!validateImprovedInstructions(response)) {
      console.error("Invalid response format from OpenAI:", response);
      return { 
        success: false, 
        message: "Received invalid instruction improvement format from AI" 
      };
    }

    console.log(`[Instruction Improvement] Successfully processed ${response.length} improved sections`);

    // Return success with the validated data
    return {
      success: true,
      improvedData: response
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
 * Updates section content object with improved instructions AND feedback.
 * @param {Object} currentSections - The current sections object from state.
 * @param {Array} improvedData - Array of objects { id, editedInstructions, feedback, completionStatus }.
 * @returns {Object} - A new object with updated section content.
 */
export const updateSectionWithImprovedInstructions = (currentSections, improvedData) => {
  // Validate inputs
  if (!currentSections || typeof currentSections !== 'object') {
    console.error("Invalid currentSections: Expected an object");
    return currentSections || {}; // Return original or empty object
  }

  if (!Array.isArray(improvedData)) {
    console.error("Invalid improvedData: Expected an array");
    return {...currentSections}; // Return a shallow copy of the original
  }

  // Create a deep copy to avoid modifying the original state directly
  let updatedSections;
  try {
    updatedSections = JSON.parse(JSON.stringify(currentSections));
  } catch(e) {
    console.error("Error creating deep copy of sections:", e);
    return {...currentSections}; // Return shallow copy on error
  }

  // Keep track of changes made
  let changesApplied = false;
  
  // These are known placeholder patterns to reject
  const PLACEHOLDER_PATTERNS = [
    "Remove points",
    "addressed all key points",
    "remove points the user has already addressed",
    "congratulatory message"
  ];

  // Update each section based on the improved data
  improvedData.forEach(improvement => {
    if (!improvement?.id) {
      console.warn("Missing ID in improvement data, skipping", improvement);
      return;
    }

    // Get section from updated sections
    let section = null;
    let sectionIndex = -1;
    
    if (Array.isArray(updatedSections.sections)) {
      sectionIndex = updatedSections.sections.findIndex(s => s?.id === improvement.id);
      if (sectionIndex === -1) {
        console.warn(`Section not found in current state: ${improvement.id}. Cannot apply improvement.`);
        return;
      }
      section = updatedSections.sections[sectionIndex];
    } else {
      console.error("Invalid sections structure:", updatedSections);
      return;
    }
    
    if (!section) {
      console.warn(`Section at index ${sectionIndex} is null or undefined, skipping.`);
      return;
    }

    // Initialize instructions object if it doesn't exist
    if (!section.instructions) {
      section.instructions = {};
    }

    // Store original instructions for debugging
    const originalInstructions = section.instructions.text || '';
    
    // Helper to check if text is a placeholder
    const isPlaceholder = (text) => {
      if (!text || text.trim() === '') return true;
      if (text.length < 50) return true; // Too short to be real instructions
      
      // Check for known placeholder phrases
      return PLACEHOLDER_PATTERNS.some(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      );
    };
    
    // Check editedInstructions
    const newInstructions = improvement.editedInstructions;
    if (!isPlaceholder(newInstructions)) {
      // Only update if we have meaningful content that's not a placeholder
      section.instructions.text = newInstructions;
      console.log(`[updateSectionWithImprovedInstructions] Updated instructions for ${improvement.id} (${newInstructions.length} chars)`);
      changesApplied = true;
    } else {
      // Log warning about placeholder and keep original
      console.warn(`[updateSectionWithImprovedInstructions] Detected placeholder text for ${improvement.id}: "${newInstructions?.substring(0, 50)}..." - keeping original instructions`);
      
      // Keep original instructions
      // If the original is also empty, use some default text
      if (!originalInstructions || originalInstructions.trim() === '') {
        const defaultInstructions = `A good ${section.title} helps you focus your research effort and clearly communicate your intentions.`;
        section.instructions.text = defaultInstructions;
        console.log(`[updateSectionWithImprovedInstructions] Using default instructions for ${improvement.id}`);
        changesApplied = true;
      }
    }

    // Update feedback only if it's provided and meaningful
    if (improvement.feedback && improvement.feedback.trim() !== '' && improvement.feedback.length > 20) {
      section.instructions.feedback = improvement.feedback;
      console.log(`[updateSectionWithImprovedInstructions] Updated feedback for ${improvement.id} (${improvement.feedback.length} chars)`);
      changesApplied = true;
    } else {
      console.warn(`[updateSectionWithImprovedInstructions] Empty or short feedback for ${improvement.id}, skipping feedback update`);
    }
  });

  if (!changesApplied) {
    console.warn("[updateSectionWithImprovedInstructions] No meaningful changes were applied to any section");
  }

  // Return the new object with updated sections
  return updatedSections;
};
