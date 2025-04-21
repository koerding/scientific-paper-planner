// FILE: src/hooks/useChat.js

/**
 * Hook for managing chat functionality
 */
import { useState, useCallback } from 'react';
import { callOpenAI } from '../services/openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';

export const useChat = (userInputs, chatMessages, setChatMessages, currentSection, sectionContent) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Modernized send message handler
  const handleSendMessage = useCallback(async (overrideMessage = null) => {
    const messageToSend = overrideMessage || currentMessage;
    
    if (!messageToSend.trim() || !currentSection) return;

    // Add user message to chat state
    const newUserMessage = { role: 'user', content: messageToSend };
    setChatMessages(prevMessages => ({
        ...prevMessages,
        [currentSection]: [...(prevMessages[currentSection] || []), newUserMessage]
    }));
    setCurrentMessage('');

    setLoading(true);

    try {
      // Find the section data for context
      const sectionsForContext = sectionContent?.sections || [];
      const currentSectionObj = sectionsForContext.find(s => s && s.id === currentSection) || {};
      
      // Get instructions text
      const instructionsText = currentSectionObj.instructions?.text || '';
      const feedbackText = currentSectionObj.instructions?.feedback || '';
      
      // Get user's current content for this section
      const userContent = userInputs[currentSection] || '';
      
      // Generate system prompt
      const systemPrompt = buildSystemPrompt('chat', {
        sectionTitle: currentSectionObj.title || 'Research',
        instructionsText,
        feedbackText,
        userContent: userContent || "They haven't written anything substantial yet."
      });
      
      // Get chat history
      const historyForApi = chatMessages[currentSection] || [];
      
      // For chat, don't use JSON mode
      const response = await callOpenAI(
        messageToSend,            // User's message
        currentSection,           // Context type (section ID)
        userInputs,               // All user inputs for broader context
        sectionsForContext,       // Section definitions for context
        { temperature: 0.9 },     // Higher temperature for more creative questions
        historyForApi,            // Chat history for the current section
        systemPrompt,             // The system prompt built with promptUtils
        false                     // Don't use JSON mode for chat
      );
      
      // Add the assistant's response
      const newAssistantMessage = { role: 'assistant', content: response };
      
      setChatMessages(prevMessages => {
        const currentMessages = prevMessages[currentSection] || [];
        return {
          ...prevMessages,
          [currentSection]: [...currentMessages, newAssistantMessage]
        };
      });
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Handle error gracefully
      const errorMessage = { 
        role: 'assistant', 
        content: `I encountered a technical issue. What would you like to know about your research?` 
      };
      
      setChatMessages(prevMessages => {
        const currentMessages = prevMessages[currentSection] || [];
        return {
          ...prevMessages,
          [currentSection]: [...currentMessages, errorMessage]
        };
      });
    } finally {
      setLoading(false);
    }
  }, [currentMessage, currentSection, sectionContent, setChatMessages, userInputs, chatMessages]);

  // Check if a message can be sent
  const canSendMessage = currentMessage.trim() !== '' && !loading;

  return {
    currentMessage,
    setCurrentMessage,
    loading,
    handleSendMessage,
    canSendMessage
  };
};
