import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../sectionContent.json';
import ConfirmDialog from '../ConfirmDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import { improveInstructions, updateSectionWithImprovedInstructions } from '../../services/instructionImprovementService';
import { callOpenAI } from '../../services/openaiService';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Paper Planner with:
 * - Full width user content
 * - Full-height instruction panel with "Improve" button
 * - Minimizable chat interface
 * - Larger fonts
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // State tracking for active section
  const [activeSection, setActiveSection] = useState('question'); // Default to question section
  const [initialized, setInitialized] = useState(false);
  const sectionRefs = useRef({});
  
  // State for improved instructions
  const [localSectionContent, setLocalSectionContent] = useState(sectionContent);
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

  // Store refs for all sections
  useEffect(() => {
    localSectionContent.sections.forEach(section => {
      sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
    });
  }, [localSectionContent.sections]);

  // Initialize with focus on question section and prefill content
  useEffect(() => {
    if (!initialized) {
      // Set initial focus
      handleSectionChange('question');
      setActiveSection('question');
      
      // Pre-fill text for every section that's not already filled
      localSectionContent.sections.forEach(section => {
        if (section.type !== 'checklist' && section.placeholder) {
          if (!userInputs[section.id] || userInputs[section.id].trim() === '') {
            handleInputChange(section.id, section.placeholder);
          }
        }
      });
      
      setInitialized(true);
    }
  }, [initialized, handleSectionChange, userInputs, handleInputChange, localSectionContent.sections]);

  // We're using explicit user interaction only for section changes
  
  // Custom setActiveSection that updates both the active section and current section
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
  };

  // Check if a section has content beyond placeholder
  const hasSectionContent = (sectionId) => {
    if (sectionId === 'philosophy') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    
    // Get section content and placeholder
    const content = userInputs[sectionId] || '';
    const section = localSectionContent.sections.find(s => s.id === sectionId);
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
    return localSectionContent.sections.find(s => s.id === activeSection) || null;
  };
  
  // Handle improving instructions with AI
  const handleImproveInstructions = async () => {
    setImprovingInstructions(true);
    
    try {
      // Use our instruction improvement service
      const result = await improveInstructions(
        localSectionContent.sections,
        userInputs,
        localSectionContent,
        callOpenAI // Pass the existing OpenAI API function
      );
      
      if (result.success && result.improvedInstructions) {
        // Update our local section content
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent,
          result.improvedInstructions
        );
        
        setLocalSectionContent(updatedSections);
        console.log("Instructions improved successfully");
      } else {
        console.error("Failed to improve instructions:", result.message);
      }
    } catch (error) {
      console.error("Error in improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
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
          {/* Left column - User editable sections - taking 1/2 width */}
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
            {localSectionContent.sections.map((section) => {
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
                  philosophyOptions={localSectionContent.philosophyOptions}
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
        
        {/* Full-height instructions panel (fixed position) with improve button */}
        <FullHeightInstructionsPanel 
          currentSection={getCurrentSection()} 
          userInputs={userInputs}
          improveInstructions={handleImproveInstructions}
          loading={loading || improvingInstructions}
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
