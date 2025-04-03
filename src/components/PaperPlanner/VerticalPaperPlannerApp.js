import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import SectionCard from '../sections/SectionCard';
import ModernChatInterface from '../chat/ModernChatInterface';
import '../../styles/PaperPlanner.css';

/**
 * Complete Paper Planner App Replacement
 * This component replaces the entire app structure with a simplified version
 * that ensures the header buttons are visible.
 */
const CompletePaperPlannerApp = ({ usePaperPlannerHook }) => {
  // State tracking for active section
  const [activeSection, setActiveSection] = useState('question'); 
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

  // CSS for fixed elements
  const headerStyle = {
    padding: '1rem',
    margin: '0 0 2rem 0',
    borderBottom: '1px solid #e5e7eb'
  };
  
  const headerContentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto'
  };
  
  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center'
  };
  
  const logoStyle = {
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
  };
  
  const titleContainerStyle = {
    display: 'flex',
    flexDirection: 'column'
  };
  
  const appTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0
  };
  
  const appSubtitleStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  };
  
  const buttonContainerStyle = {
    display: 'flex',
    gap: '8px'
  };
  
  const resetButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #ef4444',
    color: '#dc2626',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  };
  
  const exportButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #10b981',
    color: '#059669',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  };
  
  const mainContentStyle = {
    display: 'flex',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem'
  };
  
  const leftColumnStyle = {
    width: '50%',
    paddingRight: '1rem'
  };
  
  const rightColumnStyle = {
    width: '50%',
    backgroundColor: '#EBF5FF',
    borderLeft: '4px solid #3B82F6',
    padding: '1rem',
    borderRadius: '8px'
  };
  
  const currentSection$ = getCurrentSection();
  const instructionsTitle = currentSection$?.instructions?.title || '';
  const instructionsDescription = currentSection$?.instructions?.description || '';
  const workStepTitle = currentSection$?.instructions?.workStep?.title || '';
  const workStepContent = currentSection$?.instructions?.workStep?.content || '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Custom Header with buttons */}
      <header style={headerStyle}>
        <div style={headerContentStyle}>
          <div style={logoContainerStyle}>
            <div style={logoStyle}>SP</div>
            <div style={titleContainerStyle}>
              <h1 style={appTitleStyle}>Scientific Paper Planner</h1>
              <p style={appSubtitleStyle}>Design a hypothesis-based neuroscience project step-by-step</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div style={buttonContainerStyle}>
            <button 
              onClick={() => setShowConfirmDialog(true)} 
              style={resetButtonStyle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '4px' }}>
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New
            </button>
            
            <button 
              onClick={exportProject} 
              style={exportButtonStyle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '4px' }}>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div style={mainContentStyle}>
        {/* Left Column - User Inputs */}
        <div style={leftColumnStyle}>
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
        
        {/* Right Column - Instructions */}
        <div style={rightColumnStyle}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1E40AF', marginTop: 0 }}>
            {instructionsTitle}
          </h2>
          <div style={{ color: '#1E40AF' }}>
            {instructionsDescription.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          
          {workStepTitle && (
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1E40AF', marginTop: '1.5rem' }}>
              {workStepTitle}
            </h3>
          )}
          
          {workStepContent && (
            <div style={{ color: '#1E40AF' }}>
              {workStepContent.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}
          
          <button 
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '500',
              marginTop: '1rem',
              cursor: 'pointer'
            }}
          >
            Improve
          </button>
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

export default CompletePaperPlannerApp;
