/**
 * Service for improving instructions based on user progress
 * UPDATED: Added logging before the apiCallFunction call.
 */
import { callOpenAI } from './openaiService';

// ... (keep the existing single improveInstructions function here) ...
export const improveInstructions = async (
  currentSection,
  userInputs,
  options = {}
) => {
  // ... (existing single improveInstructions function code) ...
};

/**
 * Improves instructions for multiple sections
 * @param {Array} currentSections - Array of section objects (full list)
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full section content object from JSON
 * @param {Function} apiCallFunction - Function to call the API
 * @returns {Promise<Object>} - Result with success flag and improved instructions
 */
export const improveBatchInstructions = async (
  currentSections, // Should be the full array from sectionContent.sections
  userInputs,
  sectionContent, // Pass the original sectionContent JSON object
  apiCallFunction = callOpenAI // Allow overriding the API call function if needed
) => {
  try {
    // Identify which sections have meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId]; // Get the raw content
      // Ensure sectionContent exists and has a sections array before finding
      const section = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = section?.placeholder || '';

      // Check if content is a string before calling trim()
      if (typeof content !== 'string') {
          return false;
      }
      // Proceed with the check
      return content.trim() !== '' && content !== placeholder;
    });

    // Skip if no sections have progress
    if (sectionsWithProgress.length === 0) {
       console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data for each section that has progress
    const sectionsData = sectionsWithProgress.map(sectionId => {
       // Ensure sectionContent exists and has a sections array before finding
      const section = sectionContent?.sections?.find(s => s.id === sectionId);
      // If section not found (e.g., old 'philosophy' key), skip or handle appropriately
      if (!section) {
          console.warn(`Section with ID ${sectionId} not found in sectionContent. Skipping.`);
          return null; // Return null to filter out later
      }
      const userContent = userInputs[sectionId] || ''; // Should be string here based on filter

      return {
        id: sectionId,
        title: section.title,
        instructions: {
          description: section.instructions.description,
          workStep: section.instructions.workStep
        },
        userContent
      };
    }).filter(data => data !== null); // Filter out any null entries from missing sections

    // Re-check if we still have sections after filtering potential mismatches
    if (sectionsData.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // Build the prompt for the API
    const prompt = `
I need you to improve the instruction content for a scientific paper planning tool. The user has made progress on some sections, and I want to update the instructions to be more relevant based on what they've already done.

For each section PROVIDED BELOW, I'll provide:
1. The current instructions (description and work step)
2. The user's current content for that section

Your task is, FOR EACH SECTION PROVIDED:
1. Analyze the user's content for that specific section to understand their progress ON THAT SECTION.
2. Edit the instruction text FOR THAT SECTION to remove redundant advice (things they've already done well in that section).
3. Focus the instruction FOR THAT SECTION on what still needs improvement within that section's goals.
4. Keep the tone helpful and encouraging.
5. Return the complete updated instructions FOR EACH SECTION PROVIDED, maintaining the original structure (description, workStep title, workStep content) but improving the text content. Make sure to include all parts (description, workStep title, workStep content) even if one part wasn't changed significantly.

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with a valid JSON array containing objects for EACH section ID listed above. Use the following format exactly for each object in the array:
{
  "id": "section_id",
  "instructions": {
    "description": "Improved description text here...",
    "workStep": {
      "title": "Original or slightly improved title",
      "content": "Improved work step content here..."
    }
  }
}
Ensure the output is ONLY the JSON array, starting with '[' and ending with ']'.
`;

    // Call the OpenAI API - Pass ALL sections for broader context if needed by AI, but prompt focuses on sectionsData
    console.log("[Instruction Improvement] Sending batch request to OpenAI for sections:", sectionsWithProgress.join(', '));

    // *** DEBUG LOG: Log the sections array being passed to the API call function ***
    console.log("[Instruction Improvement] Passing this sections array to apiCallFunction:", sectionContent?.sections);

    // Ensure sectionContent.sections is actually an array before passing
    const sectionsToPass = Array.isArray(sectionContent?.sections) ? sectionContent.sections : [];
    if (sectionsToPass.length === 0 && sectionContent?.sections) {
        console.error("[Instruction Improvement] sectionContent.sections is not an array!", sectionContent.sections);
    }

    const response = await apiCallFunction(
        prompt,
        "improve_instructions_batch",
        userInputs,
        sectionsToPass // Pass the validated array
    );


    // Parse the response
    let improvedInstructions;
    try {
      // Try to parse the JSON response, extracting the array
      const jsonRegex = /(\[[\s\S]*\])/; // Match content between outer square brackets
      const jsonMatch = response.match(jsonRegex);

      if (jsonMatch && jsonMatch[0]) {
        const extractedJson = jsonMatch[0];
        improvedInstructions = JSON.parse(extractedJson);
        // Basic validation
        if (!Array.isArray(improvedInstructions)) {
            throw new Error("Parsed response is not an array.");
        }
        console.log(`[Instruction Improvement] Parsed ${improvedInstructions.length} improved sections.`);
      } else {
        console.error("Raw response from AI:", response);
        throw new Error("Could not extract valid JSON array from response.");
      }
    } catch (error) {
      console.error("Error parsing instruction improvement response:", error);
      console.log("Raw response received:", response); // Log the raw response on error
      return {
        success: false,
        message: `Failed to parse improved instructions: ${error.message}`
      };
    }

    return {
      success: true,
      improvedInstructions
    };
  } catch (error) {
    console.error("Error improving batch instructions:", error); // Log the error caught in the main try block
    return {
      success: false,
      message: error.message || "An error occurred while improving instructions"
    };
  }
};


