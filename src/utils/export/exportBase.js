// FILE: src/utils/export/exportBase.js

/**
 * Base export utilities shared across different export formats
 */

/**
 * Helper to prompt for filename
 * @param {string} extension - File extension without dot
 * @returns {string|null} - Filename with extension or null if canceled
 */
export const promptForFilename = (extension) => {
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
 * Creates a format selection dialog and handles the export based on user selection
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 * @param {Object} exporters - Object containing export functions by format
 */
export const showExportDialog = (userInputs, chatMessages, sectionContent, exporters) => {
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
      exporters.pdf(userInputs, chatMessages, sectionContent);
    });
    
    document.getElementById('btn-export-docx').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
      exporters.docx(userInputs, chatMessages, sectionContent);
    });
    
    document.getElementById('btn-export-md').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
      exporters.markdown(userInputs, chatMessages, sectionContent);
    });
    
    document.getElementById('btn-cancel-export').addEventListener('click', () => {
      document.body.removeChild(formatDialog);
    });
    
    return true;
  } catch (error) {
    console.error("Error showing export dialog:", error);
    alert("There was an error showing the export dialog. Using markdown export as fallback.");
    
    // Fallback to markdown export if available
    if (exporters.markdown) {
      return exporters.markdown(userInputs, chatMessages, sectionContent);
    }
    return false;
  }
};

/**
 * Common function to get project content as structured text
 * @param {Object} userInputs - The user inputs
 * @returns {string} - Formatted content
 */
export const getFormattedContent = (userInputs) => {
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
 * Validates loaded project data 
 * @param {Object} data - The data to validate
 * @returns {boolean} - Whether the data is valid
 */
export const validateProjectData = (data) => {
  // Basic validation checks with detailed logging
  if (!data) {
    console.error("validateProjectData: data is null or undefined");
    return false;
  }
  
  // Check if it's an object
  if (typeof data !== 'object') {
    console.error("validateProjectData: data is not an object, it's a", typeof data);
    return false;
  }
  
  // Direct check for the actual structure we're getting
  console.log("validateProjectData: received data structure:", 
              typeof data, 
              data ? Object.keys(data).join(', ') : "null/undefined");
  
  // Consider different valid formats:
  // 1. Object with userInputs property (standard format)
  // 2. Object that IS the userInputs (the API sometimes returns this directly)
  
  let userInputs = null;
  
  // Case 1: Standard format with userInputs property
  if (data.userInputs && typeof data.userInputs === 'object') {
    userInputs = data.userInputs;
    console.log("validateProjectData: found standard format with userInputs property");
  } 
  // Case 2: The object itself contains input fields
  else if (data.question || data.abstract || data.audience) {
    // The data object itself appears to be the userInputs
    userInputs = data;
    console.log("validateProjectData: object appears to be userInputs directly");
  }
  // Neither case matches
  else {
    console.error("validateProjectData: could not find userInputs in data");
    return false;
  }
  
  // Get all keys from userInputs to check content
  const existingFields = Object.keys(userInputs);
  console.log("validateProjectData: found fields:", existingFields);
  
  if (existingFields.length === 0) {
    console.error("validateProjectData: userInputs is empty");
    return false;
  }
  
  // IMPROVED: Extremely lenient validation for imported documents
  // Accept if ANY field has non-empty content
  const hasAnyContent = existingFields.some(field => {
    const value = userInputs[field];
    const hasValue = typeof value === 'string' && value.trim() !== '';
    return hasValue;
  });
  
  if (!hasAnyContent) {
    console.error("validateProjectData: no fields have content");
    return false;
  }
  
  // If we made it here, the data is valid enough to use
  console.log("validateProjectData: data is valid");
  return true;
};
