// FILE: src/services/openaiService.js

/**
 * Enhanced OpenAI service with centralized prompts
 * REFACTORED: Uses unified prompt system for all interactions
 */
import { 
  isResearchApproachSection, 
  buildSystemPrompt,
  generateMockResponse
} from '../utils/promptUtils';

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo";

// Fallback flag for development without API key
const USE_FALLBACK = !apiKey || process.env.REACT_APP_USE_FALLBACK === 'true';

/**
 * Determine the appropriate response type based on context
 * @param {string} contextType - The context/section identifier
 * @returns {string} The response type to use for mocks
 */
const getResponseType = (contextType) => {
  // The main chat interactions should use "chat" type (Socratic style)
  if (contextType.match(/^(question|audience|hypothesis|needsresearch|exploratoryresearch|relatedpapers|experiment|existingdata|analysis|process|abstract)$/)) {
    return 'chat';
  }
  
  // Document import uses its own style
  if (contextType === 'document_import_task') {
    return 'documentImport';
  }
  
  // Instruction improvement uses its own style
  if (contextType === 'improve_instructions_batch') {
    return 'instructionImprovement';
  }
  
  // Default to chat for unknown types
  return 'chat';
};

/**
 * Build messages for API call with context and history
 * REFACTORED: Simplified to rely on system prompt for context
 * @param {string} prompt - The user prompt
 * @param {string} contextType - The section ID or context type
 * @param {Array} currentChatHistory - Previous chat messages
 * @param {string} systemPrompt - The system prompt with all context
 * @returns {Array} - Array of message objects for the API
 */
const buildMessages = (prompt, contextType, currentChatHistory = [], systemPrompt = null) => {
  // Start with system prompt if provided
  const messages = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
  
  // Prepend filtered chat history (if any exists)
  if (Array.isArray(currentChatHistory)) {
    currentChatHistory.forEach(msg => {
      if (msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
        messages.push({ role: msg.role, content: msg.content });
      }
    });
  }

  // Add the latest user prompt
  messages.push({ role: 'user', content: prompt });
  
  return messages;
};

// Main function to call the OpenAI API - using centralized prompts
export const callOpenAI = async (
    prompt,
    contextType = "general",
    userInputs = {},
    sections = [],
    options = {},
    chatHistory = [],
    systemPrompt = null
 ) => {

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

  // If no API key is configured, use mock responses
  if (USE_FALLBACK) {
    console.warn("[openaiService] Using FALLBACK mode because API key is missing");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determine the appropriate mock response type based on context
    const responseType = getResponseType(contextType);
    return generateMockResponse(responseType, contextType);
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  
  // Pass systemPrompt to buildMessages - simplified as we no longer distinguish prompt types
  const messages = buildMessages(prompt, contextType, chatHistory, systemPrompt);

  // Determine temperature based on section type - research sections get higher temperature
  const isResearchSectionType = isResearchApproachSection(contextType);
  const temperature = isResearchSectionType ? 0.9 : (options.temperature ?? 0.7);
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

// Export the helper function for testing
export { buildMessages };
