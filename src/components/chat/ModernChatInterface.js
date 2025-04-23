// FILE: src/components/chat/ModernChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { trackChatInteraction, trackPageView } from '../../utils/analyticsUtils';
import '../../styles/PaperPlanner.css'; // Ensure styles are imported

// Component now relies entirely on props passed down, originating from Zustand store
const ModernChatInterface = ({
  currentSection, // Section ID string (currentChatSectionId from store)
  currentSectionTitle, // Title string
  chatMessages, // Object like { sectionId: [messages] } (from store)
  currentMessage, // String for input (from store)
  setCurrentMessage, // Function/action from store
  handleSendMessage, // Async function/action from store
  loading, // Boolean chat loading state (from store)
  currentSectionData, // Full section object for context (from store)
  onboardingStep // Optional onboarding step number (from store if needed)
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null); // Tracks section for analytics

  // Scroll to bottom effect
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]); // Depend on chatMessages from props

  // Section tracking effect (for analytics)
  useEffect(() => {
    if (currentSection && currentSection !== previousSectionRef.current) {
      console.log(`[ModernChatInterface] Switched to section: ${currentSection}`);
      previousSectionRef.current = currentSection;
      // If opening the chat, trigger analytics
      if (!isMinimized) {
          trackPageView(`/chat/${currentSection}`);
          // Note: tracking message count on open might be less accurate now,
          // maybe track on send instead.
          trackChatInteraction(currentSection, chatMessages?.[currentSection]?.length || 0);
      }
    }
  }, [currentSection, isMinimized, chatMessages]); // Depend on props

  // Format time (unchanged)
  const formatTime = (timestamp) => timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Toggle chat visibility
  const toggleChat = () => {
    if (!currentSection) { console.warn("[ModernChatInterface] Cannot toggle chat - currentSection ID is invalid."); return; }
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (!newState) { // Track opening event
        trackPageView(`/chat/${currentSection}`);
        trackChatInteraction(currentSection, chatMessages?.[currentSection]?.length || 0);
    }
  };

  // Send message wrapper (uses handleSendMessage prop from store)
  const handleSendMessageWithTracking = () => {
     if (!currentSection || loading || currentMessage.trim() === '') return;
     trackChatInteraction(currentSection, (chatMessages?.[currentSection]?.length || 0) + 1);
     handleSendMessage(); // Call the action passed via props
   };

  const handleInputChange = (e) => {
      setCurrentMessage(e.target.value); // Call action passed via props
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && currentMessage.trim() !== '' && !loading) {
          e.preventDefault();
          handleSendMessageWithTracking();
      }
  };


  // Prepare data for rendering
  const showChatHighlight = onboardingStep === 3;
  // Ensure safe access to messages for the current section
  const safeChatMessages = (currentSection && chatMessages && chatMessages[currentSection]) ? chatMessages[currentSection] : [];

  // Early return check (unchanged) - check for valid section context
   if (!currentSection) {
      console.warn(`[ModernChatInterface] Rendering suspended - missing currentSection ID.`);
      return null; // Don't render chat if no section is active
   }
   // Keep showing chat button even if section data is loading? Or hide? For now, show button.
   // if (!currentSectionData) { console.warn(`[ModernChatInterface] Rendering suspended - missing currentSectionData for ${currentSection}.`); return null; }


  // --- Render ---
  return (
    <>
      {/* Minimized Chat Icon Button */}
       {isMinimized && (
         <div
           className={`fixed bottom-6 right-6 z-[1001] ${loading ? 'cursor-wait' : 'cursor-pointer'} ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`} // Increased z-index slightly
           style={{ transform: 'translateZ(0)' }} // Hardware acceleration hint
         >
           <button
             onClick={loading ? null : toggleChat}
             disabled={loading}
             className={`flex items-center justify-center px-4 py-3 rounded-full shadow-lg transition-colors text-white font-medium ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
             title={`Ask AI for help on ${currentSectionTitle || 'current section'}`}
             aria-label="Open chat"
           >
                {/* Minimized Button Content */}
                {loading ? ( /* Loading spinner */ <div className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2" /*...*/></svg><span>Processing...</span></div>)
                         : ( /* Default icon/text */ <div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" /*...*/></svg><span>Let's talk about {currentSectionTitle || 'this section'}</span></div>)}
           </button>
           {showChatHighlight && (<div className="onboarding-tooltip onboarding-tooltip-chat">Stuck? Ask AI for help anytime.</div>)}
         </div>
       )}

      {/* Expanded chat interface */}
      <div
        className={`fixed shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{ bottom: '0', right: '0', width: 'min(950px, 95vw)', height: 'min(600px, 75vh)', maxHeight: 'calc(100vh - 48px)', zIndex: 1000 }}
      >
        {/* Conditional Rendering Check */}
        {currentSection ? ( // Only need currentSection ID to show header/input
            <>
              {/* Chat header */}
              <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center chat-header flex-shrink-0">
                 <h3 className="text-lg font-semibold text-white">AI Chat: {currentSectionTitle || 'Current Section'}</h3>
                 <button onClick={toggleChat} className="text-indigo-200 hover:text-white focus:outline-none" aria-label="Minimize chat"> {/* Minimize Icon */} <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg></button>
              </div>
              {/* Chat messages container */}
              <div className="flex flex-col h-full overflow-hidden"> {/* Ensure parent takes height */}
                  {/* Messages Area - Make this scrollable */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
                     {safeChatMessages.map((msg, index) => (
                         <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.role === 'assistant' && <div className="ai-avatar mr-2 flex-shrink-0">AI</div>}
                             <div className={`message-bubble ${msg.role === 'user' ? 'user-message' : (msg.content.startsWith("I'm sorry") ? 'ai-message ai-message-error' : 'ai-message')}`}>
                                 <div className="prose prose-sm max-w-none message-content">
                                     <ReactMarkdown
                                        components={{ // Ensure links open in new tabs
                                            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer"/>
                                        }}
                                     >
                                        {msg.content}
                                     </ReactMarkdown>
                                 </div>
                                 <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
                                    {formatTime(msg.timestamp)}
                                 </div>
                             </div>
                             {msg.role === 'user' && <div className="user-avatar ml-2 flex-shrink-0">You</div>}
                         </div>
                     ))}
                     {loading && (
                         <div className="flex justify-start items-center">
                             <div className="ai-avatar mr-2 flex-shrink-0">AI</div>
                             <div className="typing-indicator"><span></span><span></span><span></span></div>
                         </div>
                     )}
                     <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
                  </div>
                 {/* Chat input */}
                 <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                     <div className="flex items-center space-x-2">
                         <textarea
                             value={currentMessage}
                             onChange={handleInputChange}
                             onKeyDown={handleKeyDown}
                             placeholder={`Ask about ${currentSectionTitle || 'this section'}... (Shift+Enter for newline)`}
                             className="flex-grow p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                             rows="1"
                             style={{ maxHeight: '80px', overflowY: 'auto' }} // Limit height
                             disabled={loading}
                         />
                         <button
                             onClick={handleSendMessageWithTracking}
                             disabled={loading || currentMessage.trim() === ''}
                             className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                                 (loading || currentMessage.trim() === '')
                                     ? 'bg-indigo-300 cursor-not-allowed'
                                     : 'bg-indigo-600 hover:bg-indigo-700'
                             }`}
                             aria-label="Send message"
                         >
                             Send
                         </button>
                     </div>
                  </div>
              </div>
            </>
        ) : (
            <div className="p-4 text-center text-gray-500">Select a section to start chatting.</div>
        )}
      </div>

      {/* Inline styles - simplified */}
      <style jsx>{`
        .ai-avatar { width: 2rem; height: 2rem; background-color: #e0e7ff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #4f46e5; }
        .user-avatar { width: 2rem; height: 2rem; background-color: #d1d5db; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #4b5563; font-size: 0.75rem; }
        .message-bubble { border-radius: 0.75rem; padding: 0.75rem 1rem; display: inline-block; max-width: 85%; margin-bottom: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .user-message { background-color: #4f46e5; color: white; border-bottom-right-radius: 0; }
        .ai-message { background-color: white; border: 1px solid #e5e7eb; border-top-left-radius: 0; }
        .ai-message-error { background-color: #fee2e2; border-color: #fecaca; }
        .message-content { word-break: break-word; }
        .message-content :global(p) { margin-bottom: 0.5em; } /* Add space between paragraphs in markdown */
        .message-content :global(ul), .message-content :global(ol) { margin-left: 1.2em; margin-bottom: 0.5em; }
        .message-content :global(a) { color: #2563eb; text-decoration: underline; }
        .typing-indicator { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; background-color: #f3f4f6; border-radius: 0.75rem; }
        .typing-indicator span { height: 6px; width: 6px; margin: 0 2px; background-color: #6366F1; border-radius: 50%; display: inline-block; opacity: 0.6; animation: typing 1s infinite ease-in-out; }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0%, 100% { transform: translateY(0px); opacity: 0.6; } 50% { transform: translateY(-4px); opacity: 1; } }
      `}</style>
    </>
  );
};

export default ModernChatInterface;
