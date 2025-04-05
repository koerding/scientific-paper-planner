// FILE: src/services/instructionImprovementService.js

/**
 * Updates section content with improved instructions AND feedback
 * Refactored to check sectionContent validity *before* try block.
 * @param {Object} sectionContent - The original section content object
 * @param {Array} improvedData - Array of objects { id, editedInstructions, feedback, completionStatus }
 * @returns {Object} - Updated section content object
 */
export const updateSectionWithImprovedInstructions = (sectionContent, improvedData) => {
    // Validate inputs upfront
    if (typeof sectionContent !== 'object' || sectionContent === null) {
         console.error("updateSectionWithImprovedInstructions received invalid sectionContent:", sectionContent);
         return { sections: [] }; // Return default structure immediately
    }

    if (!Array.isArray(improvedData)) {
        console.error("Invalid improvedData format: Expected an array.");
         // Return a safe copy of the original content if improvedData is bad
        try {
            return JSON.parse(JSON.stringify(sectionContent));
        } catch(e) {
            console.error("Error deep copying sectionContent during improvedData validation failure", e);
            return { sections: [] };
        }
    }

    let updatedSectionsData;
    try {
        // Deep copy is likely safe now after the initial check
        updatedSectionsData = JSON.parse(JSON.stringify(sectionContent));
    } catch(e) {
        console.error("Error deep copying section content", e);
        return { sections: [] }; // Return default structure on copy error
    }

    // Ensure sections array exists after copy
    if (!Array.isArray(updatedSectionsData.sections)) {
        console.error("updatedSectionsData does not have a valid sections array after copy.");
        updatedSectionsData.sections = [];
    }

    improvedData.forEach(improvement => {
        if (!improvement || typeof improvement.id !== 'string' ||
            typeof improvement.editedInstructions !== 'string' ||
            typeof improvement.feedback !== 'string') {
            console.warn("Skipping invalid improvement object:", improvement);
            return; // Skip this invalid item
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

             const fixedInstructions = fixMarkdownFormatting(improvement.editedInstructions);
             const fixedFeedback = fixMarkdownFormatting(improvement.feedback);

             updatedSectionsData.sections[sectionIndex].instructions.text = fixedInstructions;
             updatedSectionsData.sections[sectionIndex].instructions.feedback = fixedFeedback;

             // Store completion status if available
             if (improvement.completionStatus) {
                 updatedSectionsData.sections[sectionIndex].completionStatus = improvement.completionStatus;
             }

             delete updatedSectionsData.sections[sectionIndex].instructions.description;
             delete updatedSectionsData.sections[sectionIndex].instructions.workStep;

        } else {
            console.warn(`Could not find section with id: ${improvement.id} to apply improvement.`);
        }
    });

    return updatedSectionsData;
};


// Ensure we export both functions
export { repairTruncatedJson, fixMarkdownFormatting, detectCompletionStatus };
 * Service for improving instructions based on user progress
 * REFACTORED: Uses centralized prompt content and utilities
 */
import { callOpenAI } from './openaiService';
import { 
  isResearchApproachSection, 
  buildSystemPrompt, 
  getApproachGuidance 
} from '../utils/promptUtils';
import promptContent from '../data/promptContent.json';

/**
 * Advanced JSON parser that handles truncated API responses
 * Updated to expect 'editedInstructions' and 'feedback' fields
 * @param {string} text - The JSON string to parse, possibly truncated
 * @returns {any} - The parsed JSON object or array
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

    // Fix trailing commas (important for potentially truncated JSON)
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

        const arrayItems = [];
        let braceDepth = 0;
        let currentItemText = '';
        let inString = false;
        let escapeNext = false;
        let itemStartIndex = -1;

        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];

            // Handle string detection with escape sequences
            if (char === '\\' && !escapeNext) {
                escapeNext = true;
            } else if (char === '"' && !escapeNext) {
                inString = !inString;
            } else {
                escapeNext = false;
            }


            // Track object boundaries only when not inside a string
            if (!inString) {
                if (char === '{') {
                    if (braceDepth === 0) itemStartIndex = i; // Mark start of a top-level object
                    braceDepth++;
                } else if (char === '}') {
                    braceDepth--;
                    // If we close an object at the top level, try to parse it
                    if (braceDepth === 0 && itemStartIndex !== -1) {
                        currentItemText = cleanText.substring(itemStartIndex, i + 1);
                        try {
                            const parsedItem = JSON.parse(currentItemText);
                             // Basic validation for the new structure
                            if (parsedItem && typeof parsedItem.id === 'string' && typeof parsedItem.editedInstructions === 'string' && typeof parsedItem.feedback === 'string') {
                                // Add completion status detection
                                parsedItem.completionStatus = detectCompletionStatus(parsedItem.editedInstructions, parsedItem.feedback);
                                arrayItems.push(parsedItem);
                            } else {
                                console.warn("Skipping incomplete/invalid item during repair:", currentItemText);
                            }
                            currentItemText = '';
                            itemStartIndex = -1; // Reset start index

                            // Skip trailing comma and whitespace
                            let nextCharIndex = i + 1;
                            while (nextCharIndex < cleanText.length && /^\s*,?\s*$/.test(cleanText.substring(i + 1, nextCharIndex + 1))) {
                                nextCharIndex++;
                            }
                            i = nextCharIndex - 1; // Move index forward

                        } catch (parseErr) {
                            console.log("Found invalid JSON object during repair, skipping:", currentItemText, parseErr);
                            currentItemText = '';
                            itemStartIndex = -1; // Reset start index
                        }
                    }
                }
            }
        } // End for loop

        // If we extracted at least one complete object
        if (arrayItems.length > 0) {
            console.log(`Successfully extracted ${arrayItems.length} complete objects from truncated JSON`);
            return arrayItems;
        }
    }

    // If we couldn't fix it, throw the original parsing error or a generic one
    throw new Error("Could not repair the JSON: it may be severely truncated or malformed");
}

/**
 * Detect completion status for a section based on instruction and feedback content
 * UPDATED: Made much more generous in marking sections as complete
 * @param {string} instructionText - The edited instruction text
 * @param {string} feedbackText - The feedback text
 * @returns {string} - The completion status: 'complete', 'progress', or 'unstarted'
 */
