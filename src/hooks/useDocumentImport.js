// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * FIXED: Maintains loading spinner state after confirmation throughout import process
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading

// This function uses the store to show a confirmation dialog instead of blocking window.confirm
const showCustomConfirmation = async (message) => {
  return new Promise(resolve => {
    // Use the Zustand store to show a modal
    const openConfirmDialog = useAppStore.getState().openModal;
    
    // Store the resolution function so it can be called when confirmed or canceled
    window._importConfirmResolve = resolve;
    
    // We'll use a custom prop on the state to track what to do when confirmed
    // See the ConfirmDialog component for how this is used
    useAppStore.setState({
      _importConfirmOperation: {
        message: message,
        active: true
      }
    });
  });
};

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // We maintain local loading state for internal use while also setting
  // the global loading state in the store for consistent UI blocking
  const [importLoading, setImportLoading] = useState(false);
  
  // Get setLoading from the store
  const setLoading = useAppStore((state) => state.setLoading);
  
  const handleDocumentImport = useCallback(async (file) => {
    if (!file) return false;
    
    console.log(`Starting document import for ${file.name}`);
    
    // Set all loading states at the start
    console.log("Setting loading states to TRUE");
    setImportLoading(true);
    setLoading('import', true);
    
    // Force global loading state to TRUE for all components
    // This is critical because some components check isAnyLoading() directly
    useAppStore.setState({ globalAiLoading: true });
    
    // Force a small delay to ensure state updates propagate
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      // Show confirmation dialog using our custom approach
      const confirmed = await showCustomConfirmation(
        "Creating an example from this document will replace your current work. Continue?"
      );
      
      if (!confirmed) {
        console.log("User cancelled import operation");
        // Clear loading states if cancelled
        setImportLoading(false);
        setLoading('import', false);
        // Use the store's setState method directly to update globalAiLoading
        useAppStore.setState({ globalAiLoading: false });
        return false;
      }
      
      console.log(`Processing import for ${file.name}`);

      // First, reset all state to ensure clean slate
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
        
        // IMPORTANT: Reset may have cleared our loading state, so set it again
        // This is crucial to ensure loading spinners continue after reset
        setLoading('import', true);
        useAppStore.setState({ globalAiLoading: true });
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      // Pass sectionContent to the import service
      const importedData = await importDocumentContent(file, sectionContent);

      // Load the imported data using the loadProject function
      if (importedData && importedData.userInputs) {
        // Toggle Detection Logic (Checks Key Presence)
        let detectedApproach = 'hypothesis';
        let detectedDataMethod = 'experiment';

        if (importedData.userInputs?.hasOwnProperty('needsresearch')) {
            detectedApproach = 'needsresearch';
        } else if (importedData.userInputs?.hasOwnProperty('exploratoryresearch')) {
            detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs?.hasOwnProperty('hypothesis')) {
            detectedApproach = 'hypothesis';
        }

        if (importedData.userInputs?.hasOwnProperty('existingdata')) {
            detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs?.hasOwnProperty('theorysimulation')) {
            detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs?.hasOwnProperty('experiment')) {
            detectedDataMethod = 'experiment';
        }

        // Include detected toggles in the loaded data
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected toggles: Approach=${detectedApproach}, Method=${detectedDataMethod}`);

        // Make sure global loading is still true before loading the project
        useAppStore.setState({ globalAiLoading: true });
        
        // Load data into the store
        try {
            loadProject(importedData);
            console.log(`Document ${file.name} successfully processed and loaded.`);

            // Dispatch event
            window.dispatchEvent(new CustomEvent('documentImported', { 
                detail: { 
                    fileName: file.name,
                    timestamp: Date.now(),
                    success: true
                } 
            }));

            // IMPORTANT: Small delay before clearing loading states
            // This ensures UI has time to update after project load
            setTimeout(() => {
              // Clear loading states AFTER everything is done 
              console.log("Setting loading states to FALSE after successful import");
              setImportLoading(false);
              setLoading('import', false);
              // Update global loading state directly through setState for immediate effect
              useAppStore.setState({ globalAiLoading: false });
            }, 300);

            return true; // Success
        } catch (loadError) {
             console.error("Error during the loadProject step:", loadError);
             // Clear loading states on error
             setImportLoading(false);
             setLoading('import', false);
             // Update global loading state directly through setState for immediate effect
             useAppStore.setState({ globalAiLoading: false });
             throw new Error(`Failed to load processed data: ${loadError.message}`);
        }
      } else {
          // Clear loading states if import service returns invalid data
          setImportLoading(false);
          setLoading('import', false);
          // Update global loading state directly through setState for immediate effect
          useAppStore.setState({ globalAiLoading: false });
          throw new Error("Failed to retrieve valid data from document processing service.");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      // Clear loading states on general error
      setImportLoading(false);
      setLoading('import', false);
      // Update global loading state directly through setState for immediate effect
      useAppStore.setState({ globalAiLoading: false });
      return false; // Failure
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]);

  return {
    importLoading,
    handleDocumentImport
  };
};
