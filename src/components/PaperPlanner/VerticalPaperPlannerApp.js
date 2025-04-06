// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
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
 * UPDATED: Fixed right panel overlapping footer using Flexbox layout
 * UPDATED: Aligned right panel top/bottom with left cards via container padding
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Receive the *entire* hook result as a prop
  const {
    currentSection: currentSectionIdForChat,
    currentSectionData,  // NEW: Get the section data from the hook
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
    saveProject,
    loadProject,
    importDocumentContent
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

  // Helper to check if section has meaningful content beyond placeholder
  const hasSectionContent = (sectionId) => {
    const content = userInputs[sectionId];
    const section = localSectionContent.sections.find(s => s?.id === sectionId);
    const placeholder = section?.placeholder || '';
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content);
    // Consider it 'completed' if it's not empty and different from placeholder
    return stringContent && stringContent.trim() !== '' && stringContent !== placeholder;
  };

  // MUCH MORE GENEROUS completion status detection
  const getSectionCompletionStatus = (sectionId) => {
    // If there's an explicit completion status from the AI, use it
    if (sectionCompletionStatus[sectionId]) {
      return sectionCompletionStatus[sectionId];
    }

    // Get content and template
    const content = userInputs[sectionId];
    if (!content || content.trim() === '') {
      return 'unstarted';
    }

    const section = localSectionContent.sections.find(s => s?.id === sectionId);
    const placeholder = section?.placeholder || '';

    // If content is exactly the placeholder, it's unstarted
    if (content === placeholder) {
      return 'unstarted';
    }

    // VERY GENEROUS GRADING:
    // If they've written anything meaningful beyond the template, mark it as complete

    // Check if the content has actual text that differs from placeholder
    if (content !== placeholder && content.trim().length > 0) {
      // If they've filled in at least the minimum amount of information expected
      // For example, in hypothesis they need: two hypotheses and why they matter
      // In audience they need: communities and specific researchers

      // Count the number of filled lines or sections
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const placeholderLines = placeholder.split('\n').filter(line => line.trim().length > 0);

      // For most sections, if they filled in at least 50% of expected points, mark complete
      // This is a much more generous threshold than before
      if (lines.length >= placeholderLines.length * 0.5) {
        // Additional section-specific checks for certain key fields
        if (sectionId === 'hypothesis') {
          // For hypothesis, check if they have two hypotheses and at least one reason
          // looking for lines that start with "Hypothesis 1", "Hypothesis 2", and at least one "-" item
          const hasH1 = content.includes('Hypothesis 1:');
          const hasH2 = content.includes('Hypothesis 2:');
          const hasReason = content.includes('-');

          if (hasH1 && hasH2) {
            return 'complete';
          }
        }
        else if (sectionId === 'audience') {
          // For audience, check if they've listed at least one community and one researcher
          const communitySection = content.includes('Target Audience/Community');
          const researcherSection = content.includes('Specific Researchers/Labs');
          const hasItems = content.includes('1.') && (content.includes('2.') || content.includes('- '));

          if (communitySection && researcherSection && hasItems) {
            return 'complete';
          }
        }
        else if (sectionId === 'question') {
          // For research question, check if they have both question and significance
          const hasQuestion = content.includes('Research Question:');
          const hasSignificance = content.includes('Significance/Impact:');

          if (hasQuestion && hasSignificance) {
            return 'complete';
          }
        }
        else {
          // For all other sections, be very generous - if they've written more than a few lines
          if (content.length > 50 && lines.length >= 3) {
            return 'complete';
          }
        }
      }

      // If the content is substantial but doesn't meet specific criteria
      // still mark as complete if it's significantly longer than template
      if (content.length > placeholder.length * 1.2) {
        return 'complete';
      }

      // If it's not clearly complete but they've made progress, mark as progress
      return 'progress';
    }

    return 'unstarted';
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
    // Use activeSection which tracks the manually focused section
    const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection) || null;
    return sectionData;
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
            // Make this much more generous - almost anything with feedback should be "complete"
            const userContent = userInputs[item.id] || '';

            if (userContent.trim() !== '') {
              // Check if there's any feedback - if so, mark as complete
              if (item.feedback && item.feedback.length > 20) {
                newCompletionStatuses[item.id] = 'complete';
                return;
              }

              // Check for congratulatory messages in editedInstructions
              const isComplete = item.editedInstructions.includes('Excellent work') ||
                                item.editedInstructions.includes('Great job') ||
                                item.editedInstructions.includes('Well done') ||
                                item.editedInstructions.includes('completed all');

              // MORE GENEROUS MARKING:
              // If they've written anything substantial, mark as complete
              const section = localSectionContent.sections.find(s => s?.id === item.id);
              const placeholder = section?.placeholder || '';

              if (isComplete || userContent.length > placeholder.length * 1.2) {
                newCompletionStatuses[item.id] = 'complete';
              } else if (userContent.trim() !== '' && userContent !== placeholder) {
                // If they've done some work, mark as progress
                newCompletionStatuses[item.id] = 'progress';
              } else {
                newCompletionStatuses[item.id] = 'unstarted';
              }
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

  // Render a section with proper completion status
  const renderSection = (section) => {
    if (!section || !section.id) return null;

    // Use activeSection to determine the *focused* card, not currentSectionIdForChat
    const isCurrentActive = activeSection === section.id;

    // Get completion status from explicit state or calculate it
    const completionStatus = sectionCompletionStatus[section.id] || getSectionCompletionStatus(section.id);

    return (
      <SectionCard
        key={section.id}
        section={section}
        isCurrentSection={isCurrentActive}
        completionStatus={completionStatus} // Explicitly pass the completion status
        userInputs={userInputs}
        handleInputChange={handleInputChange}
        loading={chatLoading && currentSectionIdForChat === section.id} // Loading applies based on chat context
        sectionRef={sectionRefs.current[section.id]}
        onClick={() => setActiveSectionWithManualFlag(section.id)} // Set the active section on click
        useLargerFonts={true}
      />
    );
  };

  return (
    // Use Flexbox for overall page structure
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader
        activeSection={activeSection} // Pass the locally tracked active section
        setActiveSection={setActiveSectionWithManualFlag}
        handleSectionChange={handleSectionChange}
        scrollToSection={scrollToSection}
        resetProject={() => setShowConfirmDialog(true)} // Trigger dialog from hook state
        exportProject={exportProject} // From hook
        saveProject={saveProject} // From hook
        loadProject={loadProject} // From hook
        importDocumentContent={importDocumentContent} // Pass document import function
        setShowExamplesDialog={setShowExamplesDialog} // Pass setter from hook to header
      />

      {/* Main Content Area (Flex Grow) */}
      <div className="flex flex-grow w-full"> {/* Make this row take remaining space */}
        {/* Left Side Sections (Scrollable if needed) */}
        {/* Container has px-8 and py-6 */}
        <div className="w-1/2 px-8 py-6 overflow-y-auto">
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

        {/* Right Side Instructions Panel Container */}
        {/* Added matching py-6 for vertical alignment */}
        {/* Adjusted horizontal padding (pl-4 pr-8) */}
        {/* Removed border-l (panel itself will have border) */}
        {/* Added overflow-hidden */}
        <div className="w-1/2 py-6 pl-4 pr-8 overflow-hidden">
            <FullHeightInstructionsPanel
              currentSection={sectionDataForPanel}
              improveInstructions={handleMagic}
              loading={improvingInstructions}
              userInputs={userInputs}
            />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-gray-500 text-base mt-auto border-t border-gray-200 pt-6 pb-6">
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• {new Date().getFullYear()}</p>
      </div>

      {/* Chat Interface (Positioned Fixed or Absolute as needed) */}
      {/* Note: ModernChatInterface might need its own positioning adjustments */}
      <ModernChatInterface
        currentSection={currentSectionIdForChat} // From hook (needed for messages)
        currentSectionTitle={sectionDataForPanel?.title} // Pass the title
        chatMessages={chatMessages} // From hook
        currentMessage={currentMessage} // From hook
        setCurrentMessage={setCurrentMessage} // From hook
        handleSendMessage={handleSendMessage} // From hook
        loading={chatLoading} // From hook
        currentSectionData={sectionDataForPanel} // Pass the full section data including AI-edited instructions
      />

      {/* Dialogs */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog} // From hook
        setShowConfirmDialog={setShowConfirmDialog} // From hook
        resetProject={handleResetRequest} // Use combined reset handler
      />
      <ExamplesDialog
          showExamplesDialog={showExamplesDialog}
          setShowExamplesDialog={setShowExamplesDialog}
          loadProject={loadProject}
      />
    </div>
  );
};

export default VerticalPaperPlannerApp;
