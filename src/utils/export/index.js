// FILE: src/utils/export/index.js

/**
 * Centralized export module that brings all export functionality together
 * UPDATED: saveProjectAsJson now accepts the full state object
 */

import { showExportDialog, validateProjectData, promptForFilename } from './exportBase';
import { exportAsMarkdown } from './markdownExporter';
import { exportAsPdf } from './pdfExporter';
import { exportAsDocx } from './docxExporter';

/**
 * Creates a format selection dialog and handles the export based on user selection
 * (Export to PDF/DOCX/MD still uses only content for simplicity)
 * @param {Object} userInputs - The user inputs (content only for these formats)
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 */
export const exportProject = (userInputs, chatMessages, sectionContent) => {
  return showExportDialog(userInputs, chatMessages, sectionContent, {
    markdown: exportAsMarkdown,
    pdf: exportAsPdf,
    docx: exportAsDocx
  });
};

/**
 * Creates a JSON project file for later loading, including full state.
 * @param {Object} stateToSave - The relevant parts of the Zustand state object (sections, toggles, scores, proMode, chatMessages).
 * @param {string} [fileName] - Optional custom file name (without extension)
 * @returns {boolean} Success indicator
 */
export const saveProjectAsJson = (stateToSave, fileName) => {
  try {
    // Get filename from parameter or prompt
    const safeFileName = fileName || promptForFilename('json');
    if (!safeFileName) return false;

    // Prepare the data to be saved
    // Ensure we only save the necessary parts of the state
    const jsonData = {
      sections: stateToSave.sections || {}, // Full section state including feedback
      activeToggles: stateToSave.activeToggles || { approach: 'hypothesis', dataMethod: 'experiment' },
      scores: stateToSave.scores || {},
      proMode: stateToSave.proMode || false,
      chatMessages: stateToSave.chatMessages || {},
      timestamp: new Date().toISOString(),
      version: "2.0" // Increment version number due to format change
    };

    // Create JSON blob
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);

    // Create a link and trigger download of JSON
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = safeFileName;
    document.body.appendChild(jsonLink);
    jsonLink.click();

    // Clean up JSON file link
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    console.log("Project saved successfully as:", safeFileName);
    return true;
  } catch (error) {
    console.error("Error saving project as JSON:", error);
    alert("There was an error saving the project: " + (error.message || "Unknown error"));
    return false;
  }
};

// Re-export needed functions
export { validateProjectData };
