// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Uses the new globalAiLoading mechanism for consistent UI feedback
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading and setGlobalAiLoading

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // Local loading state (still useful for the hook's internal logic)
  const [importLoading, setImportLoading] = useState(false);
  
  // Get both loading setters from the store
  const setLoading = useAppStore((state) => state.setLoading);
  const setGlobalAiLoading = useAppStore((state) => state.setGlobalAiLoading);

  const handleDocumentImport = useCallback(async (file) => {
    if (!file) return false;
    
    console.log(`Starting document import for ${file.name}`);
    
    // Set all loading states at the start
    console.log("Setting loading states to TRUE");
    setImportLoading(true);
    setLoading('import', true);
    setGlobalAiLoading(true); // <-- This is the important addition for consistent UI
    
    try {
      // Use window.confirm which won't affect our global loading state
      const confirmed = window.confirm(
        "Creating an example from this document will replace your current work. Continue?"
      );
      
      if (!confirmed) {
        console.log("User cancelled import operation");
        // Clear all loading states
        setImportLoading(false);
        setLoading('import', false);
        setGlobalAiLoading(false);
        return false;
      }
      
      console.log(`Processing import for ${file.name}`);

      // First, reset all state to ensure clean slate
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
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

            // Clear all loading states AFTER everything is done
            console.log("Setting loading states to FALSE after successful import");
            setImportLoading(false);
            setLoading('import', false);
            setGlobalAiLoading(false);

            return true; // Success
        } catch (loadError) {
             console.error("Error during the loadProject step:", loadError);
             // Clear all loading states on error
             setImportLoading(false);
             setLoading('import', false);
             setGlobalAiLoading(false);
             throw new Error(`Failed to load processed data: ${loadError.message}`);
        }
      } else {
          // Clear all loading states if import service returns invalid data
          setImportLoading(false);
          setLoading('import', false);
          setGlobalAiLoading(false);
          throw new Error("Failed to retrieve valid data from document processing service.");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      // Clear all loading states on general error
      setImportLoading(false);
      setLoading('import', false);
      setGlobalAiLoading(false);
      return false; // Failure
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading, setGlobalAiLoading]);

  return {
    importLoading,
    handleDocumentImport
  };
};
