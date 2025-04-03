/**
 * Service for improving instructions based on user progress
 * UPDATED: Modified prompt for AI to include positive preamble and completion message.
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

    // *** Build the REVISED prompt for the AI ***
    const prompt = `
I need you to act as a helpful and encouraging editor improving instruction content for a scientific paper planning tool. The user has made progress on some sections, and the instructions MUST be updated based on their input.

For each section PROVIDED BELOW, I'll provide:
1. The current full instruction text (field name: 'instructionsText')
2. The user's current content for that section (field name: 'userContent')

Your task is, FOR EACH SECTION PROVIDED:
1. **Analyze** the 'userContent' to understand what the user has already addressed well regarding the goals in 'instructionsText'.
2. **Start** your response for 'instructionsText' with a brief (1-2 sentence) positive acknowledgement of the specific points the user has successfully covered (e.g., "Great job clearly defining the research question!").
3. **Then, critically EDIT** the *original* 'instructionsText'. Your **PRIMARY GOAL** is to **REMOVE** sentences or paragraphs that are now redundant because the user's content already covers that point or demonstrates understanding. Focus the remaining text *only* on what the user still needs to do or improve for that specific section.
4. **If, after editing, you find the user has addressed *all* the key points from the original instructions**, DO NOT provide minimal remaining instructions. Instead, replace the *entire* instruction text with a clear, positive, congratulatory message acknowledging they've completed the main goals for this section (e.g., "Excellent work on this section! You've addressed all the key points regarding X and Y. Ready for the next step!").
5. **Otherwise (if points remain),** append the edited, focused, and likely shorter remaining instructions after your positive preamble (from step 2).
6. Maintain a helpful and encouraging tone throughout. Preserve necessary markdown formatting (like ### headings) in the edited text.
7. Return the **complete, updated instruction text** (which might be just the positive preamble, the preamble plus remaining instructions, or the congratulatory message) inside the 'instructionsText' field for that section.

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with a valid JSON array containing objects for EACH section ID listed above. Use the following format exactly for each object in the array:
{
  "id": "section_id",
  "instructionsText": "Positive preamble + edited instructions text OR congratulatory message here..."
}
Ensure the output is ONLY the JSON array, starting with '[' and ending with ']'.
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
