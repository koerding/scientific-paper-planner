// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Replaced window.confirm with a custom non-blocking approach
 * FIXED: Adjusted loading state management to prevent premature spinner stop
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store to access setLoading

// We'll need to create a custom confirmation dialog component
// This will be controlled directly by the store
const showCustomConfirmation = async (message) => {
  return new Promise(resolve => {
    // Use the Zustand store to show a modal
    const openConfirmDialog = useAppStore.getState().openModal;

    // Store the resolution function so it can be called when confirmed or canceled
    window._importConfirmResolve = resolve;

    // Show the confirm dialog
    openConfirmDialog('confirmDialog');

    // We'll use a custom prop on the state to track what to do when confirmed
    // See the ConfirmDialog component for how this is used
    useAppStore.setState({
      _importConfirmOperation: {
        message: message,
        active: true
      }
    });
  });
};

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  // We maintain local loading state for internal use while also setting
  // the global loading state in the store for consistent UI blocking
  const [importLoading, setImportLoading] = useState(false);

  // Get setLoading from the store
  const setLoading = useAppStore((state) => state.setLoading);

  const handleDocumentImport = useCallback(async (file) => {
    if (!file) return false;

    console.log(`Starting document import for ${file.name}`);

    // *** CHANGE 1: Don't set loading state here yet ***
    // setLoading('import', true); // <-- REMOVED FROM HERE

    // Force a small delay to ensure state updates propagate
    // await new Promise(resolve => setTimeout(resolve, 50)); // Optional delay, might not be needed now

    try {
      // Show confirmation dialog
      const confirmed = await showCustomConfirmation(
        "Creating an example from this document will replace your current work. Continue?"
      );

      if (!confirmed) {
        console.log("User cancelled import operation");
        // No loading state was set, so nothing to clear
        return false;
      }

      console.log(`Processing import for ${file.name}`);

      // *** CHANGE 2: Reset state immediately after confirmation ***
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
         // Optional: add a small delay if state reset needs time to propagate UI updates
         await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      // *** CHANGE 3: Set loading state AFTER confirmation and reset ***
      console.log("Setting loading states to TRUE after confirmation and reset");
      setImportLoading(true); // Keep local loading if needed
      setLoading('import', true); // Set global loading flag

      // *** CHANGE 4: Force a small delay AFTER setting loading to ensure UI updates ***
      await new Promise(resolve => setTimeout(resolve, 50));

      // --- Start the actual import process ---
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

            // *** Loading state cleared in finally block ***
            return true; // Success
        } catch (loadError) {
             console.error("Error during the loadProject step:", loadError);
             // Error will be caught by outer catch, loading cleared in finally
             throw new Error(`Failed to load processed data: ${loadError.message}`);
        }
      } else {
          // Error will be caught by outer catch, loading cleared in finally
          throw new Error("Failed to retrieve valid data from document processing service.");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      // Loading state cleared in finally block
      return false; // Failure
    } finally {
        // *** CHANGE 5: Ensure loading state is cleared in finally block ***
        console.log("Setting loading states to FALSE after import process finishes (in finally block)");
        setImportLoading(false);
        setLoading('import', false);
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading]);

  return {
    importLoading, // This local state might still be useful for the import button itself
    handleDocumentImport
  };
};