/**
 * Updates section content with improved instructions
 * @param {Object} sectionContent - The section content object
 * @param {Array} improvedInstructions - Array of improved instruction objects
 * @returns {Object} - Updated section content
 */
export const updateSectionWithImprovedInstructions = (sectionContent, improvedInstructions) => {
  // Create a deep copy to avoid mutating the original
  let updatedSectionsData;
  try {
      // Ensure sectionContent is an object before stringifying
      if (typeof sectionContent !== 'object' || sectionContent === null) {
          throw new Error("sectionContent is not a valid object for deep copy.");
      }
      updatedSectionsData = JSON.parse(JSON.stringify(sectionContent));
  } catch(e) {
      console.error("Error deep copying section content", e);
      // Return a default structure or handle error appropriately
      return { sections: [] };
  }

  // Ensure sections array exists after copy
  if (!Array.isArray(updatedSectionsData?.sections)) {
      console.error("updatedSectionsData does not have a valid sections array after copy.");
      updatedSectionsData.sections = []; // Initialize if missing
  }


  if (!Array.isArray(improvedInstructions)) {
      console.error("Invalid improvedInstructions format: Expected an array.");
      return updatedSectionsData; // Return copied state without updates
  }

  // Apply updates to each section
  improvedInstructions.forEach(improvement => {
    if (!improvement || typeof improvement.id === 'undefined' || typeof improvement.instructions === 'undefined') {
        console.warn("Skipping invalid improvement object:", improvement);
        return; // Skip this malformed improvement object
    }

    const sectionIndex = updatedSectionsData.sections.findIndex(s => s && s.id === improvement.id); // Check if s exists

    if (sectionIndex !== -1) {
      // Ensure the target section and its instructions object exist
       if (!updatedSectionsData.sections[sectionIndex]) {
          console.warn(`Target section at index ${sectionIndex} is undefined. Skipping improvement for id: ${improvement.id}`);
          return;
      }
       if (!updatedSectionsData.sections[sectionIndex].instructions) {
          updatedSectionsData.sections[sectionIndex].instructions = {}; // Initialize if missing
           console.warn(`Initialized missing instructions object for section id: ${improvement.id}`);
      }


      // Update the instructions safely, checking for existence
      if (typeof improvement.instructions.description === 'string') {
          updatedSectionsData.sections[sectionIndex].instructions.description =
              improvement.instructions.description;
      }

      if (improvement.instructions.workStep) {
         // Ensure workStep exists on the target before assigning
         if (!updatedSectionsData.sections[sectionIndex].instructions.workStep) {
             updatedSectionsData.sections[sectionIndex].instructions.workStep = {};
         }

         if (typeof improvement.instructions.workStep.title === 'string') {
             updatedSectionsData.sections[sectionIndex].instructions.workStep.title =
                improvement.instructions.workStep.title;
          }
         if (typeof improvement.instructions.workStep.content === 'string') {
             updatedSectionsData.sections[sectionIndex].instructions.workStep.content =
                improvement.instructions.workStep.content;
          }
      } else {
           console.warn(`AI omitted workStep for section ${improvement.id}. Check if this is intended.`);
           // Decide if you want to clear the workStep or keep the original
           // To clear: updatedSectionsData.sections[sectionIndex].instructions.workStep = undefined;
      }
    } else {
        console.warn(`Could not find section with id: ${improvement.id} to apply improvement.`);
    }
  });

  return updatedSectionsData;
};
