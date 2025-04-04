// Correct imports section for VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog'; // <-- Import ExamplesDialog
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Paper Planner with research approach and data acquisition toggles
 * ADDED: ExamplesDialog rendering and state management
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [activeSection, setActiveSection] = useState('question');
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
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
    showExamplesDialog, // <-- Get examples dialog state from hook
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog, // <-- Get examples dialog setter from hook
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject: hookResetProject, // Rename to avoid conflict
    exportProject,
    loadProject
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

  // Effect to update active approach and data method based on user inputs
  useEffect(() => {
    // Determine default placeholder content for each section
    const placeholders = {};
    if (localSectionContent?.sections) {
        localSectionContent.sections.forEach(s => {
            if (s?.id) placeholders[s.id] = s.placeholder || '';
        });
    }

    // Helper to check if content is different from placeholder
    const isModified = (sectionId) => {
        const content = userInputs[sectionId];
        return typeof content === 'string' && content.trim() !== '' && content !== placeholders[sectionId];
    };

    // Check if user has modified input in any of the approach sections
    if (isModified('hypothesis')) {
      setActiveApproach('hypothesis');
    } else if (isModified('needsresearch')) {
      setActiveApproach('needsresearch');
    } else if (isModified('exploratoryresearch')) {
      setActiveApproach('exploratoryresearch');
    } else {
       setActiveApproach('hypothesis'); // Default if none are modified
    }

    // Check if user has modified input in any of the data acquisition sections
    if (isModified('experiment')) {
      setActiveDataMethod('experiment');
    } else if (isModified('existingdata')) {
      setActiveDataMethod('existingdata');
    } else {
       setActiveDataMethod('experiment'); // Default if none are modified
    }
  }, [userInputs, localSectionContent.sections]); // Add localSectionContent.sections dependency


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
    // Consider it 'completed' if it's not empty and different from placeholder
    return stringContent && stringContent.trim() !== '' && stringContent !== placeholder;
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
      // Reset local instructions state using a deep copy of original content
       try {
          setLocalSectionContent(JSON.parse(JSON.stringify(sectionContent)));
       } catch(e) {
           console.error("Failed to reset local section content:", e);
           setLocalSectionContent({ sections: [] }); // Fallback to empty
       }
      setActiveSection('question'); // Reset active section locally
      setActiveApproach('hypothesis'); // Reset active approach
      setActiveDataMethod('experiment'); // Reset active data method
  };

  const sectionDataForPanel = getCurrentSectionData();

  // Check if a section should be displayed based on toggles
  const shouldDisplaySection = (sectionId) => {
    if (sectionId === 'hypothesis' || sectionId === 'needsresearch' || sectionId === 'exploratoryresearch') {
      return sectionId === activeApproach;
    }

    if (sectionId === 'experiment' || sectionId === 'existingdata') {
      return sectionId === activeDataMethod;
    }

    return true; // All other sections are always displayed
  };

  // Handle approach toggle
  const handleApproachToggle = (approach) => {
    setActiveApproach(approach);
    // If we switch to this approach, automatically set it as the active section
    setActiveSectionWithManualFlag(approach);
  };

  // Handle data method toggle
  const handleDataMethodToggle = (method) => {
    setActiveDataMethod(method);
    // If we switch to this method, automatically set it as the active section
    setActiveSectionWithManualFlag(method);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-12">
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          scrollToSection={scrollToSection}
          resetProject={() => setShowConfirmDialog(true)} // Trigger dialog
          exportProject={exportProject}
          loadProject={loadProject}
          setShowExamplesDialog={setShowExamplesDialog} // <-- Pass setter to header
        />

        <div className="flex">
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
            {/* Display first two sections: Question and Audience */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => section?.id === 'question' || section?.id === 'audience')
              .map((section) => {
                if (!section || !section.id) return null;
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
                    handleFirstVersionFinished={() => handleFirstVersionFinished(section.id)}
                    loading={chatLoading && currentSectionIdForChat === section.id}
                    sectionRef={sectionRefs.current[section.id]}
                    onClick={() => setActiveSectionWithManualFlag(section.id)}
                    useLargerFonts={true}
                  />
                );
              })}

            {/* Research Approach Toggle */}
            <ResearchApproachToggle
              activeApproach={activeApproach}
              setActiveApproach={handleApproachToggle}
            />

            {/* Display active approach section */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => (section?.id === 'hypothesis' || section?.id === 'needsresearch' || section?.id === 'exploratoryresearch') && section?.id === activeApproach)
              .map((section) => {
                if (!section || !section.id) return null;
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
                    handleFirstVersionFinished={() => handleFirstVersionFinished(section.id)}
                    loading={chatLoading && currentSectionIdForChat === section.id}
                    sectionRef={sectionRefs.current[section.id]}
                    onClick={() => setActiveSectionWithManualFlag(section.id)}
                    useLargerFonts={true}
                  />
                );
              })}

            {/* Related Papers Section */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => section?.id === 'relatedpapers')
              .map((section) => {
                if (!section || !section.id) return null;
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
                    handleFirstVersionFinished={() => handleFirstVersionFinished(section.id)}
                    loading={chatLoading && currentSectionIdForChat === section.id}
                    sectionRef={sectionRefs.current[section.id]}
                    onClick={() => setActiveSectionWithManualFlag(section.id)}
                    useLargerFonts={true}
                  />
                );
              })}

            {/* Data Acquisition Toggle */}
            <DataAcquisitionToggle
              activeMethod={activeDataMethod}
              setActiveMethod={handleDataMethodToggle}
            />

            {/* Display active data acquisition section */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => (section?.id === 'experiment' || section?.id === 'existingdata') && section?.id === activeDataMethod)
              .map((section) => {
                if (!section || !section.id) return null;
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
                    handleFirstVersionFinished={() => handleFirstVersionFinished(section.id)}
                    loading={chatLoading && currentSectionIdForChat === section.id}
                    sectionRef={sectionRefs.current[section.id]}
                    onClick={() => setActiveSectionWithManualFlag(section.id)}
                    useLargerFonts={true}
                  />
                );
              })}

            {/* Display remaining sections: Analysis, Process, Abstract */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => section?.id === 'analysis' || section?.id === 'process' || section?.id === 'abstract')
              .map((section) => {
                if (!section || !section.id) return null;
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

        {/* Render ExamplesDialog */}
        <ExamplesDialog
            showExamplesDialog={showExamplesDialog}
            setShowExamplesDialog={setShowExamplesDialog}
            loadProject={loadProject}
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
