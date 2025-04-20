// Function to handle section expansion and ensure activeSection is updated
  const handleToggleSectionExpansion = (sectionId) => {
    // First, update the active section to ensure instructions panel shows the right content
    setActiveSection(sectionId);
    
    // Then toggle the expansion state
    toggleSectionExpansion(sectionId);
  };// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js - Updated with sequential mode

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
import ReviewPaperModal from '../modals/ReviewPaperModal';
import ImprovementReminderToast from '../toasts/ImprovementReminderToast';
import AppHeader from '../layout/AppHeader';
import PrivacyPolicyModal from '../modals/PrivacyPolicyModal';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';
import { reviewScientificPaper } from '../../services/paperReviewService';
import HeaderCard from '../sections/HeaderCard';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
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
 * Enhanced Project Planner with sequential mode
 * Scientific project planning tool with AI-assisted features
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
    loadProject,
    importDocumentContent,
    // NEW: Sequential mode states and handlers
    expandedSections,
    sectionStatus,
    toggleSectionExpansion,
    handleSectionFeedback
  } = usePaperPlannerHook;

  // Core state
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Review-related state
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Improvement reminder state
  const [lastImprovementTime, setLastImprovementTime] = useState(Date.now());
  const [editEvents, setEditEvents] = useState([]);
  const [significantEditsMade, setSignificantEditsMade] = useState(false);
  
  // Refs
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // Local state for instructions potentially modified by AI
  const [localSectionContent, setLocalSectionContent] = useState(() => {
    try {
      return JSON.parse(JSON.stringify(sectionContent));
    } catch (e) {
      console.error("Failed to parse initial sectionContent", e);
      return { sections: [] };
    }
  });

  // Make splash screen ref globally available
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
  }, []);

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

  // Effect for keeping activeSection and currentSectionIdForChat in sync
  useEffect(() => {
    setActiveSection(currentSectionIdForChat);
  }, [currentSectionIdForChat]);

  // Also sync in the other direction - when activeSection changes, update currentSection in the hook
  useEffect(() => {
    if (activeSection !== currentSectionIdForChat) {
      handleSectionChange(activeSection);
    }
  }, [activeSection, currentSectionIdForChat, handleSectionChange]);

  // Track initial pageview
  useEffect(() => {
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
    }

    // Set active data method based on modified content
    if (isModified('experiment')) {
      setActiveDataMethod('experiment');
    } else if (isModified('existingdata')) {
      setActiveDataMethod('existingdata');
    } else if (isModified('theorysimulation')) {
      setActiveDataMethod('theorysimulation');
    }
  }, [userInputs, localSectionContent.sections]);

  // Section handling functions
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
    
    // Track this section change in analytics
    const sectionTitle = localSectionContent.sections.find(s => s?.id === sectionId)?.title || 'Unknown';
    trackSectionChange(sectionId, sectionTitle);
  };

  // Get the current section data for instructions display
  const getCurrentSectionData = () => {
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) {
      return null;
    }
    
    // Find the section matching activeSection (which tracks the cursor/active section)
    return localSectionContent.sections.find(s => s && s.id === activeSection) || null;
  };

  // Edit tracking
  const handleEdit = (sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'edit' }]);
  };

  const handleSignificantEdit = (sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'significant' }]);
    setSignificantEditsMade(true);
  };

  // Handle magic (improving instructions)
  const handleMagic = async () => {
    if (isAnyAiLoading) return;
    
    trackInstructionImprovement(activeSection);
    setLastImprovementTime(Date.now());
    setSignificantEditsMade(false);
    setEditEvents([]);
    
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
      }
    } catch (error) {
      console.error("[handleMagic] Error during improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
  };

  // Handle opening the review modal without uploading a file
  const handleOpenReviewModal = () => {
    setShowReviewModal(true);
  };

  // Handle paper review with file upload
  const handleReviewPaper = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setReviewLoading(true);
    try {
      // Call the paper review service
      console.log(`Starting paper review for: ${file.name}`);
      const result = await reviewScientificPaper(file);
      
      if (result.success) {
        console.log(`Review completed successfully for: ${file.name}`);
        // Set the review data and show the modal
        setReviewData(result);
        setShowReviewModal(true);
        
        // Track review completion in analytics
        trackEvent('Paper Review', 'Complete Review', file.name);
      } else {
        console.error(`Review failed for: ${file.name}`, result.error);
        // Show error message
        alert(`Error reviewing paper: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error in paper review:", error);
      alert(`Error reviewing paper: ${error.message || 'Unknown error'}`);
    } finally {
      setReviewLoading(false);
    }
  };

  // Show splash screen
  const handleShowHelpSplash = () => {
    if (splashManagerRef.current) {
      console.log("Showing splash screen via ref");
      splashManagerRef.current.showSplash();
    } else {
      // Fallback method
      console.log("Showing splash screen via localStorage fallback");
      localStorage.removeItem('hideWelcomeSplash');
      window.location.reload();
    }
  };

  // Project management
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
    
    // Reset improvement reminder state
    setLastImprovementTime(Date.now());
    setEditEvents([]);
    setSignificantEditsMade(false);
  };

  // Save project
  const handleSaveProject = () => {
    trackSave();
    setShowSaveDialog(true);
  };

  // Export project
  const handleExportRequest = () => {
    trackExport('any');
    exportProject();
  };

  // Save project with filename
  const saveProjectWithFilename = (fileName) => {
    try {
      const safeFileName = fileName.trim() || 'scientific-project-plan';
      const finalFileName = safeFileName.endsWith('.json') ? safeFileName : `${safeFileName}.json`;
      
      const jsonData = {
        userInputs: userInputs,
        chatMessages: chatMessages,
        timestamp: new Date().toISOString(),
        version: "1.0-direct-from-component"
      };

      const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);

      const link = document.createElement('a');
      link.href = jsonUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      
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

  // Get current section data for UI
  const sectionDataForPanel = getCurrentSectionData();

  // Toggle handling
  const handleApproachToggle = (approach) => {
    setActiveApproach(approach);
    setActiveSectionWithManualFlag(approach);
    trackApproachToggle(approach);
    
    // Don't automatically expand the section when selected from the toggle
    // Just update which approach is active in state
  };

  const handleDataMethodToggle = (method) => {
    setActiveDataMethod(method);
    setActiveSectionWithManualFlag(method);
    trackDataMethodToggle(method);
    
    // Don't automatically expand the section when selected from the toggle
    // Just update which data method is active in state
  };

  // Rendering
  const renderSection = (section) => {
    if (!section || !section.id) return null;

    const isCurrentActive = activeSection === section.id;
    const isExpanded = !!expandedSections[section.id];
    const currentStatus = sectionStatus[section.id] || 'none';
    
    return (
      <SectionCard
        key={section.id}
        section={section}
        isExpanded={isExpanded}
        onToggleExpand={() => handleToggleSectionExpansion(section.id)}
        isCurrentSection={isCurrentActive}
        userInputs={userInputs}
        handleInputChange={handleInputChange}
        loading={isAnyAiLoading}
        sectionRef={sectionRefs.current[section.id]}
        onClick={() => setActiveSectionWithManualFlag(section.id)}
        onEdit={handleEdit}
        onSignificantEdit={handleSignificantEdit}
        feedbackStatus={currentStatus}
        onGetFeedback={handleSectionFeedback}
      />
    );
  };

  // Handle document import with loading state
  const handleDocumentImport = async (file) => {
    setLoading(true);
    try {
      await importDocumentContent(file);
    } finally {
      setLoading(false);
    }
  };

  // Combined loading state for all AI features
  const isAnyAiLoading = loading || chatLoading || improvingInstructions || reviewLoading;

  // Section display logic - UPDATED for sequential mode with toggle behavior
  const shouldDisplaySection = (sectionId) => {
    // For approach sections, only show the active one
    if (sectionId === 'hypothesis' || sectionId === 'needsresearch' || sectionId === 'exploratoryresearch') {
      return sectionId === activeApproach;
    }
    
    // For data method sections, only show the active one
    if (sectionId === 'experiment' || sectionId === 'existingdata' || sectionId === 'theorysimulation') {
      return sectionId === activeDataMethod;
    }
    
    // All other sections are always displayed
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Add the splash screen manager */}
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      
      <div className="w-full pb-6">
        {/* Header */}
        <AppHeader
          resetProject={() => setShowConfirmDialog(true)}
          exportProject={handleExportRequest}
          saveProject={handleSaveProject}
          loadProject={loadProject}
          importDocumentContent={handleDocumentImport}
          onOpenReviewModal={handleOpenReviewModal}
          setShowExamplesDialog={setShowExamplesDialog}
          showHelpSplash={handleShowHelpSplash}
          loading={isAnyAiLoading}
        />

        {/* Main content area */}
        <div style={{ paddingTop: '40px' }}>
          <div className="flex">
            {/* Left panel */}
            <div className="w-half px-4 py-2" style={{ width: '50%' }}>
              <HeaderCard />
              
              {/* Display Research Question first */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => section?.id === 'question')
                .map(section => renderSection(section))}

              {/* Research Approach Toggle */}
              <ResearchApproachToggle
                activeApproach={activeApproach}
                setActiveApproach={handleApproachToggle}
              />

              {/* Display ONLY the active approach section */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => (section?.id === 'hypothesis' || section?.id === 'needsresearch' || section?.id === 'exploratoryresearch') && section?.id === activeApproach)
                .map(section => renderSection(section))}

              {/* Target Audience section */}
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

              {/* Display ONLY the active data acquisition method section */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => (section?.id === 'experiment' || section?.id === 'existingdata' || section?.id === 'theorysimulation') && section?.id === activeDataMethod)
                .map(section => renderSection(section))}

              {/* Display remaining sections */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
                .filter(section => {
                  // Only include non-toggle sections
                  const isApproachSection = section?.id === 'hypothesis' || section?.id === 'needsresearch' || section?.id === 'exploratoryresearch';
                  const isDataMethodSection = section?.id === 'experiment' || section?.id === 'existingdata' || section?.id === 'theorysimulation';
                  const isAlreadyRendered = section?.id === 'question' || section?.id === 'audience' || section?.id === 'relatedpapers';
                  
                  // Only show remaining sections that aren't toggle sections or already rendered
                  return !isApproachSection && !isDataMethodSection && !isAlreadyRendered;
                })
                .map(section => renderSection(section))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-6 border-t border-gray-200 pt-3 pb-3 bg-white">
            <p>
              Scientific Project Planner • Designed with Love for Researchers by Konrad @Kordinglab • {new Date().getFullYear()}
              <span className="mx-2">•</span>
              <button 
                onClick={() => {
                  setShowPrivacyPolicy(true);
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

        {/* Right panel */}
        <FullHeightInstructionsPanel
          currentSection={sectionDataForPanel}
          improveInstructions={handleMagic}
          loading={isAnyAiLoading}
        />

        {/* Interactive UI elements - remove FloatingMagicButton since we have feedback buttons per section now */}
        <ImprovementReminderToast
          userInputs={userInputs}
          lastImprovementTime={lastImprovementTime}
          significantEditsMade={significantEditsMade}
          handleMagicClick={handleMagic}
        />

        <ModernChatInterface
          currentSection={currentSectionIdForChat}
          currentSectionTitle={sectionDataForPanel?.title}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={isAnyAiLoading}
          currentSectionData={sectionDataForPanel}
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

        <ReviewPaperModal
          showModal={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          reviewData={reviewData}
          handleReviewPaper={handleReviewPaper}
        />

        <PrivacyPolicyModal 
          showModal={showPrivacyPolicy} 
          onClose={() => setShowPrivacyPolicy(false)} 
        />

        <SaveDialog
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          saveProject={saveProjectWithFilename}
        />
      </div>
      
      {/* Add additional styles for sequential mode */}
      <style jsx>{`
        /* Sequential mode styles */
        .section-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .section-card.minimized {
          max-height: 60px;
        }

        .section-card.expanded {
          max-height: 2000px; /* Large value to accommodate any content size */
        }

        /* Hover effect for minimized cards */
        .section-card.minimized:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default VerticalPaperPlannerApp;
