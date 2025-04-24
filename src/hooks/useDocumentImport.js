// FILE: src/hooks/useDocumentImport.js
// Fixed: Escaped backslashes in loadError.message within the catch block.

/**
 * Hook for managing document import functionality
 * UPDATED: Fixed syntax error in conditional checks for toggle detection.
 * UPDATED: Correctly handles the loading process without expecting a boolean return from the loadProject prop.
 * INTEGRATED: Uses Zustand's setLoading for global loading state.
 */
import { useCallback } from 'react'; // Removed useState import
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // Get setLoading action from Zustand store
  const setLoading = useAppStore((state) => state.setLoading);

  const handleDocumentImport = useCallback(async (file) => {
    // Set global loading state START
    setLoading('import', true);

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        // setLoading('import', false); // Handled in finally
        return false; // User cancelled
      }

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
        if (importedData.userInputs?.needsresearch?.trim() !== '') {
          detectedApproach = 'needsresearch';
        } else if (importedData.userInputs?.exploratoryresearch?.trim() !== '') {
          detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs?.hypothesis?.trim() !== '') {
          detectedApproach = 'hypothesis';
        }
        if (importedData.userInputs?.existingdata?.trim() !== '') {
          detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs?.theorysimulation?.trim() !== '') {
          detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs?.experiment?.trim() !== '') {
          detectedDataMethod = 'experiment';
        }
        // --- CORRECTED CONDITIONS END ---


        // Include detected toggles in the loaded data
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected approach: ${detectedApproach}, data method: ${detectedDataMethod}`);

        // Load data into the store
        try {
            // --- FIX: Restructure data for updated loadProjectData action ---
            const restructuredData = {
              ...importedData, // Use the original data which now includes detectedToggles
              sections: importedData.userInputs || {}, // Rename userInputs to sections
            };
            delete restructuredData.userInputs; // Remove the old key
            // --- End FIX ---

            loadProject(restructuredData); // Call the load function with restructured data
            console.log(`Document ${file.name} successfully processed and loaded into store.`);

            return true; // Indicate success

        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             // --- FIX: Escape backslashes in error message ---
             const escapedMessage = (loadError.message || 'Unknown loading error').replace(/\\/g, '\\\\');
             throw new Error(`Failed to load processed data into application state: ${escapedMessage}`);
             // --- END FIX ---
        }

      } else {
          throw new Error("Failed to retrieve valid data from document processing service.");
      }

    } catch (error) {
      console.error("Error importing document:", error);
      // Use simple alert for errors as in the original version
      alert("Error importing document: " + (error.message || "Unknown error"));
      return false; // Indicate failure
    } finally {
        // Ensure loading state is always cleared
        setLoading('import', false);
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]); // Added setLoading dependency

  return {
    handleDocumentImport
  };
};
