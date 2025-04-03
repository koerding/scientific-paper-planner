/**
 * Service for improving instructions based on user progress
 * UPDATED: Works with single 'instructions.text' field.
 */
import { callOpenAI } from './openaiService';

/**
 * Improves instructions for multiple sections
 * @param {Array} currentSections - Array of section objects (full list)
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full section content object
 * @param {Function} apiCallFunction - Function to call the API
 * @returns {Promise<Object>} - Result with success flag and improved instructions
 */
export const improveBatchInstructions = async (
  currentSections, // Keep passing full array for context if needed by AI
  userInputs,
  sectionContent, // Keep passing for accessing original section data
  apiCallFunction = callOpenAI
) => {
  try {
    // Identify sections with meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId];
      const section = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = section?.placeholder || '';
      if (typeof content !== 'string') return false;
      return content.trim() !== '' && content !== placeholder;
    });

    if (sectionsWithProgress.length === 0) {
       console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data for sections with progress, using the new structure
    const sectionsData = sectionsWithProgress.map(sectionId => {
      const section = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!section || !section.instructions?.text) { // Check for instructions.text
          console.warn(`Section or instructions text missing for ID ${sectionId}. Skipping.`);
          return null;
      }
      const userContent = userInputs[sectionId] || '';

      return {
        id: sectionId,
        title: section.title,
        // Pass the single merged instruction text
        instructionsText: section.instructions.text,
        userContent
      };
    }).filter(data => data !== null);

    if (sectionsData.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // Build the prompt for the API, referencing 'instructionsText'
    const prompt = `
I need you to improve the instruction content for a scientific paper planning tool. The user has made progress on some sections, and I want to update the instructions to be more relevant based on what they've already done.

For each section PROVIDED BELOW, I'll provide:
1. The current full instruction text (field name: 'instructionsText')
2. The user's current content for that section (field name: 'userContent')

Your task is, FOR EACH SECTION PROVIDED:
1. Analyze the user's content for that specific section to understand their progress ON THAT SECTION.
2. Edit the provided 'instructionsText' FOR THAT SECTION to remove redundant advice (things they've already done well in that section).
3. Focus the instruction text FOR THAT SECTION on what still needs improvement within that section's goals.
4. Keep the tone helpful and encouraging. Maintain any markdown formatting (like ### headings) if appropriate.
5. Return the complete, updated instruction text FOR EACH SECTION PROVIDED.

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with a valid JSON array containing objects for EACH section ID listed above. Use the following format exactly for each object in the array:
{
  "id": "section_id",
  "instructionsText": "Complete improved instruction text here..."
}
Ensure the output is ONLY the JSON array, starting with '[' and ending with ']'.
`;

    console.log("[Instruction Improvement] Sending batch request to OpenAI for sections:", sectionsWithProgress.join(', '));
    // Pass the original full sections array for context building in openaiService if needed
    const sectionsToPassToOpenAI = Array.isArray(sectionContent?.sections) ? sectionContent.sections : [];

    const response = await apiCallFunction(
        prompt,
        "improve_instructions_batch",
        userInputs,
        sectionsToPassToOpenAI // Pass full original structure for context building
    );

    // Parse the response expecting 'instructionsText'
    let improvedInstructions;
    try {
      const jsonRegex = /(\[[\s\S]*\])/;
      const jsonMatch = response.match(jsonRegex);
      if (jsonMatch && jsonMatch[0]) {
        const extractedJson = jsonMatch[0];
        improvedInstructions = JSON.parse(extractedJson);
        if (!Array.isArray(improvedInstructions)) {
            throw new Error("Parsed response is not an array.");
        }
         // Validate parsed structure minimally
        const isValid = improvedInstructions.every(item => item && typeof item.id === 'string' && typeof item.instructionsText === 'string');
        if (!isValid) {
            console.warn("Parsed response contains items with missing id or instructionsText.", improvedInstructions);
            // Decide how to handle - filter out invalid items or throw error
            improvedInstructions = improvedInstructions.filter(item => item && typeof item.id === 'string' && typeof item.instructionsText === 'string');
            if(improvedInstructions.length === 0) throw new Error("No valid items found after filtering parsed response.");
        }
        console.log(`[Instruction Improvement] Parsed ${improvedInstructions.length} improved sections.`);
      } else {
        console.error("Raw response from AI:", response);
        throw new Error("Could not extract valid JSON array from response.");
      }
    } catch (error) {
      console.error("Error parsing instruction improvement response:", error);
      console.log("Raw response received:", response);
      return {
        success: false,
        message: `Failed to parse improved instructions: ${error.message}`
      };
    }

    return {
      success: true,
      improvedInstructions // This array now contains objects like { id: "...", instructionsText: "..." }
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
 * Updates section content with improved instructions (using instructions.text)
 * @param {Object} sectionContent - The section content object
 * @param {Array} improvedInstructions - Array of improved instruction objects ({id: ..., instructionsText: ...})
 * @returns {Object} - Updated section content
 */
export const updateSectionWithImprovedInstructions = (sectionContent, improvedInstructions) => {
  let updatedSectionsData;
  try {
      if (typeof sectionContent !== 'object' || sectionContent === null) {
          throw new Error("sectionContent is not a valid object for deep copy.");
      }
      updatedSectionsData = JSON.parse(JSON.stringify(sectionContent));
  } catch(e) {
      console.error("Error deep copying section content", e);
      return { sections: [] }; // Return default structure
  }

  if (!Array.isArray(updatedSectionsData?.sections)) {
      console.error("updatedSectionsData does not have a valid sections array after copy.");
      updatedSectionsData.sections = [];
  }

  if (!Array.isArray(improvedInstructions)) {
      console.error("Invalid improvedInstructions format: Expected an array.");
      return updatedSectionsData;
  }

  // Apply updates using the new 'instructionsText' field
  improvedInstructions.forEach(improvement => {
    // Validate the improvement object structure
    if (!improvement || typeof improvement.id !== 'string' || typeof improvement.instructionsText !== 'string') {
        console.warn("Skipping invalid improvement object (missing id or instructionsText):", improvement);
        return;
    }

    const sectionIndex = updatedSectionsData.sections.findIndex(s => s && s.id === improvement.id);

    if (sectionIndex !== -1) {
       if (!updatedSectionsData.sections[sectionIndex]) {
          console.warn(`Target section at index ${sectionIndex} is undefined. Skipping improvement for id: ${improvement.id}`);
          return;
      }
       // Ensure instructions object exists
       if (!updatedSectionsData.sections[sectionIndex].instructions) {
          updatedSectionsData.sections[sectionIndex].instructions = {};
           console.warn(`Initialized missing instructions object for section id: ${improvement.id}`);
      }

      // Update the single 'text' field
      updatedSectionsData.sections[sectionIndex].instructions.text = improvement.instructionsText;

      // Remove old fields if they somehow still exist after JSON update
      delete updatedSectionsData.sections[sectionIndex].instructions.description;
      delete updatedSectionsData.sections[sectionIndex].instructions.workStep;

    } else {
        console.warn(`Could not find section with id: ${improvement.id} to apply improvement.`);
    }
  });

  return updatedSectionsData;
};
