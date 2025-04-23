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

  // Prop check logging (keep for debugging if needed)
  useEffect(() => {
    console.log('[ModernChatInterface] Props Update:', { /* ... props ... */ });
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
  // Use safe default for messages, handle potential missing section ID
  const safeChatMessages = currentSection && chatMessages?.[currentSection] ? chatMessages[currentSection] : [];

  // --- Render ---
  // REMOVED the overly broad early return check from here

  return (
    <>
      {/* Minimized Chat Icon Button - Should always render */}
       {isMinimized && (
         <div
           className={`fixed bottom-6 right-6 z-50 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`}
           style={{ transform: 'translateZ(0)' }}
         >
           <button
             onClick={loading ? null : toggleChat}
             disabled={loading}
             className={`flex items-center justify-center px-4 py-5 rounded-full shadow-lg transition-colors text-white font-medium ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
             title="Ask AI for help on this section"
             aria-label="Open chat"
           >
                {/* Minimized Button Content (Loading/Default Icons) */}
                {loading ? ( <><svg className="animate-spin h-5 w-5 mr-2" /*...*/></svg>Processing...</> ) :
                ( <><svg xmlns="http://www.w3.org/2000/svg" /*...*/></svg>Let's talk about this</> )}
           </button>
           {showChatHighlight && (<div className="onboarding-tooltip onboarding-tooltip-chat">Stuck? Ask AI for help anytime.</div>)}
         </div>
       )}

      {/* Expanded chat interface - Conditionally render based on isMinimized */}
      <div
        className={`fixed shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{ /* Styles unchanged */
            bottom: '0', right: '0', width: 'min(950px, 95vw)', height: 'min(600px, 75vh)',
            transform: isMinimized ? 'translateZ(0) translateY(20px)' : 'translateZ(0)',
            maxHeight: 'calc(100vh - 48px)', zIndex: 1000
        }}
      >
        {/* --- ADDED CHECK HERE --- */}
        {/* Only render header/body/input if we have the necessary section info */}
        {currentSection && currentSectionData ? (
            <>
              {/* Chat header */}
              <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center chat-header">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">AI</div>
                  <h3 className="font-medium text-lg truncate pr-2">
                    AI Research Assistant - Talk about {currentSectionTitle || currentSectionData.title || 'Current Section'} {/* Use data title as fallback */}
                  </h3>
                </div>
                <button onClick={toggleChat} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Minimize chat">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              {/* Chat messages container */}
              <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}>
                <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                  {/* Render messages or placeholder */}
                  {safeChatMessages.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                       <p className="text-lg">No messages yet</p>
                       <p className="text-sm">Ask a question about your {currentSectionTitle || currentSectionData.title || 'research'}</p>
                     </div>
                  ) : (
                    <div className="space-y-3">
                        {/* Render messages */}
                        {safeChatMessages.map((msg, index) => ( /* Message rendering logic */ <div key={index} /* ... */></div> ))}
                        {/* Thinking indicator */}
                        {loading && ( <div /* ... */ ></div> )}
                       <div ref={messagesEndRef} />
                     </div>
                  )}
                </div>

                {/* Chat input */}
                 <div className="p-3 border-t border-gray-200 bg-white">
                    {/* Input field and send button */}
                     <div className="flex">
                        <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ask a question..." onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessageWithTracking()} disabled={loading} />
                        <button onClick={handleSendMessageWithTracking} disabled={loading || currentMessage.trim() === ''} className={`px-3 py-2 rounded-r-lg transition-colors ${loading || currentMessage.trim() === '' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} aria-label="Send message" >
                            {loading ? ( /* Loading SVG */ <svg className="animate-spin h-5 w-5" /*...*/></svg> ) : ( /* Send SVG */ <svg xmlns="http://www.w3.org/2000/svg" /*...*/></svg> )}
                        </button>
                      </div>
                 </div>
              </div>
            </>
        ) : (
            // Optional: Render a minimal loading state or placeholder inside the expanded view if data is missing
            <div className="p-4 text-center text-gray-500">Loading section data...</div>
        )}
      </div>

      {/* Inline styles (unchanged) */}
      <style jsx>{` /* CSS unchanged */ `}</style>
    </>
  );
};

export default ModernChatInterface;
