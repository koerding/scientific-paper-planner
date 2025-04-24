// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * REMOVED: Local importLoading state, relies solely on global Zustand state.
 */
import { useCallback } from 'react'; // Removed useState import
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // REMOVED: const [importLoading, setImportLoading] = useState(false);
  const setLoading = useAppStore((state) => state.setLoading);

  const handleDocumentImport = useCallback(async (file) => {
    // REMOVED: setImportLoading(true);
    setLoading('import', true); // Set global loading START

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        // REMOVED: setImportLoading(false);
        setLoading('import', false); // Clear global loading on cancel
        return false; // User cancelled
      }

      console.log(`Starting import process for ${file.name}`);

      // Reset state
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      // Import content
      const importedData = await importDocumentContent(file, sectionContent);

      // Load data
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

        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected toggles: Approach=${detectedApproach}, Method=${detectedDataMethod}`);

        // Load data into store
        try {
            loadProject(importedData);
            console.log(`Document ${file.name} successfully processed and loaded.`);
            window.dispatchEvent(new CustomEvent('documentImported', { /* ... */ }));
            // REMOVED: setImportLoading(false); // Local state removed
            // Global loading cleared in finally
            return true;

        } catch (loadError) {
             console.error("Error during the loadProject (store update) step:", loadError);
             // REMOVED: setImportLoading(false);
             setLoading('import', false); // Clear global on error
             throw new Error(`Failed to load processed data: ${loadError.message}`);
        }

      } else {
          // REMOVED: setImportLoading(false);
          setLoading('import', false); // Clear global on error
          throw new Error("Failed to retrieve valid data from document processing service.");
      }

    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      // REMOVED: setImportLoading(false);
      setLoading('import', false); // Clear global on error
      return false;
    } finally {
        setLoading('import', false); // Ensure global loading is always cleared
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]);

  // Return only the handler, no need to return the removed local state
  return {
    // importLoading, // Removed
    handleDocumentImport
  };
};
