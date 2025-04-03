import React, { useState } from 'react';
import { callOpenAI } from '../../services/openaiService';

/**
 * Full-height instructions panel with Improve button
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
      const philosophyOptions = require('../../sectionContent.json').philosophyOptions;
      
      // Create the prompt for improvement
      const prompt = `
      Review the user's progress on their scientific paper plan and provide more tailored instructions
      for this section. Focus on what they still need to improve based on what they've already done.
      
      Current section: ${currentSection.title}
      
      Current instructions:
      ${currentSection.instructions.description}
      
      User's current content:
      ${currentSection.id === 'philosophy' 
        ? (userInputs.philosophy || []).map(id => {
            const philosophy = philosophyOptions.find(p => p.id === id);
            return philosophy ? philosophy.label : '';
          }).join('\n')
        : userInputs[currentSection.id] || ''
      }
      
      Please provide updated instructions that:
      1. Remove redundant advice for things they've already done well
      2. Focus on what still needs improvement
      3. Keep the same helpful tone
      
      Response format: Just provide the new instructions text that should replace the current instructions.
      `;
      
      // Call the OpenAI API
      const response = await callOpenAI(
        prompt, 
        currentSection.id, 
        userInputs, 
        [currentSection], 
        philosophyOptions
      );
      
      // Update the instructions in the DOM (since we don't want to modify the JSON file)
      const descriptionEl = document.querySelector('.text-blue-700.text-lg');
      if (descriptionEl) {
        // Create new paragraph elements with improved content
        const newContent = response.split('\n\n').map((paragraph, i) => {
          const p = document.createElement('p');
          p.className = 'mb-3';
          p.textContent = paragraph;
          return p;
        });
        
        // Clear existing content and add new paragraphs
        descriptionEl.innerHTML = '';
        newContent.forEach(p => descriptionEl.appendChild(p));
        
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
        {/* Improve button */}
        <button 
          onClick={handleImprove}
          disabled={improving || !currentSection}
          className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-base font-medium transition-all
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

        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-blue-800 mb-4 pr-24">
              {currentSection.title}
            </h3>
            <div className="prose prose-blue max-w-none">
              <div className="text-blue-700 text-lg">
                {currentSection.instructions.description.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-3">{paragraph}</p>
                ))}
              </div>
              {currentSection.instructions.workStep && currentSection.instructions.workStep.content && (
                <div className="bg-white rounded-lg p-4 border border-blue-200 mt-5">
                  <h4 className="font-medium text-blue-800 mb-2 text-xl">
                    {currentSection.instructions.workStep.title}
                  </h4>
                  <div className="text-blue-600 text-lg">
                    {currentSection.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
