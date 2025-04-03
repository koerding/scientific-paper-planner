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
  const exportContent = `# Scientific Paper Project Plan

## 1. Research Question & Philosophy
${userInputs.question || "Not completed yet"}

## 2. Target Audience
${userInputs.audience || "Not completed yet"}

## 3. Hypotheses
${userInputs.hypothesis || "Not completed yet"}

## 4. Related Papers
${userInputs.relatedpapers || "Not completed yet"}

## 5. Experimental Design
${userInputs.experiment || "Not completed yet"}

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
