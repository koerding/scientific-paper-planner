// FILE: src/utils/export/index.js

/**
 * Centralized export module that brings all export functionality together
 */

import { showExportDialog, validateProjectData, promptForFilename } from './exportBase';
import { exportAsMarkdown } from './markdownExporter';
import { exportAsPdf } from './pdfExporter';
import { exportAsDocx } from './docxExporter';

/**
 * Creates a format selection dialog and handles the export based on user selection
 * @param {Object} userInputs - The user inputs
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
 * Creates a JSON project file for later loading
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {string} [fileName] - Optional custom file name (without extension)
 * @returns {boolean} Success indicator
 */
export const saveProjectAsJson = (userInputs, chatMessages, fileName) => {
  try {
    // Get filename from base helper
    const safeFileName = fileName || promptForFilename('json');
    if (!safeFileName) return false;
    
    const jsonData = {
      userInputs,
      chatMessages,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

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
