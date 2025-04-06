// FILE: src/services/openaiService.js

/**
 * Modernized OpenAI service using JSON mode for structured responses
 * Uses OpenAI's native JSON mode for reliable parsing
 */
import { isResearchApproachSection, buildSystemPrompt } from '../utils/promptUtils';

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
// Use GPT-4 or newer model that supports JSON mode
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-4-turbo";

/**
 * Build messages for API call with context and history
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

/**
 * Call OpenAI API with JSON mode for structured responses
 * @param {string} prompt - The user's prompt or task description
 * @param {string} contextType - Context identifier (section ID or task type)
 * @param {Object} userInputs - Current user inputs (for context)
 * @param {Array} sections - Section definitions (for context)
 * @param {Object} options - Request options (temperature, etc)
 * @param {Array} chatHistory - Previous messages in the conversation
 * @param {string} systemPrompt - System prompt with context
 * @param {boolean} useJsonMode - Whether to use JSON mode (default true)
 * @returns {Object|string} - JSON response object or string for chat
 */
export const callOpenAI = async (
    prompt,
    contextType = "general",
    userInputs = {},
    sections = [],
    options = {},
    chatHistory = [],
    systemPrompt = null,
    useJsonMode = contextType !== "general" // Use JSON mode by default except for general chat
 ) => {

  console.log(`[openaiService] API Call Request - Context: ${contextType}`, {
    apiKeyConfigured: !!apiKey,
    modelUsed: model,
    useJsonMode: useJsonMode,
    promptLength: prompt.length,
    userInputsCount: Object.keys(userInputs).length,
    sectionsCount: Array.isArray(sections) ? sections.length : 'Not an array',
    chatHistoryLength: Array.isArray(chatHistory) ? chatHistory.length : 'Not an array',
    hasSystemPrompt: !!systemPrompt
  });

  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please add your API key to the environment variables.");
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  
  // Pass systemPrompt to buildMessages
  const messages = buildMessages(prompt, contextType, chatHistory, systemPrompt);

  // Determine temperature based on section type - research sections get higher temperature
  const isResearchSectionType = isResearchApproachSection(contextType);
  const temperature = isResearchSectionType ? 0.9 : (options.temperature ?? 0.7);
  const max_tokens = options.max_tokens ?? 1024;

  // Prepare request body with JSON mode when appropriate
  const requestBody = {
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: max_tokens
  };

  // Add response_format for JSON mode when requested
  if (useJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    console.log(`[openaiService] Sending request to OpenAI API...`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
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
    
    // If using JSON mode, parse response into an object
    if (useJsonMode) {
      try {
        return JSON.parse(responseContent);
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        console.log("Raw response:", responseContent);
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    }
    
    // Return raw string for chat contexts
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
