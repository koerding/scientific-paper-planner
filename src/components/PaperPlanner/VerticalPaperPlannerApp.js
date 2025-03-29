import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import sectionContent from '../../sectionContent.json';
import ConfirmDialog from './ConfirmDialog'; // Added missing import
import './PaperPlanner.css';

/**
 * Vertical Paper Planner with 1/3 for user content, 2/3 for instructions and AI
 * All sections visible at once with vertical scrolling
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [researchApproach] = useState('hypothesis'); // Fixed to hypothesis-driven for now
  const sectionRefs = useRef({});
  const rightPanelRef = useRef(null);
  
  const {
    currentSection,
    userInputs,
    chatMessages,
    currentMessage,
    loading,
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleCheckboxChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject
  } = usePaperPlannerHook;

  // Store refs for all sections
  useEffect(() => {
    sectionContent.sections.forEach(section => {
      sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
    });
  }, []);

  // Setup intersection observer to detect which section is in view
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Element is considered "visible" when 50% is in view
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
          
          // If it's different from current section in state, change it
          if (entry.target.id !== currentSection) {
            handleSectionChange(entry.target.id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all section elements
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [currentSection, handleSectionChange]);

  // Check if a section has content
  const hasSectionContent = (sectionId) => {
    if (sectionId === 'philosophy') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    return userInputs[sectionId] && userInputs[sectionId].trim() !== '';
  };

  // Toggle dark mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Format timestamp for chat messages
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get approach-specific tips
  const getApproachTips = () => {
    return "Ask about hypothesis formulation, experimental design, or competing theories";
  };

  // Scroll to a specific section
  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId] && sectionRefs.current[sectionId].current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Handle position of right panel during scroll
  useEffect(() => {
    const handleScroll = () => {
      const rightPanel = rightPanelRef.current;
      if (!rightPanel) return;
      
      const scrollTop = window.scrollY;
      const headerHeight = 60; // Adjust based on your header height
      
      rightPanel.style.top = `${Math.max(0, scrollTop - headerHeight)}px`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow py-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                SP
              </div>
              <div>
                <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Hypothesis-Driven Research Project
                </p>
              </div>
            </div>
            
            {/* Dark mode toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Section quick links */}
          <div className="flex overflow-x-auto py-2 mt-2 space-x-2">
            {sectionContent.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap 
                  ${activeSection === section.id 
                    ? 'bg-indigo-100 text-indigo-800 font-medium' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
              >
                {index + 1}. {section.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main content area - 1/3 for user content, 2/3 for instructions & AI */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - User editable sections - 1/3 width */}
          <div className="w-full lg:w-1/3 space-y-6">
            {sectionContent.sections.map((section, index) => {
              const isCompleted = hasSectionContent(section.id);
              const isActive = activeSection === section.id;
              
              return (
                <div 
                  key={section.id}
                  id={section.id}
                  ref={sectionRefs.current[section.id]}
                  className={`bg-white rounded-lg shadow-sm p-6 
                    ${isCompleted ? 'border-2 border-green-500' : isActive ? 'border-2 border-indigo-500' : 'border border-gray-200'}
                  `}
                >
                  {/* Section Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{section.title}</h2>
                    {isActive && (
                      <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">
                        Current Focus
                      </div>
                    )}
                    {isCompleted && !isActive && (
                      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        Completed
                      </div>
                    )}
                  </div>
                  
                  {/* Section content - Philosophy has checkboxes, others have textareas */}
                  {section.id === 'philosophy' ? (
                    <div className="space-y-3">
                      {sectionContent.philosophyOptions.map(option => (
                        <div 
                          key={option.id} 
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                            userInputs.philosophy && userInputs.philosophy.includes(option.id) 
                              ? 'bg-indigo-50 border-2 border-indigo-300' 
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => handleCheckboxChange(option.id)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                id={option.id}
                                checked={userInputs.philosophy && userInputs.philosophy.includes(option.id)}
                                onChange={() => handleCheckboxChange(option.id)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <label 
                              htmlFor={option.id} 
                              className={`ml-3 text-gray-700 cursor-pointer ${
                                userInputs.philosophy && userInputs.philosophy.includes(option.id) ? 'font-medium' : ''
                              }`}
                            >
                              {option.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={userInputs[section.id] || ''}
                      onChange={(e) => handleInputChange(section.id, e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      rows={10}
                      placeholder={section.placeholder || "Enter your content here..."}
                    />
                  )}
                  
                  {/* Mark complete button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => section.id === currentSection && handleFirstVersionFinished()}
                      disabled={loading || !isActive}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        !loading && isActive
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? 'Processing...' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Right column - Fixed instructions and AI - 2/3 width */}
          <div className="w-full lg:w-2/3 relative">
            <div 
              ref={rightPanelRef}
              className="lg:sticky lg:top-20 space-y-6"
              style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}
            >
              {/* Instructions Panel - Based on active section */}
              {activeSection && (
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">
                    {sectionContent.sections.find(s => s.id === activeSection)?.title || 'Instructions'}
                  </h3>
                  <div className="prose prose-blue max-w-none">
                    <div className="text-blue-700">
                      {sectionContent.sections.find(s => s.id === activeSection)?.instructions.description.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-3">{paragraph}</p>
                      ))}
                    </div>
                    {sectionContent.sections.find(s => s.id === activeSection)?.instructions.workStep.content && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200 mt-4">
                        <h4 className="font-medium text-blue-800 mb-2">
                          {sectionContent.sections.find(s => s.id === activeSection)?.instructions.workStep.title}
                        </h4>
                        <div className="text-blue-600 text-sm">
                          {sectionContent.sections.find(s => s.id === activeSection)?.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="mb-2">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* AI Chat Panel */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="bg-indigo-600 text-white px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
                      AI
                    </div>
                    <h3 className="font-medium">AI Research Assistant</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Chat messages area */}
                  <div className="h-96 overflow-y-auto mb-4">
                    {!activeSection || !chatMessages[activeSection] || chatMessages[activeSection].length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-700 mb-2">Your AI Research Assistant</h4>
                        <p className="text-gray-500 max-w-md">
                          I'll help you develop your hypothesis-driven research project. Click "Mark Complete" when you're ready for initial feedback, or ask me a specific question below!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeSection && chatMessages[activeSection].map((message, index) => {
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
                      placeholder={`Ask a question about your hypothesis-driven research...`}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
                      disabled={!activeSection}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || currentMessage.trim() === '' || !activeSection}
                      className={`px-4 py-3 rounded-r-lg ${
                        loading || currentMessage.trim() === '' || !activeSection
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
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-12 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </div>
        
        {/* Confirmation Dialog */}
        <ConfirmDialog
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          resetProject={resetProject}
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