function detectCompletionStatus(instructionText, feedbackText) {
    // Check for congratulatory messages that indicate completion
    const congratsPatterns = [
        /excellent work/i,
        /great job/i,
        /well done/i,
        /all the key points/i,
        /completed/i,
        /perfect/i,
        /outstanding/i,
        /you've addressed/i,
        /good job/i,
        /nicely done/i,
        /impressive/i,
        /complete/i,
        /thorough/i,
        /clear/i,
        /strong/i
    ];

    // Check for phrases that indicate substantial problems
    const problemPatterns = [
        /completely missing/i,
        /no attempt/i,
        /hasn't been addressed/i,
        /empty/i,
        /blank/i,
        /nothing provided/i
    ];

    // Check for progress indicators or partial completion
    const progressPatterns = [
        /good start/i,
        /making progress/i,
        /on the right track/i,
        /solid foundation/i,
        /heading in the right direction/i,
        /needs more/i,
        /could improve/i,
        /add more detail/i,
        /consider including/i,
        /somewhat/i,
        /partially/i
    ];

    // Check content length - if there's substantive content, be generous
    const hasSubstantiveContent =
        (instructionText && instructionText.length > 100) ||
        (feedbackText && feedbackText.length > 100);

    // MUCH MORE GENEROUS CRITERIA:
    // If they've received any congratulatory feedback or substantive feedback, mark as 'complete'
    const isComplete = congratsPatterns.some(pattern =>
        pattern.test(instructionText) || pattern.test(feedbackText)
    );

    if (isComplete || (feedbackText && feedbackText.length > 20)) {
        return 'complete';
    }

    // Only mark as 'unstarted' if there are explicit indicators of a major problem
    const hasMajorProblems = problemPatterns.some(pattern =>
        pattern.test(instructionText) || pattern.test(feedbackText)
    );

    if (hasMajorProblems && !hasSubstantiveContent) {
        return 'unstarted';
    }

    // By default, if they've written anything meaningful or have any feedback,
    // mark as 'progress' at minimum
    if (hasSubstantiveContent || progressPatterns.some(pattern =>
        pattern.test(instructionText) || pattern.test(feedbackText)
    )) {
        return 'progress';
    }

    // Default case - be generous and mark as progress
    return 'progress';
}

/**
 * Function to fix common markdown formatting issues in improved instructions
 * @param {string} text - The instruction text to fix
 * @returns {string} - The fixed instruction text
 */
