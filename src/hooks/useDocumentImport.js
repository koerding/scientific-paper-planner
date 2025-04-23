// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Fixed syntax error in conditional checks for toggle detection.
 * UPDATED: Correctly handles the loading process without expecting a boolean return from the loadProject prop.
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

        // --- CORRECTED CONDITIONS START ---
        // Check which research approach has content (using consistent optional chaining)
        if (importedData.userInputs?.needsresearch?.trim() !== '') {
          detectedApproach = 'needsresearch';
        } else if (importedData.userInputs?.exploratoryresearch?.trim() !== '') {
          detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs?.hypothesis?.trim() !== '') {
          // Keep hypothesis as default unless others are present and non-empty
          detectedApproach = 'hypothesis';
        }

        // Check which data method has content (using consistent optional chaining)
        if (importedData.userInputs?.existingdata?.trim() !== '') {
          detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs?.theorysimulation?.trim() !== '') {
          detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs?.experiment?.trim() !== '') {
           // Keep experiment as default unless others are present and non-empty
          detectedDataMethod = 'experiment';
        }
        // --- CORRECTED CONDITIONS END ---


        // Include detected toggles in the loaded data
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected approach: ${detectedApproach}, data method: ${detectedDataMethod}`);

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
