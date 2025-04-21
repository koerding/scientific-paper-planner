// FILE: src/utils/export/markdownExporter.js

/**
 * Markdown exporter for the Scientific Paper Planner
 */
import { getFormattedContent, promptForFilename } from './exportBase';

/**
 * Exports the project as a markdown file
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages (unused but kept for consistency)
 * @param {Object} sectionContent - The section content (unused but kept for consistency)
 * @param {string} [fileName] - Optional custom file name (without extension)
 * @returns {boolean} - Success flag
 */
export const exportAsMarkdown = (userInputs, chatMessages, sectionContent, fileName) => {
  try {
    // Get filename from parameter or prompt
    const safeFileName = fileName || promptForFilename('md');
    if (!safeFileName) return false;
    
    // Get formatted content
    const exportContent = getFormattedContent(userInputs);
    
    // Create a blob with the markdown content
    const mdBlob = new Blob([exportContent], { type: 'text/markdown' });
    const mdUrl = URL.createObjectURL(mdBlob);
    
    // Create a link and trigger download of markdown
    const mdLink = document.createElement('a');
    mdLink.href = mdUrl;
    mdLink.download = safeFileName;
    document.body.appendChild(mdLink);
    mdLink.click();
    
    // Clean up markdown file link
    document.body.removeChild(mdLink);
    URL.revokeObjectURL(mdUrl);
    
    console.log("Project exported successfully as Markdown:", safeFileName);
    return true;
  } catch (error) {
    console.error("Error exporting project as Markdown:", error);
    alert("There was an error exporting the project as Markdown: " + (error.message || "Unknown error"));
    return false;
  }
};
