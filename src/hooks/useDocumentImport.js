// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Removed direct call to expandAllSections from deleted sectionStateService.
 * Expansion is now handled by the store's loadProjectData action.
 * UPDATED: Detects appropriate research approach and data method
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
// REMOVED: import { expandAllSections } from '../services/sectionStateService'; // <-- Removed import

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  const [importLoading, setImportLoading] = useState(false);

  const handleDocumentImport = useCallback(async (file) => {
    setImportLoading(true);

    try {
      // Ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setImportLoading(false);
        return false;
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

      console.log("Document import returned data:", importedData ? "Success" : "Failed");

      // REMOVED: Explicit call to expandAllSections() is no longer needed here.
      // console.log("[handleDocumentImport] Explicitly expanded all sections");

      // Load the imported data using the loadProject function (which should trigger store update)
      if (importedData) {
        // DETECT WHICH TOGGLES SHOULD BE ACTIVE BASED ON IMPORTED DATA
        let detectedApproach = 'hypothesis'; // Default
        let detectedDataMethod = 'experiment'; // Default

        // Check which research approach has content
        if (importedData.userInputs?.needsresearch &&
            importedData.userInputs.needsresearch.trim() !== '') {
          detectedApproach = 'needsresearch';
        } else if (importedData.userInputs?.exploratoryresearch &&
                  importedData.userInputs.exploratoryresearch.trim() !== '') {
          detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs?.hypothesis &&
                  importedData.userInputs.hypothesis.trim() !== '') {
          detectedApproach = 'hypothesis';
        }

        // Check which data method has content
        if (importedData.userInputs?.existingdata &&
            importedData.userInputs.existingdata.trim() !== '') {
          detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs?.theorysimulation &&
                  importedData.userInputs.theorysimulation.trim() !== '') {
          detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs?.experiment &&
                  importedData.userInputs.experiment.trim() !== '') {
          detectedDataMethod = 'experiment';
        }

        // Include detected toggles in the loaded data
        importedData.detectedToggles = {
          approach: detectedApproach,
          dataMethod: detectedDataMethod
        };

        console.log(`[handleDocumentImport] Detected approach: ${detectedApproach}, data method: ${detectedDataMethod}`);

        const result = loadProject(importedData); // This function now calls the store's loadProjectData
        if (result) {
          console.log(`Document ${file.name} successfully imported`);

          // Dispatch event with toggle information
           // NOTE: The 'expandAllSections' detail might be redundant now but kept for potential listeners.
          window.dispatchEvent(new CustomEvent('documentImported', {
            detail: {
              fileName: file.name,
              timestamp: Date.now(),
              expandAllSections: true,
              detectedApproach,
              detectedDataMethod
            }
          }));

          return true;
        }
      }

      throw new Error("Failed to process imported document data");
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      return false;
    } finally {
      setImportLoading(false);
    }
  }, [loadProject, sectionContent, resetAllProjectState]);

  return {
    importLoading,
    handleDocumentImport
  };
};
