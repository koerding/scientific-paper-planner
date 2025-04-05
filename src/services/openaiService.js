// FILE: src/services/openaiService.js

/**
 * Enhanced OpenAI service with better error reporting and fallback mode
 * MODIFIED: Accepts systemPrompt parameter for context-specific personas.
 * MODIFIED: Improved handling of section-specific context data.
 * MODIFIED: Enhanced to support truly Socratic-style conversations.
 * MODIFIED: Added specialized handling for different research approaches.
 */
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo";

// Fallback flag for development without API key
const USE_FALLBACK = !apiKey || process.env.REACT_APP_USE_FALLBACK === 'true';

// ENHANCED: Added support for special instructionsFeedback field and improved context handling
const buildMessages = (prompt, contextType, userInputs, sections, currentChatHistory = [], systemPrompt = null) => {
  // Start with system prompt if provided
  const messages = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];

  // If it's a Socratic prompt indicator, we don't need to add section context 
  // since it's already included in the system prompt
  if (prompt === "__SOCRATIC_PROMPT__" && systemPrompt) {
    // For Socratic prompts, we rely on the custom system prompt that already has context
    return messages;
  }

  // For regular messages, add section context (if not already in system prompt)
  if (!systemPrompt || !systemPrompt.includes("Section instructions:")) {
    // Find the specific section for the current context if available
    const currentSectionObj = Array.isArray(sections) ? 
      sections.find(s => s && s.id === contextType) : null;
    
    if (currentSectionObj) {
      const sectionTitle = currentSectionObj.title || 'Unknown Section';
      const instructionText = currentSectionObj.instructions?.text || 'No instructions available';
      const feedbackText = currentSectionObj.instructions?.feedback || '';
      const userInput = userInputs && currentSectionObj.id ? (userInputs[currentSectionObj.id] || '') : '';
      
      messages.push({
        role: 'system',
        content: `Context for Section "${sectionTitle}" (ID: ${currentSectionObj.id}):
Instructions: ${instructionText}
${feedbackText ? `Recent Feedback: ${feedbackText}\n` : ''}
Current User Input: ${userInput || 'No content yet'}`
      });
    }
    else if (Array.isArray(sections)) {
      // If specific section not found, provide minimal context about all sections
      messages.push({
        role: 'system',
        content: `Working on a scientific paper plan with multiple sections.
Current section: ${contextType || 'general'}`
      });
    }
  }

  // Prepend chat history (if any exists)
  if (Array.isArray(currentChatHistory)) {
    // Filter out any special prompt markers from history
    const filteredHistory = currentChatHistory.filter(msg => 
      !(msg.role === 'user' && msg.content === "__SOCRATIC_PROMPT__")
    );
    
    filteredHistory.forEach(msg => {
      if (msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
        messages.push({ role: msg.role, content: msg.content });
      } else {
        console.warn("Skipping invalid message in chat history:", msg);
      }
    });
  }

  // Add the latest user prompt (unless it's a special prompt marker)
  if (prompt !== "__SOCRATIC_PROMPT__") {
    messages.push({ role: 'user', content: prompt });
  }
  
  return messages;
};

// Specialized mock responses based on research approach type
const getResearchApproachQuestions = (sectionId) => {
  // Questions for hypothesis-driven research
  const hypothesisQuestions = [
    "What are the two competing explanations your research is trying to distinguish between?",
    "How would the world look different if hypothesis A is true versus if hypothesis B is true?",
    "What key evidence would allow you to determine whether hypothesis A or B is more likely correct?",
    "What would be the theoretical significance if your first hypothesis turns out to be supported?",
    "How do your competing hypotheses relate to existing theories in the field?",
    "What prediction does each of your hypotheses make that the other doesn't?",
    "How will you know if neither of your hypotheses adequately explains what you observe?",
    "What makes distinguishing between these particular hypotheses scientifically interesting?"
  ];
  
  // Questions for needs-based research
  const needsBasedQuestions = [
    "Who specifically will benefit from your solution and what problem does it solve for them?",
    "How do the stakeholders currently address this need without your solution?",
    "What metrics will you use to determine if your solution is actually solving the problem?",
    "What are the limitations of existing approaches that make your solution necessary?",
    "How have you validated that this is actually a problem worth solving?",
    "What would constitute 'success' for your solution from the stakeholders' perspective?",
    "What constraints (ethical, technical, economic) are you working within?",
    "How will you measure improvement over current approaches?"
  ];
  
  // Questions for exploratory research
  const exploratoryQuestions = [
    "What patterns or relationships are you hoping to discover in your data?",
    "How will you distinguish meaningful patterns from random noise?",
    "What makes this particular exploration valuable to your field?",
    "What would be a surprising finding that could emerge from this exploration?",
    "How open-ended is your exploration and how will you determine when to focus on specific patterns?",
    "What analytical approaches will help you discover unexpected patterns?",
    "How will you validate whether the patterns you find are meaningful?",
    "What might you discover that would warrant a shift to hypothesis-testing in future work?"
  ];
  
  // General research questions (when section type is unclear)
  const generalResearchQuestions = [
    "What aspect of your research question most excites your scientific curiosity?",
    "How does your question connect to broader issues in your field?",
    "What's been most challenging about formulating this part of your research?",
    "How has your thinking evolved as you've worked on this section?",
    "What's the most interesting tension or paradox in this area of research?",
    "How would you explain the significance of this work to someone outside your field?",
    "What assumptions have you had to examine while working on this section?"
  ];
  
  // Return the appropriate question set based on section ID
  if (sectionId === 'hypothesis') {
    return hypothesisQuestions;
  } else if (sectionId === 'needsresearch') {
    return needsBasedQuestions;
  } else if (sectionId === 'exploratoryresearch') {
    return exploratoryQuestions;
  } else {
    return generalResearchQuestions;
  }
};

