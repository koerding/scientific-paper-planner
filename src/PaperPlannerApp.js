import React, { useState, useEffect } from 'react';
import { callOpenAI } from './services/openaiService';
import ReactMarkdown from 'react-markdown';
import sectionContent from './sectionContent.json';

const PaperPlannerApp = () => {
  // Get sections and philosophy options from the imported JSON
  const { sections, philosophyOptions } = sectionContent;

  // State
  const [currentSection, setCurrentSection] = useState(sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState({
    question: '',
    hypothesis: '',
    philosophy: [],
    experiment: '',
    analysis: '',
    process: '',
    abstract: ''
  });
  const [chatMessages, setChatMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize chat messages for each section
  useEffect(() => {
    const initialChatMessages = {};
    sections.forEach(section => {
      initialChatMessages[section.id] = [];
    });
    setChatMessages(initialChatMessages);
  }, []);

  // Update current section and index
  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sections.findIndex(s => s.id === sectionId));
  };

  // Update user input
  const handleInputChange = (section, value) => {
    setUserInputs({
      ...userInputs,
      [section]: value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (id) => {
    const newPhilosophy = [...userInputs.philosophy];
    if (newPhilosophy.includes(id)) {
      const index = newPhilosophy.indexOf(id);
      newPhilosophy.splice(index, 1);
    } else {
      newPhilosophy.push(id);
    }
    setUserInputs({
      ...userInputs,
      philosophy: newPhilosophy
    });
  };

  // Send message to AI assistant
  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;
    
    // Add user message to chat
    const newMessages = [
      ...chatMessages[currentSection], 
      { role: 'user', content: currentMessage }
    ];
    
    setChatMessages({
      ...chatMessages,
      [currentSection]: newMessages
    });
    
    setCurrentMessage('');
    setLoading(true);
    
    try {
      // Call OpenAI API with the current message, context, and all sections.
      const aiResponse = await callOpenAI(currentMessage, currentSection, userInputs, sections);
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...newMessages, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle "First version finished" button click
  const handleFirstVersionFinished = async () => {
    // Don't do anything if there's no content yet
    if (!userInputs[currentSection] && currentSection !== 'philosophy') return;
    if (currentSection === 'philosophy' && userInputs.philosophy.length === 0) return;
    
    setLoading(true);
    
    try {
      // Create an appropriate message based on the section
      let initialMessage = "I've finished my first version. Can you provide feedback?";
      
      // Add the initial message to chat
      const newMessages = [
        ...chatMessages[currentSection], 
        { role: 'user', content: initialMessage }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: newMessages
      });
      
      // Call OpenAI API with the initial message
      const aiResponse = await callOpenAI(initialMessage, currentSection, userInputs, sections);
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...chatMessages[currentSection], { role: 'user', content: "I've finished my first version. Can you provide feedback?" }, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset project
  const resetProject = () => {
    // Clear all user inputs
    setUserInputs({
      question: '',
      hypothesis: '',
      philosophy: [],
      experiment: '',
      analysis: '',
      process: '',
      abstract: ''
    });
    
    // Clear all chat messages
    const freshChatMessages = {};
    sections.forEach(section => {
      freshChatMessages[section.id] = [];
    });
    setChatMessages(freshChatMessages);
    
    // Reset to first section
    handleSectionChange(sections[0].id);
    
    // Clear localStorage
    localStorage.removeItem('paperPlannerData');
    localStorage.removeItem('paperPlannerChat');
  };

  // Save progress to localStorage
  const saveProgress = () => {
    try {
      localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
      localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  };

  // Load progress from localStorage
  const loadProgress = () => {
    try {
      const savedInputs = localStorage.getItem('paperPlannerData');
      const savedChat = localStorage.getItem('paperPlannerChat');
      
      if (savedInputs) {
        setUserInputs(JSON.parse(savedInputs));
      }
      
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
      
      return !!savedInputs;
    } catch (error) {
      console.error('Error loading progress:', error);
      return false;
    }
  };

  // Auto-save on input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgress();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [userInputs, chatMessages]);

  // Load progress on initial mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Export project as markdown
  const exportProject = () => {
    const exportContent = `# Scientific Paper Project Plan

## 1. Research Question
${userInputs.question || "Not completed yet"}

## 2. Hypotheses
${userInputs.hypothesis || "Not completed yet"}

## 3. Research Philosophy
${userInputs.philosophy.map(id => `- ${philosophyOptions.find(o => o.id === id).label}`).join('\n') || "Not selected yet"}

## 4. Experimental Design
${userInputs.experiment || "Not completed yet"}

## 5. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 6. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 7. Abstract
${userInputs.abstract || "Not completed yet"}
`;

    // Create a blob with the content
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scientific-paper-plan.md';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Count words in a string
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word !== '').length;
  };

  // Helper to format instructions text
  const formatInstructions = (section) => {
    return `${section.instructions.title}\n\n${section.instructions.description}\n\n${section.instructions.workStep.title}\n\n${section.instructions.workStep.content}`;
  };

  // Render input based on section type
  const renderInput = (section) => {
    // Render instructions
    const instructionsElement = (
      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-gray-700 overflow-y-auto max-h-96">
        <div className="whitespace-pre-line">{formatInstructions(section)}</div>
      </div>
    );
    
    // Render input form
    let inputElement;
    if (section.type === 'checklist') {
      inputElement = (
        <div className="mt-4">
          {philosophyOptions.map(option => (
            <div key={option.id} className="flex items-start mb-3">
              <input
                type="checkbox"
                id={option.id}
                checked={userInputs.philosophy.includes(option.id)}
                onChange={() => handleCheckboxChange(option.id)}
                className="mt-1 mr-2"
              />
              <label htmlFor={option.id} className="text-gray-700">{option.label}</label>
            </div>
          ))}
        </div>
      );
    } else {
      inputElement = (
        <textarea
          value={userInputs[section.id]}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded h-32 mt-2"
          placeholder={`Enter your ${section.title.toLowerCase()} here (max 200 words)`}
          maxLength={1200} // Approximately 200 words
        />
      );
    }
    
    // Check if there's content to enable the button
    const hasContent = section.type === 'checklist' 
      ? userInputs.philosophy.length > 0 
      : userInputs[section.id]?.trim().length > 0;
    
    // Return both instructions, input form, and the new button
    return (
      <div>
        {instructionsElement}
        {inputElement}
        
        {/* Word Counter */}
        {section.type !== 'checklist' && (
          <div className="text-right text-sm text-gray-600 mt-1">
            {countWords(userInputs[section.id])} / 200 words
          </div>
        )}
        
        {/* First Version Finished Button */}
        <div className="mt-4">
          <button
            onClick={handleFirstVersionFinished}
            disabled={!hasContent || loading}
            className={`px-4 py-2 rounded-md font-medium ${
              hasContent && !loading
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'First version finished'
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render chat section
  const renderChat = () => {
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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Scientific Paper Planner
        </h1>
        <p className="text-gray-600 mb-6">
          Design a hypothesis-based neuroscience project by completing each section step-by-step.
        </p>
        
        {/* Navigation Tabs with Progress Indicators */}
        <div className="flex flex-wrap mb-6">
          {sections.map((section, index) => {
            const hasContent = section.type === 'checklist' 
              ? userInputs.philosophy.length > 0 
              : userInputs[section.id]?.trim().length > 0;
            
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`mr-2 mb-2 px-4 py-2 rounded flex items-center ${
                  currentSection === section.id
                    ? 'bg-blue-600 text-white'
                    : hasContent
                      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full mr-2 ${
                  currentIndex === index
                    ? 'bg-white text-blue-600'
                    : hasContent
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-400 text-white'
                }`}>
                  {index + 1}
                </span>
                {section.title}
              </button>
            );
          })}
        </div>
        
        {/* Content Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-blue-600 text-white mr-2">
              {sections.findIndex(s => s.id === currentSection) + 1}
            </span>
            {sections.find(s => s.id === currentSection).title}
          </h2>
          
          {/* Input Area */}
          {renderInput(sections.find(s => s.id === currentSection))}
          
          {/* Chat Interface */}
          {renderChat()}
        </div>
        
        {/* Progress and Navigation */}
        <div className="flex justify-between mt-8">
          <div className="flex">
            <button
              onClick={() => {
                const newIndex = currentIndex - 1;
                if (newIndex >= 0) {
                  handleSectionChange(sections[newIndex].id);
                }
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex items-center mr-2"
              disabled={currentIndex === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center mr-2"
              title="Start a new project"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Project
            </button>
            
            <button
              onClick={exportProject}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
              title="Export your project as a markdown file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Project
            </button>
          </div>
          
          <button
            onClick={() => {
              const newIndex = currentIndex + 1;
              if (newIndex < sections.length) {
                handleSectionChange(sections[newIndex].id);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            disabled={currentIndex === sections.length - 1}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm New Project</h3>
              <p className="mb-6 text-gray-600">
                Are you sure you want to start a new project? All current progress will be lost.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetProject();
                    setShowConfirmDialog(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes, start new
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperPlannerApp;
