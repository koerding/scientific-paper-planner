import React, { useEffect, useState } from 'react';

/**
 * Subtle toast notification that reminds users to use the improvement button
 * Simplified version with unused props removed
 */
const ImprovementReminderToast = ({ 
  userInputs,
  lastImprovementTime,
  significantEditsMade,
  handleMagicClick
}) => {
  const [showReminder, setShowReminder] = useState(false);
  const [lastEditTime, setLastEditTime] = useState(Date.now());
  const reminderDelay = 3 * 60 * 1000; // 3 minutes in milliseconds
  
  // Track when user edits content
  useEffect(() => {
    setLastEditTime(Date.now());
  }, [userInputs]);
  
  // Check conditions to show reminder
  useEffect(() => {
    let timer;
    
    // Only set timer if we have a valid last improvement time and significant edits were made
    if (lastImprovementTime && significantEditsMade) {
      timer = setInterval(() => {
        const currentTime = Date.now();
        
        // Show reminder if:
        // 1. At least 3 minutes has passed since last edit
        // 2. User has edited since last improvement
        // 3. Reminder is not already showing
        if (
          (currentTime - lastEditTime) >= reminderDelay && 
          lastEditTime > lastImprovementTime &&
          !showReminder
        ) {
          setShowReminder(true);
        }
      }, 10000); // Check every 10 seconds to reduce overhead
    }
    
    return () => clearInterval(timer);
  }, [lastEditTime, lastImprovementTime, showReminder, reminderDelay, significantEditsMade]);
  
  // Auto-dismiss after 15 seconds if not manually dismissed
  useEffect(() => {
    let dismissTimer;
    
    if (showReminder) {
      dismissTimer = setTimeout(() => {
        setShowReminder(false);
      }, 15000); // Auto-dismiss after 15 seconds
    }
    
    return () => clearTimeout(dismissTimer);
  }, [showReminder]);
  
  // Handle manual dismiss
  const handleDismiss = () => {
    setShowReminder(false);
  };
  
  // Handle click on improvement button
  const handleImproveClick = () => {
    setShowReminder(false);
    if (handleMagicClick) handleMagicClick();
  };
  
  if (!showReminder) return null;
  
  return (
    <div 
      className="fixed bottom-24 right-6 bg-white rounded-lg shadow-lg p-4 max-w-xs animate-fade-in flex z-40 border border-purple-200"
      style={{ 
        animation: 'fadeIn 0.5s ease-out',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="mr-3 mt-1 text-purple-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-grow">
        <div className="text-sm font-medium text-gray-800">
          Ready for feedback?
        </div>
        <div className="text-xs text-gray-600 mb-2">
          Click "Improve Instructions" to get AI feedback on your changes.
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 text-xs mr-3"
          >
            Dismiss
          </button>
          <button 
            onClick={handleImproveClick}
            className="text-purple-600 hover:text-purple-800 text-xs font-medium"
          >
            Improve Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovementReminderToast;
