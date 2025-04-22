// src/contexts/SectionContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';

// Initial state
const initialState = {
  expandedSections: { 'question': true }, // Question section is expanded by default
  lastActiveSectionId: 'question'
};

// Action types
const ACTION_TYPES = {
  EXPAND_SECTION: 'EXPAND_SECTION',
  COLLAPSE_SECTION: 'COLLAPSE_SECTION',
  EXPAND_ALL_SECTIONS: 'EXPAND_ALL_SECTIONS',
  COLLAPSE_ALL_SECTIONS: 'COLLAPSE_ALL_SECTIONS',
  SET_ACTIVE_SECTION: 'SET_ACTIVE_SECTION',
  IMPORT_SECTION_STATES: 'IMPORT_SECTION_STATES',
  RESET_SECTION_STATES: 'RESET_SECTION_STATES'
};

// Reducer
function sectionReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.EXPAND_SECTION:
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.payload]: true
        }
      };
      
    case ACTION_TYPES.COLLAPSE_SECTION:
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.payload]: false
        }
      };
      
    case ACTION_TYPES.EXPAND_ALL_SECTIONS: {
      const allExpanded = {};
      action.payload.forEach(sectionId => {
        allExpanded[sectionId] = true;
      });
      return {
        ...state,
        expandedSections: allExpanded
      };
    }
    
    case ACTION_TYPES.COLLAPSE_ALL_SECTIONS: {
      const allCollapsed = {};
      action.payload.forEach(sectionId => {
        allCollapsed[sectionId] = false;
      });
      // Keep question expanded if it's the first time
      return {
        ...state,
        expandedSections: { 
          ...allCollapsed,
          'question': state.expandedSections.question || true
        }
      };
    }
    
    case ACTION_TYPES.SET_ACTIVE_SECTION:
      return {
        ...state,
        lastActiveSectionId: action.payload,
        // Automatically expand the section being activated
        expandedSections: {
          ...state.expandedSections,
          [action.payload]: true
        }
      };
      
    case ACTION_TYPES.IMPORT_SECTION_STATES:
      return {
        ...state,
        expandedSections: action.payload.expandedSections || state.expandedSections,
        lastActiveSectionId: action.payload.lastActiveSectionId || state.lastActiveSectionId
      };
      
    case ACTION_TYPES.RESET_SECTION_STATES:
      return initialState;
      
    default:
      return state;
  }
}

// Create the context
const SectionContext = createContext();

// Provider component
export function SectionProvider({ children, sectionIds = [] }) {
  const [state, dispatch] = useReducer(sectionReducer, initialState);
  
  // Load section states from storage on mount
  useEffect(() => {
    const savedState = storageService.loadSectionStates();
    if (savedState) {
      dispatch({
        type: ACTION_TYPES.IMPORT_SECTION_STATES,
        payload: savedState
      });
    }
  }, []);
  
  // Save section states when they change
  useEffect(() => {
    storageService.saveSectionStates(state);
  }, [state]);
  
  // Define the actions that components can use
  const actions = {
    expandSection: (sectionId) => {
      dispatch({ type: ACTION_TYPES.EXPAND_SECTION, payload: sectionId });
    },
    
    collapseSection: (sectionId) => {
      dispatch({ type: ACTION_TYPES.COLLAPSE_SECTION, payload: sectionId });
    },
    
    toggleSection: (sectionId) => {
      if (state.expandedSections[sectionId]) {
        dispatch({ type: ACTION_TYPES.COLLAPSE_SECTION, payload: sectionId });
      } else {
        dispatch({ type: ACTION_TYPES.EXPAND_SECTION, payload: sectionId });
      }
    },
    
    expandAllSections: () => {
      dispatch({ type: ACTION_TYPES.EXPAND_ALL_SECTIONS, payload: sectionIds });
    },
    
    collapseAllSections: () => {
      dispatch({ type: ACTION_TYPES.COLLAPSE_ALL_SECTIONS, payload: sectionIds });
    },
    
    setActiveSection: (sectionId) => {
      dispatch({ type: ACTION_TYPES.SET_ACTIVE_SECTION, payload: sectionId });
    },
    
    resetSectionStates: () => {
      dispatch({ type: ACTION_TYPES.RESET_SECTION_STATES });
    },
    
    // Helper function to check if a section is expanded
    isExpanded: (sectionId) => {
      return !!state.expandedSections[sectionId];
    }
  };
  
  return (
    <SectionContext.Provider value={{ state, actions }}>
      {children}
    </SectionContext.Provider>
  );
}

// Custom hook for consuming the context
export function useSectionState() {
  const context = useContext(SectionContext);
  if (!context) {
    throw new Error('useSectionState must be used within a SectionProvider');
  }
  
  return {
    ...context.actions,
    expandedSections: context.state.expandedSections,
    activeSection: context.state.lastActiveSectionId
  };
}
