// FILE: src/components/sections/FeedbackButton.js
import React from 'react';
import { getFeedbackButtonColor, getFeedbackLabel } from '../../utils/sectionUtils';

const FeedbackButton = ({ 
  loading, 
  hasEditedContent, 
  hasFeedback,
  editedSinceFeedback,
  feedbackRating, 
  handleFeedbackRequest 
}) => {
  const buttonColorClass = getFeedbackButtonColor(hasEditedContent, loading, feedbackRating);
  const buttonLabel = getFeedbackLabel(hasEditedContent, loading, hasFeedback, editedSinceFeedback, feedbackRating);
  
  const tooltipText = hasEditedContent ? 
    (editedSinceFeedback ? "Content changed since last feedback" : "Get AI feedback on this section") : 
    "Add content before requesting feedback";

  return (
    <div className="flex justify-end mt-2">
      <button
        onClick={handleFeedbackRequest}
        disabled={loading || !hasEditedContent}
        className={`
          feedback-button text-sm font-medium
          px-3 py-1.5 rounded
          flex items-center
          transition-colors
          ${buttonColorClass}
        `}
        title={tooltipText}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {buttonLabel}
          </>
        )}
      </button>
    </div>
  );
};

export default FeedbackButton;
