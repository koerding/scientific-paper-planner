import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Modern chat interface with bubble design and animations
 * Updated to support both original and enhanced layouts
 */
const ModernChatInterface = ({
  currentSection,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading,
  researchApproach, // Research approach prop
  enhancedLayout = false // Whether using enhanced layout
}) => {
  // Reference for auto-scrolling
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, currentSection]);

  // Format timestamp
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get approach-specific greeting
  const getApproachGreeting = () => {
    if (!researchApproach) {
      return "I'll help you develop your research project.";
    }
    
    switch(researchApproach) {
      case 'hypothesis':
        return "I'll help you develop your hypothesis-driven research project.";
      case 'exploratory':
        return "I'll help you develop your exploratory research project.";
      case 'needs':
        return "I'll help you develop your needs-driven research project.";
      default:
        return "I'll help you develop your research project.";
    }
  };

  // Get approach-specific tips
  const getApproachTips = () => {
    if (!researchApproach) {
      return "Ask about methodology, literature recommendations, or feedback on your current section";
    }
    
    switch(researchApproach) {
      case 'hypothesis':
        return "Ask about hypothesis formulation, experimental design, or competing theories";
      case 'exploratory':
        return "Ask about data collection strategies, pattern detection, or generating future hypotheses";
      case 'needs':
        return "Ask about stakeholder requirements, solution approaches, or evaluation methods";
      default:
        return "Ask about methodology, literature recommendations, or feedback on your current section";
    }
  };

  // For enhanced layout, we don't need the container since it's already provided
  if (enhancedLayout) {
    return (
      <>
        {/* Chat messages area */}
        <div className="h-96 overflow-y-auto mb-4">
          {!chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Your AI Research Assistant</h4>
              <p className="text-gray-500 max-w-md">
                {getApproachGreeting()} Click "MARK COMPLETE" when you're ready for initial feedback, 
                or ask me a specific question below!
              </p>
              {researchApproach && (
                <div className="mt-4 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">Current approach:</span> {
                      researchApproach === 'hypothesis' ? 'Hypothesis-Driven Research' :
                      researchApproach === 'exploratory' ? 'Exploratory Research' :
                      researchApproach === 'needs' ? 'Needs-Driven Research' : 'Research'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1 mx-2">
                          AI
                        </div>
                      )}
                      
                      {/* Message bubble */}
                      <div 
                        className={`rounded-2xl px-4 py-3 inline-block ${
                          isUser 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white border border-gray-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {/* Message content */}
                        {isUser ? (
                          <div className="whitespace-pre-line text-sm">{message.content}</div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <div 
                          className={`text-xs mt-1 ${
                            isUser ? 'text-indigo-200 text-right' : 'text-gray-400'
                          }`}
                        >
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
                  <div className="bg-white rounded-2xl px-4 py-3 inline-block border border-gray-200 rounded-tl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef}></div>
            </div>
          )}
        </div>
        
        {/* Chat input */}
        <div className="flex items-center">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Ask a question about your ${researchApproach || 'research'} design...`}
            onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || currentMessage.trim() === ''}
            className={`px-4 py-3 rounded-r-lg ${
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
        
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>{getApproachTips()}</span>
        </div>
      </>
    );
  }

  // Original layout
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
            AI
          </div>
          <div>
            <h3 className="font-medium">AI Feedback</h3>
            <p className="text-xs text-indigo-100">This tool highlights strengths & weaknesses - you decide what feedback to use</p>
          </div>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="bg-gray-50 p-4 h-96 overflow-y-auto">
        {!chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">Your AI Research Assistant</h4>
            <p className="text-gray-500 max-w-md">
              {getApproachGreeting()} Click "Mark First Version Complete" above 
              when you're ready for initial feedback, or ask me a specific question below!
            </p>
            {researchApproach && (
              <div className="mt-4 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Current approach:</span> {
                    researchApproach === 'hypothesis' ? 'Hypothesis-Driven Research' :
                    researchApproach === 'exploratory' ? 'Exploratory Research' :
                    researchApproach === 'needs' ? 'Needs-Driven Research' : 'Research'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
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
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1 mx-2">
                        AI
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div 
                      className={`rounded-2xl px-4 py-3 inline-block ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Message content */}
                      {isUser ? (
                        <div className="whitespace-pre-line text-sm">{message.content}</div>
                      ) : (
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <div 
                        className={`text-xs mt-1 ${
                          isUser ? 'text-indigo-200 text-right' : 'text-gray-400'
                        }`}
                      >
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
                <div className="bg-white rounded-2xl px-4 py-3 inline-block border border-gray-200 rounded-tl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef}></div>
          </div>
        )}
      </div>
      
      {/* Chat input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Ask a question about your ${researchApproach || 'research'} design...`}
            onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || currentMessage.trim() === ''}
            className={`px-4 py-2 rounded-r-lg ${
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
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>{getApproachTips()}</span>
        </div>
      </div>
    </div>
  );
};

export default ModernChatInterface;
