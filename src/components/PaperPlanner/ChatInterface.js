import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Renders the chat interface for talking with the AI assistant
 */
const ChatInterface = ({
  currentSection,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading
}) => {
  return (
    <div className="mt-6 border border-gray-300 rounded p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        Chat with Konrad Kording (AI Assistant)
      </h3>
      <div className="bg-white border border-gray-300 rounded p-3 h-64 overflow-y-auto mb-3">
        {!chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? (
          <div className="text-gray-500 p-4 text-center italic">
            <p>Hello! I'm Konrad Kording, your AI assistant.</p>
            <p className="mt-2">I'll help you develop your research project. Click "First version finished" above when you're ready for initial feedback, or ask me a specific question below!</p>
          </div>
        ) : (
          chatMessages[currentSection].map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 p-3 rounded ${
                message.role === 'user' 
                  ? 'bg-blue-100 ml-12' 
                  : 'bg-gray-100 mr-12'
              }`}
            >
              <div className="font-semibold mb-1">{message.role === 'user' ? 'You' : 'Konrad Kording'}</div>
              {message.role === 'user' ? (
                <div className="whitespace-pre-line">{message.content}</div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="text-gray-500 italic p-2">Konrad is thinking...</div>
        )}
      </div>
      <div className="flex">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-l"
          placeholder="Ask for help or suggestions..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 flex items-center"
          disabled={loading || currentMessage.trim() === ''}
        >
          <span>Send</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
      <div className="mt-3 text-sm text-gray-600">
        <p>Tip: I'm Konrad Kording, and I can help you with specific aspects of this section. Feel free to ask for feedback on what you've written!</p>
      </div>
    </div>
  );
};

export default ChatInterface;
