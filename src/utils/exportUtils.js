/**
 * Utilities for exporting project content
 */

/**
 * Exports the project as a markdown file
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages
 * @param {Object} sectionContent - The section content
 */
export const exportProject = (userInputs, chatMessages, sectionContent) => {
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

  // Create a blob with the content
  const blob = new Blob([exportContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  // Create a link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scientific-paper-plan.md';
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
