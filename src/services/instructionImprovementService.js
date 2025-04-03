// src/services/instructionImprovementService.js

/**
 * Service for improving instructions based on user progress
 */

// This function analyzes user progress and generates improved instructions
export const improveInstructions = async (
  currentSections,
  userInputs,
  sectionContent,
  callOpenAI  // We'll use the existing OpenAI call mechanism
) => {
  try {
    // Identify which sections have meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      if (sectionId === 'philosophy') {
        return userInputs.philosophy && userInputs.philosophy.length > 0;
      } else {
        const content = userInputs[sectionId] || '';
        const section = sectionContent.sections.find(s => s.id === sectionId);
        const placeholder = section?.placeholder || '';
        
        // Check if content has been modified from placeholder
        return content.trim() !== '' && content !== placeholder;
      }
    });
    
    // Skip if no sections have progress
    if (sectionsWithProgress.length === 0) {
      return { success: false, message: "No sections with progress to improve" };
    }
    
    // Prepare data for each section
    const sectionsData = sectionsWithProgress.map(sectionId => {
      const section = sectionContent.sections.find(s => s.id === sectionId);
      let userContent;
      
      if (sectionId === 'philosophy') {
        const philosophyLabels = userInputs.philosophy.map(id => {
          const philosophy = sectionContent.philosophyOptions.find(p => p.id === id);
          return philosophy ? philosophy.label : '';
        });
        userContent = philosophyLabels.join('\n');
      } else {
        userContent = userInputs[sectionId] || '';
      }
      
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
    console.log("[Instruction Improvement] Sending request to OpenAI");
    const response = await callOpenAI(prompt, "improve_instructions", userInputs, sectionContent.sections, sectionContent.philosophyOptions);
    
    // Parse the response
    let improvedInstructions;
    try {
      // Try to parse the JSON response
      // The AI might return text outside the JSON, so we need to extract it
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        improvedInstructions = JSON.parse(jsonMatch[0]);
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

// Function to update section content with improved instructions
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
