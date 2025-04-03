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
 * Enhanced Paper Planner with more debugging logs for instruction improvement state update.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [activeSection, setActiveSection] = useState('question');
  const [initialized, setInitialized] = useState(false);
  const sectionRefs = useRef({});

  // Ensure initial state uses a deep copy to prevent accidental mutations
  const [localSectionContent, setLocalSectionContent] = useState(() => JSON.parse(JSON.stringify(sectionContent)));
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

  // Simplified initialization effect
  useEffect(() => {
      if (!initialized) {
        setActiveSection('question');
        handleSectionChange('question'); // Set chat context too
        setInitialized(true);
        // Removed placeholder setting from here, handle in SectionCard if needed
      }
  }, [initialized, handleSectionChange]);


  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId); // Update the *active* section for UI focus/instructions
    handleSectionChange(sectionId); // Update the *current* section for chat context etc.
  };

  const hasSectionContent = (sectionId) => {
    const content = userInputs[sectionId] || '';
    const section = localSectionContent.sections.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    // Ensure content is treated as string for comparison
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content);
    if (!stringContent || stringContent.trim() === '') return false;
    if (stringContent === placeholder) return false; // Compare stringified content to placeholder
    return true;
  };


  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId] && sectionRefs.current[sectionId].current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get the current section object based on the *active* section for display
  const getCurrentSection = () => {
     // Add checks to prevent errors if localSectionContent or sections are not ready
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) {
        return null;
    }
    return localSectionContent.sections.find(s => s && s.id === activeSection) || null;
  };

  // Handle improving instructions - with added logging for state update data
  const handleImproveInstructions = async () => {
    console.log('[handleImproveInstructions] Clicked! Starting improvement process.');
    setImprovingInstructions(true);

    try {
      console.log('[handleImproveInstructions] Calling improveBatchInstructions service...');
      // Pass the current state to the service
      const result = await improveBatchInstructions(
        localSectionContent.sections, // Pass sections array
        userInputs,
        localSectionContent // Pass the whole object for context if needed by service
      );
      console.log('[handleImproveInstructions] Service returned:', result);

      if (result.success && result.improvedInstructions) {
        console.log('[handleImproveInstructions] Improvement successful.');

        // *** DEBUG LOG: Log the data received from the service ***
        console.log('[handleImproveInstructions] Data from AI (result.improvedInstructions):', JSON.stringify(result.improvedInstructions, null, 2));

        // Create the updated structure
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent, // Pass current state
          result.improvedInstructions // Pass improvements
        );

        // *** DEBUG LOG: Log the structure *before* setting state ***
        console.log('[handleImproveInstructions] Merged data BEFORE setLocalSectionContent (updatedSections):', JSON.stringify(updatedSections, null, 2));

        // *** DEBUG LOG: Compare specific section before/after merge (e.g., 'question') ***
        const originalSectionForLog = localSectionContent.sections.find(s => s.id === result.improvedInstructions[0]?.id);
        const updatedSectionForLog = updatedSections.sections.find(s => s.id === result.improvedInstructions[0]?.id);
        console.log(`[handleImproveInstructions] Comparing section '${result.improvedInstructions[0]?.id}' BEFORE merge:`, JSON.stringify(originalSectionForLog?.instructions, null, 2));
        console.log(`[handleImproveInstructions] Comparing section '${result.improvedInstructions[0]?.id}' AFTER merge:`, JSON.stringify(updatedSectionForLog?.instructions, null, 2));


        // Update the main state
        setLocalSectionContent(updatedSections);
        console.log('[handleImproveInstructions] State update initiated.');

      } else {
        console.error("[handleImproveInstructions] Failed to improve instructions based on service response:", result.message);
      }
    } catch (error) {
      console.error("[handleImproveInstructions] Error during improvement process:", error);
    } finally {
      console.log('[handleImproveInstructions] Setting improvingInstructions state back to false.');
      setImprovingInstructions(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-12">
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          scrollToSection={scrollToSection}
          resetProject={() => setShowConfirmDialog(true)} // Show dialog on reset click
          exportProject={exportProject}
        />

        <div className="flex">
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
             {/* Ensure localSectionContent.sections is an array before mapping */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.map((section) => {
               // Add check for valid section object within map
              if (!section || !section.id) {
                  console.warn("Skipping rendering invalid section:", section);
                  return null;
              }

              const isCurrentActive = activeSection === section.id;
              const isCompleted = hasSectionContent(section.id);

              return (
                <SectionCard
                  key={section.id}
                  section={section}
                  isCurrentSection={isCurrentActive}
                  isCompleted={isCompleted}
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                  handleFirstVersionFinished={handleFirstVersionFinished}
                  loading={loading && currentSection === section.id}
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
