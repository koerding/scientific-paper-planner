import React from 'react';
import { countWords, formatInstructions } from '../../utils/formatUtils';

/**
 * Modern input area component with structured template guidance
 */
const ModernInputArea = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  loading
}) => {
  // Render instructions with card design
  const instructionsElement = (
    <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{section.instructions.title}</h3>
      <div className="instruction-text text-gray-600 mb-4 leading-relaxed">{formatInstructions(section)}</div>
      {section.instructions.workStep.content && (
        <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400">
          <div className="text-sm text-indigo-700 leading-relaxed">{section.instructions.workStep.content}</div>
        </div>
      )}
    </div>
  );
  
  // Create a structured template UI for each section
  const renderStructuredInput = () => {
    // Get stored user input
    const userInput = userInputs[section.id] || '';
    
    if (section.id === 'question') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Research Question:</label>
            <textarea 
              value={userInput.includes('Research Question:') ? userInput.split('Research Question:')[1].split('Why this question matters')[0].trim() : ''}
              onChange={(e) => {
                const newValue = `Research Question:\n${e.target.value}\n\nWhy this question matters (objectives):\n- \n- \n- \n\nScientists who would care about this question:\n1. \n2. \n3. \n4. \n5. `;
                handleInputChange(section.id, newValue);
              }}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why this question matters (objectives):</label>
            <textarea 
              value={userInput.includes('Why this question matters') ? userInput.split('Why this question matters')[1].split('Scientists who would care')[0].replace(/\(objectives\):\n-/g, '').trim() : ''}
              onChange={(e) => {
                // Split the input by new lines and prepend each with "- "
                const bulletPoints = e.target.value.split('\n').map(line => {
                  if (line.trim() === '') return '';
                  if (line.trim().startsWith('- ')) return line.trim();
                  return `- ${line.trim()}`;
                }).join('\n');
                
                // Reconstruct the entire content with the new objectives
                const questionPart = userInput.includes('Research Question:') ? 
                  userInput.split('Research Question:')[1].split('Why this question matters')[0].trim() : '';
                
                const scientistsPart = userInput.includes('Scientists who would care') ?
                  userInput.split('Scientists who would care')[1].trim() : 'about this question:\n1. \n2. \n3. \n4. \n5. ';
                
                const newValue = `Research Question:\n${questionPart}\n\nWhy this question matters (objectives):\n${bulletPoints}\n\nScientists who would care ${scientistsPart}`;
                handleInputChange(section.id, newValue);
              }}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scientists who would care about this question:</label>
            <textarea 
              value={userInput.includes('Scientists who would care') ? userInput.split('Scientists who would care about this question:')[1].trim() : ''}
              onChange={(e) => {
                // Format numbered list
                const scientistsList = e.target.value.split('\n').map((line, index) => {
                  if (line.trim() === '') return '';
                  if (line.trim().match(/^\d+\.\s/)) return line.trim();
                  return `${index + 1}. ${line.trim()}`;
                }).join('\n');
                
                // Reconstruct the entire content
                const beforeScientists = userInput.split('Scientists who would care')[0];
                const newValue = `${beforeScientists}Scientists who would care about this question:\n${scientistsList}`;
                handleInputChange(section.id, newValue);
              }}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={5}
            />
          </div>
        </div>
      );
    }
    
    if (section.id === 'hypothesis') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hypothesis 1:</label>
            <textarea 
              value={userInput.includes('Hypothesis 1:') ? userInput.split('Hypothesis 1:')[1].split('Hypothesis 2:')[0].trim() : ''}
              onChange={(e) => {
                // Extract other parts
                const hyp2Part = userInput.includes('Hypothesis 2:') ? 
                  userInput.split('Hypothesis 2:')[1].split('Why distinguishing')[0].trim() : '';
                
                const whyPart = userInput.includes('Why distinguishing') ?
                  userInput.split('Why distinguishing')[1].split('Most similar papers')[0].replace(/these hypotheses matters:\n-/g, '').trim() : '';
                
                const papersPart = userInput.includes('Most similar papers') ?
                  userInput.split('Most similar papers')[1].trim() : 'that test related hypotheses:\n1. \n2. \n3. \n4. \n5. ';
                
                // Reconstruct
                const newValue = `Hypothesis 1:\n${e.target.value}\n\nHypothesis 2:\n${hyp2Part}\n\nWhy distinguishing these hypotheses matters:\n- ${whyPart}\n\nMost similar papers ${papersPart}`;
                handleInputChange(section.id, newValue);
              }}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hypothesis 2:</label>
            <textarea 
              value={userInput.includes('Hypothesis 2:') ? userInput.split('Hypothesis 2:')[1].split('Why distinguishing')[0].trim() : ''}
              onChange={(e) => {
                // Extract other parts
                const hyp1Part = userInput.includes('Hypothesis 1:') ? 
                  userInput.split('Hypothesis 1:')[1].split('Hypothesis 2:')[0].trim() : '';
                
                const whyPart = userInput.includes('Why distinguishing') ?
                  userInput.split('Why distinguishing')[1].split('Most similar papers')[0].replace(/these hypotheses matters:\n-/g, '').trim() : '';
                
                const papersPart = userInput.includes('Most similar papers') ?
                  userInput.split('Most similar papers')[1].trim() : 'that test related hypotheses:\n1. \n2. \n3. \n4. \n5. ';
                
                // Reconstruct
                const newValue = `Hypothesis 1:\n${hyp1Part}\n\nHypothesis 2:\n${e.target.value}\n\nWhy distinguishing these hypotheses matters:\n- ${whyPart}\n\nMost similar papers ${papersPart}`;
                handleInputChange(section.id, newValue);
              }}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
          </div>
          
          {/* Similar pattern for other fields */}
        </div>
      );
    }
    
    // For other sections, use a default template
    return (
      <textarea
        value={userInputs[section.id] || section.placeholder || ''}
        onChange={(e) => handleInputChange(section.id, e.target.value)}
        className="w-full p-4 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        rows={12}
        maxLength={1200}
      />
    );
  };
  
  // Render input form with modern styling
  let inputElement;
  if (section.type === 'checklist') {
    inputElement = (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Research Philosophy</h3>
        <div className="space-y-3">
          {philosophyOptions.map(option => (
            <div 
              key={option.id} 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                userInputs.philosophy.includes(option.id) 
                  ? 'bg-indigo-50 border-2 border-indigo-300' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => handleCheckboxChange(option.id)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={userInputs.philosophy.includes(option.id)}
                    onChange={() => handleCheckboxChange(option.id)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <label 
                  htmlFor={option.id} 
                  className={`ml-3 text-gray-700 cursor-pointer ${
                    userInputs.philosophy.includes(option.id) ? 'font-medium' : ''
                  }`}
                >
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // Show structured input for each section
    inputElement = (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your {section.title}</h3>
        
        {renderStructuredInput()}
        
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <div>
            {userInputs[section.id] ? countWords(userInputs[section.id]) : 0} / 200 words
          </div>
          <div>
            {userInputs[section.id] ? 1200 - userInputs[section.id].length : 1200} characters remaining
          </div>
        </div>
      </div>
    );
  }
  
  // Check if there's content to enable the button
  const hasContent = section.type === 'checklist' 
    ? userInputs.philosophy.length > 0 
    : userInputs[section.id]?.trim().length > 0;
  
  return (
    <div className="space-y-6">
      {instructionsElement}
      {inputElement}
      
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleFirstVersionFinished}
          disabled={!hasContent || loading}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            hasContent && !loading
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Mark First Version Complete
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModernInputArea;
