// background.js
// Service worker that handles all Gemini API calls.
// Receives messages from content.js, calls the Gemini API with Google Search grounding,
// and returns the warning text or SAFE if the link is legitimate.

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

// Send a prompt to the Gemini API with Google Search grounding
async function sendPrompt(apiKey, prompt) {
  await respectRateLimit();

  const response = await fetch(GEMINI_URL, {
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
      tools: [
        {
          google_search: {}
        }
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

  // Check if candidates exist and have content
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Analysis was blocked or returned no results. Please try again.');
  }

  if (
    !data.candidates[0].content ||
    !data.candidates[0].content.parts ||
    data.candidates[0].content.parts.length === 0
  ) {
    throw new Error('Analysis returned an empty response. Please try again.');
  }

  return data.candidates[0].content.parts[0].text;
}

// Generate a contextually specific warning for a suspicious message
// Uses Google Search grounding to evaluate domain legitimacy dynamically
async function generateWarning(apiKey, messageContext, linkUrl) {
  const prompt = `You are a phishing warning system for a messaging application.
A user is about to click a link. Use Google Search to research the domain and determine if this link is genuinely suspicious.

CONVERSATION CONTEXT:
${messageContext}

LINK URL:
${linkUrl}

Search for information about the domain to determine its legitimacy. Consider:
- Is this a well known legitimate website?
- Are there any reports of this domain being used for phishing?
- Does the domain make sense in the context of the conversation?
- Is the domain attempting to impersonate a well known brand through typosquatting? Look for subtle misspellings, character substitutions, or added words that make a fake domain resemble a trusted one (e.g. "discordd.com", "paypa1.com", "steamcommunlty.com").
- Are there suspicious subdomains or URL structures designed to look legitimate at a glance?

If the link appears legitimate based on your research, respond with exactly: SAFE

If the link is genuinely suspicious, respond with a brief warning (2-3 sentences) that:
1. Explains specifically why this link appears suspicious based on its context
2. Identifies the specific risk the user may face, including typosquatting if applicable
3. Is written in plain language without technical jargon
4. Uses cautious, hedged language — avoid absolute claims like "this is a phishing site" or "this will steal your information". Instead use phrases like "this link appears suspicious", "this may be an attempt to", or "exercise caution before proceeding".

Provide only "SAFE" or the warning text, nothing else.`;

  return await sendPrompt(apiKey, prompt);
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_LINK') {
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
        const response = await generateWarning(
          apiKey,
          message.messageContext,
          message.linkUrl
        );

        // Check if Gemini determined the link is safe
        if (response.trim().toUpperCase() === 'SAFE') {
          sendResponse({ success: true, safe: true });
        } else {
          sendResponse({ success: true, safe: false, warningText: response });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });

    // Return true to keep the message channel open for async response
    return true;
  }
});