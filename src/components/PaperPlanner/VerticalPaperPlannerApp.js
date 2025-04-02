// Modifications for VerticalPaperPlannerApp.js to fix width and feedback issues

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
  // State tracking for active section and focus
  const [activeSection, setActiveSection] = useState('question'); // Default to question section
  const [initialized, setInitialized] = useState(false);
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
    exportProject
  } = usePaperPlannerHook;

  // Store refs for all sections
  useEffect(() => {
    sectionContent.sections.forEach(section => {
      sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
    });
  }, []);

  // Initialize with focus on question section and prefill content
  useEffect(() => {
    if (!initialized) {
      // Set initial focus
      handleSectionChange('question');
      setActiveSection('question');
      
      // Pre-fill text for every section that's not already filled
      sectionContent.sections.forEach(section => {
        if (section.type !== 'checklist' && section.placeholder) {
          if (!userInputs[section.id] || userInputs[section.id].trim() === '') {
            handleInputChange(section.id, section.placeholder);
          }
        }
      });
      
      setInitialized(true);
    }
  }, [initialized, handleSectionChange, userInputs, handleInputChange]);

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

  // Check if a section has content beyond placeholder
  const hasSectionContent = (sectionId) => {
    if (sectionId === 'philosophy') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    
    // Get section content and placeholder
    const content = userInputs[sectionId] || '';
    const section = sectionContent.sections.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    
    // If content is completely empty, it's not completed
    if (!content || content.trim() === '') return false;
    
    // If content is exactly the placeholder, it's not completed
    if (content === placeholder) return false;
    
    // Otherwise, consider it completed (even if just slightly modified)
    return true;
  };

  // Format timestamp for chat messages
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Get the current section object for instructions display
  const getCurrentSection = () => {
    return sectionContent.sections.find(s => s.id === activeSection) || sectionContent.sections[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Use 100% width instead of max-w-7xl */}
      <div className="w-full px-4 pb-12">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white shadow py-4 mb-6">
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
                onClick={() => {
                  scrollToSection(section.id);
                  setActiveSection(section.id);
                  handleSectionChange(section.id);
                }}
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
        
        {/* Main content area - 1/3 for user content, 2/3 for instruction & AI (fixed) */}
        <div style={{ display: 'flex' }}>
          {/* Left column - User editable sections - scrollable (1/3 width) */}
          <div style={{ 
            width: '50%', // Increased from 33.333% to 50% for better use of space
            paddingRight: '1rem', 
            overflowY: 'auto',
            paddingBottom: '50px' 
          }}>
            {sectionContent.sections.map((section, index) => {
              const isCurrentSection = activeSection === section.id;
              const isCompleted = hasSectionContent(section.id);
              
              return (
                <div 
                  key={section.id}
                  id={section.id}
                  ref={sectionRefs.current[section.id]}
                  className={`bg-white rounded-lg shadow-sm p-6 mb-6
                    ${isCompleted ? 'border-2 border-green-500' : isCurrentSection ? 'border-2 border-indigo-500' : 'border border-gray-200'}
                    ${isCurrentSection ? 'relative' : ''}
                  `}
                  onClick={() => {
                    setActiveSection(section.id);
                    handleSectionChange(section.id);
                  }}
                >
                  {/* Connection dot for active section */}
                  {isCurrentSection && (
                    <div className="absolute -right-3 top-1/2 w-6 h-6 bg-blue-500 rounded-full transform -translate-y-1/2 z-10"></div>
                  )}
                  
                  {/* Section Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{section.title}</h2>
                    {isCurrentSection && (
                      <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">
                        Current Focus
                      </div>
                    )}
                    {isCompleted && !isCurrentSection && (
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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering parent onClick
                            handleCheckboxChange(option.id);
                          }}
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
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering parent onClick
                        if (section.id === activeSection) handleFirstVersionFinished();
                      }}
                      disabled={loading || section.id !== activeSection}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        !loading && section.id === activeSection
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
          <div style={{ 
            width: '50%', // Changed from 66.666% to 50%
            paddingLeft: '1rem',
            position: 'relative'
          }}>
            <div style={{
              position: 'fixed',
              width: 'calc(50% - 2rem)', // Changed to match new right column width
              top: '140px', // Fixed position from top
              bottom: '1rem', // Fixed position from bottom
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10
            }}>
              {/* Instructions Panel - Top 2/3 */}
              <div style={{
                backgroundColor: '#EBF5FF', /* bg-blue-50 */
                borderRadius: '0.5rem',
                padding: '1.5rem',
                borderLeftWidth: '4px',
                borderLeftColor: '#3B82F6', /* border-blue-500 */
                overflowY: 'auto',
                height: 'calc(66.666% - 1rem)', // Exact 2/3 minus margin
                marginBottom: '1rem',
                position: 'relative'
              }}>
                {/* Connection to active section */}
                <div style={{
                  position: 'absolute',
                  left: '-3px',
                  top: '50%',
                  transform: 'translateX(-50%) translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#3B82F6', /* bg-blue-500 */
                  borderRadius: '50%',
                  zIndex: 10
                }}>
                  {/* Line connecting to active section */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '100%',
                    width: '30px',
                    height: '2px',
                    backgroundColor: '#3B82F6', /* bg-blue-500 */
                    transform: 'translateY(-50%)'
                  }}></div>
                </div>
              
                {getCurrentSection() ? (
                  <>
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">
                      {getCurrentSection().title}
                    </h3>
                    <div className="prose prose-blue max-w-none">
                      <div className="text-blue-700">
                        {getCurrentSection().instructions.description.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="mb-3">{paragraph}</p>
                        ))}
                      </div>
                      {getCurrentSection().instructions.workStep && getCurrentSection().instructions.workStep.content && (
                        <div className="bg-white rounded-lg p-4 border border-blue-200 mt-4">
                          <h4 className="font-medium text-blue-800 mb-2">
                            {getCurrentSection().instructions.workStep.title}
                          </h4>
                          <div className="text-blue-600 text-sm">
                            {getCurrentSection().instructions.workStep.content.split('\n\n').map((paragraph, i) => (
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
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB', /* border-gray-200 */
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                height: 'calc(33.333%)', // Exact 1/3 of available height
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
                  {/* Chat messages area - KEY CHANGE: Use currentSection instead of activeSection */}
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
