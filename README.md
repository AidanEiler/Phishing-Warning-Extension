# PhishGuard 

An extension for Chromium-based browsers that intercepts suspicious links on Discord and generates contextually specific, AI-powered warnings using Google Gemini. Built as part of a usable security research project at Louisiana State University.

---

## How It Works

When you click a link in a Discord message, the extension intercepts the click before navigation occurs. It analyzes the link and surrounding conversation context using the Gemini AI model to determine whether the link may be a phishing attempt. If suspicious, an interruptive warning modal is displayed with a contextually specific explanation of the risk. If the link appears legitimate, navigation proceeds normally without any interruption.

Warnings vary in appearance each time they are shown — changing border color, background, icon, header text, and animation — implementing polymorphic warning design based on Anderson et al.'s research on habituation resistance in security warnings.

---

## Installation

### Prerequisites
- Google Chrome, Microsoft Edge, or any Chromium-based browser
- A free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### Steps

**1. Download and unzip the extension**

Download the zip file and extract it to a location on your computer.

**2. Open your browser's extension page**

- Chrome: navigate to `chrome://extensions`
- Edge: navigate to `edge://extensions`
- Brave: navigate to `brave://extensions`

**3. Enable Developer Mode**

Toggle on **Developer mode** in the top right corner of the extensions page.

**4. Load the extension**

Click **Load unpacked** and select the unzipped folder.

**5. Pin the extension**

*Note: This is optional, but it helps with locating the extension.*

Click the puzzle piece icon in your browser toolbar, find **Phishing Warning System**, and click the pin icon to keep it visible.

**6. Enter your API key**

Click the extension icon in your toolbar to open the popup. Enter your Gemini API key and click **Save Key**. The status indicator will turn green when the key is saved successfully.

---

## Getting a Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** in the left sidebar
4. Click **Create API key**
5. Copy the key and paste it into the extension popup

The free tier includes enough requests for personal use and demonstrations. Your key is stored locally in your browser and is never transmitted anywhere except directly to the Gemini API.

---

## Usage

Once installed and configured, the extension runs automatically on Discord web. No additional setup is required.

**When you click a link in a Discord message:**
- A loading indicator appears while the AI analyzes the message
- If the link appears safe, navigation proceeds normally
- If the link appears suspicious, a warning modal is displayed

**Warning modal options:**
- **Go Back (Safe)** — closes the modal and stays on Discord
- **Proceed Anyway** — closes the modal and opens the link in a new tab

---

## Polymorphic Warning Design

Each warning is visually unique, varying across the following dimensions to resist habituation:

| Dimension | Variations |
|---|---|
| Border color | 10 colors across the full spectrum |
| Background | Dark tint matching the border color |
| Icon | Shield, warning triangle, lock, eye, bug, broken link, exclamation, fingerprint |
| Header text | 5 variations including "Phishing Warning", "Security Alert", "Suspicious Link Detected" |
| Icon position | Before or after header text, randomized |
| Animation | Slide, jiggle, pulse, vertical shake, bounce, fade |

---

## Privacy

- Your API key is stored locally in your browser using Chrome's sync storage
- No data is collected or stored by the extension itself
- Message context is sent to the Gemini API solely for the purpose of link analysis
- The extension only activates on Discord web pages

---

## Research Context

This extension was developed as a prototype for a usable security research study titled *Phishing Warning Design in Messaging Applications: A Comparative Evaluation of Effectiveness and Habituation Over Time*, conducted at the LSU Cybersecurity Clinic. The study investigates how warning delivery mode, language specificity, and visual presentation affect phishing detection in messaging environments.

The polymorphic warning design is grounded in habituation theory and implements variations validated by Anderson et al. (2016) as most resistant to repetition suppression.

While this prototype targets Discord web, the underlying warning layer architecture is platform-agnostic. The link interception, AI analysis, and polymorphic warning display components can be adapted to any messaging platform with a web interface, including WhatsApp Web, Telegram Web, and Slack.