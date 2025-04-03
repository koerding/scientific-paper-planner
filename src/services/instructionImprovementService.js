/**
 * Service for improving instructions based on user progress
 * UPDATED: Moved all prompting logic from components to this service
 */
import { callOpenAI } from './openaiService';

/**
 * Improves instructions for a specific section based on user progress
 * @param {Object} currentSection - The current section object
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} [options] - Optional parameters
 * @returns {Promise<Object>} - Result with success flag and improved content
 */
export const improveInstructions = async (
  currentSection,
  userInputs,
  options = {}
) => {
  try {
    if (!currentSection) {
      return { success: false, message: "No section provided" };
    }

    const sectionId = currentSection.id;
    const sectionContent = userInputs[sectionId] || '';
    
    // Skip if no meaningful content
    if (!sectionContent || sectionContent.trim() === '') {
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
    console.log("[Instruction Improvement] Sending request to OpenAI");
    const response = await callOpenAI(
      prompt, 
      "improve_instructions", 
      userInputs, 
      [currentSection]
    );

    // Format the improved content for display
    const improvedContent = response.split('\n\n').map(paragraph => {
      return `<p class="mb-3 text-blue-700 text-lg">${paragraph}</p>`;
    }).join('');

    return {
      success: true,
      message: "Instructions improved successfully",
      improvedContent,
      rawResponse: response
    };
  } catch (error) {
    console.error("Error improving instructions:", error);
    return {
      success: false,
      message: error.message || "An error occurred while improving instructions"
    };
  }
};

/**
 * Improves instructions for multiple sections
 * @param {Array} currentSections - Array of section objects
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
    // Identify which sections have meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId] || '';
      const section = sectionContent.sections.find(s => s.id === sectionId);
      const placeholder = section?.placeholder || '';
      
      // Check if content has been modified from placeholder
      return content.trim() !== '' && content !== placeholder;
    });
    
    // Skip if no sections have progress
    if (sectionsWithProgress.length === 0) {
      return { success: false, message: "No sections with progress to improve" };
    }
    
    // Prepare data for each section
    const sectionsData = sectionsWithProgress.map(sectionId => {
      const section = sectionContent.sections.find(s => s.id === sectionId);
      const userContent = userInputs[sectionId] || '';
      
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

For each section, I'll provide:
1. The current instructions
2. The user's current content

Your task is to:
1. Analyze the user's content to understand their progress
2. Edit the instruction text to remove redundant advice (things they've already done well)
3. Focus the instruction on what still needs improvement
4. Keep the tone helpful and encouraging
5. Return the complete updated instructions, maintaining the structure but improving the content

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

For each section, provide your improved instructions in this format:
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
`;

    // Call the OpenAI API
    console.log("[Instruction Improvement] Sending batch request to OpenAI");
    const response = await apiCallFunction(prompt, "improve_instructions", userInputs, sectionContent.sections);
    
    // Parse the response
    let improvedInstructions;
    try {
      // Try to parse the JSON response
      // The AI might return text outside the JSON, so we need to extract it
      const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]|\{[\s\S]*\}/;
      const jsonMatch = response.match(jsonRegex);
      
      if (jsonMatch) {
        const extractedJson = jsonMatch[0];
        // Check if it's an array or single object
        if (extractedJson.trim().startsWith('[')) {
          improvedInstructions = JSON.parse(extractedJson);
        } else {
          // If it's a single object, wrap it in an array
          improvedInstructions = [JSON.parse(extractedJson)];
        }
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (error) {
      console.error("Error parsing instruction improvement response:", error);
      console.log("Raw response:", response);
      return { 
        success: false, 
        message: "Failed to parse improved instructions"
      };
    }
    
    return {
      success: true,
      improvedInstructions
    };
  } catch (error) {
    console.error("Error improving instructions:", error);
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
  const updatedSections = JSON.parse(JSON.stringify(sectionContent));
  
  // Apply updates to each section
  improvedInstructions.forEach(improvement => {
    const sectionIndex = updatedSections.sections.findIndex(s => s.id === improvement.id);
    
    if (sectionIndex !== -1) {
      // Update the instructions
      updatedSections.sections[sectionIndex].instructions.description = 
        improvement.instructions.description;
      
      if (improvement.instructions.workStep) {
        updatedSections.sections[sectionIndex].instructions.workStep.title = 
          improvement.instructions.workStep.title;
        updatedSections.sections[sectionIndex].instructions.workStep.content = 
          improvement.instructions.workStep.content;
      }
    }
  });
  
  return updatedSections;
};
