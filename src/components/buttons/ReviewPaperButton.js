import React, { useState } from 'react';

/**
 * Review Paper button component that matches the styling of other AI features
 * Allows users to upload a paper for critical review against scientific standards
 */
const ReviewPaperButton = ({ handleReviewPaper, loading, onboardingStep }) => {
  // Determine if the review button should be highlighted based on onboarding step
  const showReviewHighlight = onboardingStep === 5; // New onboarding step for review
  
  return (
    <div
      className={`fixed bottom-6 right-24 z-40 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${showReviewHighlight ? 'onboarding-highlight-review' : ''}`}
      style={{ transform: 'translateZ(0)' }} /* Force hardware acceleration for smoother animations */
    >
      <label
        className={`
          flex items-center justify-center 
          px-4 py-5 
          rounded-full 
          shadow-lg 
          transition-colors 
          text-white 
          font-medium 
          ${loading
            ? 'bg-teal-400 cursor-wait'
            : 'bg-teal-600 hover:bg-teal-700'
          }
        `}
        title="Upload a paper for critical review"
        aria-label="Review Paper"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )}
        {loading ? 'Reviewing...' : 'Review Paper'}
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.docx,.doc" 
          onChange={handleReviewPaper}
          disabled={loading} 
        />
      </label>
      
      {/* Onboarding Tooltip */}
      {showReviewHighlight && (
        <div className="onboarding-tooltip onboarding-tooltip-review" style={{ zIndex: 41 }}>
          Upload a paper to see how it meets scientific standards
        </div>
      )}
    </div>
  );
};

export default ReviewPaperButton;
