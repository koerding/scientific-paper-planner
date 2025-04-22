// FILE: src/contexts/FeedbackContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';

// Try to load initial state from localStorage
const getInitialState = () => {
  try {
    const savedFeedback = localStorage.getItem('savedSectionFeedback');
    if (savedFeedback) {
      const parsedData = JSON.parse(savedFeedback);
      
      // Extract feedback data from the old format
      if (parsedData && parsedData.sections) {
        const feedback = {};
        const lastFeedbackTimes = {};
        
        // Process each section to extract feedback
        parsedData.sections.forEach(section => {
          if (section && section.id && section.instructions && section.instructions.improvement) {
            feedback[section.id] = section.instructions.improvement;
            lastFeedbackTimes[section.id] = section.instructions.improvement.timestamp || Date.now();
          }
        });
        
        return {
          feedback,
          lastFeedbackTimes,
          editTimestamps: {},
          loading: false
        };
      }
    }
  } catch (error) {
    console.warn('Error loading feedback data from localStorage:', error);
  }
  
  // Default empty state
  return {
    feedback: {},
    lastFeedbackTimes: {},
    editTimestamps: {},
    loading: false
  };
};

// Initial state
const initialState = getInitialState();

// Action types
const ACTION_TYPES = {
  SET_FEEDBACK: 'SET_FEEDBACK',
  UPDATE_EDIT_TIMESTAMP: 'UPDATE_EDIT_TIMESTAMP',
  SET_LOADING: 'SET_LOADING',
  IMPORT_FEEDBACK: 'IMPORT_FEEDBACK',
  RESET_FEEDBACK: 'RESET_FEEDBACK'
};

// Reducer
function feedbackReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_FEEDBACK: {
      const { sectionId, feedbackData } = action.payload;
      const now = Date.now();
      
      // Ensure the feedback has a timestamp
      const enhancedFeedback = {
        ...feedbackData,
        timestamp: now
      };
      
      return {
        ...state,
        feedback: {
          ...state.feedback,
          [sectionId]: enhancedFeedback
        },
        lastFeedbackTimes: {
          ...state.lastFeedbackTimes,
          [sectionId]: now
        }
      };
    }
    
    case ACTION_TYPES.UPDATE_EDIT_TIMESTAMP: {
      const { sectionId, timestamp } = action.payload;
      
      return {
        ...state,
        editTimestamps: {
          ...state.editTimestamps,
          [sectionId]: timestamp || Date.now()
        }
      };
    }
    
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ACTION_TYPES.IMPORT_FEEDBACK:
      return {
        ...state,
        feedback: action.payload.feedback || {},
        lastFeedbackTimes: action.payload.lastFeedbackTimes || {},
        editTimestamps: action.payload.editTimestamps || {}
      };
      
    case ACTION_TYPES.RESET_FEEDBACK:
      return {
        feedback: {},
        lastFeedbackTimes: {},
        editTimestamps: {},
        loading: false
      };
      
    default:
      return state;
  }
}

// Create context
const FeedbackContext = createContext();

// Provider component
export function FeedbackProvider({ children }) {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);
  
  // Save feedback data to localStorage in the new format
  useEffect(() => {
    try {
      // Only save if we have feedback data
      if (Object.keys(state.feedback).length > 0) {
        localStorage.setItem('feedback_data', JSON.stringify({
          feedback: state.feedback,
          lastFeedbackTimes: state.lastFeedbackTimes,
          editTimestamps: state.editTimestamps
        }));
      }
    } catch (error) {
      console.warn('Error saving feedback data to localStorage:', error);
    }
  }, [state.feedback, state.lastFeedbackTimes, state.editTimestamps]);
  
  // Listen for storage reset events
  useEffect(() => {
    const handleStorageReset = () => {
      dispatch({ type: ACTION_TYPES.RESET_FEEDBACK });
    };
    
    window.addEventListener('storageReset', handleStorageReset);
    return () => window.removeEventListener('storageReset', handleStorageReset);
  }, []);
  
  // Actions
  const actions = {
    setFeedback: (sectionId, feedbackData) => {
      dispatch({
        type: ACTION_TYPES.SET_FEEDBACK,
        payload: { sectionId, feedbackData }
      });
    },
    
    updateEditTimestamp: (sectionId, timestamp = null) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_EDIT_TIMESTAMP,
        payload: { sectionId, timestamp }
      });
    },
    
    setLoading: (isLoading) => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: isLoading });
    },
    
    resetFeedback: () => {
      dispatch({ type: ACTION_TYPES.RESET_FEEDBACK });
    }
  };
  
  // Helper functions
  const hasFeedback = (sectionId) => !!state.feedback[sectionId];
  
  const getFeedbackRating = (sectionId) => {
    return state.feedback[sectionId]?.rating || null;
  };
  
  const isEditedSinceFeedback = (sectionId) => {
    const lastEdit = state.editTimestamps[sectionId];
    const lastFeedback = state.lastFeedbackTimes[sectionId];
    
    if (!lastEdit || !lastFeedback) return false;
    return lastEdit > lastFeedback;
  };
  
  const getSectionsWithFeedback = () => Object.keys(state.feedback);
  
  return (
    <FeedbackContext.Provider value={{
      state,
      actions,
      hasFeedback,
      getFeedbackRating,
      isEditedSinceFeedback,
      getSectionsWithFeedback,
      feedback: state.feedback,
      lastFeedbackTimes: state.lastFeedbackTimes,
      editTimestamps: state.editTimestamps,
      loading: state.loading
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

// Custom hook for consuming the context
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  
  return {
    // State
    feedback: context.feedback,
    lastFeedbackTimes: context.lastFeedbackTimes,
    editTimestamps: context.editTimestamps,
    loading: context.loading,
    
    // Helper functions
    hasFeedback: context.hasFeedback,
    getFeedbackRating: context.getFeedbackRating,
    isEditedSinceFeedback: context.isEditedSinceFeedback,
    getSectionsWithFeedback: context.getSectionsWithFeedback,
    
    // Actions
    setFeedback: context.actions.setFeedback,
    updateEditTimestamp: context.actions.updateEditTimestamp,
    setLoading: context.actions.setLoading,
    resetFeedback: context.actions.resetFeedback
  };
}
