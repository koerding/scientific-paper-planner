// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Correctly handles the loading process without expecting a boolean return from the loadProject prop.
 * UPDATED: Detects appropriate research approach and data method
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
        // DETECT WHICH TOGGLES SHOULD BE ACTIVE BASED ON IMPORTED DATA
        let detectedApproach = 'hypothesis'; // Default
        let detectedDataMethod = 'experiment'; // Default

        if (importedData.userInputs?.needsresearch && /* ... */) { detectedApproach = 'needsresearch'; }
        else if (importedData.userInputs?.exploratoryresearch && /* ... */) { detectedApproach = 'exploratoryresearch'; }
        else if (importedData.userInputs?.hypothesis && /* ... */) { detectedApproach = 'hypothesis'; }

        if (importedData.userInputs?.existingdata && /* ... */) { detectedDataMethod = 'existingdata'; }
        else if (importedData.userInputs?.theorysimulation && /* ... */) { detectedDataMethod = 'theorysimulation'; }
        else if (importedData.userInputs?.experiment && /* ... */) { detectedDataMethod = 'experiment'; }


        // Include detected toggles in the loaded data
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected approach: ${detectedApproach}, data method: ${detectedDataMethod}`);

        // --- MODIFIED PART ---
        try {
            loadProject(importedData); // Call the load function (triggers store update)
            // Assume success if no error is thrown by loadProject/store action
            console.log(`Document ${file.name} successfully processed and loaded into store.`);

            // Dispatch event with toggle information
             window.dispatchEvent(new CustomEvent('documentImported', {
               detail: {
                 fileName: file.name,
                 timestamp: Date.now(),
                 expandAllSections: true, // Store action handles expansion
                 detectedApproach,
                 detectedDataMethod
               }
             }));

            setImportLoading(false); // Stop loading indicator *after* success
            return true; // Indicate success from the hook

        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             // Throw a more specific error for the catch block below
             throw new Error(`Failed to load processed data into application state: ${loadError.message}`);
        }
        // --- END MODIFIED PART ---

      } else {
          // If importDocumentContent failed or returned invalid data
          throw new Error("Failed to retrieve valid data from document processing service.");
      }

    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      setImportLoading(false); // Ensure loading stops on error
      return false; // Indicate failure from the hook
    }
    // Removed finally block as loading is handled in try/catch now
  }, [loadProject, sectionContent, resetAllProjectState]);

  return {
    importLoading,
    handleDocumentImport
  };
};
