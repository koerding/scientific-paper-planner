/**
 * Service for interacting with the OpenAI API
 */

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
    const currentSection = sections.find(s => s.id === currentSectionId);

    const context = {
      currentSection: {
        id: currentSectionId,
        title: currentSection.title,
        instructions: currentSection.instructions,
        content: userInputs[currentSectionId] || ""
      },
      allSections: {}
    };

    sections.forEach(section => {
      context.allSections[section.id] = {
        title: section.title,
        content: userInputs[section.id] || ""
      };
    });

    const payload = {
      message,
      context,
      philosophyOptions
    };

    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "Sorry, something went wrong while contacting the AI.";
  }
};
