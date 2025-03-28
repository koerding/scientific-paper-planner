import React, { useEffect } from 'react';
import { countWords } from '../../utils/formatUtils';

/**
 * Modern input area with instructions and AI submission
 */
const ModernInputArea = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  handleSendMessage,
  loading
}) => {
  useEffect(() => {
    if (
      section.type !== 'checklist' &&
      section.placeholder &&
      (!userInputs[section.id] || userInputs[section.id].trim() === '')
    ) {
      handleInputChange(section.id, section.placeholder);
    }
  }, [section.id, section.placeholder, section.type, userInputs, handleInputChange]);

  const hasUserContent = () => {
    if (section.type === 'checklist') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    const input = userInputs[section.id] || '';
    const placeholder = section.placeholder || '';
    return input.trim() !== '' && input.trim() !== placeholder.trim();
  };

  const instructionsElement = (
    <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="font-semibold text-xl mb-2">{section.instructions.title}</div>
      <div className="text-gray-600 mb-4 leading-relaxed">{section.instructions.description}</div>
      {section.instructions.workStep.content && (
        <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400">
          <div className="text-sm text-indigo-700 leading-relaxed">
            {section.instructions.workStep.content}
          </div>
        </div>
      )}
    </div>
  );

  const inputElement = (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your {section.title}</h3>
      <textarea
        value={userInputs[section.id] || ''}
        onChange={(e) => handleInputChange(section.id, e.target.value)}
        className="w-full p-4 border border-gray-200 rounded-lg font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        rows={12}
        maxLength={1200}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-500">
        <div>{countWords(userInputs[section.id] || '')} words</div>
        <div>{1200 - (userInputs[section.id]?.length || 0)} characters left</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {instructionsElement}
      {inputElement}

      {section.confirmFirstVersion && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              handleFirstVersionFinished();
              handleSendMessage();
            }}
            disabled={!hasUserContent() || loading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              hasUserContent() && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
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
      )}
    </div>
  );
};

export default ModernInputArea;
