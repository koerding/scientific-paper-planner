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

  // Console logging (can be removed once stable)
  useEffect(() => {
    console.log('[ModernChatInterface] Props Received:', { /* ... props ... */ });
  }, [/* ... dependencies ... */]);

  // Scroll to bottom effect (unchanged)
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]);

  // Section tracking effect (unchanged)
  useEffect(() => {
    if (currentSection && currentSection !== previousSectionRef.current) {
      previousSectionRef.current = currentSection;
    }
  }, [currentSection]);

  // Format time (unchanged)
  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Toggle chat visibility (unchanged)
  const toggleChat = () => {
    if (!currentSection) { console.warn("[ModernChatInterface] Cannot toggle chat - currentSection ID is invalid."); return; }
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (!newState) { trackPageView(`/chat/${currentSection}`); trackChatInteraction(currentSection, chatMessages?.[currentSection]?.length || 0); }
  };

  // Send message wrapper (unchanged)
  const handleSendMessageWithTracking = () => {
     if (!currentSection || loading || currentMessage.trim() === '') return;
     trackChatInteraction(currentSection, (chatMessages?.[currentSection]?.length || 0) + 1);
     handleSendMessage();
   };

  const showChatHighlight = onboardingStep === 3;
  const safeChatMessages = chatMessages?.[currentSection] || [];

  // Early return check (unchanged)
  if (!currentSection || !currentSectionData) {
     console.warn(`[ModernChatInterface] Rendering suspended - missing currentSection (${currentSection}) or currentSectionData (${!!currentSectionData})`);
     return null;
   }

  // --- Render (only if currentSection and currentSectionData are valid) ---
  return (
    <>
      {/* Minimized Chat Icon Button (unchanged) */}
       {isMinimized && ( <div /* ... icon button JSX ... */ ></div> )}

      {/* Expanded chat interface */}
      <div
        className={`fixed shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{ // <<< CORRECTION HERE: Removed invalid comment
          bottom: '0',
          right: '0',
          width: 'min(950px, 95vw)',
          height: 'min(600px, 75vh)',
          transform: isMinimized ? 'translateZ(0) translateY(20px)' : 'translateZ(0)',
          maxHeight: 'calc(100vh - 48px)',
          zIndex: 1000
        }}
      >
        {/* Chat header (unchanged) */}
        <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center chat-header">
          {/* ... header content ... */}
           <div className="flex items-center">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">AI</div>
             <h3 className="font-medium text-lg truncate pr-2">
               AI Research Assistant - Talk about {currentSectionTitle || 'Current Section'}
             </h3>
           </div>
           <button onClick={toggleChat} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Minimize chat">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </button>
        </div>

        {/* Chat messages container (unchanged) */}
        <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}>
          {/* ... messages rendering logic ... */}
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
             {/* Render messages or placeholder */}
              {safeChatMessages.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      {/* Placeholder content */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">Ask a question about your {currentSectionTitle || 'research'}</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {/* Message mapping */}
                      {safeChatMessages.map((msg, index) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                              {/* Message bubble structure */}
                              <div className={`message-bubble ${msg.role === 'user' ? 'user-message' : 'ai-message-purple'} max-w-3xl`}>
                                  {/* Timestamp/Role */}
                                  <div className="text-sm mb-1 opacity-75">{msg.role === 'user' ? 'You' : 'AI Assistant'} • {formatTime()}</div>
                                  {/* Content */}
                                  <div className={`message-content ${msg.role === 'user' ? 'text-white' : 'text-purple-700'}`}>
                                      {msg.role === 'user' ? ( <p className="whitespace-pre-wrap">{msg.content}</p> ) : ( <div className="prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> )}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {/* Loading indicator */}
                      {loading && (
                          <div className="flex justify-start mb-2">
                              {/* Loading bubble structure */}
                              <div className="message-bubble ai-message-purple max-w-3xl">
                                  <div className="text-sm mb-1 opacity-75">AI Assistant • {formatTime()}</div>
                                  <div className="message-content text-purple-700 flex items-center">
                                      <div className="typing-indicator"><span></span><span></span><span></span></div>
                                      <span className="ml-2 text-purple-700">Thinking...</span>
                                  </div>
                              </div>
                          </div>
                      )}
                      <div ref={messagesEndRef} />
                  </div>
              )}
           </div>


          {/* Chat input (unchanged) */}
           <div className="p-3 border-t border-gray-200 bg-white">
                {/* Input field and send button */}
                <div className="flex">
                   <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ask a question..." onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessageWithTracking()} disabled={loading} />
                   <button onClick={handleSendMessageWithTracking} disabled={loading || currentMessage.trim() === ''} className={`px-3 py-2 rounded-r-lg transition-colors ${loading || currentMessage.trim() === '' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} aria-label="Send message" >
                       {loading ? ( /* Loading SVG */ <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : ( /* Send SVG */ <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> )}
                   </button>
                 </div>
           </div>
        </div>

      {/* Inline styles (unchanged) */}
      <style jsx>{` /* CSS unchanged */ `}</style>
    </div>
  </>
  );
};

export default ModernChatInterface;
