// FILE: src/services/openaiService.js

/**
 * Modernized OpenAI service using JSON mode for structured responses
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Comprehensive logging of requests and responses
 * UPDATED: Updated to use GPT-4o model by default
 * UPDATED: Refined JSON mode prompt/parsing for batch instructions to ensure array output
 * UPDATED: Now includes instructions for using strikethrough instead of deleting completed items
 */
import { isResearchApproachSection, buildSystemPrompt } from '../utils/promptUtils';

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o"; // Updated to use GPT-4o by default
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
  
  // For request body, also log full system prompt for debugging
  if (label.includes("Request") && logData.messages) {
    // If first message is system, log it separately
    const systemMsg = logData.messages.find(m => m.role === 'system');
    if (systemMsg) {
      console.log(`${label} - SYSTEM PROMPT:`, systemMsg.content);
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

  // --- Updated System Prompt for Batch Instructions JSON Mode ---
  // Ask for a JSON object containing a 'results' array and explicitly mention strikethrough
  if (contextType === "improve_instructions_batch" && useJsonMode) {
    systemPrompt = (systemPrompt || "") + `

    IMPORTANT: Your response MUST be a valid JSON object. Format your response exactly as:
    {
      "results": [
        {
          "id": "section_id_1",
          "editedInstructions": "Full instructions text for this section, with completed items marked with ~~strikethrough~~ (not deleted).",
          "feedback": "**Strengths:**\\nSpecific, constructive feedback on their work.\\n\\n**Weaknesses:**\\nAreas that need improvement.\\n\\n**Comments:**\\nSuggestions for enhancement.",
          "completionStatus": "complete" // or "unstarted" or "progress" based on analysis
        },
        // Include one object here for EACH section provided in the input data
      ]
    }
    Return ONLY this single JSON object with no additional text, comments, or explanations outside the JSON structure. Ensure the 'results' array contains an entry for every section processed.
    
    Important note about instructions format: 
    - Use ~~strikethrough~~ to mark completed items (do NOT delete them)
    - Keep all original bullet points but cross out the completed ones
    - Add congratulatory messages for good progress
    - Make sure to include line breaks between feedback sections for better readability
    `;
  }
  // --- End System Prompt Update ---

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const messages = buildMessages(prompt, contextType, chatHistory, systemPrompt);
  const isResearchSectionType = isResearchApproachSection(contextType);
  const temperature = isResearchSectionType ? 0.9 : (options.temperature ?? 0.7);
  const max_tokens = options.max_tokens ?? 2048; // Increased slightly for potentially larger batch response

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
  console.log(`Messages:`, messages);
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

    // --- Updated JSON Parsing Logic ---
    if (useJsonMode) {
      try {
        // Always parse the response as an object first
        console.log("[openaiService] Parsing JSON response...");
        const jsonObj = JSON.parse(responseContent);
        console.log("[openaiService] Successfully parsed JSON:", jsonObj);

        // Special handling for improve_instructions_batch context
        if (contextType === "improve_instructions_batch") {
          // Look specifically for the 'results' array within the object
          if (jsonObj && Array.isArray(jsonObj.results)) {
              console.log(`[openaiService] Found 'results' array with ${jsonObj.results.length} items.`);
              return jsonObj.results; // Return the array directly
          } else if (Array.isArray(jsonObj)) {
              // Handle case where the API directly returns an array (shouldn't happen with json_object mode)
              console.log(`[openaiService] Response is already an array with ${jsonObj.length} items.`);
              return jsonObj;
          } else {
              // If the expected structure isn't found, log a warning and return empty array
              console.warn("[openaiService] Response JSON object did not contain expected 'results' array. Response:", jsonObj);
              return []; // Return empty array to indicate failure to get batch results
          }
        }

        // Standard JSON object return for other contexts (if any use json_object)
        return jsonObj;

      } catch (error) {
        console.error("[openaiService] Error parsing JSON response:", error, "Raw:", responseContent);
        // If parsing fails for batch, return empty array
        if (contextType === "improve_instructions_batch") {
          return [];
        }
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    }
    // --- End JSON Parsing Update ---

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
