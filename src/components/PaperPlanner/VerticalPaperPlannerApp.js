import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import InstructionsPanel from '../rightPanel/InstructionsPanel';
import AIChatPanel from '../rightPanel/AIChatPanel';
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

  // Helper functions (moved from utils to prevent import issues)
  // Format timestamp for chat messages
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
    return sectionContent.sections.find(s => s.id === activeSection) || null;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Use 100% width instead of max-w-7xl */}
      <div className="w-full px-4 pb-12">
        {/* Header Component */}
        <AppHeader
          sections={sectionContent.sections}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          handleSectionChange={handleSectionChange}
          scrollToSection={scrollToSection}
          resetProject={resetProject}
          exportProject={exportProject}
        />
        
        {/* Main content area - 1/3 for user content, 2/3 for instruction & AI (fixed) */}
        <div style={{ display: 'flex' }}>
          {/* Left column - User editable sections - scrollable (50% width) */}
          <div style={{ 
            width: '50%',
            paddingRight: '1rem', 
            overflowY: 'auto',
            paddingBottom: '50px' 
          }}>
            {sectionContent.sections.map((section) => {
              const isCurrentSection = activeSection === section.id;
              const isCompleted = hasSectionContent(section.id);
              
              return (
                <SectionCard
                  key={section.id}
                  section={section}
                  isCurrentSection={isCurrentSection}
                  isCompleted={isCompleted}
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                  handleCheckboxChange={handleCheckboxChange}
                  handleFirstVersionFinished={handleFirstVersionFinished}
                  philosophyOptions={sectionContent.philosophyOptions}
                  loading={loading}
                  sectionRef={sectionRefs.current[section.id]}
                  onClick={() => {
                    setActiveSection(section.id);
                    handleSectionChange(section.id);
                  }}
                />
              );
            })}
          </div>
          
          {/* Right column - Fixed instructions and AI - 50% width */}
          <div style={{ 
            width: '50%',
            paddingLeft: '1rem',
            position: 'relative'
          }}>
            <div style={{
              position: 'fixed',
              width: 'calc(50% - 2rem)',
              maxHeight: 'calc(100vh - 140px)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10
            }}>
              {/* Instructions Panel Component - Top 75% */}
              <InstructionsPanel 
                currentSection={getCurrentSection()} 
              />
              
              {/* AI Chat Panel Component - Bottom 25% */}
              <AIChatPanel
                currentSection={currentSection}
                chatMessages={chatMessages}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                handleSendMessage={handleSendMessage}
                loading={loading}
                formatTime={formatTime}
              />
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
