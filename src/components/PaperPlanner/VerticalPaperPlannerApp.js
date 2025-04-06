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
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

// Helper function to check if onboarding has run
const hasOnboardingRun = () => {
  try {
    return localStorage.getItem('onboardingComplete') === 'true';
  } catch (e) {
    return false; // Assume it hasn't run if localStorage fails
  }
};

// Helper function to mark onboarding as complete
const markOnboardingComplete = () => {
  try {
    localStorage.setItem('onboardingComplete', 'true');
  } catch (e) {
    console.error("Failed to save onboarding status to localStorage", e);
  }
};

/**
 * Enhanced Paper Planner with research approach and data acquisition toggles
 * UPDATED: Added sequential onboarding highlight/tooltip feature
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // ... (hook destructuring and other state declarations remain the same)
   const {
    currentSection: currentSectionIdForChat,
    currentSectionData,
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
  const sectionRefs = useRef({});
  const [localSectionContent, setLocalSectionContent] = useState(() => {
      try {
          return JSON.parse(JSON.stringify(sectionContent));
      } catch (e) {
          console.error("Failed to parse initial sectionContent", e);
          return { sections: [] };
      }
  });
  const [improvingInstructions, setImprovingInstructions] = useState(false);

  // --- Onboarding State ---
  // Initialize based on whether it has run before (from localStorage)
  const [onboardingStep, setOnboardingStep] = useState(hasOnboardingRun() ? 4 : 0); // 0:Start, 1:PDF, 2:Feedback, 3:Chat, 4:Done

  // --- Onboarding Effect ---
  useEffect(() => {
    // Only run if onboarding hasn't completed
    if (onboardingStep < 4) {
      let timer;
      if (onboardingStep === 0) {
        // Start the sequence immediately if not done
        timer = setTimeout(() => setOnboardingStep(1), 500); // Brief delay before starting
      } else if (onboardingStep >= 1 && onboardingStep <= 3) {
        // Advance to the next step after a delay
        timer = setTimeout(() => {
          const nextStep = onboardingStep + 1;
          setOnboardingStep(nextStep);
          // Mark as complete when the sequence finishes (step becomes 4)
          if (nextStep === 4) {
            markOnboardingComplete();
          }
        }, 4000); // 4 seconds per step
      }
      // Clear timeout if component unmounts or step changes manually
      return () => clearTimeout(timer);
    }
  }, [onboardingStep]);

  // ... (other useEffects and handlers remain the same)
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
      const placeholders = {};
      if (localSectionContent?.sections) {
          localSectionContent.sections.forEach(s => {
              if (s?.id) placeholders[s.id] = s.placeholder || '';
          });
      }
      const isModified = (sectionId) => {
          const content = userInputs[sectionId];
          return typeof content === 'string' && content.trim() !== '' && content !== placeholders[sectionId];
      };
      if (isModified('hypothesis')) {
        setActiveApproach('hypothesis');
      } else if (isModified('needsresearch')) {
        setActiveApproach('needsresearch');
      } else if (isModified('exploratoryresearch')) {
        setActiveApproach('exploratoryresearch');
      } else {
         setActiveApproach('hypothesis');
      }
      if (isModified('experiment')) {
        setActiveDataMethod('experiment');
      } else if (isModified('existingdata')) {
        setActiveDataMethod('existingdata');
      } else {
         setActiveDataMethod('experiment');
      }
    }, [userInputs, localSectionContent.sections]);

    const setActiveSectionWithManualFlag = (sectionId) => {
      setActiveSection(sectionId);
      handleSectionChange(sectionId);
    };

    const hasSectionContent = (sectionId) => {
      // ... implementation
    };

    const getSectionCompletionStatus = (sectionId) => {
      // ... implementation
    };

    const scrollToSection = (sectionId) => {
      // ... implementation
    };

    const getCurrentSectionData = () => {
       if (!localSectionContent || !Array.isArray(localSectionContent.sections)) {
          return null;
      }
      const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection) || null;
      return sectionData;
    };

    const handleMagic = async () => {
      // ... (using improveInstructions, now called handleFeedbackClick in panel)
       setImprovingInstructions(true);
       try {
         const result = await improveBatchInstructions(localSectionContent.sections, userInputs, sectionContent);
         if (result.success && result.improvedData && result.improvedData.length > 0) {
           const updatedSections = updateSectionWithImprovedInstructions(localSectionContent, result.improvedData);
           setLocalSectionContent(updatedSections);
           const newCompletionStatuses = {};
           result.improvedData.forEach(item => {
               if (item.completionStatus) {
                 newCompletionStatuses[item.id] = item.completionStatus;
               } else {
                 const userContent = userInputs[item.id] || '';
                 if (userContent.trim() !== '') {
                   if (item.feedback && item.feedback.length > 20) {
                     newCompletionStatuses[item.id] = 'complete';
                     return;
                   }
                   const isComplete = item.editedInstructions.includes('Excellent work') || item.editedInstructions.includes('Great job') || item.editedInstructions.includes('Well done') || item.editedInstructions.includes('completed all');
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
           setSectionCompletionStatus(prevStatus => ({...prevStatus, ...newCompletionStatuses }));
         } else {
           console.error("[handleMagic] Failed to improve instructions:", result.message || "No improved instructions returned.");
         }
       } catch (error) {
         console.error("[handleMagic] Error during improvement process:", error);
       } finally {
         setImprovingInstructions(false);
       }
    };

    const handleResetRequest = () => {
        hookResetProject();
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

    const shouldDisplaySection = (sectionId) => {
      // ... implementation
    };

    const handleApproachToggle = (approach) => {
      // ... implementation
    };

    const handleDataMethodToggle = (method) => {
      // ... implementation
    };


  // Render a section with proper completion status
  const renderSection = (section) => {
    // ... (implementation remains the same)
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

  const sectionDataForPanel = getCurrentSectionData();

  return (
    // Use Flexbox for overall page structure
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header - Pass onboardingStep */}
      <AppHeader
        activeSection={activeSection}
        setActiveSection={setActiveSectionWithManualFlag}
        handleSectionChange={handleSectionChange}
        scrollToSection={scrollToSection}
        resetProject={() => setShowConfirmDialog(true)}
        exportProject={exportProject}
        saveProject={saveProject}
        loadProject={loadProject}
        importDocumentContent={importDocumentContent}
        setShowExamplesDialog={setShowExamplesDialog}
        onboardingStep={onboardingStep} // Pass onboarding state
      />

      {/* Main Content Area (Flex Grow) */}
      <div className="flex flex-grow w-full">
        {/* Left Side Sections */}
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
        <div className="w-1/2 py-6 pl-4 pr-8 overflow-hidden">
             {/* Pass onboardingStep */}
            <FullHeightInstructionsPanel
              currentSection={sectionDataForPanel}
              improveInstructions={handleMagic} // This triggers feedback logic
              loading={improvingInstructions}
              userInputs={userInputs}
              onboardingStep={onboardingStep} // Pass onboarding state
            />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-gray-500 text-base mt-auto border-t border-gray-200 pt-6 pb-6">
        {/* You can update footer text here if needed, based on previous turn */}
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• 2025</p>
      </div>

      {/* Chat Interface - Pass onboardingStep */}
      <ModernChatInterface
        currentSection={currentSectionIdForChat}
        currentSectionTitle={sectionDataForPanel?.title}
        chatMessages={chatMessages}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        handleSendMessage={handleSendMessage}
        loading={chatLoading}
        currentSectionData={sectionDataForPanel}
        onboardingStep={onboardingStep} // Pass onboarding state
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
  );
};

export default VerticalPaperPlannerApp;
