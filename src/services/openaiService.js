// FILE: src/services/openaiService.js

/**
 * Modernized OpenAI service using JSON mode for structured responses
 * UPDATED: Reduced logging, keeping only key request/response info.
 */
import { buildSystemPrompt } from '../utils/promptUtils';

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o";
const API_TIMEOUT_MS = 180000; // 180 seconds timeout

/**
 * Build messages for API call
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
 * Call OpenAI API
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

  // Keep minimal request start log
  console.log(`[openaiService] Sending API Request - Context: ${contextType}, Model: ${model}, JSON Mode: ${useJsonMode}`);

  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const messages = buildMessages(prompt, contextType, chatHistory, systemPrompt);
  const temperature = options.temperature ?? 0.7;
  const max_tokens = options.max_tokens ?? 2048;

  const requestBody = {
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: max_tokens
  };

  if (useJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  // --- KEEP THIS LOG: Shows the actual request body ---
  console.log(`[openaiService] Request Body:`, JSON.stringify(requestBody, null, 2));
  // ---

  let timeoutId;

  try {
    // console.log(`[openaiService] Sending request to OpenAI API (Timeout: ${API_TIMEOUT_MS / 1000}s)...`); // Removed
    console.time("openaiApiCallTime");

    const controller = new AbortController();
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
      signal: controller.signal
    });

    const response = await fetchPromise;
    clearTimeout(timeoutId);
    console.timeEnd("openaiApiCallTime");

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        console.error("[openaiService] API Error Response:", errorBody); // Keep error log
        errorMessage += `: ${errorBody?.error?.message || response.statusText}`;
      } catch (parseError) { /* console.error("[openaiService] Failed to parse error response:", parseError); */ } // Commented out
      throw new Error(errorMessage);
    }

    const data = await response.json();
    // console.log("[openaiService] API Response received successfully"); // Removed
    // console.log("[openaiService] Complete API Response:", data); // Removed (redundant with below)

    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        throw new Error("Received empty or invalid response content from API.");
    }

    // --- KEEP THIS LOG: Shows the actual response content ---
    console.log("[openaiService] Response Content:", responseContent);
    // ---

    if (useJsonMode) {
      try {
        // console.log("[openaiService] Parsing JSON response..."); // Removed
        const jsonObj = JSON.parse(responseContent);
        // console.log("[openaiService] Successfully parsed JSON:", jsonObj); // Removed
        return jsonObj;
      } catch (error) {
        console.error("[openaiService] Error parsing JSON response:", error, "Raw:", responseContent); // Keep error log
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    }

    return responseContent;

  } catch (error) {
    if (timeoutId) { clearTimeout(timeoutId); }
    console.error("[openaiService] Error calling OpenAI API:", error); // Keep error log
    if (error.name === 'AbortError') { throw new Error(`OpenAI API request timed out after ${API_TIMEOUT_MS / 1000} seconds`); }
    else if (error.message.includes('Failed to fetch')) {
      throw new Error("Network error connecting to OpenAI API. Please check your internet connection.");
    }
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
};

// Export helper function if needed for testing, otherwise remove
// export { buildMessages };
