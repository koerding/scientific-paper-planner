// FILE: src/components/sections/FeedbackButton.js
// Back to basics - extremely simplified logic

import React from 'react';
import useAppStore from '../../store/appStore';

const FeedbackButton = ({
  hasEditedContent,
  hasFeedback,
  editedSinceFeedback,
  feedbackRating,
  handleFeedbackRequest,
  sectionId,
  content, // Just pass the raw content
  onSwitchToGuide = null
}) => {
  // --- Get loading states from store ---
  const isAnyAiBusy = useAppStore((state) => state.isAnyLoading());
  const globalAiLoading = useAppStore((state) => state.globalAiLoading);
  const setUiMode = useAppStore((state) => state.setUiMode);
  
  // Extremely simplified logic to determine button state
  const isLoading = isAnyAiBusy || globalAiLoading;
  
  // Check if content is placeholder or minimal
  const hasMinimalContent = !content || 
                         content.trim() === '' || 
                         content.includes('[Clear, focused question') ||
                         content.trim().length < 15;
  
  // After feedback state
  const hasReceivedFeedback = hasFeedback && !editedSinceFeedback;
  
  // Button disabled if loading, no real content, or feedback not followed by edits
  const isButtonDisabled = isLoading || hasMinimalContent || hasReceivedFeedback;
  
  // Button color class - direct logic
  let buttonColor = 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
  
  if (isLoading) {
    buttonColor = 'bg-purple-300 text-purple-800 cursor-wait animate-pulse';
  } else if (hasMinimalContent || hasReceivedFeedback) {
    buttonColor = 'bg-gray-400 text-white cursor-not-allowed opacity-70';
  }
  
  // Button label
  let buttonLabel = "Ready for feedback";
  
  if (isLoading) {
    buttonLabel = "Processing...";
  } else if (hasMinimalContent) {
    buttonLabel = "Add content first";
  } else if (hasReceivedFeedback) {
    if (feedbackRating) {
      if (feedbackRating <= 3) buttonLabel = `Needs work (${feedbackRating}/10)`;
      else if (feedbackRating <= 5) buttonLabel = `Average (${feedbackRating}/10)`;
      else if (feedbackRating <= 7) buttonLabel = `Good (${feedbackRating}/10)`;
      else if (feedbackRating <= 9) buttonLabel = `Very good (${feedbackRating}/10)`;
      else buttonLabel = `Excellent (${feedbackRating}/10)`;
    } else {
      buttonLabel = "Feedback received";
    }
  } else if (editedSinceFeedback) {
    buttonLabel = "Get new feedback";
  }
  
  // Simple click handler
  const handleClick = () => {
    if (isButtonDisabled) return;
    
    // Call the feedback handler
    if (typeof handleFeedbackRequest === 'function') {
      handleFeedbackRequest();
    }
    
    // Switch to guide mode
    setTimeout(() => {
      if (typeof onSwitchToGuide === 'function') {
        onSwitchToGuide();
      } else {
        setUiMode('guide');
      }
    }, 100);
  };
  
  // For debugging
  console.log(`Button state for ${sectionId}:`, {
    content: content?.substring(0, 30) + (content?.length > 30 ? '...' : ''),
    hasMinimalContent,
    hasReceivedFeedback,
    isButtonDisabled,
    buttonColor,
    buttonLabel
  });

  return (
    <div className="flex justify-end mt-2">
      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`
          feedback-button text-sm font-medium
          px-3 py-1.5 rounded
          flex items-center
          transition-colors
          ${buttonColor}
        `}
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