// Enhanced mock response function with specialized research approach handling
const mockResponse = (contextType, prompt) => {
  if (prompt === "__SOCRATIC_PROMPT__") {
    // Get appropriate questions based on section type
    const questionSet = getResearchApproachQuestions(contextType);
    
    // Select 2-3 random questions
    const shuffled = [...questionSet].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.floor(Math.random() * 2) + 2); // 2-3 questions
    
    // Create the Socratic prompt response
    let response = `Hey there! I'm here to help you think through your ${contextType} section.\n\n`;
    
    // Add brief context based on research approach
    if (contextType === 'hypothesis') {
      response += "Let's explore your competing explanations together. ";
    } else if (contextType === 'needsresearch') {
      response += "Let's think about the problem you're solving and who needs the solution. ";
    } else if (contextType === 'exploratoryresearch') {
      response += "Let's explore what patterns you're looking to discover. ";
    }
    
    // Add the selected questions
    response += selectedQuestions.map(q => `\n• ${q}`).join('');
    
    return response;
  }
  
  // For normal conversation responses
  if (contextType === 'hypothesis' || contextType === 'needsresearch' || contextType === 'exploratoryresearch') {
    const questionSet = getResearchApproachQuestions(contextType);
    // Pick 1-2 questions relevant to the approach
    const shuffled = [...questionSet].sort(() => 0.5 - Math.random());
    const selectedQuestion = shuffled[0];
    const maybeSecondQuestion = Math.random() > 0.5 ? `\n\nAlso, ${shuffled[1]}` : '';
    
    return `That's an interesting point! ${selectedQuestion}${maybeSecondQuestion}`;
  }
  
  // Default responses for other sections
  if (contextType === 'improve_instructions_batch') {
    return `
Here are the instruction texts:

[
  {
    "id": "question",
    "editedInstructions": "Great job defining your research question! You're asking whether speed-dating events between scientists increase collaboration probability, which is clear and testable. Here are some additional points to consider: 1) Think about the scope - are you focusing on specific scientific disciplines? 2) Consider quantifying what 'increased collaboration' means (joint papers, grant applications, etc.).",
    "feedback": "**Strengths:** Clear question.\n**Weaknesses:** Scope unclear.\n**Suggestions:** Define collaboration metrics.",
    "completionStatus": "progress"
  },
  {
    "id": "hypothesis",
    "editedInstructions": "Excellent work! You've addressed all key points. Ready for the next step!",
    "feedback": "**Strengths:** Both hypotheses are clear and testable.\n**Weaknesses:** None noted.\n**Suggestions:** Proceed to experiment design.",
    "completionStatus": "complete"
  }
]`;
  }

  // General response for other contexts
  const generalQuestions = getResearchApproachQuestions('general');
  const randomQuestion = generalQuestions[Math.floor(Math.random() * generalQuestions.length)];
  
  return `Interesting thoughts about ${contextType}! ${randomQuestion}`;
};

// Main function to call the OpenAI API - enhanced with special handling for research approaches
export const callOpenAI = async (
    prompt,
    contextType = "general",
    userInputs = {},
    sections = [],
    options = {},
    chatHistory = [],
    systemPrompt = null
 ) => {

  // Special handling for Socratic prompt
  const isSocraticPrompt = prompt === "__SOCRATIC_PROMPT__";
  if (isSocraticPrompt) {
    console.log(`[openaiService] Socratic Prompt Request - Context: ${contextType}`);
  } else {
    console.log(`[openaiService] API Call Request - Context: ${contextType}`, {
      apiKeyConfigured: !!apiKey,
      modelUsed: model,
      useFallback: USE_FALLBACK,
      promptLength: prompt.length,
      userInputsCount: Object.keys(userInputs).length,
      sectionsCount: Array.isArray(sections) ? sections.length : 'Not an array',
      chatHistoryLength: Array.isArray(chatHistory) ? chatHistory.length : 'Not an array',
      hasSystemPrompt: !!systemPrompt
    });
  }

  // If no API key is configured, use mock responses
  if (USE_FALLBACK) {
    console.warn("[openaiService] Using FALLBACK mode because API key is missing");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockResponse(contextType, prompt);
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  
  // Pass systemPrompt to buildMessages
  const messages = buildMessages(prompt, contextType, userInputs, sections, chatHistory, systemPrompt);

  // If it's a Socratic prompt or related to research approaches, use higher temperature
  const isResearchApproach = contextType === 'hypothesis' || contextType === 'needsresearch' || contextType === 'exploratoryresearch';
  const temperature = (isSocraticPrompt || isResearchApproach) ? 0.9 : (options.temperature ?? 0.7);
  const max_tokens = options.max_tokens ?? 1024;

  const body = JSON.stringify({
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: max_tokens,
  });

  try {
    console.log(`[openaiService] Sending request to OpenAI API...`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: body,
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        console.error("OpenAI API Error:", response.status, errorBody);
        errorMessage += `: ${errorBody?.error?.message || response.statusText}`;
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorMessage += ` (could not parse error details)`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[openaiService] API Response received successfully");

    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        console.error("No response content found in API data:", data);
        throw new Error("Received empty or invalid response content from API.");
    }
    return responseContent;

  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      throw new Error("Network error: Unable to connect to OpenAI API. Please check your internet connection.");
    }

    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
};

// Export the helper functions for testing
export { buildMessages, mockResponse };
