/**
 * Service for improving instructions based on user progress
 * UPDATED: Added robust JSON parsing for truncated responses
 */
import { callOpenAI } from './openaiService';

/**
 * Advanced JSON parser that handles truncated API responses
 * @param {string} text - The JSON string to parse, possibly truncated
 * @returns {any} - The parsed JSON object
 */
function repairTruncatedJson(text) {
  // First, check if we have a clean valid JSON already
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("First parse attempt failed, trying to repair...", e);
  }

  // Clean up any markdown formatting
  let cleanText = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
  
  // Fix trailing commas
  cleanText = cleanText.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
  
  // Try to parse again after basic cleanup
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.log("Basic cleanup parse failed, checking for truncation...", e);
  }
  
  // Check if we have a truncated JSON array
  if (cleanText.trim().startsWith('[') && !cleanText.trim().endsWith(']')) {
    console.log("Detected truncated JSON array, attempting to repair");
    
    // Extract just the complete objects
    const arrayItems = [];
    let depth = 0;
    let currentItem = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      
      // Handle string detection with escape sequences
      if (char === '\\' && !escapeNext) {
        escapeNext = true;
        currentItem += char;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }
      
      escapeNext = false;
      
      // Only count braces when not in a string
      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') depth--;
        
        // When we close an object at the top level, we've completed an item
        if (depth === 0 && char === '}') {
          currentItem += char;
          // We've found a complete object
          try {
            // Verify it's a valid JSON object
            const parsedItem = JSON.parse(currentItem);
            arrayItems.push(parsedItem);
            currentItem = '';
            // Skip any commas or whitespace
            while (i + 1 < cleanText.length && 
                  (cleanText[i + 1] === ',' || 
                   cleanText[i + 1] === ' ' || 
                   cleanText[i + 1] === '\n' || 
                   cleanText[i + 1] === '\r' || 
                   cleanText[i + 1] === '\t')) {
              i++;
            }
          } catch (e) {
            console.log("Found invalid JSON object, skipping:", currentItem);
            currentItem = '';
          }
          continue;
        }
      }
      
      // Add character to current item
      currentItem += char;
    }
    
    // If we extracted at least one complete object
    if (arrayItems.length > 0) {
      console.log(`Successfully extracted ${arrayItems.length} complete objects from truncated JSON`);
      return arrayItems;
    }
  }
  
  // If we couldn't fix it with any method above, throw an error
  throw new Error("Could not repair the JSON: it may be severely truncated or malformed");
}

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

    // *** Build the user-improved prompt for the AI ***
    const prompt = `
I need you to act as a helpful and encouraging editor improving instruction content for a scientific paper planning tool that is used by PhD students. The user has made progress on some sections, and the instructions MUST be updated based on their progress so far.

For each section PROVIDED BELOW, I'll provide:
1. The current full instruction text (field name: 'instructionsText')
2. The user's current content for that section (field name: 'userContent')

Your task is, FOR EACH SECTION PROVIDED:
1. **Analyze** the 'userContent' to understand what the user has already addressed well regarding the goals in 'instructionsText'.
2. **Start** your response for 'instructionsText' with a brief (1-2 sentence) positive acknowledgement of the specific points the user has successfully covered (e.g., "Great job clearly defining the research question!").
3. **Then, critically EDIT** the *original* 'instructionsText'. Your **PRIMARY GOAL** is to **REMOVE** sentences or paragraphs that are now no longer helpful to them because the user's content already covers that point. Focus the remaining text *only* on what the user still needs to do or improve for that specific section. Make sure you remove the points if a reasonable person can argue that the point is satisfied by the text.
4. **If, after editing, you find the user has addressed *****all***** the key points from the original instructions**, DO NOT provide minimal remaining instructions. Instead, replace the *entire* instruction text with a clear, positive, congratulatory message acknowledging all the points they are doing right already. After all, they've completed the main goals for this section (e.g., "Excellent work on this section! You've addressed all the key points regarding X, Y,... and Z. Ready for the next step!").
5. **Otherwise (if points remain),** append the edited, focused, and likely shorter remaining instructions after your positive preamble (from step 2).
6. Maintain a helpful and encouraging tone throughout. Preserve necessary markdown formatting (like ### headings) in the edited text.
7. Return the **complete, updated instruction text** (which might be just the positive preamble, the preamble plus remaining instructions, or the congratulatory message) inside the 'instructionsText' field for that section.

IMPORTANT FORMATTING RULES:
1. JSON responses must be valid without trailing commas
2. Avoid excessively long instructionsText values that might get truncated
3. Keep the total response under 4000 characters if possible
4. DO NOT use trailing commas in JSON objects as they are not valid JSON
5. For example, use {"id": "value", "key": "value"} NOT {"id": "value", "key": "value",}

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with a valid JSON array containing objects for EACH section ID listed above. Use the following format exactly for each object in the array:
[
  {
    "id": "section_id",
    "instructionsText": "Positive preamble + edited instructions text OR congratulatory message here..."
  }
]
Ensure the output is ONLY the JSON array, starting with '[' and ending with ']', and DO NOT include trailing commas or markdown formatting around the JSON.
`;

    console.log("[Instruction Improvement] Sending batch request to OpenAI for sections:", sectionsWithProgress.join(', '));
    const sectionsToPassToOpenAI = Array.isArray(sectionContent?.sections) ? sectionContent.sections : [];

    const response = await apiCallFunction(
        prompt,
        "improve_instructions_batch",
        userInputs,
        sectionsToPassToOpenAI,
        { max_tokens: 2000 } // Limit token length to avoid truncation
    );

    // Parse the response with our robust parser
    let improvedInstructions;
    try {
      // Log the raw response for debugging
      console.log("Raw response from API:", response);
      
      // Use our robust parser
      improvedInstructions = repairTruncatedJson(response);
      
      // Ensure we have an array
      if (!Array.isArray(improvedInstructions)) {
        // Try to extract array from the response using regex
        const jsonRegex = /(\[[\s\S]*\])/;
        const jsonMatch = response.match(jsonRegex);
        if (jsonMatch && jsonMatch[0]) {
          try {
            improvedInstructions = repairTruncatedJson(jsonMatch[0]);
          } catch (err) {
            console.warn("Failed to extract with regex:", err);
          }
        }
        
        // If still not an array, look for the array brackets and try to extract
        if (!Array.isArray(improvedInstructions)) {
          const startIdx = response.indexOf('[');
          if (startIdx !== -1) {
            // Extract everything from the opening bracket
            const partial = response.substring(startIdx);
            try {
              improvedInstructions = repairTruncatedJson(partial);
            } catch (err) {
              console.warn("Failed to extract from bracket:", err);
            }
          }
        }
        
        // If still not an array, try one more approach - manually looking for objects
        if (!Array.isArray(improvedInstructions)) {
          // Look for objects with id and instructionsText
          const idMatches = [...response.matchAll(/"id"\s*:\s*"([^"]+)"/g)];
          const textMatches = [...response.matchAll(/"instructionsText"\s*:\s*"([^"]+)"/g)];
          
          if (idMatches.length > 0 && textMatches.length > 0) {
            improvedInstructions = [];
            for (let i = 0; i < Math.min(idMatches.length, textMatches.length); i++) {
              improvedInstructions.push({
                id: idMatches[i][1],
                instructionsText: textMatches[i][1].replace(/\\n/g, '\n')
              });
            }
          }
        }
        
        // If all attempts failed, throw an error
        if (!Array.isArray(improvedInstructions)) {
          throw new Error("Parsed response is not an array and could not be converted to one.");
        }
      }
      
      // Validate object structure
      const isValid = improvedInstructions.every(item => 
        item && typeof item.id === 'string' && typeof item.instructionsText === 'string');
      
      if (!isValid) {
        console.warn("Parsed response contains items with missing id or instructionsText:", improvedInstructions);
        improvedInstructions = improvedInstructions.filter(item => 
          item && typeof item.id === 'string' && typeof item.instructionsText === 'string');
        
        if(improvedInstructions.length === 0) {
          throw new Error("No valid items found after filtering parsed response.");
        }
      }
      
      console.log(`[Instruction Improvement] Successfully parsed ${improvedInstructions.length} improved sections.`);
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

/**
 * Updates section content with improved instructions
 * @param {Object} sectionContent - The original section content object
 * @param {Array} improvedInstructions - Array of improved instruction objects
 * @returns {Object} - Updated section content object
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
