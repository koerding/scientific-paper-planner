import React, { useState } from 'react';
import { callOpenAI } from '../../services/openaiService';

/**
 * Simplified full-height instructions panel with Improve button
 * Merges the white and blue boxes into a single blue panel
 */
const FullHeightInstructionsPanel = ({ currentSection }) => {
  const [improving, setImproving] = useState(false);

  // Handle improve button click
  const handleImprove = async () => {
    if (!currentSection) return;

    setImproving(true);

    try {
      // Get user inputs from localStorage or your app state
      const userInputs = JSON.parse(localStorage.getItem('paperPlannerData')) || {};
      const philosophyOptions = require('../../data/sectionContent.json').philosophyOptions;

      // Create the prompt for improvement
      const prompt = `
      You are an editor tasked with streamlining scientific paper planning instructions based on what the user has already accomplished. Your job is primarily to REMOVE redundant or unnecessary guidance from the instructions.

      Current section: ${currentSection.title}

      Current instructions:
      ${currentSection.instructions.description}
      ${currentSection.instructions.workStep ? '\n' + currentSection.instructions.workStep.title + '\n' + currentSection.instructions.workStep.content : ''}

      User's current content:
      ${userInputs[currentSection.id] || ''}

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
      const response = await callOpenAI(
        prompt,
        currentSection.id,
        userInputs,
        [currentSection],
        philosophyOptions
      );

      // Update the instructions in the DOM
      const instructionsEl = document.querySelector('.instructions-content');
      if (instructionsEl) {
        // Create new content with improved instructions
        const newContent = response.split('\n\n').map((paragraph, i) => {
          const p = document.createElement('p');
          p.className = 'mb-3';
          p.textContent = paragraph;
          return p;
        });

        // Clear existing content and add new paragraphs
        instructionsEl.innerHTML = '';
        newContent.forEach(p => instructionsEl.appendChild(p));

        console.log("Instructions improved successfully");
      }
    } catch (error) {
      console.error("Error improving instructions:", error);
    } finally {
      setImproving(false);
    }
  };

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 h-full overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Account for header
        paddingBottom: '2rem',
        zIndex: 10
      }}
    >
      <div className="px-6 py-4 relative">
        {/* Improve button - Moved to below the title */}
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-blue-800 mb-4 pr-24">
              {currentSection.title}
            </h3>
            <button
              onClick={handleImprove}
              disabled={improving || !currentSection}
              className={`mb-4 px-4 py-2 rounded-lg text-base font-medium transition-all
                ${improving || !currentSection
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md'
                }`}
            >
              {improving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Improving...
                </span>
              ) : 'Improve'}
            </button>
            <div className="prose prose-blue max-w-none instructions-content">
              {/* Main instruction content */}
              {currentSection.instructions.description.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-3 text-blue-700 text-lg">{paragraph}</p>
              ))}

              {/* Work step content - now merged into the main blue panel */}
              {currentSection.instructions.workStep && currentSection.instructions.workStep.title && (
                <h4 className="font-medium text-blue-800 mt-5 mb-2 text-xl">
                  {currentSection.instructions.workStep.title}
                </h4>
              )}

              {currentSection.instructions.workStep && currentSection.instructions.workStep.content && (
                currentSection.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-3 text-blue-700 text-lg">{paragraph}</p>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
