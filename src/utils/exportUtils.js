/**
 * Utilities for exporting project content
 */

/**
 * Exports the project as a markdown file
 * @param {Object} userInputs - The user inputs
 * @param {Array} philosophyOptions - The philosophy options
 */
export const exportProject = (userInputs, philosophyOptions) => {
  const exportContent = `# Scientific Paper Project Plan

## 1. Research Question
${userInputs.question || "Not completed yet"}

## 2. Hypotheses
${userInputs.hypothesis || "Not completed yet"}

## 3. Research Philosophy
${userInputs.philosophy.map(id => `- ${philosophyOptions.find(o => o.id === id).label}`).join('\n') || "Not selected yet"}

## 4. Experimental Design
${userInputs.experiment || "Not completed yet"}

## 5. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 6. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 7. Abstract
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
