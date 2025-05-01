// FILE: src/utils/export/index.js

/**
 * Centralized export module that brings all export functionality together
 * UPDATED: saveProjectAsJson to save full section data including feedback
 */

import { showExportDialog, validateProjectData, promptForFilename } from './exportBase';
import { exportAsMarkdown } from './markdownExporter';
import { exportAsPdf } from './pdfExporter';
import { exportAsDocx } from './docxExporter';
import useAppStore from '../../store/appStore'; // Import the store to access full state

/**
 * Creates a format selection dialog and handles the export based on user selection
 * @param {Object} userInputs - The user inputs (content only for PDF/DOCX/MD)
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
 * Creates a JSON project file for later loading.
 * UPDATED: Now saves complete section data including AI feedback
 * @param {Object} userInputs - The user inputs object (key: sectionId, value: content string).
 * @param {Object} chatMessages - The chat messages object.
 * @param {string} [fileName] - Optional custom file name (without extension)
 * @returns {boolean} Success indicator
 */
export const saveProjectAsJson = (userInputs, chatMessages, fileName) => {
  try {
    // Get filename from parameter or prompt
    const safeFileName = fileName || promptForFilename('json');
    if (!safeFileName) return false;

    // Get complete sections data from store to preserve feedback
    const fullSectionsData = useAppStore.getState().sections;
    
    // Preserve active toggles and other important state
    const activeToggles = useAppStore.getState().activeToggles;
    const scores = useAppStore.getState().scores;
    const proMode = useAppStore.getState().proMode;

    // Prepare the data to be saved
    const jsonData = {
      // Save full sections data rather than just content
      sections: fullSectionsData,
      // Still include userInputs for backward compatibility
      userInputs: userInputs || {},
      chatMessages: chatMessages || {},
      // Add important state information
      activeToggles,
      scores,
      proMode,
      timestamp: new Date().toISOString(),
      version: "1.1" // Updated version number
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
export { validateProjectData };// FILE: src/utils/export/index.js

/**
 * Centralized export module that brings all export functionality together
 * REVERTED: saveProjectAsJson accepts userInputs (content) and chatMessages
 */

import { showExportDialog, validateProjectData, promptForFilename } from './exportBase';
import { exportAsMarkdown } from './markdownExporter';
import { exportAsPdf } from './pdfExporter';
import { exportAsDocx } from './docxExporter';

/**
 * Creates a format selection dialog and handles the export based on user selection
 * @param {Object} userInputs - The user inputs (content only for PDF/DOCX/MD)
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
 * Creates a JSON project file for later loading (saves content and chat).
 * @param {Object} userInputs - The user inputs object (key: sectionId, value: content string).
 * @param {Object} chatMessages - The chat messages object.
 * @param {string} [fileName] - Optional custom file name (without extension)
 * @returns {boolean} Success indicator
 */
export const saveProjectAsJson = (userInputs, chatMessages, fileName) => {
  try {
    // Get filename from parameter or prompt
    const safeFileName = fileName || promptForFilename('json');
    if (!safeFileName) return false;

    // Prepare the data to be saved
    // This version only saves content and chat messages
    const jsonData = {
      userInputs: userInputs || {}, // Save only the content
      chatMessages: chatMessages || {}, // Save chat messages
      timestamp: new Date().toISOString(),
      version: "1.0" // Original version number
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
