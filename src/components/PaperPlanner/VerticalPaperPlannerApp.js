// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
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
import ReviewPaperButton from '../buttons/ReviewPaperButton';
import ReviewPaperModal from '../modals/ReviewPaperModal';
import ImprovementReminderToast from '../toasts/ImprovementReminderToast';
import AppHeader from '../layout/AppHeader';
import PrivacyPolicyModal from '../modals/PrivacyPolicyModal';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import { reviewScientificPaper } from '../../services/paperReviewService';
import {
  trackSectionChange,
  trackInstructionImprovement,
  trackApproachToggle,
  trackDataMethodToggle,
  trackExport,
  trackSave,
  trackEvent
} from '../../utils/analyticsUtils';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Paper Planner with research approach and data acquisition toggles
 * REFACTORED: Added "Review Paper" functionality
 * UPDATED: Added ReviewPaperButton and ReviewPaperModal components
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
  const [showSaveDialog, setShowSaveDialog] = useState(false); // State for save dialog
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false); // State for privacy policy
  const [reviewLoading, setReviewLoading] = useState(false); // New state for review loading
  const [showReviewModal, setShowReviewModal] = useState(false); // New state for review modal
  const [reviewData, setReviewData] = useState(null); // New state for review data
  const sectionRefs = useRef({});
  
  // New states for tracking improvement reminders
  const [lastImprovementTime, setLastImprovementTime] = useState(Date.now());
  const [editEvents, setEditEvents] = useState([]);
  const [significantEditsMade, setSignificantEditsMade] = useState(false);

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

  // Track initial pageview with GA4
  useEffect(() => {
    // Track initial pageview
    ReactGA.send({ 
      hitType: "pageview", 
      page: `/section/${activeSection}` 
    });
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
    
    // Track this section change in analytics
    const sectionTitle = localSectionContent.sections.find(s => s?.id === sectionId)?.title || 'Unknown';
    trackSectionChange(sectionId, sectionTitle);
  };

  // Helper to check if section has meaningful content beyond placeholder
  const hasSectionContent = (sectionId) => {
    const content = userInputs[sectionId];
    const section = localSectionContent?.sections?.find(s => s?.id === sectionId);
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

  // Handle edit events for improvement reminder
  const handleEdit = (sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'edit' }]);
  };

  // Handle significant edit events for improvement reminder
  const handleSignificantEdit = (sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'significant' }]);
    setSignificantEditsMade(true);
  };

  // Handle magic (improving instructions) with analytics tracking
  const handleMagic = async () => {
    // Don't allow instruction improvement during loading
    if (loading) return;
    
    // Track improvement attempt in analytics
    trackInstructionImprovement(activeSection);
    
    // Track when improvement was last used
    setLastImprovementTime(Date.now());
    // Reset significant edits flag
    setSignificantEditsMade(false);
    // Clear edit events
    setEditEvents([]);
    
    setImprovingInstructions(true);
    try {
      console.log("Calling improveBatchInstructions...");
      const result = await improveBatchInstructions(
        localSectionContent.sections,
        userInputs,
        sectionContent
      );

      console.log("Received result from improveBatchInstructions:", result.success);

      if (result.success && result.improvedData && result.improvedData.length > 0) {
        console.log("Processing improved data...", result.improvedData.length);
        
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
              const isComplete = item.editedInstructions?.includes('Excellent work') ||
                                item.editedInstructions?.includes('Great job') ||
                                item.editedInstructions?.includes('Well done') ||
                                item.editedInstructions?.includes('completed all');

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
        
        console.log("Instruction improvement completed successfully");
      } else {
        console.warn("No improved data received from API");
      }
    } catch (error) {
      console.error("[handleMagic] Error during improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
  };

  // Handle paper review with tracking
  const handleReviewPaper = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setReviewLoading(true);
    try {
      // Track this event in analytics
      trackEvent('Paper Review', 'Start Review', file.type);
      
      // Show a loading indicator
      const result = await reviewScientificPaper(file);
      
      if (result.success) {
        // Set the review data state
        setReviewData(result);
        // Show the review modal
        setShowReviewModal(true);
        // Track successful review
        trackEvent('Paper Review', 'Review Success', file.name);
      } else {
        // Handle errors
        alert(`Error reviewing paper: ${result.error || 'Unknown error'}`);
        // Track failed review
        trackEvent('Paper Review', 'Review Error', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error in review process:", error);
      alert(`Failed to review paper: ${error.message || 'Unknown error occurred'}`);
      // Track exception
      trackEvent('Paper Review', 'Exception', error.message || 'Unknown error');
    } finally {
      setReviewLoading(false);
    }
  };

  // Combine local reset logic with hook's reset logic and add analytics
  const handleResetRequest = () => {
    // Track reset action
    ReactGA.event({
      category: 'Document Actions',
      action: 'Reset Project'
    });
    
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
    
    // Reset improvement reminder state
    setLastImprovementTime(Date.now());
    setEditEvents([]);
    setSignificantEditsMade(false);
  };

  // Modified save function to show dialog with analytics
  const handleSaveProject = () => {
    // Track save action
    trackSave();
    setShowSaveDialog(true);
  };

  // Handle export with analytics
  const handleExportRequest = () => {
    // Track export action
    trackExport('any');
    exportProject();
  };

  // Function to actually save the project with filename from dialog
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

  // Handle approach toggle with analytics
  const handleApproachToggle = (approach) => {
    setActiveApproach(approach);
    setActiveSectionWithManualFlag(approach);
    
    // Track approach toggle in analytics
    trackApproachToggle(approach);
  };

  // Handle data method toggle with analytics
  const handleDataMethodToggle = (method) => {
    setActiveDataMethod(method);
    setActiveSectionWithManualFlag(method);
    
    // Track data method toggle in analytics
    trackDataMethodToggle(method);
  };

  // Render a section with proper completion status
  const renderSection = (section) => {
    if (!section || !section.id) return null;

    const isCurrentActive = activeSection === section.id;
    
    // We still calculate completionStatus internally but don't use it for styling
    const completionStatus = sectionCompletionStatus[section.id] || getSectionCompletionStatus(section.id);

    return (
      <SectionCard
        key={section.id}
        section={section}
        isCurrentSection={isCurrentActive}
        completionStatus={completionStatus} // Still pass it for internal use if needed
        userInputs={userInputs}
        handleInputChange={handleInputChange}
        loading={chatLoading && currentSectionIdForChat === section.id}
        sectionRef={sectionRefs.current[section.id]}
        onClick={() => setActiveSectionWithManualFlag(section.id)}
        useLargerFonts={false} // Use smaller fonts for more compact layout
        onEdit={handleEdit}
        onSignificantEdit={handleSignificantEdit}
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

  // Combined loading state to properly disable buttons
  const isAnyLoading = loading || chatLoading || improvingInstructions || reviewLoading;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="w-full pb-6"> {/* Reduced bottom padding */}
        {/* Use imported AppHeader component with props */}
        <AppHeader
          resetProject={() => setShowConfirmDialog(true)}
          exportProject={handleExportRequest}
          saveProject={handleSaveProject}
          loadProject={loadProject}
          importDocumentContent={handleDocumentImport}
          reviewPaper={handleReviewPaper} // Add review paper function
          setShowExamplesDialog={setShowExamplesDialog}
          showHelpSplash={showHelpSplash}
          loading={isAnyLoading}
        />

        {/* Main content area */}
        <div style={{ paddingTop: '40px' }}>
          <div className="flex">
            {/* Left panel with full half-width */}
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

              {/* Target Audience section after Research Approach block */}
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
                .filter(section => (section?.id === 'experiment' || section?.id === 'existingdata' || section?.id === 'theorysimulation') && section?.id === activeDataMethod)
                .map(section => renderSection(section))}

              {/* Display remaining sections: Analysis, Process, Abstract */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => section?.id === 'analysis' || section?.id === 'process' || section?.id === 'abstract')
                .map(section => renderSection(section))}
            </div>
          </div>

          {/* Fixed-height footer with Privacy Policy link */}
          <div className="text-center text-gray-500 text-sm mt-6 border-t border-gray-200 pt-3 pb-3 bg-white">
            <p>
              Scientific Paper Planner • Designed with Love for Researchers by Konrad @Kordinglab • {new Date().getFullYear()}
              <span className="mx-2">•</span>
              <button 
                onClick={() => {
                  setShowPrivacyPolicy(true);
                  // Track when users view the privacy policy
                  ReactGA.event({
                    category: 'Footer',
                    action: 'Open Privacy Policy'
                  });
                }}
                className="text-blue-500 hover:text-blue-700 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>

        <FullHeightInstructionsPanel
          currentSection={sectionDataForPanel}
          improveInstructions={handleMagic}
          loading={improvingInstructions}
          userInputs={userInputs}
        />

        {/* Improvement Reminder Toast */}
        <ImprovementReminderToast
          userInputs={userInputs}
          lastImprovementTime={lastImprovementTime}
          editEvents={editEvents}
          significantEditsMade={significantEditsMade}
          handleMagicClick={handleMagic}
        />

        {/* Floating Magic Button */}
        <FloatingMagicButton
          handleMagicClick={handleMagic}
          loading={improvingInstructions || loading}
          onboardingStep={onboardingStep}
        />

        {/* Review Paper Button - NEW */}
        <ReviewPaperButton
          handleReviewPaper={handleReviewPaper}
          loading={reviewLoading}
          onboardingStep={onboardingStep}
        />

        <ModernChatInterface
          currentSection={currentSectionIdForChat}
          currentSectionTitle={sectionDataForPanel?.title}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={chatLoading || loading}
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

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal 
          showModal={showPrivacyPolicy} 
          onClose={() => setShowPrivacyPolicy(false)} 
        />

        {/* Save Dialog */}
        <SaveDialog
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          saveProject={saveProjectWithFilename}
        />

        {/* Review Paper Modal - NEW */}
        <ReviewPaperModal
          showModal={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          reviewData={reviewData}
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
