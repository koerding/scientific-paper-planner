// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
import SaveDialog from './SaveDialog';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import FloatingMagicButton from '../buttons/FloatingMagicButton';
import AppHeader from '../layout/AppHeader';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Paper Planner with research approach and data acquisition toggles
 * FIXES:
 * - Proper header spacing with paddingTop
 * - Fixed alignment between panels
 * - Improved fixed positioning for instructions panel
 * - Better handling of footer spacing
 * - Added loading animation for PDF import
 * - FIXED: Properly disable Magic button during PDF import
 * - FIXED: Added direct save implementation
 * - FIXED: Reduced overall whitespace and simplified layout
 * - FIXED: Consistent font styles between left and right panels
 * - RESTORED: Left cards layout with proper width/spacing
 * - UPDATED: Moved Target Audience section after Research Approach block
 * - ADDED: Save dialog to prompt for file name when saving
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Destructure the hook data
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
    saveProject: hookSaveProject,
    loadProject,
    importDocumentContent
  } = usePaperPlannerHook;

  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loading, setLoading] = useState(false); // Track overall loading state
  const [showSaveDialog, setShowSaveDialog] = useState(false); // New state for save dialog
  const sectionRefs = useRef({});

  // Use local state for instructions potentially modified by AI
  const [localSectionContent, setLocalSectionContent] = useState(() => {
    try {
      return JSON.parse(JSON.stringify(sectionContent));
    } catch (e) {
      console.error("Failed to parse initial sectionContent", e);
      return { sections: [] };
    }
  });

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

    // Set active approach based on modified content
    if (isModified('hypothesis')) {
      setActiveApproach('hypothesis');
    } else if (isModified('needsresearch')) {
      setActiveApproach('needsresearch');
    } else if (isModified('exploratoryresearch')) {
      setActiveApproach('exploratoryresearch');
    } else {
      setActiveApproach('hypothesis'); // Default
    }

    // Set active data method based on modified content
    if (isModified('experiment')) {
      setActiveDataMethod('experiment');
    } else if (isModified('existingdata')) {
      setActiveDataMethod('existingdata');
    } else if (isModified('theorysimulation')) {
      setActiveDataMethod('theorysimulation');
    } else {
      setActiveDataMethod('experiment'); // Default
    }
  }, [userInputs, localSectionContent.sections]);

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
    return stringContent && stringContent.trim() !== '' && stringContent !== placeholder;
  };

  // Section completion status detection
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

    // If it has meaningful content different from the placeholder
    if (content !== placeholder && content.trim().length > 0) {
      const lines = content.split('\n').filter(line => line.trim().length > 0);

      // Section-specific checks
      if (sectionId === 'hypothesis') {
        const hasH1 = content.includes('Hypothesis 1:');
        const hasH2 = content.includes('Hypothesis 2:');
        const hasReason = content.includes('-');

        if (hasH1 && hasH2) {
          return 'complete';
        }
      }
      else if (sectionId === 'audience') {
        const communitySection = content.includes('Target Audience/Community');
        const researcherSection = content.includes('Specific Researchers/Labs');
        const hasItems = content.includes('1.') && (content.includes('2.') || content.includes('- '));

        if (communitySection && researcherSection && hasItems) {
          return 'complete';
        }
      }
      else if (sectionId === 'question') {
        const hasQuestion = content.includes('Research Question:');
        const hasSignificance = content.includes('Significance/Impact:');

        if (hasQuestion && hasSignificance) {
          return 'complete';
        }
      }
      else {
        // For other sections, more generous criteria
        if (content.length > 50 && lines.length >= 3) {
          return 'complete';
        }
      }

      // If content is substantially longer than template
      if (content.length > placeholder.length * 1.2) {
        return 'complete';
      }

      // Some progress but not complete
      return 'progress';
    }

    return 'unstarted';
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId]?.current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get the current section data from local state for instructions display
  const getCurrentSectionData = () => {
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) {
      return null;
    }
    const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection) || null;
    return sectionData;
  };

  // Handle magic (formerly improving instructions)
  const handleMagic = async () => {
    // FIXED: Don't allow instruction improvement during loading
    if (loading) return;
    
    setImprovingInstructions(true);
    try {
      const result = await improveBatchInstructions(
        localSectionContent.sections,
        userInputs,
        sectionContent
      );

      if (result.success && result.improvedData && result.improvedData.length > 0) {
        // Update the instruction content
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent,
          result.improvedData
        );
        setLocalSectionContent(updatedSections);

        // Process completion status
        const newCompletionStatuses = {};

        result.improvedData.forEach(item => {
          // First check for explicit completionStatus field
          if (item.completionStatus) {
            newCompletionStatuses[item.id] = item.completionStatus;
          }
          // Alternatively, analyze content for completion markers
          else {
            const userContent = userInputs[item.id] || '';

            if (userContent.trim() !== '') {
              // Check if there's any feedback
              if (item.feedback && item.feedback.length > 20) {
                newCompletionStatuses[item.id] = 'complete';
                return;
              }

              // Check for congratulatory messages
              const isComplete = item.editedInstructions.includes('Excellent work') ||
                                item.editedInstructions.includes('Great job') ||
                                item.editedInstructions.includes('Well done') ||
                                item.editedInstructions.includes('completed all');

              // Compare with placeholder
              const section = localSectionContent.sections.find(s => s?.id === item.id);
              const placeholder = section?.placeholder || '';

              if (isComplete || userContent.length > placeholder.length * 1.2) {
                newCompletionStatuses[item.id] = 'complete';
              } else if (userContent.trim() !== '' && userContent !== placeholder) {
                newCompletionStatuses[item.id] = 'progress';
              } else {
                newCompletionStatuses[item.id] = 'unstarted';
              }
            }
          }
        });

        // Set the new completion statuses
        setSectionCompletionStatus(prevStatus => ({
          ...prevStatus,
          ...newCompletionStatuses
        }));
      }
    } catch (error) {
      console.error("[handleMagic] Error during improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
  };

  // Combine local reset logic with hook's reset logic
  const handleResetRequest = () => {
    hookResetProject();
    // Reset local instructions state
    try {
      setLocalSectionContent(JSON.parse(JSON.stringify(sectionContent)));
    } catch(e) {
      console.error("Failed to reset local section content:", e);
      setLocalSectionContent({ sections: [] });
    }
    setActiveSection(sectionContent?.sections?.[0]?.id || 'question');
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
    setSectionCompletionStatus({});
  };

  // UPDATED: Modified save function to show dialog instead of direct save
  const handleSaveProject = () => {
    setShowSaveDialog(true);
  };

  // NEW: Function to actually save the project with filename from dialog
  const saveProjectWithFilename = (fileName) => {
    try {
      console.log("Save function triggered with filename:", fileName);
      
      // Generate a safe filename
      const safeFileName = fileName.trim() || 'scientific-paper-plan';
      
      // Add the .json extension if not present
      const finalFileName = safeFileName.endsWith('.json') ? safeFileName : `${safeFileName}.json`;
      
      const jsonData = {
        userInputs: userInputs,
        chatMessages: chatMessages,
        timestamp: new Date().toISOString(),
        version: "1.0-direct-from-component"
      };

      // Create the blob directly
      const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);

      // Create and trigger download link
      const link = document.createElement('a');
      link.href = jsonUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(jsonUrl);
      }, 100);
      
      console.log("Project saved successfully as:", finalFileName);
      return true;
    } catch (error) {
      console.error("Error saving project:", error);
      alert("There was an error saving your project: " + (error.message || "Unknown error"));
      return false;
    }
  };

  const sectionDataForPanel = getCurrentSectionData();

  // Check if a section should be displayed based on toggles
  const shouldDisplaySection = (sectionId) => {
    if (sectionId === 'hypothesis' || sectionId === 'needsresearch' || sectionId === 'exploratoryresearch') {
      return sectionId === activeApproach;
    }

    if (sectionId === 'experiment' || sectionId === 'existingdata' || sectionId === 'theorysimulation') {
      return sectionId === activeDataMethod;
    }

    return true; // All other sections are always displayed
  };

  // Handle approach toggle
  const handleApproachToggle = (approach) => {
    setActiveApproach(approach);
    setActiveSectionWithManualFlag(approach);
  };

  // Handle data method toggle
  const handleDataMethodToggle = (method) => {
    setActiveDataMethod(method);
    setActiveSectionWithManualFlag(method);
  };

  // Render a section with proper completion status
  const renderSection = (section) => {
    if (!section || !section.id) return null;

    const isCurrentActive = activeSection === section.id;
    const completionStatus = sectionCompletionStatus[section.id] || getSectionCompletionStatus(section.id);

    return (
      <SectionCard
        key={section.id}
        section={section}
        isCurrentSection={isCurrentActive}
        completionStatus={completionStatus}
        userInputs={userInputs}
        handleInputChange={handleInputChange}
        loading={chatLoading && currentSectionIdForChat === section.id}
        sectionRef={sectionRefs.current[section.id]}
        onClick={() => setActiveSectionWithManualFlag(section.id)}
        useLargerFonts={false} // FIXED: Use smaller fonts for more compact layout
      />
    );
  };

  // Wrapper for import document content to track loading state
  const handleDocumentImport = async (file) => {
    setLoading(true);
    try {
      await importDocumentContent(file);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Combined loading state to properly disable buttons
  const isAnyLoading = loading || chatLoading || improvingInstructions;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-6"> {/* FIXED: Reduced bottom padding */}
        {/* Use imported AppHeader component with props */}
        <AppHeader
          resetProject={() => setShowConfirmDialog(true)}
          exportProject={exportProject}
          saveProject={handleSaveProject} // UPDATED: Now shows save dialog
          loadProject={loadProject}
          importDocumentContent={handleDocumentImport}
          setShowExamplesDialog={setShowExamplesDialog}
          loading={isAnyLoading}
        />

        {/* Main content area */}
        <div style={{ paddingTop: '40px' }}>
          <div className="flex">
            {/* RESTORED: Left panel with full half-width */}
            <div className="w-half px-4 py-2" style={{ width: '50%' }}>
              {/* Display Research Question first */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => section?.id === 'question')
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

              {/* MOVED: Target Audience section after Research Approach block */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => section?.id === 'audience')
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

          {/* Fixed-height footer */}
          <div className="text-center text-gray-500 text-sm mt-6 border-t border-gray-200 pt-3 pb-3 bg-white"> {/* FIXED: Reduced padding */}
            <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad @Kordinglab • {new Date().getFullYear()}</p>
          </div>
        </div>

        <FullHeightInstructionsPanel
          currentSection={sectionDataForPanel}
          improveInstructions={handleMagic}
          loading={improvingInstructions}
          userInputs={userInputs}
        />

        {/* Floating Magic Button - FIXED: Pass proper loading state */}
        <FloatingMagicButton
          handleMagicClick={handleMagic}
          loading={improvingInstructions || loading} // Disable during either loading state
          onboardingStep={onboardingStep}
        />

        {/* Chat Interface */}
        <ModernChatInterface
          currentSection={currentSectionIdForChat}
          currentSectionTitle={sectionDataForPanel?.title}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={chatLoading}
          currentSectionData={sectionDataForPanel}
          onboardingStep={onboardingStep}
        />

        {/* Dialogs */}
        <ConfirmDialog
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          resetProject={handleResetRequest}
        />

        <ExamplesDialog
          showExamplesDialog={showExamplesDialog}
          setShowExamplesDialog={setShowExamplesDialog}
          loadProject={loadProject}
        />

        {/* NEW: Save Dialog */}
        <SaveDialog
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          saveProject={saveProjectWithFilename}
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
