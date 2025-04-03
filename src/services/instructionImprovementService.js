/**
 * Service for improving instructions based on user progress
 * UPDATED: Strengthened prompt to encourage AI text removal/editing.
 */
import { callOpenAI } from './openaiService';

// (Keep the single improveInstructions function here if it exists, unchanged)

/**
 * Improves instructions for multiple sections
 * @param {Array} currentSections - Array of section objects (full list)
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full section content object
 * @param {Function} apiCallFunction - Function to call the API
 * @returns {Promise<Object>} - Result with success flag and improved instructions
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
      const section = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = section?.placeholder || '';
      if (typeof content !== 'string') return false;
      return content.trim() !== '' && content !== placeholder;
    });

    if (sectionsWithProgress.length === 0) {
       console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data for sections with progress
    const sectionsData = sectionsWithProgress.map(sectionId => {
      const section = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!section || !section.instructions?.text) {
          console.warn(`Section or instructions text missing for ID ${sectionId}. Skipping.`);
          return null;
      }
      const userContent = userInputs[sectionId] || '';
      return {
        id: sectionId,
        title: section.title,
        instructionsText: section.instructions.text,
        userContent
      };
    }).filter(data => data !== null);

    if (sectionsData.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // *** Build the STRONGER prompt for the API ***
    const prompt = `
I need you to act as a strict editor improving instruction content for a scientific paper planning tool. The user has made progress, and the instructions MUST be updated based on their input.

For each section PROVIDED BELOW, I'll provide:
1. The current full instruction text (field name: 'instructionsText')
2. The user's current content for that section (field name: 'userContent')

Your task is, FOR EACH SECTION PROVIDED:
1. **Analyze** the 'userContent' to understand what the user has already addressed or accomplished for that section.
2. **Aggressively EDIT** the provided 'instructionsText' for that section. Your **PRIMARY GOAL** is to **REMOVE** sentences or paragraphs that are now redundant because the user's content already covers that point or demonstrates understanding.
3. **DO NOT** simply return the original 'instructionsText'. You MUST make edits, focusing on removal. It is expected that the resulting text will be shorter.
4. **Focus** the remaining instruction text on what the user still needs to do or improve for that specific section, based *only* on what's missing or weak according to the original instructions' goals and the provided user content.
5. Maintain a helpful and encouraging tone. Preserve markdown formatting (like ### headings) in the edited text.
6. Return the **complete, edited, and likely shorter** instruction text for that section.

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with a valid JSON array containing objects for EACH section ID listed above. Use the following format exactly for each object in the array:
{
  "id": "section_id",
  "instructionsText": "Complete EDITED and potentially SHORTER instruction text here..."
}
Ensure the output is ONLY the JSON array, starting with '[' and ending with ']'. If a section's instructions become entirely redundant based on user content, return an empty string for "instructionsText".
`;

    console.log("[Instruction Improvement] Sending batch request to OpenAI for sections:", sectionsWithProgress.join(', '));
    const sectionsToPassToOpenAI = Array.isArray(sectionContent?.sections) ? sectionContent.sections : [];
    const response = await apiCallFunction(
        prompt,
        "improve_instructions_batch",
        userInputs,
        sectionsToPassToOpenAI
    );

    // Parse the response
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
        const isValid = improvedInstructions.every(item => item && typeof item.id === 'string' && typeof item.instructionsText === 'string');
        if (!isValid) {
            console.warn("Parsed response contains items with missing id or instructionsText.", improvedInstructions);
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
      improvedInstructions
    };
  } catch (error) {
    console.error("Error improving batch instructions:", error);
    return {
      success: false,
      message: error.message || "An error occurred while improving instructions"
    };
  }
};

// (Keep the updateSectionWithImprovedInstructions function here, unchanged from the previous version)
export const updateSectionWithImprovedInstructions = (sectionContent, improvedInstructions) => {
  // ... (function code remains the same as last version) ...
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

  improvedInstructions.forEach(improvement => {
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
       if (!updatedSectionsData.sections[sectionIndex].instructions) {
          updatedSectionsData.sections[sectionIndex].instructions = {};
           console.warn(`Initialized missing instructions object for section id: ${improvement.id}`);
      }
      updatedSectionsData.sections[sectionIndex].instructions.text = improvement.instructionsText;
      delete updatedSectionsData.sections[sectionIndex].instructions.description;
      delete updatedSectionsData.sections[sectionIndex].instructions.workStep;
    } else {
        console.warn(`Could not find section with id: ${improvement.id} to apply improvement.`);
    }
  });
  return updatedSectionsData;
};
