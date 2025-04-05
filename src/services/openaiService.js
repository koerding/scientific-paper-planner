// FILE: src/services/openaiService.js

/**
 * Enhanced OpenAI service with better error reporting and fallback mode
 * REFACTORED: To use centralized prompt content and utilities
 */
import { 
  isResearchApproachSection, 
  generateMockResponse
} from '../utils/promptUtils';

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
    
    // Use our utility to generate appropriate mock responses
    const mockType = isSocraticPrompt ? 'socraticPrompt' : 'regularChat';
    return generateMockResponse(mockType, contextType);
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  
  // Pass systemPrompt to buildMessages
  const messages = buildMessages(prompt, contextType, userInputs, sections, chatHistory, systemPrompt);

  // If it's a Socratic prompt or related to research approaches, use higher temperature
  const isResearchSectionType = isResearchApproachSection(contextType);
  const temperature = (isSocraticPrompt || isResearchSectionType) ? 0.9 : (options.temperature ?? 0.7);
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
export { buildMessages };
