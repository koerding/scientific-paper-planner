import React from 'react';

/**
 * SectionCard component represents a single editable section in the paper planner
 * Handles displaying content, status indicators, and different input types
 */
const SectionCard = ({
  section,
  isCurrentSection,
  isCompleted,
  userInputs,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  philosophyOptions,
  loading,
  sectionRef,
  onClick
}) => {
  return (
    <div 
      id={section.id}
      ref={sectionRef}
      className={`bg-white rounded-lg shadow-sm p-6 mb-6
        ${isCompleted ? 'border-2 border-green-500' : isCurrentSection ? 'border-2 border-indigo-500' : 'border border-gray-200'}
        ${isCurrentSection ? 'relative' : ''}
      `}
      onClick={onClick}
    >
      {/* Connection dot for active section */}
      {isCurrentSection && (
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-blue-500 rounded-full transform -translate-y-1/2 z-10"></div>
      )}
      
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{section.title}</h2>
        {isCurrentSection && (
          <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">
            Current Focus
          </div>
        )}
        {isCompleted && !isCurrentSection && (
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
            Completed
          </div>
        )}
      </div>
      
      {/* Section content - Philosophy has checkboxes, others have textareas */}
      {section.id === 'philosophy' ? (
        <div className="space-y-3">
          {philosophyOptions.map(option => (
            <div 
              key={option.id} 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                userInputs.philosophy && userInputs.philosophy.includes(option.id) 
                  ? 'bg-indigo-50 border-2 border-indigo-300' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent onClick
                handleCheckboxChange(option.id);
              }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={userInputs.philosophy && userInputs.philosophy.includes(option.id)}
                    onChange={() => handleCheckboxChange(option.id)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <label 
                  htmlFor={option.id} 
                  className={`ml-3 text-gray-700 cursor-pointer ${
                    userInputs.philosophy && userInputs.philosophy.includes(option.id) ? 'font-medium' : ''
                  }`}
                >
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <textarea
          value={userInputs[section.id] || ''}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          rows={10}
          placeholder={section.placeholder || "Enter your content here..."}
        />
      )}
      
      {/* Mark complete button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent onClick
            if (section.id === section.id && isCurrentSection) handleFirstVersionFinished();
          }}
          disabled={loading || !isCurrentSection}
          className={`px-4 py-2 rounded-lg font-medium ${
            !loading && isCurrentSection
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Processing...' : 'Mark Complete'}
        </button>
      </div>
    </div>
  );
};

export default SectionCard;