function fixMarkdownFormatting(text) {
  if (!text) return text;

  // Fix headings that don't have proper spacing
  let fixed = text.replace(/([^\n])###/g, '$1\n\n###');
  // Ensure headings have a space after them if they don't already
  fixed = fixed.replace(/(###)([^ \n])/g, '$1 $2');
  // Ensure headings have a line break after them
  fixed = fixed.replace(/(###.*)([^\n])/g, '$1\n$2');
  // Remove extra spaces after ###
  fixed = fixed.replace(/###\s+/g, '### ');

  // Ensure proper spacing between paragraphs and after headings
  fixed = fixed.replace(/([.!?])([A-Za-z0-9*`])/g, '$1\n\n$2'); // Between sentences
  fixed = fixed.replace(/(\*\*)\n([A-Za-z0-9])/g, '$1\n\n$2'); // After bold
  fixed = fixed.replace(/(### .*)\n([^*])/g, '$1\n\n$2'); // Ensure gap after heading

  // Make sure bullet points have proper spacing
  fixed = fixed.replace(/([^\n])\* /g, '$1\n\n* ');
  // Ensure lists start on a new line if preceded by text
  fixed = fixed.replace(/([a-zA-Z.!?])(\n\* )/g, '$1\n\n* ');

  // Add space after congratulatory messages before starting instructions
  fixed = fixed.replace(/(Excellent work|Great job|Well done)([^!]*)!([^\n\s])/g, '$1$2!\n\n$3');

  // Ensure double line breaks between major points or sections if not already there
  fixed = fixed.replace(/(\.\s*\n)(?=[A-Z0-9*#])/g, '$1\n');

  // Trim leading/trailing whitespace which might affect markdown rendering
  fixed = fixed.trim();

  return fixed;
}

/**
 * Improves instructions for multiple sections, now separating instructions and feedback.
 * Also adds completion status detection for each section.
 * REFACTORED: Uses centralized prompt utilities.
 * @param {Array} currentSections - Array of section objects (full list)
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full section content object (used for original instructions)
 * @param {Function} apiCallFunction - Function to call the API (expected to be callOpenAI)
 * @returns {Promise<Object>} - Result with success flag and improved instructions/feedback
 */
export const improveBatchInstructions = async (
  currentSections, // Use this for current (potentially already modified) instructions if needed for context
  userInputs,
  sectionContent, // Pass the original JSON for original instructions
  apiCallFunction = callOpenAI // Defaulting to callOpenAI
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

    // Prepare data using ORIGINAL instructions from sectionContent
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
            originalInstructionsText: originalSection.instructions.text, // Use original text
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

    // Get the main task prompt from our centralized content
    const mainPrompt = `${promptContent.instructionTaskPrompt}

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with the JSON array, starting with '[' and ending with ']'. 
${promptContent.instructionOutputExample}`;

    console.log("[Instruction Improvement] Sending batch request to OpenAI for sections:", sectionsWithProgress.join(', '));
    const sectionsForContext = sectionContent?.sections || []; // Pass full structure for context if needed

    // Call the API function with our system prompt
    const response = await apiCallFunction(
        mainPrompt,                 // The detailed task prompt
        "improve_instructions_batch", // Context type
        userInputs,                 // Provide current user inputs for overall context
        sectionsForContext,         // Provide overall structure for context
        { max_tokens: 2500 },       // Options
        [],                         // No chat history needed for this specific task
        systemPrompt               // The system prompt from our utility
    );

    // Parse the response with our robust parser
    let improvedInstructionsAndFeedback;
    try {
        console.log("Raw response from API:", response);
        improvedInstructionsAndFeedback = repairTruncatedJson(response);

        // Validate array structure (remains the same)
        if (!Array.isArray(improvedInstructionsAndFeedback)) {
             const jsonRegex = /(\[[\s\S]*\])/;
            const jsonMatch = response.match(jsonRegex);
            if (jsonMatch && jsonMatch[0]) {
                try {
                    improvedInstructionsAndFeedback = repairTruncatedJson(jsonMatch[0]);
                } catch (err) {
                    console.warn("Failed to extract with regex during recovery:", err);
                }
            }
            if (!Array.isArray(improvedInstructionsAndFeedback)) {
                throw new Error("Parsed response is not an array and could not be recovered.");
            }
        }

        // Validate object structure within the array (remains the same)
        const isValid = improvedInstructionsAndFeedback.every(item =>
            item && typeof item.id === 'string' &&
            typeof item.editedInstructions === 'string' &&
            typeof item.feedback === 'string' &&
            (typeof item.completionStatus === 'string' ||
             item.completionStatus === undefined)
        );

        if (!isValid) {
            console.warn("Parsed response contains items with missing id, editedInstructions, or feedback:", improvedInstructionsAndFeedback);
            improvedInstructionsAndFeedback = improvedInstructionsAndFeedback.filter(item =>
                 item && typeof item.id === 'string' &&
                 typeof item.editedInstructions === 'string' &&
                 typeof item.feedback === 'string'
            );

            if (improvedInstructionsAndFeedback.length === 0) {
                throw new Error("No valid items found after filtering parsed response for required fields (id, editedInstructions, feedback).");
            }
             console.warn("Proceeding with partially valid response:", improvedInstructionsAndFeedback);
        }

        // Add completionStatus if missing (remains the same)
        improvedInstructionsAndFeedback.forEach(item => {
            if (!item.completionStatus) {
                item.completionStatus = detectCompletionStatus(item.editedInstructions, item.feedback);
            }
        });

        console.log(`[Instruction Improvement] Successfully parsed ${improvedInstructionsAndFeedback.length} improved sections with feedback.`);

    } catch (error) {
        console.error("Error parsing instruction improvement response:", error);
        console.log("Raw response received:", response);
        return {
            success: false,
            message: `Failed to parse improved instructions/feedback: ${error.message}`
        };
    }

    return {
        success: true,
        improvedData: improvedInstructionsAndFeedback
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
