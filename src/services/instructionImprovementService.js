/**
 * Service for improving instructions based on user progress
 * UPDATED: Added type check before calling trim() in improveBatchInstructions.
 */
import { callOpenAI } from './openaiService';

/**
 * Improves instructions for a specific section based on user progress
 * @param {Object} currentSection - The current section object
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} [options] - Optional parameters
 * @returns {Promise<Object>} - Result with success flag and improved content
 */
// Note: This single-section improvement function is likely no longer used by VerticalPaperPlannerApp
// but kept here for potential other uses or backward compatibility if needed elsewhere.
export const improveInstructions = async (
  currentSection,
  userInputs,
  options = {}
) => {
  // ... (existing single improveInstructions function - likely unused but can remain)
  try {
    if (!currentSection) {
      return { success: false, message: "No section provided" };
    }

    const sectionId = currentSection.id;
    const sectionContent = userInputs[sectionId] || '';

    // Check if sectionContent is a string before trimming
    if (typeof sectionContent !== 'string' || sectionContent.trim() === '') {
      return { success: false, message: "No meaningful content to analyze" };
    }

    // Build the prompt for instruction improvement
    const prompt = `
      You are an editor tasked with streamlining scientific paper planning instructions based on what the user has already accomplished. Your job is primarily to REMOVE redundant or unnecessary guidance from the instructions.

      Current section: ${currentSection.title}

      Current instructions:
      ${currentSection.instructions.description}
      ${currentSection.instructions.workStep ? '\n' + currentSection.instructions.workStep.title + '\n' + currentSection.instructions.workStep.content : ''}

      User's current content:
      ${sectionContent}

      Instructions for editing:
      1. PRIMARILY REMOVE parts of the instructions that are redundant or already addressed by the user
      2. Keep the instructions concise and to the point
      3. You may add AT MOST 1-2 short sentences if absolutely necessary
      4. Maintain the same style and tone as the original
      5. Don't add lengthy new explanations

      Response format: Provide ONLY the edited instructions text that should replace the current instructions.
      Preserve the section title as a heading and maintain paragraph breaks.
    `;

    // Call the OpenAI API
    console.log("[Instruction Improvement - Single] Sending request to OpenAI");
    const response = await callOpenAI(
      prompt,
      "improve_instructions_single", // Differentiate context if needed
      userInputs,
      [currentSection] // Pass only current section for context if intended logic
    );

    // Format the improved content for display
    const improvedContent = response.split('\n\n').map(paragraph => {
      // Basic formatting example, adjust as needed
      return `<p class="mb-3 text-blue-700 text-lg">${paragraph}</p>`;
    }).join('');

    return {
      success: true,
      message: "Instructions improved successfully",
      improvedContent,
      rawResponse: response
    };
  } catch (error) {
    console.error("Error improving single instruction:", error);
    return {
      success: false,
      message: error.message || "An error occurred while improving instruction"
    };
  }
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
      const section = sectionContent.sections.find(s => s.id === sectionId);
      const placeholder = section?.placeholder || '';

      // *** FIX: Check if content is a string before calling trim() ***
      if (typeof content !== 'string') {
          // If it's not a string (like the old 'philosophy' array), it can't have user progress in the text sense.
          // You might add specific checks here if other non-string types should indicate progress.
          return false;
      }

      // Now we know content is a string, proceed with the check
      return content.trim() !== '' && content !== placeholder;
    });

    // Skip if no sections have progress
    if (sectionsWithProgress.length === 0) {
       console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data for each section that has progress
    const sectionsData = sectionsWithProgress.map(sectionId => {
      const section = sectionContent.sections.find(s => s.id === sectionId);
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
    });

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
    const response = await apiCallFunction(prompt, "improve_instructions_batch", userInputs, sectionContent.sections);

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
      updatedSectionsData = JSON.parse(JSON.stringify(sectionContent));
  } catch(e) {
      console.error("Error deep copying section content", e);
      return sectionContent; // Return original if copy fails
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

    const sectionIndex = updatedSectionsData.sections.findIndex(s => s.id === improvement.id);

    if (sectionIndex !== -1) {
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
          // Handle case where AI might omit workStep if it thinks it's fully addressed
          // Option 1: Clear it if AI omits it
          // updatedSectionsData.sections[sectionIndex].instructions.workStep = undefined;
          // Option 2: Keep original if AI omits it (safer?) - uncomment below
           console.warn(`AI omitted workStep for section ${improvement.id}, keeping original.`);
      }
    } else {
        console.warn(`Could not find section with id: ${improvement.id} to apply improvement.`);
    }
  });

  return updatedSectionsData;
};
