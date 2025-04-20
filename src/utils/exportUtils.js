/**
 * Utilities for exporting project content with real PDF and DOCX generation
 * UPDATED: Added support for custom file naming and separated JSON export
 * FIXED: More robust save functionality
 * FIXED: Added format selection dialog for exports (PDF, DOCX, MD)
 * FIXED: Now creates actual PDF and DOCX files using external libraries
 */

/**
 * Creates a format selection dialog and handles the export based on user selection
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 */
export const exportProject = (userInputs, chatMessages, sectionContent) => {
  try {
    // Create format selection dialog
    const formatDialog = document.createElement('div');
    formatDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    formatDialog.id = 'format-selection-dialog';
    
    formatDialog.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
        <h3 class="text-xl font-bold mb-4 text-gray-800">Choose Export Format</h3>
        <p class="mb-6 text-gray-600">
          Select the file format you would like to export your project to:
        </p>
        <div class="flex flex-col space-y-3">
          <button id="btn-export-pdf" class="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF Document (.pdf)
            </span>
          </button>
          <button id="btn-export-docx" class="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Word Document (.docx)
            </span>
          </button>
          <button id="btn-export-md" class="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Markdown (.md)
            </span>
          </button>
        </div>
        <div class="flex justify-end mt-6">
          <button id="btn-cancel-export" class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(formatDialog);
    
    // Handle button clicks
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
      exportAsPdf(userInputs, chatMessages, sectionContent);
    });
    
    document.getElementById('btn-export-docx').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
      exportAsDocx(userInputs, chatMessages, sectionContent);
    });
    
    document.getElementById('btn-export-md').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
      exportAsMarkdown(userInputs, chatMessages, sectionContent);
    });
    
    document.getElementById('btn-cancel-export').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
    });
    
    return true;
  } catch (error) {
    console.error("Error showing export dialog:", error);
    alert("There was an error showing the export dialog. Using markdown export as fallback.");
    
    // Fallback to markdown export
    return exportAsMarkdown(userInputs, chatMessages, sectionContent);
  }
};

/**
 * Common function to get project content as structured text
 * @param {Object} userInputs - The user inputs
 * @returns {string} - Formatted content
 */
const getFormattedContent = (userInputs) => {
  // Determine research approach based on filled out sections
  let researchApproach = "";
  
  if (userInputs.hypothesis && userInputs.hypothesis.trim() !== "") {
    researchApproach = "## 3. Hypothesis-Based Research\n" + userInputs.hypothesis;
  } else if (userInputs.needsresearch && userInputs.needsresearch.trim() !== "") {
    researchApproach = "## 3. Needs-Based Research\n" + userInputs.needsresearch;
  } else if (userInputs.exploratoryresearch && userInputs.exploratoryresearch.trim() !== "") {
    researchApproach = "## 3. Exploratory Research\n" + userInputs.exploratoryresearch;
  } else {
    researchApproach = "## 3. Research Approach\nNot completed yet";
  }
  
  // Determine data acquisition approach
  let dataAcquisition = "";
  
  if (userInputs.experiment && userInputs.experiment.trim() !== "") {
    dataAcquisition = "## 5. Experimental Design\n" + userInputs.experiment;
  } else if (userInputs.existingdata && userInputs.existingdata.trim() !== "") {
    dataAcquisition = "## 5. Pre-existing Data\n" + userInputs.existingdata;
  } else if (userInputs.theorysimulation && userInputs.theorysimulation.trim() !== "") {
    dataAcquisition = "## 5. Theory/Simulation Approach\n" + userInputs.theorysimulation;
  } else {
    dataAcquisition = "## 5. Data Acquisition\nNot completed yet";
  }

  return `# Scientific Paper Project Plan

## 1. Research Question & Logic
${userInputs.question || "Not completed yet"}

## 2. Target Audience
${userInputs.audience || "Not completed yet"}

${researchApproach}

## 4. Related Papers
${userInputs.relatedpapers || "Not completed yet"}

${dataAcquisition}

## 6. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 7. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 8. Abstract
${userInputs.abstract || "Not completed yet"}
`;
};

/**
 * Helper to prompt for filename
 * @param {string} extension - File extension without dot
 * @returns {string|null} - Filename with extension or null if canceled
 */
const promptForFilename = (extension) => {
  // Generate a default filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const defaultFileName = `scientific-paper-plan-${timestamp}`;
  
  // Ask for a file name
  const customFileName = prompt(`Enter a name for your exported ${extension.toUpperCase()} file:`, defaultFileName);
  
  // If user cancels prompt, return null
  if (!customFileName) return null;
  
  // Ensure filename has correct extension
  return customFileName.endsWith(`.${extension}`) 
    ? customFileName 
    : `${customFileName}.${extension}`;
};

/**
 * Exports the project as a markdown file
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
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

/**
 * Dynamically load an external library from CDN
 * @param {string} url - The URL of the library to load
 * @returns {Promise} - Resolves when the library is loaded
 */
const loadExternalLibrary = (url) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      console.log(`Library loaded: ${url}`);
      resolve();
    };
    script.onerror = () => {
      console.error(`Failed to load library: ${url}`);
      reject(new Error(`Failed to load library: ${url}`));
    };
    document.body.appendChild(script);
  });
};

/**
 * Exports the project as a DOCX file using docx.js
 * FIXED: Corrected the sections processing issue with proper error handling
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
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

/**
 * Exports the project as a PDF file using jsPDF
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 * @returns {boolean} - Success flag
 */
