// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Fixed loading state persistence during confirmation dialog
 */
import { useState, useCallback, useEffect } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // We maintain local loading state for internal use while also setting
  // the global loading state in the store for consistent UI blocking
  const [importLoading, setImportLoading] = useState(false);
  
  // Get setLoading and global loading state from the store
  const setLoading = useAppStore((state) => state.setLoading);
  const globalImportLoading = useAppStore((state) => state.loading.import);
  
  // Debug useEffect to monitor loading state changes
  useEffect(() => {
    console.log("useDocumentImport - Local loading state changed:", importLoading);
  }, [importLoading]);
  
  useEffect(() => {
    console.log("useDocumentImport - Global loading state changed:", globalImportLoading);
  }, [globalImportLoading]);

  const handleDocumentImport = useCallback(async (file) => {
    console.log(`Starting document import for ${file?.name || 'unknown file'}`);
    
    // Set both loading states at the start
    console.log("Setting loading states to TRUE");
    setImportLoading(true);
    setLoading('import', true);
    
    // Force a small delay to ensure state updates propagate
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Ask for confirmation - IMPORTANT: DON'T clear loading state here
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        console.log("User cancelled import operation");
        // NOW clear loading states since operation is cancelled
        setImportLoading(false);
        setLoading('import', false);
        return false; // User cancelled
      }

      // If we reach here, user confirmed - keep loading states active
      console.log(`Processing import for ${file.name}`);

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

            // Important: Clear loading states AFTER everything else is done
            console.log("Setting loading states to FALSE after successful import");
            setImportLoading(false);
            setLoading('import', false);

            return true; // Indicate success

        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             // Ensure loading states are cleared on error
             console.log("Setting loading states to FALSE after load error");
             setImportLoading(false);
             setLoading('import', false);
             throw new Error(`Failed to load processed data into application state: ${loadError.message}`);
        }

      } else {
          // Ensure loading states are cleared if import service returns invalid data
          console.log("Setting loading states to FALSE after invalid data");
          setImportLoading(false);
          setLoading('import', false);
          throw new Error("Failed to retrieve valid data from document processing service.");
      }

    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      // Ensure loading states are cleared on general error
      console.log("Setting loading states to FALSE after general error");
      setImportLoading(false);
      setLoading('import', false);
      return false; // Indicate failure
    }
    // No need for finally block since we're clearing loading states in all paths
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]);

  // Return both the local loading state and the handler
  return {
    importLoading,
    handleDocumentImport
  };
};
