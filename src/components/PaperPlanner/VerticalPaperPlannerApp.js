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
 * Enhanced Paper Planner - Cleaned logs.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [activeSection, setActiveSection] = useState('question');
  const sectionRefs = useRef({});

  // Use local state for instructions potentially modified by AI
  const [localSectionContent, setLocalSectionContent] = useState(() => {
      // Use deep copy on initial load to prevent mutation issues if sectionContent is used elsewhere
      try {
          return JSON.parse(JSON.stringify(sectionContent));
      } catch (e) {
          console.error("Failed to parse initial sectionContent", e);
          return { sections: [] }; // Fallback
      }
  });
  const [improvingInstructions, setImprovingInstructions] = useState(false);

  const {
    currentSection: currentSectionIdForChat,
    userInputs,
    chatMessages,
    currentMessage,
    loading: chatLoading,
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject: hookResetProject, // Rename to avoid conflict
    exportProject,
  } = usePaperPlannerHook;

  // Effect to map refs
  useEffect(() => {
    if (localSectionContent?.sections) {
        localSectionContent.sections.forEach(section => {
            if (section?.id) {
               sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
            }
        });
    }
  }, [localSectionContent.sections]);

   // Effect for initial active section setting
   useEffect(() => {
       setActiveSection('question');
       // Let the hook manage the initial chat context section
       // handleSectionChange('question');
   }, []);


  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId); // Update context for chat/API calls
  };

  // Helper to check if section has meaningful content beyond placeholder
  const hasSectionContent = (sectionId) => {
    const content = userInputs[sectionId];
    const section = localSectionContent.sections.find(s => s?.id === sectionId);
    const placeholder = section?.placeholder || '';
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content);
    if (!stringContent || stringContent.trim() === '') return false;
    if (stringContent === placeholder) return false;
    return true;
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId]?.current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get the current section data *from local state* for instructions display
  const getCurrentSectionData = () => {
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) {
        return null;
    }
    return localSectionContent.sections.find(s => s && s.id === activeSection) || null;
  };

  // Handle improving instructions
  const handleImproveInstructions = async () => {
    setImprovingInstructions(true);
    try {
      const result = await improveBatchInstructions(
        localSectionContent.sections, // Pass current sections (potentially already improved)
        userInputs,
        sectionContent // Pass original structure for context if needed by AI prompt generation
      );

      if (result.success && result.improvedInstructions && result.improvedInstructions.length > 0) {
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent, // Update based on current local state
          result.improvedInstructions
        );
        setLocalSectionContent(updatedSections); // Set the new state
      } else {
        console.error("[handleImproveInstructions] Failed to improve instructions:", result.message || "No improved instructions returned.");
      }
    } catch (error) {
      console.error("[handleImproveInstructions] Error during improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
  };

   // Combine local reset logic with hook's reset logic
   const handleResetRequest = () => {
       hookResetProject(); // Call the hook's reset (clears storage, resets hook state)
       setLocalSectionContent(JSON.parse(JSON.stringify(sectionContent))); // Reset local instructions state
       setActiveSection('question'); // Reset active section locally
   };

  const sectionDataForPanel = getCurrentSectionData();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-12">
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          scrollToSection={scrollToSection}
          resetProject={() => setShowConfirmDialog(true)} // Trigger dialog
          exportProject={exportProject}
        />

        <div className="flex">
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.map((section) => {
              if (!section || !section.id) return null;
              const isCurrentActive = activeSection === section.id;
               // isCompleted might need refinement depending on desired logic without checklist
              const isCompleted = hasSectionContent(section.id);
              return (
                <SectionCard
                  key={section.id}
                  section={section}
                  isCurrentSection={isCurrentActive}
                  isCompleted={isCompleted}
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                  handleFirstVersionFinished={() => handleFirstVersionFinished(section.id)}
                  loading={chatLoading && currentSectionIdForChat === section.id}
                  sectionRef={sectionRefs.current[section.id]}
                  onClick={() => setActiveSectionWithManualFlag(section.id)}
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
          currentSection={sectionDataForPanel} // Pass data from local state
          improveInstructions={handleImproveInstructions}
          loading={improvingInstructions}
        />

        <ModernChatInterface
          currentSection={currentSectionIdForChat}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={chatLoading}
        />

        <ConfirmDialog
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          resetProject={handleResetRequest} // Use combined reset handler
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
