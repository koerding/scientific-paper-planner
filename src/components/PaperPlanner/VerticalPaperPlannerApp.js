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
