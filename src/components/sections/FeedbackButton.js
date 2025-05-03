// FILE: src/components/sections/FeedbackButton.js
// UPDATED: Added mode switching functionality
// UPDATED: Gray button state for unchanged content

import React from 'react';
import useAppStore from '../../store/appStore'; // Import store to get loading flags

const FeedbackButton = ({
  hasEditedContent,
  hasFeedback,
  editedSinceFeedback,
  feedbackRating,
  handleFeedbackRequest,
  sectionId,
  isPlaceholderContent, // New prop to check if content is just placeholder
  onSwitchToGuide = null // Prop to handle mode switching
}) => {
  // --- Get loading states from store ---
  const isAnyAiBusy = useAppStore((state) => state.isAnyLoading());
  const globalAiLoading = useAppStore((state) => state.globalAiLoading);
  const setUiMode = useAppStore((state) => state.setUiMode);
  // ---

  // Determine if the button should be visually/functionally disabled
  const isLoading = isAnyAiBusy || globalAiLoading; // Uses boolean results
  
  // Disabled states
  const isDisabledByContent = !hasEditedContent || isPlaceholderContent;
  const isDisabledAfterFeedback = hasFeedback && !editedSinceFeedback;
  
  // New: Disabled if content hasn't been changed (either from placeholder or since last feedback)
  const isUnchangedContent = isDisabledByContent || isDisabledAfterFeedback;
  
  const isButtonDisabled = isLoading || isUnchangedContent;

  // Get button styling class
  const getButtonClass = () => {
    if (isLoading) {
      return 'bg-purple-300 text-purple-800 cursor-wait animate-pulse';
    }
    if (isUnchangedContent) {
      return 'bg-gray-400 text-white cursor-not-allowed opacity-70';
    }
    if (editedSinceFeedback) {
      return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
    }
    return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
  };

  // Get button label
  const getButtonLabel = () => {
    if (isLoading) return "Processing...";
    
    if (isDisabledByContent) return "Add content first";
    
    if (isDisabledAfterFeedback) {
        if (feedbackRating) {
             if (feedbackRating <= 3) return `Needs work (${feedbackRating}/10)`;
             if (feedbackRating <= 5) return `Average (${feedbackRating}/10)`;
             if (feedbackRating <= 7) return `Good (${feedbackRating}/10)`;
             if (feedbackRating <= 9) return `Very good (${feedbackRating}/10)`;
             return `Excellent (${feedbackRating}/10)`;
        } else {
            return "Feedback received";
        }
    }
    
    if (editedSinceFeedback) return "Get new feedback";
    
    return "Ready for feedback";
  };

  const buttonColorClass = getButtonClass();
  const buttonLabel = getButtonLabel();

  // Determine tooltip based on disabled reason
   let tooltipText = "Get AI feedback on this section";
   if (isLoading) {
       tooltipText = "AI is busy processing a request...";
   } else if (isDisabledByContent) {
       tooltipText = "Add content before requesting feedback";
   } else if (isDisabledAfterFeedback) {
       tooltipText = "Edit the section content to request new feedback";
   } else if (editedSinceFeedback) {
       tooltipText = "Content changed since last feedback. Request updated feedback.";
   }

  // New handler to handle both feedback request and mode switching
  const handleButtonClick = () => {
    if (isButtonDisabled) return;
    
    // First, call the original feedback handler
    if (typeof handleFeedbackRequest === 'function') {
      handleFeedbackRequest();
    }
    
    // Then switch to guide mode (after a small delay)
    setTimeout(() => {
      if (typeof onSwitchToGuide === 'function') {
        onSwitchToGuide();
      } else {
        // Fallback to direct store access if no prop provided
        setUiMode('guide');
      }
    }, 100);
  };

  return (
    <div className="flex justify-end mt-2">
      <button
        onClick={handleButtonClick}
        disabled={isButtonDisabled}
        className={`
          feedback-button text-sm font-medium
          px-3 py-1.5 rounded
          flex items-center
          transition-colors
          ${buttonColorClass}
        `}
        title={tooltipText}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {buttonLabel}
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
