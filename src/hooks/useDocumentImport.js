// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Now uses Zustand store for loading state management
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import the Zustand store

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // Get the setLoading function from the Zustand store
  const setLoading = useAppStore(state => state.setLoading);
  // Get the import loading state for local reference
  const importLoading = useAppStore(state => state.loadingStates.import);

  const handleDocumentImport = useCallback(async (file) => {
    // Set loading state using Zustand
    setLoading('import', true);

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        // Set loading state to false if user cancels
        setLoading('import', false);
        return false; // User cancelled
      }

      console.log(`Starting import process for ${file.name}`);

      // First, reset all state to ensure clean slate
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
        console.log("[handleDocumentImport] Reset all project state before import");
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      // Pass sectionContent to the import service
      const importedData = await importDocumentContent(file, sectionContent);

      console.log("Document import service returned data:", importedData ? "Success" : "Failed");

      // Load the imported data using the loadProject function (which triggers the store action)
      if (importedData && importedData.userInputs) { // Check if we got valid data structure
        // DETECT WHICH TOGGLES SHOULD BE ACTIVE BASED ON IMPORTED DATA
        let detectedApproach = 'hypothesis'; // Default
        let detectedDataMethod = 'experiment'; // Default

        // Check which research approach has content
        if (importedData.userInputs?.needsresearch?.trim() !== '') {
          detectedApproach = 'needsresearch';
        } else if (importedData.userInputs?.exploratoryresearch?.trim() !== '') {
          detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs?.hypothesis?.trim() !== '') {
          // Keep hypothesis as default unless others are present and non-empty
          detectedApproach = 'hypothesis';
        }

        // Check which data method has content
        if (importedData.userInputs?.existingdata?.trim() !== '') {
          detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs?.theorysimulation?.trim() !== '') {
          detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs?.experiment?.trim() !== '') {
           // Keep experiment as default unless others are present and non-empty
          detectedDataMethod = 'experiment';
        }

        // Include detected toggles in the loaded data
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected approach: ${detectedApproach}, data method: ${detectedDataMethod}`);

        // Load data into the store
        try {
            loadProject(importedData); // Call the load function (triggers store update)
            console.log(`Document ${file.name} successfully processed and loaded into store.`);

            // Dispatch event (unchanged)
            window.dispatchEvent(new CustomEvent('documentImported', { 
              detail: {
                fileName: file.name,
                timestamp: Date.now()
              }
            }));

            setLoading('import', false);
            return true; // Indicate success
        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             throw new Error(`Failed to load processed data into application state: ${loadError.message}`);
        }
      } else {
          throw new Error("Failed to retrieve valid data from document processing service.");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      setLoading('import', false);
      return false; // Indicate failure
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]);

  return {
    importLoading, // Return the loading state from Zustand
    handleDocumentImport
  };
};
