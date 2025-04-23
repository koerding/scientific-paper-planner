// FILE: src/components/chat/ModernChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { trackChatInteraction, trackPageView } from '../../utils/analyticsUtils';
import '../../styles/PaperPlanner.css'; // Ensure styles are imported

const ModernChatInterface = ({
  currentSection, // Section ID string
  currentSectionTitle, // Title string
  chatMessages, // Object like { sectionId: [messages] }
  currentMessage, // String for input
  setCurrentMessage, // Function to update input
  handleSendMessage, // Function to send message
  loading, // Boolean for thinking indicator
  currentSectionData, // The full section object (can be null/undefined initially)
  onboardingStep // Optional onboarding step number
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null);

  // Add console logging to check props on render
  useEffect(() => {
    console.log('[ModernChatInterface] Props Received:', {
        currentSection,
        currentSectionTitle,
        hasChatMessages: !!chatMessages,
        currentMessageDefined: typeof currentMessage !== 'undefined',
        loading,
        currentSectionDataExists: !!currentSectionData,
        currentSectionData // Log the actual data object
    });
  }, [currentSection, currentSectionTitle, chatMessages, currentMessage, loading, currentSectionData]);


  // Scroll to bottom effect
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]);

  // Section tracking effect
  useEffect(() => {
    if (currentSection && currentSection !== previousSectionRef.current) {
      previousSectionRef.current = currentSection;
    }
  }, [currentSection]);

  // Format time
  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Toggle chat visibility
  const toggleChat = () => {
    // Basic check: Ensure currentSection ID is valid before tracking
    if (!currentSection) {
        console.warn("[ModernChatInterface] Cannot toggle chat - currentSection ID is invalid.");
        // Optionally, still toggle the UI state but skip tracking
        // setIsMinimized(!isMinimized);
        return;
     }
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (!newState) {
      trackPageView(`/chat/${currentSection}`);
      trackChatInteraction(currentSection, chatMessages?.[currentSection]?.length || 0);
    }
  };

  // Send message wrapper
  const handleSendMessageWithTracking = () => {
     // Basic check: Ensure currentSection ID is valid before tracking/sending
     if (!currentSection || loading || currentMessage.trim() === '') return;
     trackChatInteraction(currentSection, (chatMessages?.[currentSection]?.length || 0) + 1);
     handleSendMessage();
   };

  const showChatHighlight = onboardingStep === 3;
  const safeChatMessages = chatMessages?.[currentSection] || [];

  // --- !!! ADDED CHECK !!! ---
  // If essential data like the section ID or the data object itself is missing,
  // render nothing or a placeholder to prevent runtime errors.
  if (!currentSection || !currentSectionData) {
     console.warn(`[ModernChatInterface] Rendering suspended - missing currentSection (<span class="math-inline">\{currentSection\}\) or currentSectionData \(</span>{!!currentSectionData})`);
     // Optionally return a minimal placeholder for the icon if needed,
     // but returning null is safer to avoid errors in the expanded view.
     // For now, let's return null entirely if core data is missing.
     return null;
   }

  // --- Render (only if currentSection and currentSectionData are valid) ---
  return (
    <>
      {/* Minimized Chat Icon Button */}
       {isMinimized && (
         <div
           className={`fixed bottom-6 right-6 z-50 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`}
           style={{ transform: 'translateZ(0)' }}
         >
           <button
             onClick={loading ? null : toggleChat} // Use the guarded toggleChat
             disabled={loading}
             className={`flex items-center justify-center px-4 py-5 rounded-full shadow-lg transition-colors text-white font-medium ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
             title="Ask AI for help on this section"
             aria-label="Open chat"
           >
             {loading ? ( /* Loading SVG */ <><svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</> ) :
             ( /* Default Icon */ <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor
