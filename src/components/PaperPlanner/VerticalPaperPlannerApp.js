import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import '../../styles/PaperPlanner.css';

/**
 * Redesigned Paper Planner with:
 * - Full width for user content
 * - Full-height instruction panel
 * - Minimizable chat interface
 * - Larger fonts
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // State tracking for active section and focus
  const [activeSection, setActiveSection] = useState('question'); // Default to question section
  const [initialized, setInitialized] = useState(false);
  // Flag to disable intersection observer when user manually selects a section
  const [userManuallySelected, setUserManuallySelected] = useState(false);
  const sectionRefs = useRef({});
  const observerRef = useRef(null);
  
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
  // but only when user isn't manually selecting sections
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Element is considered "visible" when 50% is in view
    };

    const observerCallback = (entries) => {
      // Skip intersection updates if user manually selected a section recently
      if (userManuallySelected) return;
      
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

    // Store observer in ref so we can disconnect it when needed
    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all section elements
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref.current) {
        observerRef.current.observe(ref.current);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentSection, handleSectionChange, userManuallySelected]);

  // Custom setActiveSection that also disables intersection observer temporarily
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
    
    // Set flag to disable intersection observer for a brief period
    setUserManuallySelected(true);
    
    // After 2 seconds, re-enable the intersection observer
    setTimeout(() => {
      setUserManuallySelected(false);
    }, 2000);
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
      {/* Full width content */}
      <div className="w-full pb-12">
        {/* Header Component */}
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          handleSectionChange={handleSectionChange}
          scrollToSection={scrollToSection}
          resetProject={resetProject}
          exportProject={exportProject}
        />
        
        {/* Main content area with adjusted layout */}
        <div className="flex">
          {/* Left column - User editable sections - taking 2/3 width */}
          <div className="w-2/3 px-8 py-6" style={{ marginRight: '33.333%' }}>
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
                    setActiveSectionWithManualFlag(section.id);
                  }}
                  setActiveSection={setActiveSectionWithManualFlag}
                  handleSectionChange={handleSectionChange}
                  useLargerFonts={true} // Enable larger fonts
                />
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-base mt-12 border-t border-gray-200 pt-6">
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </div>
        
        {/* Full-height instructions panel (fixed position) */}
        <FullHeightInstructionsPanel 
          currentSection={getCurrentSection()} 
        />
        
        {/* Minimizable chat interface */}
        <ModernChatInterface
          currentSection={currentSection}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={loading}
        />
        
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
