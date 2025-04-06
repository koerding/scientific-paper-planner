import React from 'react';

/**
 * Floating Magic Button that appears next to the chat button
 * FIXES:
 * - Consistent positioning relative to chat button
 * - Improved z-index handling
 * - Improved pointer events and transitions
 * - Fixed tooltip positioning
 */
const FloatingMagicButton = ({ handleMagicClick, loading, onboardingStep }) => {
  // Determine if the magic button should be highlighted based on onboarding step
  const showMagicHighlight = onboardingStep === 4;

  return (
    <div
      className={`fixed bottom-6 right-28 z-40 cursor-pointer ${showMagicHighlight ? 'onboarding-highlight-magic' : ''}`}
      style={{ transform: 'translateZ(0)' }} /* Force hardware acceleration for smoother animations */
    >
      <button
        onClick={handleMagicClick}
        disabled={loading}
        className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          loading
            ? 'bg-purple-400 cursor-wait'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
        title="Get AI feedback on your progress"
        aria-label="Get AI feedback on your progress"
      >
        {loading ? (
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )}
      </button>
      
      {/* Onboarding Tooltip - improved positioning */}
      {showMagicHighlight && (
        <div className="onboarding-tooltip onboarding-tooltip-magic" style={{ zIndex: 1001 }}>
          Get AI feedback on your progress
        </div>
      )}
    </div>
  );
};

export default FloatingMagicButton;
