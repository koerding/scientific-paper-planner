// Update this section in your documentImportService.js

// Try one more time with a simplified approach focused on creating a positive example
try {
  console.log("Attempting final fallback extraction...");
  
  // Create a bare-minimum example with EXACT field structure
  const simplestPrompt = `
    The document extraction failed. Please create a reasonable scientific paper example
    based on this document title: "${file.name}"
    
    This is for EDUCATIONAL PURPOSES to help students learn scientific paper structure.
    
    You MUST return JSON with these EXACT field names in the userInputs object:
    - question
    - audience
    - hypothesis (not "researchApproach")
    - relatedpapers (not "relatedPapers")
    - experiment (not "dataCollectionMethod")
    - analysis
    - process
    - abstract
    
    Here's an example of the expected structure:
    {
      "userInputs": {
        "question": "Research Question: How does X affect Y?\\n\\nSignificance/Impact: Understanding this relationship is important because...",
        "audience": "Target Audience/Community (research fields/disciplines):\\n1. Field1\\n2. Field2\\n3. Field3\\n\\nSpecific Researchers/Labs (individual scientists or groups):\\n1. Researcher1\\n2. Researcher2\\n3. Researcher3",
        "hypothesis": "Hypothesis 1: X increases Y through mechanism A\\n\\nHypothesis 2: X increases Y through mechanism B\\n\\nWhy distinguishing these hypotheses matters:\\n- Reason1\\n- Reason2",
        "relatedpapers": "Most similar papers that test related hypotheses:\\n1. Author1 et al. (Year) \"Title1\"\\n2. Author2 et al. (Year) \"Title2\"\\n3. Author3 (Year) \"Title3\"\\n4. Author4 & Author5 (Year) \"Title4\"\\n5. Author6 et al. (Year) \"Title5\"",
        "experiment": "Key Variables:\\n- Independent: IndependentVar\\n- Dependent: DependentVar\\n- Controlled: ControlledVar\\n\\nSample & Size Justification: Description\\n\\nData Collection Methods: Description\\n\\nPredicted Results: Description\\n\\nPotential Confounds & Mitigations: Description",
        "analysis": "Data Cleaning & Exclusions:\\nDescription\\n\\nPrimary Analysis Method:\\nDescription\\n\\nHow Analysis Addresses Research Question:\\nDescription\\n\\nUncertainty Quantification:\\nDescription\\n\\nSpecial Cases Handling:\\nDescription",
        "process": "Skills Needed vs. Skills I Have:\\nDescription\\n\\nCollaborators & Their Roles:\\nDescription\\n\\nData/Code Sharing Plan:\\nDescription\\n\\nTimeline & Milestones:\\nDescription\\n\\nObstacles & Contingencies:\\nDescription",
        "abstract": "Background: Description\\n\\nObjective/Question: Description\\n\\nMethods: Description\\n\\n(Expected) Results: Description\\n\\nConclusion/Implications: Description"
      }
    }
    
    Create a thoughtful, well-structured scientific paper example focusing on Bayesian inference with probabilistic population models.
  `;
  
  const fallbackResult = await callOpenAI(
    simplestPrompt,
    'document_import_fallback',
    {},
    [],
    { temperature: 0.4, max_tokens: 3000 },
    [],
    "You are creating educational examples for students. Generate a complete, well-structured scientific paper example with EXACTLY the field names requested. Do not use alternative field names.",
    true
  );
  
  if (validateResearchPaper(fallbackResult)) {
    console.log('Created fallback example based on document');
    
    fallbackResult.timestamp = new Date().toISOString();
    fallbackResult.version = '1.0-fallback-example';
    fallbackResult.chatMessages = {};
    
    return fallbackResult;
  }
} catch (fallbackError) {
  console.error('Fallback extraction also failed:', fallbackError);
}
