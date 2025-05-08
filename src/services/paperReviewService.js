// FILE: src/services/paperReviewService.js

/**
 * Paper review service for analyzing scientific papers against quality criteria
 * Now uses the dedicated documentProcessor for text extraction
 */
import { callOpenAI } from './openaiService';
import { loadPDFJS, extractTextFromDocument } from './documentProcessor';
import sectionContentData from '../data/sectionContent.json';

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
    
    // Extract text from the document using the dedicated processor
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

Use these criteria to evaluate the paper taking into account all the sections and subsections of the review criteria. 

Format your review as follows:
1. Paper Summary (1-2 paragraphs)
2. Section-by-Section list Major issues (violations of criteria provided). Spend something like 3 sentences on each point if it presents a problem. Only focus on the major issues with the paper. If there are no issues about a subsection or section, do not mention it.
  2a. While doing so, make sure that the paper is one of experimental, data generation, or theory, and check only the corresponding subsection. If the paper is a mixture comment on that.
  2b. Also check if this is hypothesis driven, needs driven, or exploratory research and check if the key criteria of those sections are fulfilled. If it is unclear what it is, say so.
  2c. Ignore the Audience section
  2d. Make sure that you check if the paper properly cites and relates to its relevant intellectual traditions.
  2e. Focus on relations. e.g. Do the hypotheses go with the question? Are they answered?
  2f. Make sure that all the relevant subsections are labeled with the same titles as in the json so the reader knows how it maps onto their knowledge base.
  2g. Be very careful about flagging the following logic of a paper. Often times papers set up a big question (e.g. in their abstract), then their research does not really answer the question, but their text suggested that it contributed to answering the question using soft words. If the paper uses this structure, flag it.
With all these criteria, doublecheck found criticism, it is embarrassing to accuse a paper of a mistake it did not make.

Key background.
The goal of this is to show readers the ins and outs of writing good papers, so clarity is of utmost importance while politeness is less central. 
Refer to the authors as "the authors".
Make the section names boldfaced.
Throughout the review mention papers that should be cited (giving the reference, make sure to only add references when you are sure, and do not refer to references published after the paper being reviewed) and flag papers that are miscited if there should be any.

The paper for review:
${documentText.substring(0, 50000)}${documentText.length > 50000 ? ' [truncated]' : ''}`;

    // Call OpenAI API to generate the review
    console.log("Sending review request to OpenAI...");
    
    const reviewResult = await callOpenAI(
      userPrompt,                 // The prompt with paper text and criteria
      "general",                  // Use "general" context type to avoid JSON mode
      {},                         // Empty user inputs (not needed)
      sectionContentData.sections, // Section info for context
      {                           // Options
        temperature: 0.0,
        max_tokens: 4000
      },
      [],                         // No chat history needed
      systemPrompt               // System prompt for the reviewer persona
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
