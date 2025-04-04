/**
 * Service for importing content from PDF files
 * Uses OpenAI to extract structured information from scientific papers
 */
import { callOpenAI } from './openaiService';

/**
 * Extracts text from a PDF file
 * @param {File} pdfFile - The PDF file object
 * @returns {Promise<string>} - The extracted text
 */
const extractTextFromPdf = async (pdfFile) => {
  try {
    // Create a promise that resolves with the text content
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        
        try {
          // In a real implementation, we would use a PDF parsing library
          // For this demo, we'll just simulate the extraction
          console.log('PDF content loaded, simulating text extraction...');
          
          // Simplified extraction - in a real app, use a library like pdf.js
          // Instead, we'll just pass the size of the PDF to OpenAI as context
          const fileSize = pdfFile.size;
          resolve(`PDF uploaded: ${pdfFile.name} (${Math.round(fileSize / 1024)} KB)`);
        } catch (error) {
          console.error('Error parsing PDF:', error);
          reject(new Error('Failed to parse PDF. Please make sure it\'s a valid PDF file.'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading PDF:', error);
        reject(new Error('Failed to read PDF file.'));
      };
      
      // Read the file as an array buffer
      reader.readAsArrayBuffer(pdfFile);
    });
  } catch (error) {
    console.error('Error in extractTextFromPdf:', error);
    throw error;
  }
};

