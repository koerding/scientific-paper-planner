// FILE: src/services/openaiService.js

/**
 * Modernized OpenAI service using JSON mode for structured responses
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Added timeout for API fetch requests.
 * FIXED: Corrected scope for timeoutId variable.
 */
import { isResearchApproachSection, buildSystemPrompt } from '../utils/promptUtils';

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-4-turbo";
const API_TIMEOUT_MS = 60000; // 60 seconds timeout for API calls

/**
 * Build messages for API call with context and history
 * @param {string} prompt - The user prompt
 * @param {string} contextType - The section ID or context type
 * @param {Array} currentChatHistory - Previous chat messages
 * @param {string} systemPrompt - The system prompt with all context
 * @returns {Array} - Array of message objects for the API
 */
const buildMessages = (prompt, contextType, currentChatHistory = [], systemPrompt = null) => {
  const messages = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
  if (Array.isArray(currentChatHistory)) {
    currentChatHistory.forEach(msg => {
      if (msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
        messages.push({ role: msg.role, content: msg.content });
      }
    });
  }
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
    useJsonMode = contextType !== "general"
 ) => {

  console.log(`[openaiService] API Call Request - Context: ${contextType}`, { /* Log details */ });

  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please add your API key to the environment variables.");
  }

  // Enhance system prompt for batch instruction improvement if needed
  if (contextType === "improve_instructions_batch" && useJsonMode) {
    systemPrompt = (systemPrompt || "") + `
    IMPORTANT: Your response MUST be a valid JSON array. Format your response as:
    [ { "id": "...", "editedInstructions": "...", "feedback": "...", "completionStatus": "..." }, ... ]
    Return ONLY this JSON array with no additional text or explanation.
    `;
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const messages = buildMessages(prompt, contextType, chatHistory, systemPrompt);
  const isResearchSectionType = isResearchApproachSection(contextType);
  const temperature = isResearchSectionType ? 0.9 : (options.temperature ?? 0.7);
  const max_tokens = options.max_tokens ?? 1024;

  const requestBody = {
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: max_tokens
  };

  if (useJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  // Declare timeoutId outside the try block so it's accessible in catch/finally
  let timeoutId;

  try {
    console.log(`[openaiService] Sending request to OpenAI API (Timeout: ${API_TIMEOUT_MS / 1000}s)...`);

    // --- Timeout Implementation ---
    const controller = new AbortController();
    // Assign to the outer timeoutId variable
    timeoutId = setTimeout(() => {
        console.warn(`[openaiService] API call timed out after ${API_TIMEOUT_MS / 1000} seconds.`);
        controller.abort();
    }, API_TIMEOUT_MS);

    const fetchPromise = fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // Link fetch to abort controller
    });

    const response = await fetchPromise;

    // Clear the timeout timer if the fetch completes or fails before the timeout
    clearTimeout(timeoutId);
    // --- End Timeout Implementation ---


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

    // Parse JSON response if needed
    if (useJsonMode) {
      try {
        // Special handling for improve_instructions_batch context
        if (contextType === "improve_instructions_batch") {
          console.log("Raw JSON response:", responseContent);
          if (responseContent.trim().startsWith('[') && responseContent.trim().endsWith(']')) { return JSON.parse(responseContent); }
          const jsonObj = JSON.parse(responseContent);
          if (Array.isArray(jsonObj)) { return jsonObj; }
          for (const key in jsonObj) { if (Array.isArray(jsonObj[key])) { return jsonObj[key]; } }
          return [jsonObj]; // Fallback: wrap in array
        }
        // Standard JSON parsing
        return JSON.parse(responseContent);
      } catch (error) {
        console.error("Error parsing JSON response:", error, "Raw:", responseContent);
        if (contextType === "improve_instructions_batch") { return []; } // Fallback for batch
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    }

    // Return raw string for chat contexts
    return responseContent;

  } catch (error) {
    // Clear timeout in the catch block as well, checking if timeoutId was assigned
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    console.error("Error calling OpenAI API:", error);

    // Handle specific error types
    if (error.name === 'AbortError') {
         throw new Error(`OpenAI API request timed out after ${API_TIMEOUT_MS / 1000} seconds.`);
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      throw new Error("Network error: Unable to connect to OpenAI API. Please check your internet connection.");
    }

    // Rethrow other errors
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
};

// Export the helper function for testing
export { buildMessages };
