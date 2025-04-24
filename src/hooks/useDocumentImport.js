// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Enhanced loading state management in the Zustand store
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // We maintain local loading state for internal use while also setting
  // the global loading state in the store for consistent UI blocking
  const [importLoading, setImportLoading] = useState(false);
  // Get setLoading from the store
  const setLoading = useAppStore((state) => state.setLoading);

  const handleDocumentImport = useCallback(async (file) => {
    // Set both loading states at the start
    setImportLoading(true);
    setLoading('import', true);

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setImportLoading(false);
        setLoading('import', false);
        return false; // User cancelled
      }

      console.log(`Starting import process for ${file.name}`);

      // First, reset all state to ensure clean slate
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      // Pass sectionContent to the import service
      const importedData = await importDocumentContent(file, sectionContent);

      // Load the imported data using the loadProject function (which triggers the store action)
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

            // Dispatch event (unchanged)
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

            return true; // Indicate success

        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             // Ensure loading states are cleared on error
             setImportLoading(false);
             setLoading('import', false);
             throw new Error(`Failed to load processed data into application state: ${loadError.message}`);
        }

      } else {
          // Ensure loading states are cleared if import service returns invalid data
          setImportLoading(false);
          setLoading('import', false);
          throw new Error("Failed to retrieve valid data from document processing service.");
      }

    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      // Ensure loading states are cleared on general error
      setImportLoading(false);
      setLoading('import', false);
      return false; // Indicate failure
    }
    // No need for finally block since we're clearing loading states in all paths
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]);

  // Return the local loading state (used by VerticalPaperPlannerApp for internal tracking)
  // The global state in the store is used for UI blocking across components
  return {
    importLoading,
    handleDocumentImport
  };
};
