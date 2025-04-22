// src/contexts/ProjectContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';
import sectionContent from '../data/sectionContent.json';

// Generate initial state from sectionContent
const generateInitialSections = () => {
  const initialSections = {};
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        initialSections[section.id] = section.placeholder || '';
      }
    });
  }
  return initialSections;
};

// Initial state structure
const initialState = {
  sections: generateInitialSections(),
  approaches: {
    active: 'hypothesis',
    options: ['hypothesis', 'needsresearch', 'exploratoryresearch']
  },
  dataMethods: {
    active: 'experiment',
    options: ['experiment', 'existingdata', 'theorysimulation']
  },
  metadata: {
    lastModified: null,
    version: '1.0'
  }
};

// Action types as constants
const ACTION_TYPES = {
  SET_SECTION_CONTENT: 'SET_SECTION_CONTENT',
  SET_ACTIVE_APPROACH: 'SET_ACTIVE_APPROACH',
  SET_ACTIVE_METHOD: 'SET_ACTIVE_METHOD',
  IMPORT_PROJECT: 'IMPORT_PROJECT',
  RESET_PROJECT: 'RESET_PROJECT'
};

// Reducer function to handle state updates
function projectReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_SECTION_CONTENT:
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: action.payload.content
        },
        metadata: {
          ...state.metadata,
          lastModified: Date.now()
        }
      };
      
    case ACTION_TYPES.SET_ACTIVE_APPROACH:
      return {
        ...state,
        approaches: {
          ...state.approaches,
          active: action.payload
        }
      };
      
    case ACTION_TYPES.SET_ACTIVE_METHOD:
      return {
        ...state,
        dataMethods: {
          ...state.dataMethods,
          active: action.payload
        }
      };
      
    case ACTION_TYPES.IMPORT_PROJECT:
      return {
        ...state,
        sections: action.payload.sections || state.sections,
        approaches: {
          ...state.approaches,
          active: action.payload.suggestedApproach || state.approaches.active
        },
        dataMethods: {
          ...state.dataMethods,
          active: action.payload.suggestedMethod || state.dataMethods.active
        },
        metadata: {
          ...state.metadata,
          lastModified: Date.now(),
          importedFrom: action.payload.source
        }
      };
      
    case ACTION_TYPES.RESET_PROJECT:
      return {
        ...initialState,
        metadata: {
          ...initialState.metadata,
          lastModified: Date.now()
        }
      };
      
    default:
      return state;
  }
}

// Create context
const ProjectContext = createContext();

// Provider component
export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  
  // Load from storage on mount
  useEffect(() => {
    const savedState = storageService.loadProject();
    if (savedState) {
      dispatch({ 
        type: ACTION_TYPES.IMPORT_PROJECT, 
        payload: { 
          sections: savedState.sections,
          suggestedApproach: savedState.suggestedApproach,
          suggestedMethod: savedState.suggestedMethod,
          source: 'storage'
        }
      });
    }
  }, []);
  
  // Save to storage when state changes
  useEffect(() => {
    storageService.saveProject(state);
  }, [state]);
  
  // Define actions that components can use
  const actions = {
    setSectionContent: (sectionId, content) => {
      dispatch({ 
        type: ACTION_TYPES.SET_SECTION_CONTENT,
        payload: { sectionId, content }
      });
    },
    
    setActiveApproach: (approach) => {
      dispatch({
        type: ACTION_TYPES.SET_ACTIVE_APPROACH,
        payload: approach
      });
    },
    
    setActiveMethod: (method) => {
      dispatch({
        type: ACTION_TYPES.SET_ACTIVE_METHOD,
        payload: method
      });
    },
    
    importProject: (data) => {
      dispatch({
        type: ACTION_TYPES.IMPORT_PROJECT,
        payload: data
      });
    },
    
    resetProject: () => {
      dispatch({ type: ACTION_TYPES.RESET_PROJECT });
    }
  };
  
  return (
    <ProjectContext.Provider value={{ state, actions }}>
      {children}
    </ProjectContext.Provider>
  );
}

// Custom hook for consuming the context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
