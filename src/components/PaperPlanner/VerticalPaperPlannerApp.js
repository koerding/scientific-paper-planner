// Updated VerticalPaperPlannerApp.js with saveProject support
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
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
 * UPDATED: Added saveProject functionality
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Receive the *entire* hook result as a prop
  const {
    currentSection: currentSectionIdForChat,
    userInputs,
    chatMessages,
    currentMessage,
    loading: chatLoading,
    showConfirmDialog,
    showExamplesDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject: hookResetProject,
    exportProject,
    saveProject, // NEW: Extract saveProject from hook
    loadProject
  } = usePaperPlannerHook; // Destructure the hook data here

  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
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

  // Effect for initial active section setting based on hook
  useEffect(() => {
      setActiveSection(currentSectionIdForChat);
  }, [currentSectionIdForChat]);

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

  // Render a section with proper completion status
  const renderSection = (section) => {
    if (!section || !section.id) return null;
    
    const isCurrentActive = activeSection === section.id;
    
    // Get completion status from explicit state or calculate it
    const completionStatus = sectionCompletionStatus[section.id] || getSectionCompletionStatus(section.id);
    
    console.log(`Rendering section ${section.id} with status:`, completionStatus);
    
    return (
      <SectionCard
        key={section.id}
        section={section}
        isCurrentSection={isCurrentActive}
        completionStatus={completionStatus} // Explicitly pass the completion status
        userInputs={userInputs}
        handleInputChange={handleInputChange}
        loading={chatLoading && currentSectionIdForChat === section.id}
        sectionRef={sectionRefs.current[section.id]}
        onClick={() => setActiveSectionWithManualFlag(section.id)}
        useLargerFonts={true}
      />
    );
};

