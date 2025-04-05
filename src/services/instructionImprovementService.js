// FILE: src/services/instructionImprovementService.js

/**
 * Service for improving instructions based on user progress
 * SIMPLIFIED: Relies on well-structured prompts rather than complex parsing
 */
import { callOpenAI } from './openaiService';
import { 
  isResearchApproachSection, 
  buildSystemPrompt 
} from '../utils/promptUtils';
import promptContent from '../data/promptContent.json';

/**
 * Improves instructions for multiple sections, separating instructions and feedback.
 * Uses a simplified approach that relies on the LLM to format responses correctly.
 * @param {Array} currentSections - Array of section objects
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full section content object
 * @param {Function} apiCallFunction - Function to call the API
 * @returns {Promise<Object>} - Result with success flag and improved instructions/feedback
 */
export const improveBatchInstructions = async (
  currentSections,
  userInputs,
  sectionContent,
  apiCallFunction = callOpenAI
) => {
  try {
    // Identify sections with meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId];
      const originalSection = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = originalSection?.placeholder || '';
      return typeof content === 'string' && content.trim() !== '' && content !== placeholder;
    });

    if (sectionsWithProgress.length === 0) {
      console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data using original instructions from sectionContent
    const sectionsData = sectionsWithProgress.map(sectionId => {
      const originalSection = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!originalSection || !originalSection.instructions?.text) {
        console.warn(`Original section or instructions text missing for ID ${sectionId}. Skipping.`);
        return null;
      }
      const userContent = userInputs[sectionId] || '';
      
      // Determine if this is a research approach section
      const needsResearchContext = isResearchApproachSection(sectionId, originalSection);
      
      return {
        id: sectionId,
        title: originalSection.title,
        originalInstructionsText: originalSection.instructions.text,
        userContent,
        needsResearchContext
      };
    }).filter(data => data !== null);

    if (sectionsData.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // Build the system prompt using our utility
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext: sectionsData.some(section => section.needsResearchContext)
    });

    // Create an updated task prompt that emphasizes clean formatting and reliable output
    const mainPrompt = `
I need you to improve instructions and provide feedback for some sections of a scientific paper planner.

For each section, I'll provide:
- Section ID and title
- Original instructions text
- User's current content

For EACH section, please provide:
1. Edited Instructions: Remove points the user has already addressed. If they've addressed all key points, provide a congratulatory message.
2. Feedback: Brief, constructive feedback noting strengths, weaknesses, and suggestions.
3. Completion Status: Assess as "complete", "progress", or "unstarted".

CRITICAL: Format your response as a valid JSON array of objects. Each object MUST have these exact keys:
- "id": The section ID (string)
- "editedInstructions": The edited instructions or congratulatory message (string)
- "feedback": The feedback (string)
- "completionStatus": The completion status (string)

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

IMPORTANT:
- Structure your response as clean, parseable JSON.
- DO NOT prefix your response with "code blocks" or add any markdown formatting.
- Start with "[" and end with "]".
- Use proper JSON escaping for newlines (\\n) and quotes.
- Be generous in assessing completion - if the user has made substantial progress, mark as "complete".
`;

    console.log("[Instruction Improvement] Sending batch request to OpenAI");
    const sectionsForContext = sectionContent?.sections || [];

    // Call the API with our improved prompts
    const response = await apiCallFunction(
      mainPrompt,
      "improve_instructions_batch",
      userInputs,
      sectionsForContext,
      { 
        max_tokens: 2500,
        temperature: 0.2 // Lower temperature for more consistent formatting
      },
      [],
      systemPrompt
    );

    // Parse the response - with simplified error handling
    let improvedData;
    try {
      // Clean any potential markdown formatting that might remain
      const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
      improvedData = JSON.parse(cleanResponse);
      
      if (!Array.isArray(improvedData)) {
        throw new Error("Response is not a JSON array");
      }
      
      console.log(`[Instruction Improvement] Successfully parsed ${improvedData.length} improved sections`);
    } catch (error) {
      console.error("Error parsing instruction improvement response:", error);
      console.log("Raw response:", response);
      return {
        success: false,
        message: `Failed to parse response: ${error.message}`
      };
    }

    return {
      success: true,
      improvedData
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
 * Updates section content with improved instructions AND feedback
 * Simplified version with better error handling
 * @param {Object} sectionContent - The original section content object
 * @param {Array} improvedData - Array of objects { id, editedInstructions, feedback, completionStatus }
 * @returns {Object} - Updated section content object
 */
export const updateSectionWithImprovedInstructions = (sectionContent, improvedData) => {
  // Validate inputs
  if (typeof sectionContent !== 'object' || sectionContent === null) {
    console.error("Invalid sectionContent");
    return { sections: [] };
  }

  if (!Array.isArray(improvedData)) {
    console.error("Invalid improvedData: Expected an array");
    return JSON.parse(JSON.stringify(sectionContent)); // Safe copy
  }

  // Create a deep copy
  let updatedSectionsData;
  try {
    updatedSectionsData = JSON.parse(JSON.stringify(sectionContent));
  } catch(e) {
    console.error("Error creating deep copy:", e);
    return { sections: [] };
  }

  // Ensure sections array exists
  if (!Array.isArray(updatedSectionsData.sections)) {
    console.error("Invalid sections array in sectionContent");
    updatedSectionsData.sections = [];
    return updatedSectionsData;
  }

  // Update each section
  improvedData.forEach(improvement => {
    if (!improvement?.id) return;
    
    const sectionIndex = updatedSectionsData.sections.findIndex(s => s?.id === improvement.id);
    
    if (sectionIndex === -1) {
      console.warn(`Section not found: ${improvement.id}`);
      return;
    }
    
    const section = updatedSectionsData.sections[sectionIndex];
    if (!section) return;
    
    // Initialize instructions object if needed
    if (!section.instructions) {
      section.instructions = {};
    }
    
    // Update the instruction text and feedback
    section.instructions.text = improvement.editedInstructions || section.instructions.text;
    section.instructions.feedback = improvement.feedback || '';
    
    // Store completion status if available
    if (improvement.completionStatus) {
      section.completionStatus = improvement.completionStatus;
    }
  });

  return updatedSectionsData;
};
