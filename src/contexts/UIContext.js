// src/contexts/UIContext.js
import React, { createContext, useReducer, useContext } from 'react';

// Initial state
const initialState = {
  modals: {
    confirmDialog: false,
    examplesDialog: false,
    reviewModal: false,
    privacyPolicy: false,
    saveDialog: false
  },
  loading: {
    project: false,
    chat: false,
    import: false,
    export: false,
    review: false,
    improvement: false
  },
  reviewData: null,
  onboarding: {
    step: 0,
    showHelpSplash: true
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
  HIDE_HELP_SPLASH: 'HIDE_HELP_SPLASH'
};

// Reducer
function uiReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SHOW_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: true
        }
      };
      
    case ACTION_TYPES.HIDE_MODAL:
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
          [action.payload]: true
        }
      };
      
    case ACTION_TYPES.CLEAR_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload]: false
        }
      };
      
    case ACTION_TYPES.SET_REVIEW_DATA:
      return {
        ...state,
        reviewData: action.payload
      };
      
    case ACTION_TYPES.SET_ONBOARDING_STEP:
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          step: action.payload
        }
      };
      
    case ACTION_TYPES.HIDE_HELP_SPLASH:
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          showHelpSplash: false
        }
      };
      
    default:
      return state;
  }
}

// Create context
const UIContext = createContext();

// Provider component
export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  
  // Load help splash preference
  React.useEffect(() => {
    const hideHelpSplash = localStorage.getItem('hideWelcomeSplash') === 'true';
    if (hideHelpSplash) {
      dispatch({ type: ACTION_TYPES.HIDE_HELP_SPLASH });
    }
  }, []);
  
  // Actions
  const actions = {
    showModal: (modalName) => {
      dispatch({ type: ACTION_TYPES.SHOW_MODAL, payload: modalName });
    },
    
    hideModal: (modalName) => {
      dispatch({ type: ACTION_TYPES.HIDE_MODAL, payload: modalName });
    },
    
    setLoading: (loadingType) => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loadingType });
    },
    
    clearLoading: (loadingType) => {
      dispatch({ type: ACTION_TYPES.CLEAR_LOADING, payload: loadingType });
    },
    
    setReviewData: (data) => {
      dispatch({ type: ACTION_TYPES.SET_REVIEW_DATA, payload: data });
    },
    
    setOnboardingStep: (step) => {
      dispatch({ type: ACTION_TYPES.SET_ONBOARDING_STEP, payload: step });
    },
    
    hideHelpSplash: () => {
      localStorage.setItem('hideWelcomeSplash', 'true');
      dispatch({ type: ACTION_TYPES.HIDE_HELP_SPLASH });
    },
    
    showHelpSplash: () => {
      localStorage.removeItem('hideWelcomeSplash');
      dispatch({ 
        type: ACTION_TYPES.HIDE_HELP_SPLASH, 
        payload: false 
      });
    }
  };
  
  // Computed properties
  const isAnyLoading = Object.values(state.loading).some(Boolean);
  
  return (
    <UIContext.Provider value={{ 
      state, 
      actions,
      isAnyLoading,
      modals: state.modals,
      loading: state.loading,
      reviewData: state.reviewData,
      onboarding: state.onboarding
    }}>
      {children}
    </UIContext.Provider>
  );
}

// Custom hook for consuming the context
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  
  return {
    // State
    modals: context.modals,
    loading: context.loading,
    reviewData: context.reviewData,
    onboarding: context.onboarding,
    isAnyLoading: context.isAnyLoading,
    
    // Modal actions with easier names
    openModal: context.actions.showModal,
    closeModal: context.actions.hideModal,
    
    // Loading actions
    setLoading: context.actions.setLoading,
    clearLoading: context.actions.clearLoading,
    
    // Other actions
    setReviewData: context.actions.setReviewData,
    setOnboardingStep: context.actions.setOnboardingStep,
    hideHelpSplash: context.actions.hideHelpSplash,
    showHelpSplash: context.actions.showHelpSplash
  };
}
