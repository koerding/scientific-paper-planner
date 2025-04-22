// FILE: src/contexts/ChatContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { callOpenAI } from '../services/openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';

// Try to load initial state from localStorage
const getInitialState = () => {
  try {
    const savedChat = localStorage.getItem('paperPlannerChat');
    if (savedChat) {
      const parsedChat = JSON.parse(savedChat);
      return {
        messages: parsedChat || {},
        currentMessage: '',
        currentSectionId: 'question',
        loading: false
      };
    }
  } catch (error) {
    console.warn('Error loading chat messages from localStorage:', error);
  }
  
  // Default empty state
  return {
    messages: {},
    currentMessage: '',
    currentSectionId: 'question',
    loading: false
  };
};

// Initial state
const initialState = getInitialState();

// Action types
const ACTION_TYPES = {
  SET_CURRENT_MESSAGE: 'SET_CURRENT_MESSAGE',
  SET_CURRENT_SECTION: 'SET_CURRENT_SECTION',
  ADD_USER_MESSAGE: 'ADD_USER_MESSAGE',
  ADD_AI_MESSAGE: 'ADD_AI_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  IMPORT_MESSAGES: 'IMPORT_MESSAGES',
  RESET_CHAT: 'RESET_CHAT'
};

// Reducer
function chatReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_CURRENT_MESSAGE:
      return {
        ...state,
        currentMessage: action.payload
      };
      
    case ACTION_TYPES.SET_CURRENT_SECTION:
      return {
        ...state,
        currentSectionId: action.payload
      };
      
    case ACTION_TYPES.ADD_USER_MESSAGE: {
      const { sectionId, content } = action.payload;
      const sectionMessages = state.messages[sectionId] || [];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [sectionId]: [
            ...sectionMessages,
            { role: 'user', content, timestamp: Date.now() }
          ]
        },
        currentMessage: '' // Clear input after sending
      };
    }
    
    case ACTION_TYPES.ADD_AI_MESSAGE: {
      const { sectionId, content } = action.payload;
      const sectionMessages = state.messages[sectionId] || [];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [sectionId]: [
            ...sectionMessages,
            { role: 'assistant', content, timestamp: Date.now() }
          ]
        }
      };
    }
    
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ACTION_TYPES.CLEAR_MESSAGES: {
      const { sectionId } = action.payload;
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [sectionId]: []
        }
      };
    }
    
    case ACTION_TYPES.IMPORT_MESSAGES:
      return {
        ...state,
        messages: action.payload || {}
      };
      
    case ACTION_TYPES.RESET_CHAT:
      return {
        ...initialState,
        currentSectionId: state.currentSectionId // Preserve current section
      };
      
    default:
      return state;
  }
}

// Create context
const ChatContext = createContext();

// Provider component
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Save chat messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('paperPlannerChat', JSON.stringify(state.messages));
    } catch (error) {
      console.warn('Error saving chat messages to localStorage:', error);
    }
  }, [state.messages]);
  
  // Listen for storage reset events
  useEffect(() => {
    const handleStorageReset = () => {
      dispatch({ type: ACTION_TYPES.RESET_CHAT });
    };
    
    window.addEventListener('storageReset', handleStorageReset);
    return () => window.removeEventListener('storageReset', handleStorageReset);
  }, []);
  
  // Actions
  const actions = {
    setCurrentMessage: (message) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_MESSAGE, payload: message });
    },
    
    setCurrentSection: (sectionId) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_SECTION, payload: sectionId });
    },
    
    sendMessage: async (content = null, userInputs = {}, sectionContent = {}) => {
      const messageContent = content || state.currentMessage;
      if (!messageContent.trim() || !state.currentSectionId) return;
      
      // Add user message
      dispatch({
        type: ACTION_TYPES.ADD_USER_MESSAGE,
        payload: {
          sectionId: state.currentSectionId,
          content: messageContent
        }
      });
      
      // Set loading state
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      try {
        // Find section data for context
        const currentSectionObj = sectionContent.sections?.find(s => s.id === state.currentSectionId);
        
        // Get necessary context for the prompt
        const sectionTitle = currentSectionObj?.title || 'section';
        const instructionsText = currentSectionObj?.instructions?.text || '';
        const feedbackText = currentSectionObj?.instructions?.feedback || '';
        const userContent = userInputs[state.currentSectionId] || '';
        
        // Build system prompt
        const systemPrompt = buildSystemPrompt('chat', {
          sectionTitle,
          instructionsText,
          feedbackText,
          userContent: userContent || "They haven't written anything substantial yet."
        });
        
        // Get chat history
        const historyForApi = state.messages[state.currentSectionId] || [];
        
        // Call the OpenAI API
        const response = await callOpenAI(
          messageContent,
          state.currentSectionId,
          userInputs,
          sectionContent.sections || [],
          { temperature: 0.9 },
          historyForApi,
          systemPrompt,
          false
        );
        
        // Add AI response
        dispatch({
          type: ACTION_TYPES.ADD_AI_MESSAGE,
          payload: {
            sectionId: state.currentSectionId,
            content: response
          }
        });
      } catch (error) {
        console.error('Error sending chat message:', error);
        
        // Add error message from AI
        dispatch({
          type: ACTION_TYPES.ADD_AI_MESSAGE,
          payload: {
            sectionId: state.currentSectionId,
            content: "I'm sorry, I encountered an error. Could you please try again or rephrase your question?"
          }
        });
      } finally {
        // Clear loading state
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      }
    },
    
    clearMessages: (sectionId) => {
      dispatch({
        type: ACTION_TYPES.CLEAR_MESSAGES,
        payload: { sectionId }
      });
    },
    
    resetChat: () => {
      dispatch({ type: ACTION_TYPES.RESET_CHAT });
    }
  };
  
  // Get messages for current section
  const currentSectionMessages = state.messages[state.currentSectionId] || [];
  
  return (
    <ChatContext.Provider value={{ 
      state, 
      dispatch, 
      actions,
      currentMessage: state.currentMessage,
      currentSectionId: state.currentSectionId,
      currentSectionMessages,
      allMessages: state.messages,
      loading: state.loading
    }}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook for consuming the context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return {
    // State
    currentMessage: context.currentMessage,
    currentSectionId: context.currentSectionId,
    messages: context.currentSectionMessages,
    allMessages: context.allMessages,
    loading: context.loading,
    
    // Actions
    setCurrentMessage: context.actions.setCurrentMessage,
    setCurrentSection: context.actions.setCurrentSection,
    sendMessage: context.actions.sendMessage,
    clearMessages: context.actions.clearMessages,
    resetChat: context.actions.resetChat
  };
}
