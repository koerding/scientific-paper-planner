// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * FIXED: Simplified version that maintains loading state correctly
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore';

// We'll keep using the custom confirmation dialog
const showCustomConfirmation = async (message) => {
  return new Promise(resolve => {
    const openConfirmDialog = useAppStore.getState().openModal;
    window._importConfirmResolve = resolve;
    useAppStore.setState({
      _importConfirmOperation: {
        message: message,
        active: true
      }
    });
  });
};

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  const [importLoading, setImportLoading] = useState(false);
  const setLoading = useAppStore((state) => state.setLoading);
  
  const handleDocumentImport = useCallback(async (file) => {
    if (!file) return false;
    
    console.log(`Starting document import for ${file.name}`);
    
    // Set loading states at the start
    setImportLoading(true);
    setLoading('import', true);
    
    try {
      // Show confirmation dialog using our custom approach
      const confirmed = await showCustomConfirmation(
        "Creating an example from this document will replace your current work. Continue?"
      );
      
      if (!confirmed) {
        console.log("User cancelled import operation");
        setImportLoading(false);
        setLoading('import', false);
        return false;
      }
      
      console.log(`Processing import for ${file.name}`);

      // Pass sectionContent to the import service
      const importedData = await importDocumentContent(file, sectionContent);

      // Load the imported data using the loadProject function
      if (importedData && importedData.userInputs) {
        // Toggle Detection Logic
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

        // Load data into the store
        try {
            // This will handle resetting the project state
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

            // Clear loading states
            setImportLoading(false);
            setLoading('import', false);

            return true; // Success
        } catch (loadError) {
             console.error("Error during the loadProject step:", loadError);
             setImportLoading(false);
             setLoading('import', false);
             throw new Error(`Failed to load processed data: ${loadError.message}`);
        }
      } else {
          setImportLoading(false);
          setLoading('import', false);
          throw new Error("Failed to retrieve valid data from document processing service.");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      setImportLoading(false);
      setLoading('import', false);
      return false; // Failure
    }
  }, [loadProject, sectionContent, setLoading]);

  return {
    importLoading,
    handleDocumentImport
  };
};
