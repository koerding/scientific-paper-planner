import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json'; // Import section data

// Helper function to create initial state from placeholders
const createInitialInputs = () => {
  const initialInputs = {};
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        // Use the main placeholder by default
        initialInputs[section.id] = section.placeholder || '';

        // If specific placeholders exist for philosophy, use the 'hypothesis' one as default maybe?
        // Or decide based on some initial logic if needed. Here we just use the main one.
        // if (section.id === 'question' && section.placeholders?.hypothesis) {
        //    initialInputs[section.id] = section.placeholders.hypothesis;
        // }
      }
    });
  } else {
     console.error("Failed to load sectionContent or sections array is missing.");
     // Define fallbacks if JSON loading fails
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => { initialInputs[id] = ''; });
  }
  return initialInputs;
};


const usePaperPlanner = () => {
  // Initialize state using the placeholders from sectionContent.json
  const [userInputs, setUserInputs] = useState(createInitialInputs);

  // Existing states
  const [chatMessages, setChatMessages] = useState([]);
  const [currentSection, setCurrentSection] = useState('question'); // Tracks context for chat/AI
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved data on initial mount, potentially overwriting placeholders
  useEffect(() => {
    console.log("Attempting to load from storage...");
    // Pass the initial state creator to loadFromStorage
    // so it can merge saved data intelligently if needed (modification to loadFromStorage might be required)
    loadFromStorage(setUserInputs, setChatMessages, createInitialInputs);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save progress whenever userInputs or chatMessages change
  useEffect(() => {
    saveToStorage(userInputs, chatMessages);
  }, [userInputs, chatMessages]);

  const handleInputChange = useCallback((sectionId, value) => {
    setUserInputs(prevInputs => ({
      ...prevInputs,
      [sectionId]: value
    }));
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setCurrentSection(sectionId);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !currentSection) return;

    const newUserMessage = { role: 'user', content: currentMessage };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setLoading(true);
    setCurrentMessage(''); // Clear input field immediately

    try {
      // Call API - Ensure sectionContent.sections is available or passed if needed by callOpenAI context building
      const sectionsForContext = sectionContent?.sections || [];
      const response = await callOpenAI(
          currentMessage,
          currentSection, // Pass the current section context ID
          userInputs,
          sectionsForContext // Pass section definitions for context building
      );
      const newAssistantMessage = { role: 'assistant', content: response };
      setChatMessages(prevMessages => [...prevMessages, newAssistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { role: 'assistant', content: 'Sorry, there was an error processing your message.' };
      setChatMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [currentMessage, currentSection, userInputs]); // Dependencies for the chat send


  // Function called when user marks a section as 'First version finished'
  const handleFirstVersionFinished = useCallback(async (sectionId) => {
     console.log(`First version finished for section: ${sectionId}`);
     const contentToReview = userInputs[sectionId];
     if (!contentToReview) return;

     setLoading(true); // Use general loading or a specific one?

     // Define a specific prompt for reviewing the section
     const reviewPrompt = `Please review the content I've written for the "${sectionId}" section and provide constructive feedback based on the section's goals as outlined in the instructions. Content:\n\n${contentToReview}`;

     const newUserMessage = { role: 'user', content: reviewPrompt };
     setChatMessages(prevMessages => [...prevMessages, newUserMessage]);

     try {
        const sectionsForContext = sectionContent?.sections || [];
        const response = await callOpenAI(
            reviewPrompt,
            sectionId, // Set context to the reviewed section
            userInputs,
            sectionsForContext
        );
        const newAssistantMessage = { role: 'assistant', content: response };
        setChatMessages(prevMessages => [...prevMessages, newAssistantMessage]);
     } catch (error) {
        console.error(`Error getting review for ${sectionId}:`, error);
        const errorMessage = { role: 'assistant', content: `Sorry, there was an error reviewing the ${sectionId} section.` };
        setChatMessages(prevMessages => [...prevMessages, errorMessage]);
     } finally {
        setLoading(false);
     }
  }, [userInputs]); // Dependency on userInputs


  // Reset project function
  const resetProject = useCallback(() => {
    clearStorage(); // Clear localStorage
    setUserInputs(createInitialInputs()); // Reset state to initial placeholders
    setChatMessages([]); // Clear chat messages
    setCurrentSection('question'); // Reset active section
    setShowConfirmDialog(false); // Close dialog
    console.log("Project reset to initial state.");
  }, []);

  // Export functionality (assuming exportUtils handles the logic)
  const exportProject = () => {
    // Import dynamically or ensure exportUtils is imported
    import('../utils/exportUtils').then(module => {
        module.exportProject(userInputs, chatMessages, sectionContent);
    }).catch(err => console.error("Failed to load or run export:", err));
  };


  return {
    userInputs,
    chatMessages,
    currentSection, // The ID of the section AI should focus on
    currentMessage,
    loading,
    showConfirmDialog,
    setChatMessages, // Expose if needed externally (e.g., for loading)
    setUserInputs, // Expose if needed externally (e.g., for loading)
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    exportProject,
  };
};

export default usePaperPlanner;
