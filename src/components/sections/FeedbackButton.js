// FILE: src/components/sections/FeedbackButton.js
import React from 'react';
import { getFeedbackButtonColor, getFeedbackLabel } from '../../utils/sectionUtils';

/**
 * Feedback button component for sections
 * FIXED: Improved handling of "edited since feedback" state
 */
const FeedbackButton = ({ 
  loading, 
  hasEditedContent, 
  hasFeedback,
  editedSinceFeedback,
  feedbackRating, 
  handleFeedbackRequest 
}) => {
  // Get proper button color based on state (including editedSinceFeedback)
  const getButtonClass = () => {
    if (!hasEditedContent) return 'bg-gray-400 text-white cursor-not-allowed';
    if (loading) return 'bg-purple-300 text-white cursor-wait';
    
    // Special case: edited since feedback - use purple color regardless of rating
    if (editedSinceFeedback) {
      return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
    }
    
    // Otherwise use standard rating-based colors
    if (!feedbackRating) return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
    
    if (feedbackRating <= 3) return 'bg-red-500 text-white hover:bg-red-600';
    if (feedbackRating <= 5) return 'bg-orange-500 text-white hover:bg-orange-600';
    if (feedbackRating <= 7) return 'bg-yellow-500 text-white hover:bg-yellow-600';
    if (feedbackRating <= 9) return 'bg-lime-500 text-white hover:bg-lime-600';
    return 'bg-green-600 text-white hover:bg-green-700';
  };
  
  // Get proper button label based on state
  const getButtonLabel = () => {
    if (!hasEditedContent) return "Add content first";
    if (loading) return "Processing...";
    
    // Special case: if edited after feedback, show "Get new feedback"
    if (editedSinceFeedback) {
      return "Get new feedback";
    }
    
    // If not rated yet
    if (!hasFeedback || !feedbackRating) return "Ready for feedback";
    
    // Show rating with descriptive text for unedited sections with feedback
    if (feedbackRating <= 3) return `Needs work (${feedbackRating}/10)`;
    if (feedbackRating <= 5) return `Average (${feedbackRating}/10)`;
    if (feedbackRating <= 7) return `Good (${feedbackRating}/10)`;
    if (feedbackRating <= 9) return `Very good (${feedbackRating}/10)`;
    return `Excellent (${feedbackRating}/10)`;
  };
  
  const buttonColorClass = getButtonClass();
  const buttonLabel = getButtonLabel();
  
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
