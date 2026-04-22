// content.js
// Injected into Discord web pages.
// Intercepts link clicks, extracts message context,
// sends to background.js for analysis, and displays warning modal.
// Implements random polymorphic warning variations based on Anderson et al.

// Track links that have already been analyzed and approved by the user
const approvedLinks = new Set();

// Prevent the click interceptor from re-firing on programmatically opened links
let bypassNext = false;

// Polymorphic warning variations based on Anderson et al.
const VARIATIONS = [
  {
    name: 'symbol',
    borderColor: '#ed4245',
    backgroundColor: '#2b2d31',
    headerColor: '#ed4245',
    icon: `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M12 6v6m0 4h.01" stroke-linecap="round"/>
    </svg>`,
    headerText: 'Phishing Warning',
    animationClass: '',
  },
  {
    name: 'colorChange',
    borderColor: '#faa61a',
    backgroundColor: '#2d2a1f',
    headerColor: '#faa61a',
    icon: `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 19h20L12 2z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
    </svg>`,
    headerText: 'Security Alert',
    animationClass: '',
  },
  {
    name: 'jiggle',
    borderColor: '#ed4245',
    backgroundColor: '#2b2d31',
    headerColor: '#ed4245',
    icon: `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 19h20L12 2z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
    </svg>`,
    headerText: 'Suspicious Link Detected',
    animationClass: 'pw-jiggle',
  },
];

// Select a random variation each time a warning is shown
function getRandomVariation() {
  return VARIATIONS[Math.floor(Math.random() * VARIATIONS.length)];
}

// Extract the conversation context surrounding a clicked link
function extractMessageContext(linkElement) {
  const messageContent =
    linkElement.closest('[class*="messageContent"]') ||
    linkElement.closest('[class*="message-"]') ||
    linkElement.closest('li');

  if (!messageContent) {
    return linkElement.textContent || linkElement.href;
  }

  const messageGroup =
    messageContent.closest('[class*="messageGroup"]') ||
    messageContent.closest('[class*="groupStart"]') ||
    messageContent.parentElement;

  if (!messageGroup) {
    return messageContent.textContent || '';
  }

  const messages = messageGroup.querySelectorAll('[class*="messageContent"]');
  const contextLines = [];

  messages.forEach((msg) => {
    const text = msg.textContent.trim();
    if (text) contextLines.push(text);
  });

  return contextLines.join('\n') || messageContent.textContent || '';
}

// Create and inject the warning modal with a random polymorphic variation
function showWarningModal(linkUrl, warningText) {
  const existing = document.getElementById('phishing-warning-modal');
  if (existing) existing.remove();

  const variation = getRandomVariation();

  const overlay = document.createElement('div');
  overlay.id = 'phishing-warning-modal';
  overlay.className = 'pw-overlay';

  const modal = document.createElement('div');
  modal.className = `pw-modal ${variation.animationClass}`;
  modal.style.borderColor = variation.borderColor;
  modal.style.backgroundColor = variation.backgroundColor;

  const header = document.createElement('div');
  header.className = 'pw-header';
  header.style.color = variation.headerColor;
  header.innerHTML = `
    ${variation.icon}
    <span>${variation.headerText}</span>
  `;

  const body = document.createElement('div');
  body.className = 'pw-body';
  body.textContent = warningText;

  const linkDisplay = document.createElement('div');
  linkDisplay.className = 'pw-link';
  linkDisplay.textContent = linkUrl;

  const buttons = document.createElement('div');
  buttons.className = 'pw-buttons';

  const goBackBtn = document.createElement('button');
  goBackBtn.className = 'pw-btn pw-btn-safe';
  goBackBtn.textContent = 'Go Back (Safe)';
  goBackBtn.addEventListener('click', () => {
    overlay.remove();
  });

  const proceedBtn = document.createElement('button');
  proceedBtn.className = 'pw-btn pw-btn-proceed';
  proceedBtn.textContent = 'Proceed Anyway';
  proceedBtn.addEventListener('click', () => {
    overlay.remove();
    approvedLinks.add(linkUrl);
    bypassNext = true;
    window.open(linkUrl, '_blank');
  });

  buttons.appendChild(goBackBtn);
  buttons.appendChild(proceedBtn);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(linkDisplay);
  modal.appendChild(buttons);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// Show a loading modal while the API call is in progress
function showLoadingModal() {
  const existing = document.getElementById('phishing-warning-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'phishing-warning-modal';
  overlay.className = 'pw-overlay';

  const modal = document.createElement('div');
  modal.className = 'pw-modal pw-loading';
  modal.innerHTML = `
    <div class="pw-spinner"></div>
    <p>Analyzing message...</p>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// Show error modal if API call fails
function showErrorModal(errorMessage) {
  const existing = document.getElementById('phishing-warning-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'phishing-warning-modal';
  overlay.className = 'pw-overlay';

  const modal = document.createElement('div');
  modal.className = 'pw-modal';
  modal.innerHTML = `
    <div class="pw-header pw-header-error">
      <span>Warning System Error</span>
    </div>
    <div class="pw-body">${errorMessage}</div>
    <div class="pw-buttons">
      <button class="pw-btn pw-btn-safe" id="pw-error-close">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('pw-error-close').addEventListener('click', () => {
    overlay.remove();
  });
}

// Main click interceptor — listens for all link clicks on Discord
document.addEventListener('click', async (e) => {
  if (bypassNext) {
    bypassNext = false;
    return;
  }

  const link = e.target.closest('a[href]');
  if (!link) return;

  const linkUrl = link.href;

  // Only intercept external links — ignore Discord internal navigation
  if (
    !linkUrl.startsWith('http') ||
    linkUrl.includes('discord.com') ||
    linkUrl.includes('discord.gg')
  ) {
    return;
  }

  // Skip links already approved by the user this session
  if (approvedLinks.has(linkUrl)) return;

  // Prevent default navigation
  e.preventDefault();
  e.stopPropagation();

  // Extract message context from surrounding Discord messages
  const messageContext = extractMessageContext(link);

  // Show loading state while API call is in progress
  showLoadingModal();

  // Send to background service worker for Gemini analysis
  chrome.runtime.sendMessage(
    {
      type: 'ANALYZE_LINK',
      linkUrl,
      messageContext,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showErrorModal('Could not connect to the warning service. Please try again.');
        return;
      }

      if (!response.success) {
        showErrorModal(response.error);
        return;
      }

      // If Gemini determined the link is safe open it normally
      if (response.safe) {
        approvedLinks.add(linkUrl);
        const existing = document.getElementById('phishing-warning-modal');
        if (existing) existing.remove();
        bypassNext = true;
        window.open(linkUrl, '_blank');
        return;
      }

      showWarningModal(linkUrl, response.warningText);
    }
  );
});