import React, { useState, useEffect } from 'react';
import VerticalPaperPlannerApp from './VerticalPaperPlannerApp'; // Using your existing component
import sectionContent from '../../data/sectionContent.json';  
import { callOpenAI } from '../../services/openaiService';
import { exportProject as exportProjectFunction } from '../../utils/exportUtils';
// REMOVED: No more import of documentImportService
// import * as documentImportService from '../../services/documentImportService';
import '../../styles/PaperPlanner.css';

/**
 * Main entry point for the Paper Planner
 * Contains core state management and API calls
 */
const PaperPlannerApp = () => {
  // State - Pre-fill with templates from sectionContent
  const initialState = {};
  sectionContent.sections.forEach(section => {
    if (section && section.id) {
      // Use placeholder as initial content
      initialState[section.id] = section.placeholder || '';
    }
  });

  // Initialize states
  const [userInputs, setUserInputs] = useState(initialState);
  const [currentSection, setCurrentSection] = useState(sectionContent.sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize chat messages for each section
  useEffect(() => {
    const initialChatMessages = {};
    sectionContent.sections.forEach(section => {
      initialChatMessages[section.id] = [];
    });
    setChatMessages(initialChatMessages);
  }, []);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedInputs = localStorage.getItem('paperPlannerData');
      const savedChat = localStorage.getItem('paperPlannerChat');
      
      if (savedInputs) {
        const parsedInputs = JSON.parse(savedInputs);
        // Make sure we're not overwriting templates with empty values
        const mergedInputs = {...initialState};
        
        // Only use saved values if they exist and are different from templates
        Object.keys(parsedInputs).forEach(sectionId => {
          if (parsedInputs[sectionId] && parsedInputs[sectionId].trim() !== '') {
            mergedInputs[sectionId] = parsedInputs[sectionId];
          }
        });
        
        setUserInputs(mergedInputs);
      }
      
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
      localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [userInputs, chatMessages]);

  // Handler functions
  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sectionContent.sections.findIndex(s => s.id === sectionId));
  };

  const handleInputChange = (section, value) => {
    setUserInputs({
      ...userInputs,
      [section]: value
    });
  };

  // Send regular chat message with full context
  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;
    
    // Add user message to chat
    const newMessages = [
      ...chatMessages[currentSection], 
      { role: 'user', content: currentMessage }
    ];
    
    setChatMessages({
      ...chatMessages,
      [currentSection]: newMessages
    });
    
    setCurrentMessage('');
    setLoading(true);
    
    try {
      // Call OpenAI API with the current message and all context
      const aiResponse = await callOpenAI(
        currentMessage, 
        currentSection, 
        userInputs, 
        sectionContent.sections
      );
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...newMessages, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle "First version finished" button with llmInstructions and all section context
  const handleFirstVersionFinished = async () => {
    // Don't do anything if there's no content yet
    if (!userInputs[currentSection]) return;
    
    setLoading(true);
    
    try {
      // Simple message for the UI
      const displayMessage = "I've finished my first version. Can you provide feedback?";
      
      // Get detailed instructions from JSON
      const currentSectionObj = sectionContent.sections.find(s => s.id === currentSection);
      const aiInstructions = currentSectionObj.llmInstructions;
      
      // Add the simple message to chat for the user to see
      const newMessages = [
        ...chatMessages[currentSection], 
        { role: 'user', content: displayMessage }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: newMessages
      });
      
      // Call OpenAI API with the detailed instructions
      const aiResponse = await callOpenAI(
        aiInstructions, 
        currentSection, 
        userInputs, 
        sectionContent.sections
      );
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...chatMessages[currentSection], { role: 'user', content: "I've finished my first version. Can you provide feedback?" }, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  const resetProject = () => {
    // Reset to template values
    const freshInputs = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        freshInputs[section.id] = section.placeholder || '';
      }
    });
    setUserInputs(freshInputs);
    
    // Clear all chat messages
    const freshChatMessages = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        freshChatMessages[section.id] = [];
      }
    });
    
    setChatMessages(freshChatMessages);
    setCurrentSection(sectionContent.sections[0].id);
    
    // Clear localStorage
    localStorage.removeItem('paperPlannerData');
    localStorage.removeItem('paperPlannerChat');
  };

  const goToNextSection = () => {
    const newIndex = currentIndex + 1;
    if (newIndex < sectionContent.sections.length) {
      handleSectionChange(sectionContent.sections[newIndex].id);
    }
  };

  const goToPreviousSection = () => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      handleSectionChange(sectionContent.sections[newIndex].id);
    }
  };

  // Function to export project
  const exportProject = () => {
    exportProjectFunction(userInputs, chatMessages, sectionContent);
  };

  // Function to load project from imported JSON file - SIMPLIFIED VERSION
  const loadProject = (data) => {
    // Simple validation
    if (!data || !data.userInputs) {
      alert("Invalid project file format. Please select a valid project file.");
      return;
    }
    
    // Confirm before loading
    if (window.confirm("Loading this project will replace your current work. Are you sure you want to continue?")) {
      try {
        // Create template values using sectionContent
        const templateValues = {};
        sectionContent.sections.forEach(section => {
          if (section && section.id) {
            templateValues[section.id] = section.placeholder || '';
          }
        });
        
        // Merge with loaded data
        const mergedInputs = {...templateValues};
        Object.keys(data.userInputs).forEach(sectionId => {
          if (data.userInputs[sectionId] && typeof data.userInputs[sectionId] === 'string' && 
              data.userInputs[sectionId].trim() !== '') {
            mergedInputs[sectionId] = data.userInputs[sectionId];
          }
        });
        
        // Update user inputs state
        setUserInputs(mergedInputs);
        
        // Create empty chat messages
        const emptyChat = {};
        sectionContent.sections.forEach(section => {
          if (section && section.id) {
            emptyChat[section.id] = [];
          }
        });
        
        // Merge with loaded chat messages if they exist
        const mergedChat = {...emptyChat};
        if (data.chatMessages) {
          Object.keys(data.chatMessages).forEach(sectionId => {
            if (Array.isArray(data.chatMessages[sectionId])) {
              mergedChat[sectionId] = data.chatMessages[sectionId];
            }
          });
        }
        
        // Update chat messages state
        setChatMessages(mergedChat);
        
        // Save to localStorage
        localStorage.setItem('paperPlannerData', JSON.stringify(mergedInputs));
        localStorage.setItem('paperPlannerChat', JSON.stringify(mergedChat));
        
        // Set to first section
        setCurrentSection(sectionContent.sections[0].id);
        setCurrentIndex(0);
        
        alert("Project loaded successfully!");
      } catch (error) {
        alert("Error loading project: " + (error.message || "Unknown error"));
      }
    }
  };

  // ADDED: Simple document import function to replace the service
  const importDocumentContent = async (file) => {
    console.log(`Creating sample project from ${file.name}`);
    
    // Create a basic structure based on the file name
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const formattedName = fileName
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize words
    
    // Return a placeholder document structure
    return {
      userInputs: {
        question: `Research Question: How does ${formattedName} affect research outcomes?\n\nSignificance/Impact: Understanding the impact of ${formattedName} could lead to improved methodologies.`,
        audience: `Target Audience/Community (research fields/disciplines):\n1. Researchers in ${formattedName}\n2. Policy makers\n3. Practitioners\n\nSpecific Researchers/Labs (individual scientists or groups):\n1. Key labs in the field\n2. University research centers\n3. Industry partners`,
        hypothesis: `Hypothesis 1: ${formattedName} has a direct causal effect on measured variables.\n\nHypothesis 2: The impact of ${formattedName} is mediated by environmental factors.\n\nWhy distinguishing these hypotheses matters:\n- Would clarify mechanisms of action\n- Could lead to refined interventions`,
        relatedpapers: `Most similar papers that test related hypotheses:\n1. Smith et al. (2023) 'A review of ${formattedName}'\n2. Johnson & Lee (2022) 'Effects of ${formattedName} on outcomes'\n3. Zhang et al. (2021) 'Comparative analysis of ${formattedName}'\n4. Williams (2020) 'Theoretical foundations of ${formattedName}'\n5. Brown et al. (2019) 'Practical applications of ${formattedName}'`,
        experiment: `Key Variables:\n- Independent: ${formattedName} (manipulated at three levels)\n- Dependent: Outcome measurements (primary and secondary)\n- Controlled: Demographics, environmental factors\n\nSample & Size Justification: 150 participants based on power analysis\n\nData Collection Methods: Surveys, direct observations, physiological measures\n\nPredicted Results: Higher levels of ${formattedName} will yield improved outcomes\n\nPotential Confounds & Mitigations: Selection bias addressed through random assignment`,
        analysis: `Data Cleaning & Exclusions:\nIncomplete data and statistical outliers will be removed\n\nPrimary Analysis Method:\nRegression analysis with ${formattedName} as main predictor\n\nHow Analysis Addresses Research Question:\nTests for direct relationship and possible mediating factors\n\nUncertainty Quantification:\n95% confidence intervals for all estimates\n\nSpecial Cases Handling:\nSubgroup analyses for demographic variables`,
        process: `Skills Needed vs. Skills I Have:\nRequires expertise in statistics and domain knowledge of ${formattedName}\n\nCollaborators & Their Roles:\nStatistician for complex analyses, domain expert for interpretation\n\nData/Code Sharing Plan:\nAll materials to be shared via public repository\n\nTimeline & Milestones:\nMonths 1-2: Preparation and recruitment\nMonths 3-4: Data collection\nMonths 5-6: Analysis and reporting\n\nObstacles & Contingencies:\nParticipant dropout addressed through oversampling`,
        abstract: `Background: ${formattedName} is an emerging area of importance in the research community.\n\nObjective/Question: This study examines the relationship between ${formattedName} and key outcomes of interest.\n\nMethods: A sample of 150 participants will undergo structured interventions with comprehensive measurements.\n\n(Expected) Results: We anticipate that ${formattedName} will show a significant positive effect on primary outcomes.\n\nConclusion/Implications: Findings will contribute to both theory development and practical applications of ${formattedName}.`
      },
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: "1.0-basic-import"
    };
  };

  // Use our own implementation instead of the service
  const handleDocumentImport = async (file) => {
    setLoading(true);
    try {
      if (window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        const importedData = await importDocumentContent(file);
        loadProject(importedData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Hook for the Paper Planner
  const usePaperPlannerHook = {
    currentSection,
    currentIndex,
    userInputs,
    chatMessages,
    currentMessage,
    loading,
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    goToNextSection,
    goToPreviousSection,
    exportProject,
    loadProject,
    importDocumentContent: handleDocumentImport
  };

  // Use your existing VerticalPaperPlannerApp
  return (
    <VerticalPaperPlannerApp 
      usePaperPlannerHook={usePaperPlannerHook}
    />
  );
};

export default PaperPlannerApp;
