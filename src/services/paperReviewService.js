// FILE: src/services/paperReviewService.js

/**
 * Paper review service for analyzing scientific papers against quality criteria
 * Uses the same document extraction as the import service but focuses on evaluation
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';
import sectionContentData from '../data/sectionContent.json';

// Reuse the document extraction functions from documentImportService
import { loadPDFJS, extractTextFromDocument } from './documentImportService';

/**
 * Extracts the section criteria from sectionContent.json for the review prompt
 * @returns {string} Formatted criteria string
 */
const extractReviewCriteria = () => {
  const criteria = [];
  
  sectionContentData.sections.forEach(section => {
    if (!section || !section.id || !section.subsections) return;
    
    // Add section title
    criteria.push(`## ${section.title} Criteria [id: ${section.id}]`);
    
    // Add intro text if available
    if (section.introText) {
      criteria.push(`${section.introText}`);
    }
    
    // Add subsection criteria
    section.subsections.forEach(subsection => {
      if (!subsection || !subsection.id) return;
      criteria.push(`- ${subsection.title}: ${subsection.instruction}`);
    });
    
    criteria.push(''); // Add a blank line between sections
  });
  
  return criteria.join('\n');
};

/**
 * Reviews a scientific paper against the criteria from sectionContent.json
 * @param {File} file - The paper file (PDF/DOCX)
 * @returns {Promise<Object>} Review results
 */
export const reviewScientificPaper = async (file) => {
  try {
    // Load PDF.js if needed for PDF files
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try { await loadPDFJS(); } catch (error) { console.warn("Failed to load PDF.js:", error); }
    }
    
    // Extract text from the document
    console.log(`Starting text extraction for review of: ${file.name}`);
    const documentText = await extractTextFromDocument(file);
    console.log(`Extraction successful. Text length: ${documentText.length}`);
    
    // Get the review criteria from sectionContent.json
    const reviewCriteria = extractReviewCriteria();
    console.log("Extracted review criteria. Length:", reviewCriteria.length);
    
    // Build the review prompt
    const systemPrompt = `You are a critical but constructive reviewer, similar to an Ivy League professor 
with a focus on scientific quality. You evaluate scientific papers on their clarity, logic, 
methodology, and overall scientific rigor. Be thorough but fair in your assessment.`;

    const userPrompt = `I want you to model a critical but constructive reviewer, similar to an Ivy League professor with a focus on scientific quality. 
You want the logic of papers to be clear and tight. Use the following criteria to review this paper:

${reviewCriteria}

Use these criteria to evaluate the paper section by section. Start with a brief summary of the paper, focusing on its logic and scientific rigor. 
Then provide detailed comments for each section, highlighting both strengths and weaknesses.

Format your review as follows:
1. Paper Summary (1-2 paragraphs)
2. Overall Assessment (general evaluation of scientific quality)
3. Section-by-Section Review (using the criteria provided)
4. Major Strengths (3-5 points)
5. Major Weaknesses (3-5 points)
6. Conclusion and Recommendation (whether the paper meets scientific standards)

The paper for review:
${documentText.substring(0, 50000)}${documentText.length > 50000 ? ' [truncated]' : ''}`;

    // Call OpenAI API to generate the review
    console.log("Sending review request to OpenAI...");
    const reviewResult = await callOpenAI(
      userPrompt,
      "paper_review",
      {}, 
      [], 
      { 
        temperature: 0.7,
        max_tokens: 4000
      },
      [],
      systemPrompt,
      false // Don't use JSON mode for the review
    );
    
    console.log("Review generated successfully.");
    
    // Format the result
    return {
      success: true,
      review: reviewResult,
      paperName: file.name,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error reviewing paper:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during paper review",
      paperName: file.name
    };
  }
};

/**
 * Exports the review as a text file
 * @param {string} review - The review text
 * @param {string} paperName - The name of the reviewed paper
 * @returns {boolean} Success indicator
 */
export const exportReview = (review, paperName) => {
  try {
    // Generate filename based on paper name
    const timestamp = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const baseName = paperName.replace(/\.[^/.]+$/, ""); // Remove extension
    const fileName = `${baseName}-review-${timestamp}.txt`;
    
    // Create a blob with the review content
    const reviewBlob = new Blob([review], { type: 'text/plain' });
    const reviewUrl = URL.createObjectURL(reviewBlob);
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = reviewUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(reviewUrl);
    
    return true;
  } catch (error) {
    console.error("Error exporting review:", error);
    return false;
  }
};
