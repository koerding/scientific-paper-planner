// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import FloatingMagicButton from '../buttons/FloatingMagicButton';
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
    saveProject,
    loadProject,
    importDocumentContent
  } = usePaperPlannerHook;

  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
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
      const placeholderLines = placeholder.split('\n').filter(line => line.trim().length > 0);

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
        useLargerFonts={true}
      />
    );
  };

  // Create AppHeader component here since we can't use the import
  const AppHeader = () => {
    // Handle file import for PDF/Word docs
    const handleFileImport = (event) => {
      const file = event.target.files?.[0];
      if (file && importDocumentContent) {
        importDocumentContent(file);
      }
      event.target.value = '';
    };

    // Function to handle file selection for project loading
    const handleFileSelection = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (loadProject) {
              loadProject(data);
            }
          } catch (error) {
            console.error('Error parsing project file:', error);
            alert('Invalid project file format. Please select a valid JSON file.');
          }
        };
        reader.readAsText(file);
      }
      event.target.value = '';
    };

    return (
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center mb-2 md:mb-0">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-md flex items-center justify-center mr-3">
                <span className="font-bold text-xl">SP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Scientific Paper Planner</h1>
                <p className="text-sm text-gray-600">Design a scientific project step-by-step</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* New Project button */}
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New
              </button>

              {/* Make Example from PDF/Doc button */}
              <label className="inline-flex items-center px-3 py-2 border border-indigo-500 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Make Example from PDF/Doc
                <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileImport} />
              </label>

              {/* Save button */}
              <button
                onClick={saveProject}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </button>

              {/* Load button */}
              <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Load
                <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} />
              </label>

              {/* Examples button */}
              <button
                onClick={() => setShowExamplesDialog(true)}
                className="inline-flex items-center px-3 py-2 border border-blue-500 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Examples
              </button>

              {/* Export button */}
              <button
                onClick={exportProject}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-8">
        {/* Render inline AppHeader to avoid react-router-dom dependency */}
        <AppHeader />

        {/* Main content area */}
        <div style={{ paddingTop: '90px' }}>
          <div className="flex">
            <div className="w-half px-6 py-3" style={{ marginRight: '50%' }}>
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

          {/* Fixed-height footer */}
          <div className="text-center text-gray-500 text-sm mt-8 border-t border-gray-200 pt-4 pb-4 bg-white">
            <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
          </div>
        </div>

        <FullHeightInstructionsPanel
          currentSection={sectionDataForPanel}
          improveInstructions={handleMagic}
          loading={improvingInstructions}
          userInputs={userInputs}
        />

        {/* Floating Magic Button */}
        <FloatingMagicButton
          handleMagicClick={handleMagic}
          loading={improvingInstructions}
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
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
