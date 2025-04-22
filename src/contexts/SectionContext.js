// FILE: src/contexts/SectionContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';

// Load initial state from localStorage or use defaults
const getInitialSectionStates = () => {
  // Try to load from localStorage first
  try {
    const savedStates = localStorage.getItem('section_states');
    if (savedStates) {
      return JSON.parse(savedStates);
    }
  } catch (error) {
    console.warn('Error loading section states from localStorage:', error);
  }
  
  // Default state (question expanded, others minimized)
  return {
    expandedSections: { 'question': true },
    lastActiveSectionId: 'question'
  };
};

// Initial state
const initialState = getInitialSectionStates();

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
      // Keep question expanded for usability
      return {
        ...state,
        expandedSections: { 
          ...allCollapsed,
          'question': true
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
      return {
        expandedSections: { 'question': true },
        lastActiveSectionId: 'question'
      };
      
    default:
      return state;
  }
}

// Create the context
const SectionContext = createContext();

// Provider component
export function SectionProvider({ children, sectionIds = [] }) {
  const [state, dispatch] = useReducer(sectionReducer, initialState);
  
  // Save section states when they change
  useEffect(() => {
    localStorage.setItem('section_states', JSON.stringify(state));
  }, [state]);
  
  // Listen for storage reset events
  useEffect(() => {
    const handleStorageReset = () => {
      dispatch({ type: ACTION_TYPES.RESET_SECTION_STATES });
    };
    
    window.addEventListener('storageReset', handleStorageReset);
    return () => window.removeEventListener('storageReset', handleStorageReset);
  }, []);
  
  // Listen for document import event to expand all sections
  useEffect(() => {
    const handleDocumentImported = (event) => {
      if (event.detail?.expandAllSections) {
        dispatch({ 
          type: ACTION_TYPES.EXPAND_ALL_SECTIONS, 
          payload: sectionIds 
        });
      }
    };
    
    window.addEventListener('documentImported', handleDocumentImported);
    return () => window.removeEventListener('documentImported', handleDocumentImported);
  }, [sectionIds]);
  
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

// Export a direct setter function for compatibility with existing code
export function setSectionMinimizedState(sectionId, isMinimized) {
  // This is a compatibility function that works with localStorage directly
  try {
    localStorage.setItem(`section_minimized_${sectionId}`, isMinimized.toString());
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
      detail: { sectionId, isMinimized }
    }));
    
    return true;
  } catch (error) {
    console.warn(`Error setting minimized state for ${sectionId}:`, error);
    return false;
  }
}
