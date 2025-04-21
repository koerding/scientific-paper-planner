// FILE: src/hooks/useDocumentImport.js

/**
 * Hook for managing document import functionality
 * UPDATED: Now uses the unified reset function before importing
 */
import { useState, useCallback } from 'react';
import { importDocumentContent } from '../services/documentImportService';

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
      // This will clear feedback, reset section states, and clear localStorage
      if (resetAllProjectState && typeof resetAllProjectState === 'function') {
        resetAllProjectState();
        console.log("[handleDocumentImport] Reset all project state before import");
      } else {
        console.warn("[handleDocumentImport] resetAllProjectState function not provided");
      }
      
      // Pass sectionContent to the import service
      const importedData = await importDocumentContent(file, sectionContent);
      
      console.log("Document import returned data:", importedData ? "Success" : "Failed");
      
      // Load the imported data using the loadProject function
      if (importedData) {
        const result = loadProject(importedData);
        if (result) {
          console.log(`Document ${file.name} successfully imported`);
          
          // Dispatch a specific event for document imports
          window.dispatchEvent(new CustomEvent('documentImported', {
            detail: { 
              timestamp: Date.now(),
              filename: file.name
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