export const exportAsPdf = async (userInputs, chatMessages, sectionContent) => {
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
          <span>Generating PDF document...</span>
        </div>
      </div>
    `;
    document.body.appendChild(loadingMessage);
    
    // Get filename
    const safeFileName = promptForFilename('pdf');
    if (!safeFileName) {
      document.body.removeChild(loadingMessage);
      return false;
    }
    
    // Load the jsPDF library from CDN
    try {
      await Promise.all([
        loadExternalLibrary('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
        loadExternalLibrary('https://unpkg.com/markdown-it@12.3.2/dist/markdown-it.min.js')
      ]);
    } catch (error) {
      console.error("Failed to load PDF libraries:", error);
      document.body.removeChild(loadingMessage);
      alert("Failed to load the PDF generation libraries. Please try again or use a different format.");
      return false;
    }
    
    // Check if the libraries loaded correctly
    if (!window.jspdf || !window.markdownit) {
      console.error("PDF libraries not found in global scope");
      document.body.removeChild(loadingMessage);
      alert("PDF generation libraries failed to initialize. Please try again or use a different format.");
      return false;
    }
    
    // Get formatted content
    const markdownContent = getFormattedContent(userInputs);
    
    // Convert markdown to HTML for better formatting
    const md = window.markdownit();
    const htmlContent = md.render(markdownContent);
    
    // Create a hidden div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set font settings
    pdf.setFont('helvetica');
    pdf.setFontSize(11);
    
    // Calculate page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20; // 20mm margins
    const contentWidth = pageWidth - (margin * 2);
    
    // Process HTML content into simpler structure for PDF
    const sections = [];
    
    // Process h1 headers (main title)
    const h1Elements = tempDiv.querySelectorAll('h1');
    for (const h1 of h1Elements) {
      sections.push({
        type: 'h1',
        text: h1.textContent,
      });
    }
    
    // Process h2 headers (section headers) and paragraphs
    const h2Elements = tempDiv.querySelectorAll('h2');
    for (const h2 of h2Elements) {
      sections.push({
        type: 'h2',
        text: h2.textContent,
      });
      
      // Get all content until the next h2
      let nextElement = h2.nextElementSibling;
      while (nextElement && nextElement.tagName !== 'H2') {
        if (nextElement.tagName === 'P') {
          sections.push({
            type: 'p',
            text: nextElement.textContent,
          });
        }
        nextElement = nextElement.nextElementSibling;
      }
    }
    
    // Draw content to PDF
    let y = margin;
    
    for (const section of sections) {
      // Set styling based on content type
      if (section.type === 'h1') {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 139); // dark blue
      } else if (section.type === 'h2') {
        // Check if we need a new page
        if (y > pageHeight - margin * 2) {
          pdf.addPage();
          y = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 100); // medium blue
        
        // Add some extra spacing before new sections
        y += 5;
      } else {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // black
      }
      
      // Split text into lines that fit the page width
      const lines = pdf.splitTextToSize(section.text, contentWidth);
      
      // Check if we need a new page
      if (y + (lines.length * 7) > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      
      // Draw text
      pdf.text(lines, margin, y);
      
      // Update y position for next content
      y += (lines.length * 7) + (section.type === 'h1' || section.type === 'h2' ? 5 : 3);
    }
    
    // Save the PDF
    pdf.save(safeFileName);
    
    // Clean up
    document.body.removeChild(tempDiv);
    document.body.removeChild(loadingMessage);
    
    console.log("Project exported successfully as PDF:", safeFileName);
    return true;
  } catch (error) {
    console.error("Error exporting project as PDF:", error);
    
    // Remove loading message if present
    const loadingMessage = document.querySelector('.fixed.inset-0.bg-gray-600.bg-opacity-50');
    if (loadingMessage) {
      document.body.removeChild(loadingMessage);
    }
    
    alert("There was an error exporting the project as PDF: " + (error.message || "Unknown error"));
    return false;
  }
};

/**
 * Creates a JSON project file for later loading
 * FIXED: More robust implementation
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {string} [fileName] - Optional custom file name (without extension)
 * @returns {boolean} Success indicator
 */
export const saveProjectAsJson = (userInputs, chatMessages, fileName) => {
  try {
    // Get filename from parameter or prompt
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

/**
 * Validates loaded project data with improved handling for imports
 * @param {Object} data - The data to validate
 * @returns {boolean} - Whether the data is valid
 */
export const validateProjectData = (data) => {
  // Basic structure validation
  if (!data || typeof data !== 'object') {
    console.error("validateProjectData: data is not an object");
    return false;
  }
  
  // Check for userInputs structure
  if (!data.userInputs || typeof data.userInputs !== 'object') {
    console.error("validateProjectData: userInputs missing or not an object");
    return false;
  }
  
  // Get all keys from userInputs to check content
  const existingFields = Object.keys(data.userInputs);
  if (existingFields.length === 0) {
    console.error("validateProjectData: userInputs is empty");
    return false;
  }
  
  // IMPROVED: More lenient validation for document imports
  // Instead of requiring ALL fields, accept if ANY of the common fields exist
  const commonFields = ['question', 'audience', 'hypothesis', 'relatedpapers', 'analysis', 'abstract'];
  
  // Check if at least one common field exists
  const hasCommonField = commonFields.some(field => 
    existingFields.includes(field) && 
    typeof data.userInputs[field] === 'string' &&
    data.userInputs[field].trim() !== ''
  );
  
  // Check if userInputs has at least some field with actual content
  const hasAnyContent = existingFields.some(field => 
    typeof data.userInputs[field] === 'string' && 
    data.userInputs[field].trim() !== ''
  );
  
  // Accept if either common fields are found or there's significant content
  return hasCommonField || (hasAnyContent && existingFields.length >= 3);
};
