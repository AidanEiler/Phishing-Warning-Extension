// background.js
// Service worker that handles all Gemini API calls.
// Receives messages from content.js, calls the Gemini API,
// and returns the warning text or an error message.

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Rate limiting — Gemini free tier allows 5 requests per minute
const REQUEST_DELAY_MS = 12000;
let lastRequestTime = 0;

// Enforce minimum delay between API requests
async function respectRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    const waitTime = REQUEST_DELAY_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

// Send a prompt to the Gemini API and return the response text
async function sendPrompt(apiKey, prompt) {
  await respectRateLimit();

  const response = await fetch(`${GEMINI_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Generate a contextually specific warning for a suspicious message
async function generateWarning(apiKey, messageContext, linkUrl) {
  const prompt = `You are a phishing warning system for a messaging application.
A user is about to click a suspicious link in the following conversation.

CONVERSATION:
${messageContext}

LINK:
${linkUrl}

Generate a brief, clear warning (2-3 sentences maximum) that:
1. Explains specifically why this message is suspicious based on its context
2. Identifies the specific risk the user faces
3. Is written in plain language without technical jargon

Provide only the warning text, no preamble or labels.`;

  return await sendPrompt(apiKey, prompt);
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_LINK') {
    // Retrieve API key from Chrome storage and analyze the link
    chrome.storage.sync.get('geminiApiKey', async (result) => {
      const apiKey = result.geminiApiKey;

      if (!apiKey) {
        sendResponse({
          success: false,
          error: 'No API key set. Please open the extension popup and enter your Gemini API key.',
        });
        return;
      }

      try {
        const warningText = await generateWarning(
          apiKey,
          message.messageContext,
          message.linkUrl
        );
        sendResponse({ success: true, warningText });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });

    // Return true to keep the message channel open for async response
    return true;
  }
});