/**
 * Processes a scientific paper PDF and extracts structured data
 * @param {File} pdfFile - The PDF file object
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export const importPaperFromPdf = async (pdfFile) => {
  try {
    // Step 1: Extract text from PDF
    const pdfText = await extractTextFromPdf(pdfFile);
    
    // Step 2: Prepare the prompt for OpenAI
    const prompt = `
# Scientific Paper Extraction - Strict Format

## Task Overview
Extract key components from the scientific paper and format them in a JSON structure that can be loaded by the Scientific Paper Planner tool.

## CRITICAL JSON FORMATTING REQUIREMENTS
1. Use ONLY plain ASCII characters - no special symbols, mathematical notations, or Unicode
2. Do NOT use any HTML tags or special formatting
3. Keep all content extremely simple and straightforward
4. Do NOT use citations, footnotes, or references
5. Replace mathematical variables with simple text descriptions
6. Use only single quotes for nested strings if needed
7. Avoid overly complex or lengthy descriptions
8. Do NOT use subscripts, superscripts, or any special notation
9. Use standard newlines only
10. Ensure JSON remains valid and parseable by standard parsers

## Research Approach Selection
First, determine which research approach the paper uses:

1. **Hypothesis-driven** - Testing specific competing hypotheses
2. **Needs-based** - Solving a specific problem or addressing a need
3. **Exploratory** - Investigating patterns without specific hypotheses

Based on your selection, you will format the "hypothesis" field differently (see details below).

## Data Collection Method Selection
Next, determine which data collection method the paper uses:

1. **Experiment** - New experiment conducted
2. **Existing Data** - Analysis of pre-existing datasets

Based on your selection, you will format the "experiment" or "existingdata" field accordingly.

## Output Format
You must output valid JSON that matches this exact structure:
{
  "userInputs": {
    "question": "Research Question: [simple description]\\n\\nSignificance/Impact: [simple description]",
    "audience": "Target Audience/Community:\\n1. [audience1]\\n2. [audience2]",

    // CHOOSE ONE OF THESE THREE OPTIONS BASED ON RESEARCH APPROACH:
    
    // OPTION 1: For Hypothesis-driven Research
    "hypothesis": "Hypothesis 1: [simple description]\\n\\nHypothesis 2: [simple description]\\n\\nWhy distinguishing these hypotheses matters:\\n- [reason1]\\n- [reason2]",
    
    // OPTION 2: For Needs-based Research
    "needsresearch": "Who needs this research:\\n[stakeholders]\\n\\nWhy they need it:\\n[problem description]\\n\\nCurrent approaches and limitations:\\n[existing solutions]\\n\\nSuccess criteria:\\n[evaluation methods]\\n\\nAdvantages of this approach:\\n[benefits]",
    
    // OPTION 3: For Exploratory Research
    "exploratoryresearch": "Phenomena explored:\\n[description]\\n\\nDiscoveries revealed:\\n1. [finding1]\\n2. [finding2]\\n\\nValue to the field:\\n[importance]\\n\\nAnalytical approaches:\\n[methods]\\n\\nValidation approach:\\n[validation]",
    
    "relatedpapers": "Most similar papers:\\n1. [paper1]\\n2. [paper2]",
    
    // CHOOSE ONE OF THESE TWO OPTIONS BASED ON DATA COLLECTION:
    
    // OPTION 1: For New Experiments
    "experiment": "Key Variables:\\n- Independent: [variables]\\n- Dependent: [variables]\\n\\nSample & Size: [simple description]\\n\\nData Collection: [simple description]\\n\\nPredicted Results: [simple description]",
    
    // OPTION 2: For Existing Data
    "existingdata": "Dataset name and source:\\n[description]\\n\\nOriginal purpose:\\n[description]\\n\\nPermissions to use data:\\n[description]\\n\\nData quality information:\\n[description]\\n\\nRelevant variables:\\n[description]",
    
    "analysis": "Data Cleaning: [simple description]\\n\\nPrimary Analysis: [simple description]\\n\\nHow Analysis Addresses Question: [simple description]",
    "process": "Skills Needed: [simple description]\\n\\nCollaborators: [simple description]\\n\\nData Sharing: [simple description]",
    "abstract": "Background: [simple description]\\n\\nObjective: [simple description]\\n\\nMethods: [simple description]\\n\\nResults: [simple description]\\n\\nConclusion: [simple description]"
  },
  "chatMessages": {},
  "timestamp": "${new Date().toISOString()}",
  "version": "1.0"
}

## IMPORTANT:
- Include ONLY ONE of the research approach fields ("hypothesis", "needsresearch", or "exploratoryresearch")
- Include ONLY ONE of the data collection fields ("experiment" or "existingdata")
- Do not include the comments (lines starting with //) in your output

## Section Extraction Guidelines
For each section:
1. Extract the core information from the paper
2. Simplify and condense to plain, straightforward language
3. Remove all technical jargon, complex notation, and special characters
4. Focus on the main points only

## Final Verification Steps
Before submitting:
1. Validate your JSON using a basic parser
2. Check that no special characters remain
3. Ensure content is drastically simplified
4. Verify all mathematical notation has been converted to plain language
5. Make sure all section formatting matches the template exactly
6. Confirm you've included only ONE research approach and ONE data collection method

Here is information about the PDF: ${pdfText}
Based on the filename, its content, and metadata, extract and structure the scientific information in the specified JSON format.
`;

    // Step 3: Send prompt to OpenAI
    console.log('Sending PDF content to OpenAI for processing...');
    const response = await callOpenAI(
      prompt, 
      'pdf_import', 
      {},  // No user inputs needed
      [],  // No sections needed
      { temperature: 0.3, max_tokens: 2500 } // Lower temperature for more deterministic response
    );
    
    // Step 4: Parse the response JSON
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\s*|\s*```/g, '');
      
      // Parse the JSON
      const parsedData = JSON.parse(cleanResponse);
      
      // Basic validation
      if (!parsedData.userInputs) {
        throw new Error('Invalid response format: missing userInputs');
      }
      
      // Add timestamp if missing
      if (!parsedData.timestamp) {
        parsedData.timestamp = new Date().toISOString();
      }
      
      // Add version if missing
      if (!parsedData.version) {
        parsedData.version = "1.0";
      }
      
      // Initialize empty chat messages if missing
      if (!parsedData.chatMessages) {
        parsedData.chatMessages = {};
      }
      
      console.log('Successfully processed PDF to structured data');
      return parsedData;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to process PDF content into structured data.');
    }
  } catch (error) {
    console.error('Error in importPaperFromPdf:', error);
    throw error;
  }
};
