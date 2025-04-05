// FILE: src/services/openaiService.js

/**
 * Enhanced OpenAI service with better error reporting and fallback mode
 */
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo";

// Fallback flag for development without API key
const USE_FALLBACK = !apiKey || process.env.REACT_APP_USE_FALLBACK === 'true';

// Add this to your openaiService.js file to enable debug mode and fallbacks
// MODIFIED: Added currentChatHistory parameter
const buildMessages = (prompt, contextType, userInputs, sections, currentChatHistory = []) => {
  const systemMessage = `You are a helpful assistant helping a student who is planning a new scientific project. Context type: ${contextType}. Maintain conversation context based on previous messages.`;
  const messages = [{ role: 'system', content: systemMessage }];

  // Add section context safely using the new 'instructions.text'
  if (Array.isArray(sections)) {
    sections.forEach((section, index) => {
      // Strict check for valid section object
      if (!section || typeof section !== 'object' || !section.id || !section.title || !section.instructions || typeof section.instructions.text !== 'string') {
          console.warn(`[openaiService buildMessages] Skipping invalid section at index ${index}`);
          return;
      }

      const instructionText = section.instructions.text;
      const userInput = userInputs && section.id ? (userInputs[section.id] || '') : '';
      const safeUserInput = (typeof userInput === 'string' ? userInput : JSON.stringify(userInput)) || 'N/A';

      messages.push({
          role: 'user', // Or adjust role based on how you structure context
          content: `Context for Section "${section.title}" (ID: ${section.id}):
Instructions: ${instructionText || 'N/A'}
Current User Input: ${safeUserInput}`
      });
    });
  } else {
       console.error("[openaiService buildMessages] 'sections' is not an array:", sections);
  }

  // *** NEW: Prepend chat history ***
  if (Array.isArray(currentChatHistory)) {
    currentChatHistory.forEach(msg => {
      // Basic validation of message structure
      if (msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
        messages.push({ role: msg.role, content: msg.content });
      } else {
        console.warn("Skipping invalid message in chat history:", msg);
      }
    });
  }

  // Add the latest user prompt
  messages.push({ role: 'user', content: prompt });
  return messages;
};


// Mock response function for when no API key is available
const mockResponse = (contextType, prompt) => {
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

  // For regular chat messages
  return `This is a mock response because no OpenAI API key is configured.
Please set REACT_APP_OPENAI_API_KEY in your environment variables or .env file.

For a real application, I would respond to your prompt about "${contextType}" with helpful information based on the conversation history provided.

For testing purposes, you can continue using the application with this mock mode.`;
};

// Main function to call the OpenAI API with improved error handling
// MODIFIED: Added chatHistory parameter
export const callOpenAI = async (
    prompt,
    contextType = "general",
    userInputs = {},
    sections = [],
    options = {},
    chatHistory = [] // Accept chat history
 ) => {

  console.log(`[openaiService] API Call Request - Context: ${contextType}`, {
    apiKeyConfigured: !!apiKey,
    modelUsed: model,
    useFallback: USE_FALLBACK,
    promptLength: prompt.length,
    userInputsCount: Object.keys(userInputs).length,
    sectionsCount: Array.isArray(sections) ? sections.length : 'Not an array',
    // MODIFIED: Log history length
    chatHistoryLength: Array.isArray(chatHistory) ? chatHistory.length : 'Not an array'
  });

  // If no API key is configured, use mock responses
  if (USE_FALLBACK) {
    console.warn("[openaiService] Using FALLBACK mode because API key is missing");
    // Wait to simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockResponse(contextType, prompt);
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  // MODIFIED: Pass history to buildMessages
  const messages = buildMessages(prompt, contextType, userInputs, sections, chatHistory);

  const body = JSON.stringify({
    model: model,
    messages: messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1024,
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

    // If the error is due to network connectivity, provide a clear message
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      throw new Error("Network error: Unable to connect to OpenAI API. Please check your internet connection.");
    }

    // Return a more user-friendly error
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
};
