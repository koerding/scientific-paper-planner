import React from 'react';

/**
 * Floating Instructions Improvement Button
 * UPDATED: More descriptive text and styling
 * FIXED: Better handling of loading state
 * FIXED: Lower z-index to be behind the chat when open
 * FIXED: Moved further to the left to avoid overlapping with chat button
 */
const FloatingMagicButton = ({ handleMagicClick, loading, onboardingStep }) => {
  // Determine if the magic button should be highlighted based on onboarding step
  const showMagicHighlight = onboardingStep === 4;

  return (
    <div
      className={`fixed bottom-6 right-82 z-40 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${showMagicHighlight ? 'onboarding-highlight-magic' : ''}`}
      style={{ transform: 'translateZ(0)' }} /* Force hardware acceleration for smoother animations */
    >
      <button
        onClick={loading ? null : handleMagicClick} // Prevent click when loading
        disabled={loading}
        className={`
          flex items-center justify-center 
          px-4 py-5 
          rounded-full 
          shadow-lg 
          transition-colors 
          text-white 
          font-medium 
          ${loading
            ? 'bg-purple-400 cursor-wait'
            : 'bg-purple-600 hover:bg-purple-700'
          }
        `}
        title="Get AI feedback and improve instructions"
        aria-label="Improve Instructions"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )}
        {loading ? 'Processing...' : 'Improve Instructions'}
      </button>
      
      {/* Onboarding Tooltip - improved positioning */}
      {showMagicHighlight && (
        <div className="onboarding-tooltip onboarding-tooltip-magic" style={{ zIndex: 41 }}>
          Get AI feedback on your instructions
        </div>
      )}
    </div>
  );
};

export default FloatingMagicButton;
