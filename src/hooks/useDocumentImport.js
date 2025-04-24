// FILE: src/hooks/useDocumentImport.js
// Reverted to the version provided by the user, with Zustand loading integration

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
  // REMOVED: const [importLoading, setImportLoading] = useState(false);
  // Get setLoading action from Zustand store
  const setLoading = useAppStore((state) => state.setLoading);

  const handleDocumentImport = useCallback(async (file) => {
    // Set global loading state START
    setLoading('import', true);

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        // setLoading('import', false); // Clear loading on cancel - Handled in finally
        return false; // User cancelled
      }

      console.log("Starting import process for \${file.name}");

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
        console.log(\`[handleDocumentImport] Detected approach: \${detectedApproach}, data method: \${detectedDataMethod}\`);

        // Load data into the store
        try {
            // --- FIX: Restructure data for updated loadProjectData action ---
            // The import service returns { userInputs: {...} }
            // The loadProjectData action now expects { sections: {...} }
            const restructuredData = {
              ...importedData, // Use the original data which now includes detectedToggles
              sections: importedData.userInputs || {}, // Rename userInputs to sections
            };
            // Remove the old userInputs key if it exists after restructuring
            delete restructuredData.userInputs;
            // --- End FIX ---

            loadProject(restructuredData); // Call the load function (triggers store update) with restructured data
            console.log(\`Document \${file.name} successfully processed and loaded into store.\`);

            // Dispatch event (unchanged) - Already handled in service

            // setLoading('import', false); // Clear loading on success (handled in finally)
            return true; // Indicate success

        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             // setLoading('import', false); // Clear loading on error (handled in finally)
             throw new Error(\`Failed to load processed data into application state: \${loadError.message}\`);
        }

      } else {
          // setLoading('import', false); // Clear loading on error (handled in finally)
          throw new Error("Failed to retrieve valid data from document processing service.");
      }

    } catch (error) {
      console.error("Error importing document:", error);
      // Use simple alert for errors as in the original version
      alert("Error importing document: " + (error.message || "Unknown error"));
      // setLoading('import', false); // Clear loading on error (handled in finally)
      return false; // Indicate failure
    } finally {
        // Ensure loading state is always cleared
        setLoading('import', false);
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]); // Added setLoading dependency

  return {
    // importLoading, // No longer returning local loading state
    handleDocumentImport
  };
};
