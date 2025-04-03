import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import '../../styles/PaperPlanner.css';

/**
 * Modernized chat interface that can be minimized to a floating button
 */
const ModernChatInterface = ({
  currentSection,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change or chat is opened
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]);

  // Format timestamp for messages
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Toggle chat window visibility
  const toggleChat = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Minimized chat icon */}
      <div 
        className={`fixed bottom-6 right-6 z-50 ${isMinimized ? 'visible' : 'hidden'}`}
        onClick={toggleChat}
      >
        <div className="w-16 h-16 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Expanded chat interface */}
      <div 
        className={`fixed bottom-0 right-6 w-full sm:w-96 md:w-1/3 z-40 transition-transform duration-300 shadow-lg ${
          isMinimized ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{ height: '50vh', maxWidth: 'calc(100% - 3rem)' }}
      >
        {/* Chat header */}
        <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
              AI
            </div>
            <h3 className="font-medium text-lg">Research Assistant</h3>
          </div>
          <button 
            onClick={toggleChat}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Chat messages */}
        <div className="bg-gray-50 flex flex-col h-full">
          <div className="flex-grow overflow-y-auto p-4">
            {!currentSection || !chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-gray-700 mb-1">Your AI Research Assistant</h4>
                <p className="text-gray-500 text-base">
                  I'll help you develop your research project. Click "Mark Complete" when you're ready for feedback!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages[currentSection].map((message, index) => {
                  const isUser = message.role === 'user';
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-3/4 ${isUser ? 'order-2' : 'order-1'}`}>
                        {/* Avatar for assistant messages */}
                        {!isUser && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1 mx-1">
                            AI
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div 
                          className={`rounded-lg px-3 py-2 inline-block ${
                            isUser 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-white border border-gray-200 rounded-tl-none shadow-sm'
                          }`}
                        >
                          {/* Message content */}
                          {isUser ? (
                            <div className="whitespace-pre-line text-base">{message.content}</div>
                          ) : (
                            <div className="prose prose-sm max-w-none text-base text-gray-700">
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                          
                          {/* Timestamp */}
                          <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200 text-right' : 'text-gray-400'}`}>
                            {formatTime()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-4 py-3 inline-block border border-gray-200 rounded-tl-none shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Chat input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ask a question about your research..."
                onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || currentMessage.trim() === ''}
                className={`px-3 py-2 rounded-r-lg ${
                  loading || currentMessage.trim() === ''
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernChatInterface;
