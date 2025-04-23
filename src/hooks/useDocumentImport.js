// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Removed direct dependency on sectionStateService. Section expansion
 * is now handled by the loadProjectData action in the store and the
 * 'documentImported' event listener in VerticalPaperPlannerApp.
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';
// Removed import: import { expandAllSections } from '../services/sectionStateService';

export const useDocumentImport = (loadProject, sectionContent, resetAllProjectState) => {
  const [importLoading, setImportLoading] = useState(false);

  const handleDocumentImport = useCallback(async (file) => {
    setImportLoading(true);

    try {
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setImportLoading(false);
        return false;
      }
      console.log(`Starting import process for ${file.name}`);

      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
        console.log("[handleDocumentImport] Reset all project state before import");
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }

      const importedData = await importDocumentContent(file, sectionContent);
      console.log("Document import returned data:", importedData ? "Success" : "Failed");

      // Section expansion is now handled by the loadProjectData action in the store
      // which sets isMinimized to false for all sections upon loading.
      // No need to call expandAllSections() here directly.
      // console.log("[handleDocumentImport] Explicitly expanded all sections"); <-- Removed this call

      if (importedData) {
        let detectedApproach = 'hypothesis';
        let detectedDataMethod = 'experiment';

        if (importedData.userInputs.needsresearch?.trim()) {
          detectedApproach = 'needsresearch';
        } else if (importedData.userInputs.exploratoryresearch?.trim()) {
          detectedApproach = 'exploratoryresearch';
        } else if (importedData.userInputs.hypothesis?.trim()) {
          detectedApproach = 'hypothesis';
        }

        if (importedData.userInputs.existingdata?.trim()) {
          detectedDataMethod = 'existingdata';
        } else if (importedData.userInputs.theorysimulation?.trim()) {
          detectedDataMethod = 'theorysimulation';
        } else if (importedData.userInputs.experiment?.trim()) {
          detectedDataMethod = 'experiment';
        }

        importedData.detectedToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        console.log(`[handleDocumentImport] Detected approach: ${detectedApproach}, data method: ${detectedDataMethod}`);

        const result = loadProject(importedData); // This now loads into the Zustand store

        if (result) {
          console.log(`Document ${file.name} successfully imported`);
          // Event dispatched to notify components (e.g., for analytics or minor UI updates)
          // The store handles the core state update (including expansion).
          window.dispatchEvent(new CustomEvent('documentImported', {
            detail: {
              fileName: file.name,
              timestamp: Date.now(),
              expandAllSections: true, // Keep flag for potential listeners
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
      // Consider if you want to load fallback data here or just return false
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
