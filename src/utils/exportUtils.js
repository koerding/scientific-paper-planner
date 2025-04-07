/**
 * Utilities for exporting project content
 * UPDATED: Added support for custom file naming and separated JSON export
 * FIXED: More robust save functionality
 */

/**
 * Exports the project as a markdown file
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 * @param {string} [fileName] - Optional custom file name (without extension)
 */
export const exportProject = (userInputs, chatMessages, sectionContent, fileName) => {
  try {
    // Generate a default filename with timestamp if none provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const defaultFileName = `scientific-paper-plan-${timestamp}`;
    
    // Ask for a file name if not provided
    const customFileName = fileName || prompt("Enter a name for your exported file:", defaultFileName);
    
    // If user cancels prompt, exit the function
    if (!customFileName) return;
    
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
    } else {
      dataAcquisition = "## 5. Data Acquisition\nNot completed yet";
    }

    const exportContent = `# Scientific Paper Project Plan

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

    // Create a blob with the markdown content
    const mdBlob = new Blob([exportContent], { type: 'text/markdown' });
    const mdUrl = URL.createObjectURL(mdBlob);
    
    // Ensure filename has .md extension
    const safeFileName = customFileName.endsWith('.md') 
      ? customFileName 
      : `${customFileName}.md`;
    
    // Create a link and trigger download of markdown
    const mdLink = document.createElement('a');
    mdLink.href = mdUrl;
    mdLink.download = safeFileName;
    document.body.appendChild(mdLink);
    mdLink.click();
    
    // Clean up markdown file link
    document.body.removeChild(mdLink);
    URL.revokeObjectURL(mdUrl);
    
    console.log("Project exported successfully as:", safeFileName);
    return true;
  } catch (error) {
    console.error("Error exporting project:", error);
    alert("There was an error exporting the project: " + (error.message || "Unknown error"));
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
    // Generate a default filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const defaultFileName = `scientific-paper-plan-${timestamp}`;
    
    // Ask for file name if not provided
    const customFileName = fileName || prompt("Enter a name for your project file:", defaultFileName);
    
    // If user cancels prompt, exit the function
    if (!customFileName) return false;
    
    // Ensure filename has .json extension
    const safeFileName = customFileName.endsWith('.json') 
      ? customFileName 
      : `${customFileName}.json`;
    
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
 * Validates loaded project data
 * @param {Object} data - The data to validate
 * @returns {boolean} - Whether the data is valid
 */
export const validateProjectData = (data) => {
  // Check if data has required structure
  if (!data || typeof data !== 'object') return false;
  if (!data.userInputs || typeof data.userInputs !== 'object') return false;
  
  // Check if userInputs has at least some of the expected fields
  const expectedFields = ['question', 'audience', 'hypothesis', 'analysis', 'abstract'];
  const hasExpectedFields = expectedFields.some(field => Object.prototype.hasOwnProperty.call(data.userInputs, field));
  
  return hasExpectedFields;
};
