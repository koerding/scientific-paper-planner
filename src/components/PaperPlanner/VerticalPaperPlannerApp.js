import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import sectionContent from '../../sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import './PaperPlanner.css';

/**
 * Vertical Paper Planner with 1/3 for user content, 2/3 for instructions and AI
 * All sections visible at once with vertical scrolling
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [researchApproach] = useState('hypothesis'); // Fixed to hypothesis-driven for now
  const sectionRefs = useRef({});
  
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
    resetProject,
    exportProject // Make sure this is exposed from the hook
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

  // Get the current section object
  const getCurrentSectionObj = () => {
    return sectionContent.sections.find(s => s.id === activeSection) || sectionContent.sections[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white shadow py-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                SP
              </div>
              <div>
                <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
                <p className="text-sm text-gray-600">
                  Hypothesis-Driven Research Project
                </p>
              </div>
            </div>
            
            {/* Save and Export buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => resetProject()}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New
              </button>
              
              <button
                onClick={() => exportProject()}
                className="px-3 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export
              </button>
            </div>
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
                      onClick={() => section.id === activeSection && handleFirstVersionFinished()}
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
            <div className="lg:sticky lg:top-20 space-y-6" style={{ height: "calc(100vh - 120px)" }}>
              {/* Instructions Panel - Based on active section - Top 2/3 */}
              <div 
                className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500 overflow-y-auto"
                style={{ height: "66%" }}
              >
                {activeSection ? (
                  <>
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">
                      {getCurrentSectionObj().title}
                    </h3>
                    <div className="prose prose-blue max-w-none">
                      <div className="text-blue-700">
                        {getCurrentSectionObj().instructions.description.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="mb-3">{paragraph}</p>
                        ))}
                      </div>
                      {getCurrentSectionObj().instructions.workStep.content && (
                        <div className="bg-white rounded-lg p-4 border border-blue-200 mt-4">
                          <h4 className="font-medium text-blue-800 mb-2">
                            {getCurrentSectionObj().instructions.workStep.title}
                          </h4>
                          <div className="text-blue-600 text-sm">
                            {getCurrentSectionObj().instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                              <p key={i} className="mb-2">{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-blue-600">Select a section to view instructions</p>
                  </div>
                )}
              </div>
              
              {/* AI Chat Panel - Bottom 1/3 */}
              <div 
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
                style={{ height: "33%" }}
              >
                <div className="bg-indigo-600 text-white px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
                      AI
                    </div>
                    <h3 className="font-medium">AI Research Assistant</h3>
                  </div>
                </div>
                
                <div className="flex flex-col h-full p-4">
                  {/* Chat messages area */}
                  <div className="flex-grow overflow-y-auto mb-4">
                    {!activeSection || !chatMessages[activeSection] || chatMessages[activeSection].length === 0 ? (
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
                      </div>
                    )}
                  </div>
                  
                  {/* Chat input */}
                  <div className="flex items-center mt-auto">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Ask a question about your research...`}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
                      disabled={!activeSection}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || currentMessage.trim() === '' || !activeSection}
                      className={`px-3 py-2 rounded-r-lg ${
                        loading || currentMessage.trim() === '' || !activeSection
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
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-12 border-t border-gray-200 pt-6">
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
