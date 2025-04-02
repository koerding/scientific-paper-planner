import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * AIChatPanel provides the chat interface with AI assistant
 * Takes up 25% of the right panel
 */
const AIChatPanel = ({
  currentSection,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading,
  formatTime
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #E5E7EB', /* border-gray-200 */
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      height: 'calc(25%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="bg-indigo-600 text-white px-4 py-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
            AI
          </div>
          <h3 className="font-medium">AI Research Assistant</h3>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100% - 56px)' /* Subtract header height */
      }}>
        {/* Chat messages area */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {!currentSection || !chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="text-base font-medium text-gray-700 mb-1">Your AI Research Assistant</h4>
              <p className="text-gray-500 text-sm">
                I'll help you develop your hypothesis-driven research project. Click "Mark Complete" when you're ready for feedback!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentSection && chatMessages[currentSection].map((message, index) => {
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
                          <div className="whitespace-pre-line text-sm">{message.content}</div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-gray-700">
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
            </div>
          )}
        </div>
        
        {/* Chat input */}
        <div style={{
          marginTop: 'auto',
          padding: '1rem',
          borderTop: '1px solid #E5E7EB', /* border-gray-200 */
          backgroundColor: '#F9FAFB' /* bg-gray-50 */
        }}>
          <div className="flex">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
