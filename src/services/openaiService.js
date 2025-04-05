// FILE: src/services/openaiService.js

/**
 * Enhanced OpenAI service with better error reporting and fallback mode
 * MODIFIED: Accepts systemPrompt parameter for context-specific personas.
 * MODIFIED: Improved handling of section-specific context data.
 * MODIFIED: Enhanced to support truly Socratic-style conversations.
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

// Enhanced mock responses for better testing
const mockResponse = (contextType, prompt) => {
  if (prompt === "__SOCRATIC_PROMPT__") {
    // Truly Socratic conversation starter
    return `Hey there! I'm here to help you think through your ${contextType} section.

What aspects of this topic are you finding most intriguing right now? 

Have you considered what specific gap in the literature your work might address?

What's been the most challenging part of formulating this section so far?`;
  }
  
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

  // For regular chat messages - use question-based responses
  const questions = [
    "What led you to focus on this particular aspect?",
    "How might this connect to the broader literature in your field?",
    "Have you considered approaching this from a different angle?",
    "What assumptions might be hidden in this formulation?",
    "How would you explain the significance of this to someone outside your field?",
    "What's the most surprising insight you've had while working on this?",
    "Which part of this feels most uncertain to you right now?"
  ];
  
  // Pick 1-2 random questions to include
  const randomQuestion1 = questions[Math.floor(Math.random() * questions.length)];
  let randomQuestion2 = questions[Math.floor(Math.random() * questions.length)];
  while (randomQuestion2 === randomQuestion1) {
    randomQuestion2 = questions[Math.floor(Math.random() * questions.length)];
  }

  return `That's an interesting point about ${contextType}! 

I'm curious - ${randomQuestion1}

${Math.random() > 0.5 ? randomQuestion2 : ''}`;
};

// Main function to call the OpenAI API - enhanced with special handling for Socratic prompts
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

  // If it's a Socratic prompt, use a slightly different configuration
  const temperature = isSocraticPrompt ? 0.9 : (options.temperature ?? 0.7);
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
