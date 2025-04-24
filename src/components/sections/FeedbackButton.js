// FILE: src/components/sections/FeedbackButton.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import store to get specific loading flag

const FeedbackButton = ({
  // loading prop removed - now using store directly
  hasEditedContent,
  hasFeedback,
  editedSinceFeedback,
  feedbackRating,
  handleFeedbackRequest,
  sectionId // Needed to identify which section this button belongs to
}) => {
  // --- Get necessary state from store ---
  const isImprovementLoading = useAppStore((state) => state.loading.improvement);
  const isAnyAiBusy = useAppStore((state) => state.isAnyLoading()); // Use the combined loading getter

  // Get proper button color based on feedback state
  const getButtonClass = () => {
    // --- Use isAnyAiBusy for disabling style ---
    if (isAnyAiBusy) return 'bg-gray-300 text-gray-400 cursor-wait'; // General disabled style
    // --- END MODIFICATION ---

    if (!hasEditedContent) return 'bg-gray-400 text-white cursor-not-allowed';

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

  // Get proper button label based on feedback state
  const getButtonLabel = () => {
    // --- Show generic "Processing..." if any AI is busy ---
    if (isAnyAiBusy) return "Processing..."; // Generic busy state
    // --- END MODIFICATION ---

    if (!hasEditedContent) return "Add content first";

    if (editedSinceFeedback) return "Get new feedback";
    if (!hasFeedback || !feedbackRating) return "Ready for feedback";
    if (feedbackRating <= 3) return `Needs work (${feedbackRating}/10)`;
    if (feedbackRating <= 5) return `Average (${feedbackRating}/10)`;
    if (feedbackRating <= 7) return `Good (${feedbackRating}/10)`;
    if (feedbackRating <= 9) return `Very good (${feedbackRating}/10)`;
    return `Excellent (${feedbackRating}/10)`;
  };

  const buttonColorClass = getButtonClass();
  const buttonLabel = getButtonLabel();

  const tooltipText = isAnyAiBusy ? "AI is busy processing another request..." :
    (hasEditedContent ?
    (editedSinceFeedback ? "Content changed since last feedback" : "Get AI feedback on this section") :
    "Add content before requesting feedback");

  return (
    <div className="flex justify-end mt-2">
      <button
        onClick={handleFeedbackRequest}
        // --- Disable if *any* AI is busy ---
        disabled={isAnyAiBusy || !hasEditedContent}
        // --- END MODIFICATION ---
        className={`
          feedback-button text-sm font-medium
          px-3 py-1.5 rounded
          flex items-center
          transition-colors
          ${buttonColorClass}
        `}
        title={tooltipText}
      >
        {/* --- Show spinner if any AI process is running --- */}
        {isAnyAiBusy ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {buttonLabel} {/* Shows "Processing..." */}
          </>
        ) : (
          <>
             {/* Show feedback icon only if not busy */}
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
            {buttonLabel}
          </>
        )}
         {/* --- END MODIFICATION --- */}
      </button>
    </div>
  );
};

export default FeedbackButton;
