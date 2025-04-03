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
  const [activeSection, setActiveSection] = useState('question'); // Tracks UI focus
  const sectionRefs = useRef({});

  // State for potentially modified instructions
  const [localSectionContent, setLocalSectionContent] = useState(() => JSON.parse(JSON.stringify(sectionContent)));
  const [improvingInstructions, setImprovingInstructions] = useState(false);

  const {
    currentSection: currentSectionIdForChat, // From hook, used for chat context
    userInputs,
    chatMessages,
    currentMessage,
    loading: chatLoading, // Rename hook loading to avoid clash
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange, // From hook, updates chat context
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    exportProject,
    setUserInputs, // Need this to apply loaded data potentially
    setChatMessages // Need this for loading chat
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

  // Effect for initial active section setting (runs only once)
  useEffect(() => {
      setActiveSection('question'); // Set initial UI focus
      // handleSectionChange('question'); // Let hook handle initial context if needed via its own default
  }, []); // Ensure this runs only once


  // This effect logs changes, can be removed if things work
  // useEffect(() => {
  //   console.log(`[EFFECT log] localSectionContent changed. Active section ID: ${activeSection}`);
  //   const currentData = getCurrentSectionData();
  //   console.log("[EFFECT log] Instructions for current active section from state:", JSON.stringify(currentData?.instructions, null, 2));
  // }, [localSectionContent, activeSection]);


  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId); // Update context for chat/API calls if needed
  };

  const hasSectionContent = (sectionId) => {
    const content = userInputs[sectionId] || '';
    const section = localSectionContent.sections.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content);
    if (!stringContent || stringContent.trim() === '') return false;
    if (stringContent === placeholder) return false;
    return true;
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId] && sectionRefs.current[sectionId].current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
        localSectionContent.sections,
        userInputs,
        localSectionContent // Pass the original structure for context
      );

      if (result.success && result.improvedInstructions && result.improvedInstructions.length > 0) {
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent,
          result.improvedInstructions
        );
        setLocalSectionContent(updatedSections); // Update the state with new instructions
      } else {
        console.error("[handleImproveInstructions] Failed to improve instructions:", result.message || "No improved instructions returned.");
        // TODO: Optionally show error to user in UI
      }
    } catch (error) {
      console.error("[handleImproveInstructions] Error during improvement process:", error);
       // TODO: Optionally show error to user in UI
    } finally {
      setImprovingInstructions(false);
    }
  };

  const sectionDataForPanel = getCurrentSectionData();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-12">
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          scrollToSection={scrollToSection}
          resetProject={() => setShowConfirmDialog(true)}
          exportProject={exportProject}
        />

        <div className="flex">
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.map((section) => {
              if (!section || !section.id) return null;
              const isCurrentActive = activeSection === section.id;
              const isCompleted = hasSectionContent(section.id); // Determine completion based on content
              return (
                <SectionCard
                  key={section.id}
                  section={section}
                  isCurrentSection={isCurrentActive}
                  isCompleted={isCompleted} // Pass completion status
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                   // Pass section ID to handler
                  handleFirstVersionFinished={() => handleFirstVersionFinished(section.id)}
                  loading={chatLoading && currentSectionIdForChat === section.id} // Use chat loading for this button? Or separate?
                  sectionRef={sectionRefs.current[section.id]}
                  onClick={() => {
                    setActiveSectionWithManualFlag(section.id);
                  }}
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
          currentSection={sectionDataForPanel}
          improveInstructions={handleImproveInstructions}
          loading={improvingInstructions} // Use the specific loading state
        />

        <ModernChatInterface
          currentSection={currentSectionIdForChat} // Chat uses its own context section ID
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={chatLoading} // Use the chat-specific loading state
        />

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
