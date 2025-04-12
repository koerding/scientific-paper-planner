// FILE: src/services/openaiService.js

/**
 * Modernized OpenAI service using JSON mode for structured responses
 * UPDATED: Removed research approach related code
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
 * Log API request/response data while handling sensitive information
 */
const logApiData = (label, data, isSensitive = false) => {
  // Create a copy of the data to avoid modifying the original
  let logData = JSON.parse(JSON.stringify(data));
  
  // If sensitive, mask the API key in headers
  if (isSensitive && logData.headers && logData.headers.Authorization) {
    logData.headers.Authorization = "Bearer sk-...";
  }
  
  // For large responses, trim to reasonable size for console
  if (label.includes("Response") && logData.choices && logData.choices[0]?.message?.content) {
    const content = logData.choices[0].message.content;
    if (content.length > 2000) {
      logData.choices[0].message.content = content.substring(0, 1000) + 
        "\n...[content truncated for logging]...\n" + 
        content.substring(content.length - 1000);
    }
  }
  
  // Log the data
  console.log(`${label}:`, logData);
  
  // Return full data for convenience
  return data;
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

  console.log(`[openaiService] API Call Request - Context: ${contextType}`, { 
    promptLength: prompt?.length,
    userInputKeys: Object.keys(userInputs || {}),
    sectionsCount: sections?.length,
    chatHistoryLength: chatHistory?.length,
    useJsonMode
  });

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

  // Keep JSON mode request format
  if (useJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  // Log the full request (except sensitive parts)
  console.log(`[openaiService] Full Request Details:`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`Context Type: ${contextType}`);
  console.log(`Model: ${model}`);
  console.log(`Temperature: ${temperature}`);
  console.log(`Max Tokens: ${max_tokens}`);
  console.log(`Use JSON Mode: ${useJsonMode}`);
  console.log(`Request Body:`, JSON.stringify(requestBody, null, 2));

  let timeoutId;

  try {
    console.log(`[openaiService] Sending request to OpenAI API (Timeout: ${API_TIMEOUT_MS / 1000}s)...`);
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
      // Error handling remains the same
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        console.error("[openaiService] API Error Response:", errorBody);
        errorMessage += `: ${errorBody?.error?.message || response.statusText}`;
      } catch (parseError) { 
        console.error("[openaiService] Failed to parse error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[openaiService] API Response received successfully");
    console.log("[openaiService] Complete API Response:", data);

    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        throw new Error("Received empty or invalid response content from API.");
    }

    // Log the full response content
    console.log("[openaiService] Response Content:", responseContent);

    // Parse JSON response
    if (useJsonMode) {
      try {
        console.log("[openaiService] Parsing JSON response...");
        const jsonObj = JSON.parse(responseContent);
        console.log("[openaiService] Successfully parsed JSON:", jsonObj);
        return jsonObj;
      } catch (error) {
        console.error("[openaiService] Error parsing JSON response:", error, "Raw:", responseContent);
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    }

    // Return raw string for non-JSON mode (e.g., general chat)
    return responseContent;

  } catch (error) {
    if (timeoutId) { clearTimeout(timeoutId); }
    console.error("[openaiService] Error calling OpenAI API:", error);
    if (error.name === 'AbortError') { throw new Error(`OpenAI API request timed out after ${API_TIMEOUT_MS / 1000} seconds`); }
    else if (error.message.includes('Failed to fetch')) { 
      throw new Error("Network error connecting to OpenAI API. Please check your internet connection."); 
    }
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
};

// Export the helper function for testing
export { buildMessages, logApiData };
