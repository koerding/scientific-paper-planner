/**
 * Utilities for handling example projects
 */

/**
 * Load all available examples from the data/examples directory
 * @returns {Promise<Array>} Array of example objects with { id, name, description, data }
 */
export const loadExamples = async () => {
  try {
    // Get a list of all example files in the directory
    const exampleContext = require.context('../data/examples', false, /\.json$/);
    const exampleFiles = exampleContext.keys();
    
    // Load each example file and extract metadata
    const examples = await Promise.all(exampleFiles.map(async (filePath) => {
      try {
        // Get the file name without extension as ID
        const id = filePath.replace(/^\.\//, '').replace(/\.json$/, '');
        
        // Load the example data
        const exampleData = exampleContext(filePath);
        
        // Extract name and description if available, or generate from content
        const name = exampleData.metadata?.name || generateName(id, exampleData);
        const description = exampleData.metadata?.description || generateDescription(exampleData);
        
        return {
          id,
          name,
          description,
          data: exampleData
        };
      } catch (error) {
        console.error(`Error processing example ${filePath}:`, error);
        return null;
      }
    }));
    
    // Filter out any examples that failed to load
    return examples.filter(example => example !== null);
  } catch (error) {
    console.error('Error loading examples:', error);
    return [];
  }
};

/**
 * Generate a descriptive name from the example data
 * @param {string} id - The file ID
 * @param {Object} data - The example data
 * @returns {string} A descriptive name
 */
const generateName = (id, data) => {
  // Try to extract a name from the research question
  if (data.userInputs?.question) {
    const questionText = data.userInputs.question;
    
    // Look for the research question text
    const match = questionText.match(/Research Question:\s*([^.!?\n]+)/);
    if (match && match[1]) {
      // Return a shortened version of the question
      const question = match[1].trim();
      if (question.length > 40) {
        return question.substring(0, 37) + '...';
      }
      return question;
    }
  }
  
  // If we can't extract from the question, create a name from the ID
  return id.replace(/[-_]/g, ' ')
           .replace(/\b\w/g, letter => letter.toUpperCase()); // capitalize words
};

/**
 * Generate a description from the example data
 * @param {Object} data - The example data
 * @returns {string} A descriptive summary
 */
const generateDescription = (data) => {
  const parts = [];
  
  // Try to extract information from various fields
  if (data.userInputs?.question) {
    const questionText = data.userInputs.question;
    
    // Look for significance/impact
    const significanceMatch = questionText.match(/Significance\/Impact:\s*([^.!?]+[.!?])/);
    if (significanceMatch && significanceMatch[1]) {
      parts.push(significanceMatch[1].trim());
    }
  }
  
  // Include information about the research approach
  let approachType = 'research';
  if (data.userInputs?.hypothesis) {
    approachType = 'hypothesis-driven research';
  } else if (data.userInputs?.needsresearch) {
    approachType = 'needs-based research';
  } else if (data.userInputs?.exploratoryresearch) {
    approachType = 'exploratory research';
  }
  
  // Include information about data collection
  let dataType = '';
  if (data.userInputs?.experiment) {
    dataType = 'experiment';
  } else if (data.userInputs?.existingdata) {
    dataType = 'existing dataset analysis';
  }
  
  // Construct the description
  if (parts.length > 0) {
    return `${parts.join(' ')} A ${approachType} project using ${dataType}.`;
  } else {
    return `A ${approachType} project using ${dataType}.`;
  }
};

/**
 * Get an example by ID
 * @param {string} id - The example ID to load
 * @returns {Promise<Object|null>} The example data or null if not found
 */
export const getExampleById = async (id) => {
  try {
    const examples = await loadExamples();
    return examples.find(example => example.id === id) || null;
  } catch (error) {
    console.error(`Error loading example ${id}:`, error);
    return null;
  }
};
