// utils/sectionUtils.js
export const isPlaceholderContent = (content, placeholder) => {
  return content === placeholder || content.trim() === '';
};

export const getPreviewText = (textValue) => {
  if (!textValue || textValue.trim() === '') {
    return 'No content yet...';
  }
  
  // Get the first non-empty line
  const firstLine = textValue.split('\n').find(line => line.trim() !== '') || '';
  if (firstLine.length > 50) {
    return firstLine.substring(0, 50) + '...';
  }
  return firstLine;
};

export const getFeedbackButtonColor = (hasEditedContent, loading, feedbackRating) => {
  if (!hasEditedContent) return 'bg-gray-400 text-white cursor-not-allowed';
  if (loading) return 'bg-purple-300 text-white cursor-wait';
  
  // Default state (not yet rated)
  if (!feedbackRating) return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
  
  // Color based on rating
  if (feedbackRating <= 3) return 'bg-red-500 text-white hover:bg-red-600';
  if (feedbackRating <= 5) return 'bg-orange-500 text-white hover:bg-orange-600';
  if (feedbackRating <= 7) return 'bg-yellow-500 text-white hover:bg-yellow-600';
  if (feedbackRating <= 9) return 'bg-lime-500 text-white hover:bg-lime-600';
  return 'bg-green-600 text-white hover:bg-green-700';
};

export const getFeedbackLabel = (hasEditedContent, loading, hasFeedback, editedSinceFeedback, feedbackRating) => {
  if (!hasEditedContent) return "Add content first";
  if (loading) return "Processing...";
  
  // If not rated yet or edited after feedback
  if (!hasFeedback) return "Ready for feedback";
  
  // If edited since feedback
  if (editedSinceFeedback) return "Get new feedback";
  
  // Otherwise show rating
  if (!feedbackRating) return "Get new feedback";
  
  if (feedbackRating <= 3) return `Needs work (${feedbackRating}/10)`;
  if (feedbackRating <= 5) return `Average (${feedbackRating}/10)`;
  if (feedbackRating <= 7) return `Good (${feedbackRating}/10)`;
  if (feedbackRating <= 9) return `Very good (${feedbackRating}/10)`;
  return `Excellent (${feedbackRating}/10)`;
};
