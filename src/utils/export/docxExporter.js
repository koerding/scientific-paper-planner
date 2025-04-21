// FILE: src/utils/export/docxExporter.js

/**
 * DOCX exporter for the Scientific Paper Planner
 */
import { getFormattedContent, promptForFilename } from './exportBase';
import { loadExternalLibrary } from '../cdnLoader';

/**
 * Exports the project as a DOCX file using docx.js
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages (unused but kept for consistency)
 * @param {Object} sectionContent - The section content (unused but kept for consistency)
 * @returns {boolean} - Success flag
 */
export const exportAsDocx = async (userInputs, chatMessages, sectionContent) => {
  try {
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    loadingMessage.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl">
        <div class="flex items-center">
          <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Generating DOCX document...</span>
        </div>
      </div>
    `;
    document.body.appendChild(loadingMessage);
    
    // Get filename
    const safeFileName = promptForFilename('docx');
    if (!safeFileName) {
      document.body.removeChild(loadingMessage);
      return false;
    }
    
    // Load the docx library from CDN
    try {
      // Use a different version of docx that's more reliable for our use case
      await loadExternalLibrary('https://unpkg.com/docx@5.0.2/build/index.js');
    } catch (error) {
      console.error("Failed to load docx.js:", error);
      document.body.removeChild(loadingMessage);
      alert("Failed to load the Word document generation library. Please try again or use a different format.");
      return false;
    }
    
    // Check if the library loaded correctly
    if (!window.docx) {
      console.error("docx library not found in global scope");
      document.body.removeChild(loadingMessage);
      alert("Word document generation library failed to initialize. Please try again or use a different format.");
      return false;
    }
    
    // Get formatted content
    const markdownContent = getFormattedContent(userInputs);
    
    // Create DOCX document
    const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = window.docx;
    
    // Create a simple document structure
    const doc = new Document({
      sections: [{
        properties: {},
        children: []
      }]
    });
    
    // Process markdown content line by line
    const lines = markdownContent.split('\n');
    const children = [];
    
    for (let line of lines) {
      line = line.trim();
      
      if (line.startsWith('# ')) {
        // Main heading (h1)
        children.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: 340,
              after: 240
            }
          })
        );
      } else if (line.startsWith('## ')) {
        // Subheading (h2)
        children.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          })
        );
      } else if (line.length > 0) {
        // Regular paragraph
        children.push(
          new Paragraph({
            text: line,
            spacing: {
              before: 120,
              after: 120
            }
          })
        );
      } else {
        // Empty line - add a spacing paragraph
        children.push(
          new Paragraph({
            text: "",
            spacing: {
              before: 100,
              after: 100
            }
          })
        );
      }
    }
    
    // Add all paragraphs to the document
    doc.addSection({
      properties: {},
      children: children
    });
    
    // Generate and save the DOCX file
    Packer.toBlob(doc).then(blob => {
      // Create a download link for the blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      document.body.removeChild(loadingMessage);
      
      console.log("Project exported successfully as DOCX:", safeFileName);
    }).catch(error => {
      console.error("Error generating DOCX:", error);
      document.body.removeChild(loadingMessage);
      alert("There was an error generating the DOCX file: " + (error.message || "Unknown error"));
    });
    
    return true;
  } catch (error) {
    console.error("Error exporting project as DOCX:", error);
    
    // Remove loading message if present
    const loadingMessage = document.querySelector('.fixed.inset-0.bg-gray-600.bg-opacity-50');
    if (loadingMessage) {
      document.body.removeChild(loadingMessage);
    }
    
    alert("There was an error exporting the project as DOCX: " + (error.message || "Unknown error"));
    return false;
  }
};
