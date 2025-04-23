// FILE: src/contexts/UIContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';

// Initial state
const initialState = {
  modals: {
    confirmDialog: false,
    examplesDialog: false,
    reviewModal: false,
    privacyPolicy: false,
    saveDialog: false
  },
  loading: { // Keep track of different loading states
    project: false,
    chat: false,
    import: false,
    export: false,
    review: false,
    improvement: false
  },
  reviewData: null, // Store data for the review modal
  onboarding: { // State for onboarding/help splash
    step: 0,
    showHelpSplash: false // Initially false, managed by component/localStorage
  }
};

// Action types
const ACTION_TYPES = {
  SHOW_MODAL: 'SHOW_MODAL',
  HIDE_MODAL: 'HIDE_MODAL',
  SET_LOADING: 'SET_LOADING',
  CLEAR_LOADING: 'CLEAR_LOADING',
  SET_REVIEW_DATA: 'SET_REVIEW_DATA',
  SET_ONBOARDING_STEP: 'SET_ONBOARDING_STEP',
  SHOW_HELP_SPLASH: 'SHOW_HELP_SPLASH', // Renamed for clarity
  HIDE_HELP_SPLASH: 'HIDE_HELP_SPLASH'
};

// Reducer
function uiReducer(state, action) {
  console.log("[UIContext] Reducer received action:", action); // <-- ADDED LOG
  switch (action.type) {
    case ACTION_TYPES.SHOW_MODAL:
      console.log(`[UIContext] Showing modal: ${action.payload}`); // <-- ADDED LOG
      // Directly set the specified modal to true in the modals object
      return { 
        ...state, 
        modals: { 
          ...state.modals, 
          [action.payload]: true 
        } 
      };

    case ACTION_TYPES.HIDE_MODAL:
       console.log(`[UIContext] Hiding modal: ${action.payload}`); // <-- ADDED LOG
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: false
        }
      };

    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.status // Expect { type: 'import', status: true }
        }
      };

    case ACTION_TYPES.CLEAR_LOADING: // Kept for symmetry, SET_LOADING handles both true/false
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload]: false // Expect just the type 'import'
        }
      };

    case ACTION_TYPES.SET_REVIEW_DATA:
      return { ...state, reviewData: action.payload };

    case ACTION_TYPES.SET_ONBOARDING_STEP:
      return { ...state, onboarding: { ...state.onboarding, step: action.payload } };

    case ACTION_TYPES.SHOW_HELP_SPLASH: // Action to explicitly show splash
         return { ...state, onboarding: { ...state.onboarding, showHelpSplash: true } };

    case ACTION_TYPES.HIDE_HELP_SPLASH: // Action to explicitly hide splash
         return { ...state, onboarding: { ...state.onboarding, showHelpSplash: false } };

    default:
      return state;
  }
}

// Create context
const UIContext = createContext();

// Provider component
export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Load help splash preference from localStorage on mount
  useEffect(() => {
    const shouldHide = localStorage.getItem('hideWelcomeSplash') === 'true';
    if (shouldHide) {
        // Dispatch HIDE only if preference is set
        dispatch({ type: ACTION_TYPES.HIDE_HELP_SPLASH });
    }
    // Otherwise, showHelpSplash remains false by default unless explicitly shown
  }, []);

  // Listen for global event to open privacy policy
  useEffect(() => {
    const handleOpenPrivacyPolicy = () => {
        console.log("[UIContext] Received 'openPrivacyPolicy' event."); // <-- ADD LOG
        dispatch({ type: ACTION_TYPES.SHOW_MODAL, payload: 'privacyPolicy' });
    };
    window.addEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
    return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
  }, []);


  // Actions object passed in context value
  const actions = {
    showModal: (modalName) => {
      console.log(`[UIContext] Dispatching SHOW_MODAL for: ${modalName}`); // <-- ADDED LOG
      dispatch({ type: ACTION_TYPES.SHOW_MODAL, payload: modalName });
    },
    hideModal: (modalName) => {
       console.log(`[UIContext] Dispatching HIDE_MODAL for: ${modalName}`); // <-- ADDED LOG
      dispatch({ type: ACTION_TYPES.HIDE_MODAL, payload: modalName });
    },
    setLoading: (loadingType, status = true) => { // status defaults to true
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type: loadingType, status } });
    },
    clearLoading: (loadingType) => { // Kept for specific use cases if needed
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type: loadingType, status: false } });
    },
    setReviewData: (data) => { dispatch({ type: ACTION_TYPES.SET_REVIEW_DATA, payload: data }); },
    setOnboardingStep: (step) => { dispatch({ type: ACTION_TYPES.SET_ONBOARDING_STEP, payload: step }); },
    hideHelpSplash: () => { // Hides and saves preference
        localStorage.setItem('hideWelcomeSplash', 'true');
        dispatch({ type: ACTION_TYPES.HIDE_HELP_SPLASH });
    },
    showHelpSplash: () => { // Shows and removes preference
        localStorage.removeItem('hideWelcomeSplash');
        dispatch({ type: ACTION_TYPES.SHOW_HELP_SPLASH });
    }
  };

   // Compute if any loading state is active
   const isAnyLoading = Object.values(state.loading).some(Boolean);

  // Provide state slices and actions directly
  const contextValue = {
      modals: state.modals,
      loading: state.loading,
      reviewData: state.reviewData,
      onboarding: state.onboarding,
      isAnyLoading,
      // Pass actions with simplified names used by useUI hook
      openModal: actions.showModal,
      closeModal: actions.hideModal,
      setLoading: actions.setLoading,
      clearLoading: actions.clearLoading,
      setReviewData: actions.setReviewData,
      setOnboardingStep: actions.setOnboardingStep,
      hideHelpSplash: actions.hideHelpSplash,
      showHelpSplash: actions.showHelpSplash
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
}

// Custom hook remains largely the same, consuming the direct values
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context; // Return the whole context value directly
}
