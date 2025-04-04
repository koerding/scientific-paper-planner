/**
 * Utilities for exporting project content
 */


/**
 * Exports the project as a markdown file
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 * @param {boolean} saveJSON - Whether to also save in JSON format for later loading
 */
export const exportProject = (userInputs, chatMessages, sectionContent, saveJSON = true) => {
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
  
  // Create a link and trigger download of markdown
  const mdLink = document.createElement('a');
  mdLink.href = mdUrl;
  mdLink.download = 'scientific-paper-plan.md';
  document.body.appendChild(mdLink);
  mdLink.click();
  
  // Clean up markdown file link
  document.body.removeChild(mdLink);
  URL.revokeObjectURL(mdUrl);

  // If saveJSON is true, also save as JSON for later loading
  if (saveJSON) {
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
    jsonLink.download = 'scientific-paper-plan.json';
    document.body.appendChild(jsonLink);
    jsonLink.click();
    
    // Clean up JSON file link
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
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
