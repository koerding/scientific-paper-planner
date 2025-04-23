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
    // console.log('[ModernChatInterface] Props Update:', { /* ... props ... */ });
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
  const safeChatMessages = currentSection && chatMessages?.[currentSection] ? chatMessages[currentSection] : [];

  // Early return check (unchanged)
  if (!currentSection || !currentSectionData) {
     // console.warn(`[ModernChatInterface] Rendering suspended - missing currentSection (${currentSection}) or currentSectionData (${!!currentSectionData})`);
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
             onClick={loading ? null : toggleChat}
             disabled={loading}
             // --- MODIFIED HERE: Changed py-5 to py-4 ---
             className={`flex items-center justify-center px-4 py-4 rounded-full shadow-lg transition-colors text-white font-medium ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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

      {/* Expanded chat interface (Code unchanged from previous version) */}
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
        {/* Conditional Rendering Check */}
        {currentSection && currentSectionData ? (
            <>
              {/* Chat header */}
              <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center chat-header">
                 {/* ... header content ... */}
              </div>
              {/* Chat messages container */}
              <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}>
                 {/* ... messages rendering logic ... */}
                 {/* Chat input */}
                 <div className="p-3 border-t border-gray-200 bg-white">
                     {/* ... input field and button ... */}
                  </div>
              </div>
            </>
        ) : (
            <div className="p-4 text-center text-gray-500">Loading section data...</div>
        )}
      </div>

      {/* Inline styles (unchanged) */}
      <style jsx>{` /* CSS unchanged */ `}</style>
    </>
  );
};

export default ModernChatInterface;
