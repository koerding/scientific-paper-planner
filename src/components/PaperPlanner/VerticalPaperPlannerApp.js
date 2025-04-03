import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Paper Planner with debugging logs for instruction improvement.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [activeSection, setActiveSection] = useState('question');
  const [initialized, setInitialized] = useState(false);
  const sectionRefs = useRef({});

  const [localSectionContent, setLocalSectionContent] = useState(sectionContent);
  const [improvingInstructions, setImprovingInstructions] = useState(false); // State for improvement loading

  const {
    currentSection, // This is the section ID used for chat/API context
    userInputs,
    chatMessages,
    currentMessage,
    loading, // This seems tied to chat loading, not instruction improvement
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange, // Function to update currentSection ID
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    exportProject
  } = usePaperPlannerHook;

  useEffect(() => {
    localSectionContent.sections.forEach(section => {
      sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
    });
  }, [localSectionContent.sections]);

  useEffect(() => {
    if (!initialized) {
      handleSectionChange('question');
      setActiveSection('question');
      localSectionContent.sections.forEach(section => {
        if (section.placeholder && (!userInputs[section.id] || userInputs[section.id].trim() === '')) {
          handleInputChange(section.id, section.placeholder);
        }
      });
      setInitialized(true);
    }
  }, [initialized, handleSectionChange, userInputs, handleInputChange, localSectionContent.sections]);

  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId); // Update the *active* section for UI focus/instructions
    handleSectionChange(sectionId); // Update the *current* section for chat context etc.
  };

  const hasSectionContent = (sectionId) => {
    const content = userInputs[sectionId] || '';
    const section = localSectionContent.sections.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    if (typeof content !== 'string') return false;
    if (!content || content.trim() === '') return false;
    if (content === placeholder) return false;
    return true;
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId] && sectionRefs.current[sectionId].current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get the current section object based on the *active* section for display
  const getCurrentSection = () => {
    return localSectionContent.sections.find(s => s.id === activeSection) || null;
  };

  // Handle improving instructions - with added logging
  const handleImproveInstructions = async () => {
    console.log('[handleImproveInstructions] Clicked! Starting improvement process.'); // DEBUG LOG 1
    setImprovingInstructions(true);

    try {
      console.log('[handleImproveInstructions] Calling improveBatchInstructions service...'); // DEBUG LOG 2
      const result = await improveBatchInstructions(
        localSectionContent.sections,
        userInputs,
        localSectionContent
      );
      console.log('[handleImproveInstructions] Service returned:', result); // DEBUG LOG 3

      if (result.success && result.improvedInstructions) {
        console.log('[handleImproveInstructions] Improvement successful. Updating section content state.'); // DEBUG LOG 4
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent,
          result.improvedInstructions
        );
        setLocalSectionContent(updatedSections);
        console.log('[handleImproveInstructions] State update complete.'); // DEBUG LOG 5
      } else {
        console.error("[handleImproveInstructions] Failed to improve instructions:", result.message);
      }
    } catch (error) {
      console.error("[handleImproveInstructions] Error during improvement process:", error);
    } finally {
      console.log('[handleImproveInstructions] Setting improvingInstructions state back to false.'); // DEBUG LOG 6
      setImprovingInstructions(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-12">
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          handleSectionChange={handleSectionChange} // Pass the correct function if needed by header
          scrollToSection={scrollToSection}
          resetProject={() => setShowConfirmDialog(true)} // Show dialog on reset click
          exportProject={exportProject}
        />

        <div className="flex">
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
            {localSectionContent.sections.map((section) => {
              const isCurrentActive = activeSection === section.id;
              const isCompleted = hasSectionContent(section.id);

              return (
                <SectionCard
                  key={section.id}
                  section={section}
                  isCurrentSection={isCurrentActive} // Pass active state for styling
                  isCompleted={isCompleted}
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                  handleFirstVersionFinished={handleFirstVersionFinished} // Ensure this uses the correct context
                  loading={loading && currentSection === section.id} // Loading state specific to the section for chat/completion
                  sectionRef={sectionRefs.current[section.id]}
                  onClick={() => { // Renamed for clarity, handles focus/activation
                    setActiveSectionWithManualFlag(section.id);
                  }}
                  setActiveSection={setActiveSectionWithManualFlag} // Pass setter if needed internally
                  handleSectionChange={handleSectionChange} // Pass if needed internally
                  useLargerFonts={true}
                />
              );
            })}
          </div>
        </div>

        <div className="text-center text-gray-500 text-base mt-12 border-t border-gray-200 pt-6">
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </div>

        <FullHeightInstructionsPanel
          currentSection={getCurrentSection()} // Pass the currently *active* section for display
          improveInstructions={handleImproveInstructions} // Pass the correctly defined handler
          loading={improvingInstructions} // Pass the specific loading state for this action
        />

        <ModernChatInterface
          currentSection={currentSection} // Keep using currentSection for chat context
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={loading} // Pass the chat-specific loading state
        />

        <ConfirmDialog
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          resetProject={resetProject} // Pass the actual reset function
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
