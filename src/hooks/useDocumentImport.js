// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Replaced window.confirm with a custom non-blocking approach
 * FIXED: Adjusted loading state management to prevent premature spinner stop
 * MODIFIED: Explicitly call expandAllSections after successful import
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
import useAppStore from '../store/appStore'; // Import store

// Custom confirmation dialog setup (assuming it exists and works via store)
const showCustomConfirmation = async (message) => {
  return new Promise(resolve => {
    const openConfirmDialog = useAppStore.getState().openModal;
    window._importConfirmResolve = resolve;
    openConfirmDialog('confirmDialog');
    useAppStore.setState({
      _importConfirmOperation: {
        message: message,
        active: true
      }
    });
  });
};

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  const [importLoading, setImportLoading] = useState(false);
  const setLoading = useAppStore((state) => state.setLoading);
  // --- ADD THIS: Get the expandAllSections action ---
  const expandAllSections = useAppStore((state) => state.expandAllSections);
  // ---

  const handleDocumentImport = useCallback(async (file) => {
    if (!file) return false;

    console.log(`Starting document import for ${file.name}`);

    try {
      const confirmed = await showCustomConfirmation(
        "Creating an example from this document will replace your current work. Continue?"
      );

      if (!confirmed) {
        console.log("User cancelled import operation");
        return false;
      }

      console.log(`Processing import for ${file.name}`);

      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      console.log("Setting loading states to TRUE after confirmation and reset");
      setImportLoading(true);
      setLoading('import', true);
      await new Promise(resolve => setTimeout(resolve, 50));

      const importedData = await importDocumentContent(file, sectionContent);

      if (importedData && importedData.userInputs) {
        // Toggle Detection Logic (remains the same)
        let detectedApproach = 'hypothesis';
        let detectedDataMethod = 'experiment';
        if (importedData.userInputs?.hasOwnProperty('needsresearch')) detectedApproach = 'needsresearch';
        else if (importedData.userInputs?.hasOwnProperty('exploratoryresearch')) detectedApproach = 'exploratoryresearch';
        if (importedData.userInputs?.hasOwnProperty('existingdata')) detectedDataMethod = 'existingdata';
        else if (importedData.userInputs?.hasOwnProperty('theorysimulation')) detectedDataMethod = 'theorysimulation';
        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected toggles: Approach=${detectedApproach}, Method=${detectedDataMethod}`);

        try {
            loadProject(importedData); // Load data into the store
            console.log(`Document ${file.name} successfully processed and loaded.`);

            // --- ADD THIS: Expand all sections after loading ---
            expandAllSections();
            console.log("All sections expanded after import.");
            // ---

            window.dispatchEvent(new CustomEvent('documentImported', {
                detail: { fileName: file.name, timestamp: Date.now(), success: true }
            }));

            return true; // Success
        } catch (loadError) {
             console.error("Error during the loadProject step:", loadError);
             throw new Error(`Failed to load processed data: ${loadError.message}`);
        }
      } else {
          throw new Error("Failed to retrieve valid data from document processing service.");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      return false; // Failure
    } finally {
        console.log("Setting loading states to FALSE after import process finishes (in finally block)");
        setImportLoading(false);
        setLoading('import', false);
    }
  }, [loadProject, sectionContent, resetAllProjectState, setLoading, expandAllSections]); // Added expandAllSections to dependencies

  return {
    importLoading,
    handleDocumentImport
  };
};
