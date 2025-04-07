// FILE: src/services/openaiService.js

/**
 * Modernized OpenAI service using JSON mode for structured responses
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Refined JSON mode prompt/parsing for batch instructions to ensure array output.
 */
import { isResearchApproachSection, buildSystemPrompt } from '../utils/promptUtils';

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

  console.log(`[openaiService] API Call Request - Context: ${contextType}`, { /* Log details */ });

  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }

  // --- Updated System Prompt for Batch Instructions JSON Mode ---
  // Ask for a JSON object containing a 'results' array
  if (contextType === "improve_instructions_batch" && useJsonMode) {
    systemPrompt = (systemPrompt || "") + `

    IMPORTANT: Your response MUST be a valid JSON object. Format your response exactly as:
    {
      "results": [
        {
          "id": "section_id_1",
          "editedInstructions": "Full instructions text for this section, reflecting user progress and feedback.",
          "feedback": "Specific, constructive feedback on their work for this section.",
          "completionStatus": "complete" // or "unstarted" or "progress" based on analysis
        },
        // Include one object here for EACH section provided in the input data
      ]
    }
    Return ONLY this single JSON object with no additional text, comments, or explanations outside the JSON structure. Ensure the 'results' array contains an entry for every section processed.
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

  let timeoutId;

  try {
    console.log(`[openaiService] Sending request to OpenAI API (Timeout: ${API_TIMEOUT_MS / 1000}s)...`);

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

    if (!response.ok) {
      // Error handling remains the same
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage += `: ${errorBody?.error?.message || response.statusText}`;
      } catch (parseError) { /* ignore */ }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[openaiService] API Response received successfully");

    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        throw new Error("Received empty or invalid response content from API.");
    }

    // --- Updated JSON Parsing Logic ---
    if (useJsonMode) {
      try {
        // Always parse the response as an object first
        console.log("Raw JSON response:", responseContent);
        const jsonObj = JSON.parse(responseContent);

        // Special handling for improve_instructions_batch context
        if (contextType === "improve_instructions_batch") {
          // Look specifically for the 'results' array within the object
          if (jsonObj && Array.isArray(jsonObj.results)) {
              console.log(`Found 'results' array with ${jsonObj.results.length} items.`);
              return jsonObj.results; // Return the array directly
          } else {
              // If the expected structure isn't found, log a warning and return empty array
              console.warn("Response JSON object did not contain expected 'results' array. Response:", jsonObj);
              return []; // Return empty array to indicate failure to get batch results
          }
        }

        // Standard JSON object return for other contexts (if any use json_object)
        return jsonObj;

      } catch (error) {
        console.error("Error parsing JSON response:", error, "Raw:", responseContent);
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
    console.error("Error calling OpenAI API:", error);
    if (error.name === 'AbortError') { throw new Error(`OpenAI API request timed out...`); }
    else if (error.message.includes('Failed to fetch') /*...*/) { throw new Error("Network error..."); }
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
};

// Export the helper function for testing
export { buildMessages };