export default VerticalPaperPlannerApp;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-12">
        <AppHeader
          activeSection={activeSection}
          setActiveSection={setActiveSectionWithManualFlag}
          handleSectionChange={handleSectionChange}
          scrollToSection={scrollToSection}
          resetProject={() => setShowConfirmDialog(true)} // Trigger dialog from hook state
          exportProject={exportProject} // From hook
          saveProject={saveProject} // NEW: Pass save function from hook
          loadProject={loadProject} // From hook
          setShowExamplesDialog={setShowExamplesDialog} // Pass setter from hook to header
        />

        <div className="flex">
          <div className="w-1/2 px-8 py-6" style={{ marginRight: '50%' }}>
            {/* Display first two sections: Question and Audience */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => section?.id === 'question' || section?.id === 'audience')
              .map(section => renderSection(section))}

            {/* Research Approach Toggle */}
            <ResearchApproachToggle
              activeApproach={activeApproach}
              setActiveApproach={handleApproachToggle}
            />

            {/* Display active approach section */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => (section?.id === 'hypothesis' || section?.id === 'needsresearch' || section?.id === 'exploratoryresearch') && section?.id === activeApproach)
              .map(section => renderSection(section))}

            {/* Related Papers Section */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => section?.id === 'relatedpapers')
              .map(section => renderSection(section))}

            {/* Data Acquisition Toggle */}
            <DataAcquisitionToggle
              activeMethod={activeDataMethod}
              setActiveMethod={handleDataMethodToggle}
            />

            {/* Display active data acquisition section */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => (section?.id === 'experiment' || section?.id === 'existingdata') && section?.id === activeDataMethod)
              .map(section => renderSection(section))}

            {/* Display remaining sections: Analysis, Process, Abstract */}
            {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
              .filter(section => section?.id === 'analysis' || section?.id === 'process' || section?.id === 'abstract')
              .map(section => renderSection(section))}
          </div>
        </div>

        <div className="text-center text-gray-500 text-base mt-12 border-t border-gray-200 pt-6">
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </div>

        <FullHeightInstructionsPanel
          currentSection={sectionDataForPanel} // Pass data from local state
          improveInstructions={handleMagic} // Updated to handleMagic
          loading={improvingInstructions}
        />

        <ModernChatInterface
          currentSection={currentSectionIdForChat} // From hook
          chatMessages={chatMessages} // From hook
          currentMessage={currentMessage} // From hook
          setCurrentMessage={setCurrentMessage} // From hook
          handleSendMessage={handleSendMessage} // From hook
          loading={chatLoading} // From hook
        />

        <ConfirmDialog
          showConfirmDialog={showConfirmDialog} // From hook
          setShowConfirmDialog={setShowConfirmDialog} // From hook
          resetProject={handleResetRequest} // Use combined reset handler
        />

        {/* Render ExamplesDialog, passing props from hook */}
        <ExamplesDialog
            showExamplesDialog={showExamplesDialog}
            setShowExamplesDialog={setShowExamplesDialog}
            loadProject={loadProject}
        />
      </div>
    </div>
  );

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
      setActiveSection(sectionContent?.sections?.[0]?.id || 'question'); // Reset active section locally safely
      setActiveApproach('hypothesis'); // Reset active approach
      setActiveDataMethod('experiment'); // Reset active data method
      setSectionCompletionStatus({}); // Reset completion statuses
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

  // Get the current section data *from local state* for instructions display
  const getCurrentSectionData = () => {
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) {
        return null;
    }
    return localSectionContent.sections.find(s => s && s.id === activeSection) || null;
  };

  // Handle magic (formerly improving instructions)
  const handleMagic = async () => {
    setImprovingInstructions(true);
    try {
      const result = await improveBatchInstructions(
        localSectionContent.sections, // Pass current sections (potentially already improved)
        userInputs,
        sectionContent // Pass original structure for context if needed by AI prompt generation
      );

      if (result.success && result.improvedData && result.improvedData.length > 0) {
        // Update the instruction content
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent, // Update based on current local state
          result.improvedData
        );
        setLocalSectionContent(updatedSections); // Set the new state
        
        // Process completion status explicitly
        const newCompletionStatuses = {};
        
        result.improvedData.forEach(item => {
          console.log(`Processing completion status for ${item.id}:`, item);
          
          // First check for explicit completionStatus field from the API
          if (item.completionStatus) {
            newCompletionStatuses[item.id] = item.completionStatus;
          }
          // Alternatively, analyze content for completion markers
          else {
            // Check for congratulatory messages in editedInstructions
            const isComplete = item.editedInstructions.includes('Excellent work') || 
                              item.editedInstructions.includes('Great job') ||
                              item.editedInstructions.includes('Well done') ||
                              item.editedInstructions.includes('completed all');
                              
            // Check for substantial remaining instructions
            const hasSubstantialInstructions = item.editedInstructions.includes('Point') ||
                                             item.editedInstructions.includes('Step') ||
                                             item.editedInstructions.includes('still need');
            
            if (isComplete) {
              newCompletionStatuses[item.id] = 'complete';
            } else if (hasSubstantialInstructions) {
              newCompletionStatuses[item.id] = 'progress';
            } else {
              newCompletionStatuses[item.id] = 'unstarted';
            }
          }
        });
        
        console.log("Updating section completion statuses:", newCompletionStatuses);
        
        // Set the new completion statuses
        setSectionCompletionStatus(prevStatus => ({
          ...prevStatus,
          ...newCompletionStatuses
        }));
      } else {
        console.error("[handleMagic] Failed to improve instructions:", result.message || "No improved instructions returned.");
      }
    } catch (error) {
      console.error("[handleMagic] Error during improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
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

  // Determine completion status for a section
  const getSectionCompletionStatus = (sectionId) => {
    // If there's an explicit completion status from the AI, use it
    if (sectionCompletionStatus[sectionId]) {
      return sectionCompletionStatus[sectionId];
    }
    
    // Otherwise, determine based on content length and feedback
    const content = userInputs[sectionId];
    if (!content || content.trim() === '') {
      return 'unstarted';
    }
    
    // Check if the section has a placeholder and if the content is different
    const section = localSectionContent.sections.find(s => s?.id === sectionId);
    const placeholder = section?.placeholder || '';
    
    if (content === placeholder) {
      return 'unstarted';
    }
    
    // Basic content length check (a very basic heuristic)
    // A better approach would be to analyze the actual quality via the AI
    if (content.length > placeholder.length * 1.5) {
      return 'progress';
    }
    
    return 'unstarted';
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId]?.current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    handleSectionChange(sectionId); // Update context for chat/API calls in the hook
  };
