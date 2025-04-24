// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * ADDED: Extra console logs for debugging toggle detection.
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
// Removed import from sectionStateService

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  const [importLoading, setImportLoading] = useState(false);

  const handleDocumentImport = useCallback(async (file) => {
    setImportLoading(true);

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setImportLoading(false);
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

        // ==========================================================
        // == ADDED DEBUGGING LOGS ==
        // ==========================================================
        console.log("[handleDocumentImport] DEBUG: Inspecting importedData.userInputs before detection:");
        console.log(importedData.userInputs); // Log the whole object
        console.log("[handleDocumentImport] DEBUG: Keys present:", Object.keys(importedData.userInputs));
        console.log("[handleDocumentImport] DEBUG: Has 'needsresearch'?", importedData.userInputs?.hasOwnProperty('needsresearch'));
        console.log("[handleDocumentImport] DEBUG: Has 'exploratoryresearch'?", importedData.userInputs?.hasOwnProperty('exploratoryresearch'));
        console.log("[handleDocumentImport] DEBUG: Has 'hypothesis'?", importedData.userInputs?.hasOwnProperty('hypothesis'));
        console.log("[handleDocumentImport] DEBUG: Has 'existingdata'?", importedData.userInputs?.hasOwnProperty('existingdata'));
        console.log("[handleDocumentImport] DEBUG: Has 'theorysimulation'?", importedData.userInputs?.hasOwnProperty('theorysimulation'));
        console.log("[handleDocumentImport] DEBUG: Has 'experiment'?", importedData.userInputs?.hasOwnProperty('experiment'));
        // ==========================================================

        // ==========================================================
        // == REVISED Toggle Detection Logic (Checks Key Presence) ==
        // ==========================================================
        let detectedApproach = 'hypothesis'; // Default if no approach key is found
        let detectedDataMethod = 'experiment'; // Default if no data method key is found

        // Check which research approach key EXISTS in the response
        if (importedData.userInputs?.hasOwnProperty('needsresearch')) {
            console.log("[handleDocumentImport] DEBUG: Detected 'needsresearch' via hasOwnProperty.");
            detectedApproach = 'needsresearch';
        } else if (importedData.userInputs?.hasOwnProperty('exploratoryresearch')) {
            console.log("[handleDocumentImport] DEBUG: Detected 'exploratoryresearch' via hasOwnProperty.");
            detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs?.hasOwnProperty('hypothesis')) {
            console.log("[handleDocumentImport] DEBUG: Detected 'hypothesis' via hasOwnProperty.");
            // Explicitly set hypothesis if the key is present
            detectedApproach = 'hypothesis';
        } else {
            console.warn(`[handleDocumentImport] No research approach key (hypothesis, needsresearch, exploratoryresearch) found in imported userInputs. Defaulting to '${detectedApproach}'.`);
            // Keep the default
        }

        // Check which data method key EXISTS in the response
        if (importedData.userInputs?.hasOwnProperty('existingdata')) {
            console.log("[handleDocumentImport] DEBUG: Detected 'existingdata' via hasOwnProperty.");
            detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs?.hasOwnProperty('theorysimulation')) {
            console.log("[handleDocumentImport] DEBUG: Detected 'theorysimulation' via hasOwnProperty.");
            detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs?.hasOwnProperty('experiment')) {
            console.log("[handleDocumentImport] DEBUG: Detected 'experiment' via hasOwnProperty.");
            // Explicitly set experiment if the key is present
            detectedDataMethod = 'experiment';
        } else {
            console.warn(`[handleDocumentImport] No data method key (experiment, existingdata, theorysimulation) found in imported userInputs. Defaulting to '${detectedDataMethod}'.`);
            // Keep the default
        }
       // ==========================================================
       // == End Revised Logic ==
       // ==========================================================


        // Include detected toggles in the loaded data
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        // Ensure this log reflects the actual variables being passed
        console.log(`[handleDocumentImport] Detected approach (revised logic): ${detectedApproach}, data method: ${detectedDataMethod}`);

        // Load data into the store
        try {
            loadProject(importedData); // Call the load function (triggers store update)
            console.log(`Document ${file.name} successfully processed and loaded into store.`);

            // Dispatch event (unchanged)
            window.dispatchEvent(new CustomEvent('documentImported', { /* ... details ... */ }));

            setImportLoading(false);
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
      setImportLoading(false);
      return false; // Indicate failure
    }
  }, [loadProject, sectionContent, resetAllProjectState]);

  return {
    importLoading,
    handleDocumentImport
  };
};
