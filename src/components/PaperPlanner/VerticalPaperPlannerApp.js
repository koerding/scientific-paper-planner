import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import SectionCard from '../sections/SectionCard';
import ModernChatInterface from '../chat/ModernChatInterface';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import '../../styles/PaperPlanner.css';

/**
 * Full-Width Paper Planner App
 * Maintains the fixed header with buttons and full-width layout
 */
const FullWidthPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // State tracking for active section
  const [activeSection, setActiveSection] = useState('question'); 
  const [initialized, setInitialized] = useState(false);
  const sectionRefs = useRef({});
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  
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

  // Initialize refs for all sections
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
  
  // Custom setActiveSection that updates both the active section and current section
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
  };

  const hasSectionContent = (sectionId) => {
    // Get section content and placeholder
    const content = userInputs[sectionId] || '';
    const section = sectionContent.sections.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    
    // Check if content is a string before using trim
    if (typeof content !== 'string') {
      return false;
    }
    
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

  // Handle improving instructions with AI
  const handleImproveInstructions = async () => {
    // Placeholder for improve function
    console.log("Improve instructions");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Custom Header with buttons */}
      <header style={{ 
        padding: '1rem 0', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #4f46e5, #9333ea)', 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              SP
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Scientific Paper Planner</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Design a hypothesis-based neuroscience project step-by-step
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowConfirmDialog(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                border: '1px solid #ef4444',
                color: '#dc2626',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                backgroundColor: 'white',
                fontWeight: '500'
              }}
            >
              <span style={{ marginRight: '4px', fontSize: '1.2rem' }}>+</span>
              <span>New</span>
            </button>
            
            <button
              onClick={exportProject}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                border: '1px solid #10b981',
                color: '#059669',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                backgroundColor: 'white',
                fontWeight: '500'
              }}
            >
              <span style={{ marginRight: '4px', fontSize: '1.2rem' }}>↓</span>
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content with 50/50 split */}
      <div style={{ position: 'relative' }}>
        {/* Left Column - User Input Sections */}
        <div style={{ 
          width: '50%', 
          padding: '0 1rem 2rem 1rem',
          marginLeft: '0'
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
                  setActiveSectionWithManualFlag(section.id);
                }}
                setActiveSection={setActiveSectionWithManualFlag}
                handleSectionChange={handleSectionChange}
                useLargerFonts={true}
              />
            );
          })}
        </div>
        
        {/* Right Panel - Fixed position instructions */}
        <div style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          width: '50%',
          height: '100vh',
          overflowY: 'auto',
          paddingTop: '120px',
          paddingRight: '1rem',
          paddingLeft: '1rem',
          paddingBottom: '2rem',
          backgroundColor: '#EBF5FF',
          borderLeft: '4px solid #3B82F6',
          zIndex: 10
        }}>
          <FullHeightInstructionsPanel 
            currentSection={getCurrentSection()} 
            userInputs={userInputs}
            improveInstructions={handleImproveInstructions}
            loading={loading || improvingInstructions}
          />
        </div>
      </div>
      
      {/* Chat Interface */}
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
  );
};

export default FullWidthPaperPlannerApp;
