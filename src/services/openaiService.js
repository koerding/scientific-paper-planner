/**
 * Service for interacting with the OpenAI API
 */
import axios from 'axios';

/**
 * Call the OpenAI API to get AI feedback
 * @param {string} message - The message or llmInstructions
 * @param {string} currentSectionId - The ID of the current section
 * @param {Object} userInputs - All user inputs across all sections
 * @param {Array} sections - All sections from the configuration
 * @returns {Promise<string>} - The AI response
 */
export const callOpenAI = async (message, currentSectionId, userInputs, sections, philosophyOptions) => {
  try {
    // Find the current section object
    const currentSection = sections.find(s => s.id === currentSectionId);
    
    // Create a comprehensive context for the AI
    let context = {
      currentSection: {
        id: currentSectionId,
        title: currentSection.title,
        instructions: currentSection.instructions,
        content: userInputs[currentSectionId] || ""
      },
      allSections: {}
    };
    
    // Add content from all sections to provide complete context
    sections.forEach(section => {
      context.allSections[section.id] = {
        title: section.title,
        content: userInputs[section.id] || "",
        completed: section.id === 'philosophy' 
          ? (userInputs.philosophy && userInputs.philosophy.length > 0)
          : (userInputs[section.id] && userInputs[section.id].trim() !== "")
      };
    });
    
    // For the philosophy section, include selected philosophies
    if (userInputs.philosophy && userInputs.philosophy.length > 0) {
      // Get the full labels for the selected philosophy options
      const selectedPhilosophies = philosophyOptions
        .filter(option => userInputs.philosophy.includes(option.id))
        .map(option => option.label);
      
      context.allSections.philosophy.selectedOptions = selectedPhilosophies;
    }
    
    // Make the API call to OpenAI with the full context
    const response = await axios.post('/api/openai', {
      message,
      context,
      sectionId: currentSectionId
    });
    
    return response.data.message;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};
