// content.js
// Injected into Discord web pages.
// Intercepts link clicks, extracts message context,
// sends to background.js for analysis, and displays warning modal.

// Track links that have already been analyzed and approved by the user
// to avoid showing the warning multiple times for the same link
const approvedLinks = new Set();

// Extract the conversation context surrounding a clicked link
// Looks for the nearest Discord message container and gets surrounding messages
function extractMessageContext(linkElement) {
  // Find the message content container
  const messageContent = linkElement.closest('[class*="messageContent"]') ||
    linkElement.closest('[class*="message-"]') ||
    linkElement.closest('li');

  if (!messageContent) {
    return linkElement.textContent || linkElement.href;
  }

  // Try to get surrounding messages for broader context
  const messageGroup = messageContent.closest('[class*="messageGroup"]') ||
    messageContent.closest('[class*="groupStart"]') ||
    messageContent.parentElement;

  if (!messageGroup) {
    return messageContent.textContent || '';
  }

  // Collect text from surrounding messages for context
  const messages = messageGroup.querySelectorAll('[class*="messageContent"]');
  const contextLines = [];

  messages.forEach((msg) => {
    const text = msg.textContent.trim();
    if (text) contextLines.push(text);
  });

  return contextLines.join('\n') || messageContent.textContent || '';
}

// Create and inject the warning modal into the Discord page
function showWarningModal(linkUrl, warningText, originalClickHandler) {
  // Remove any existing modal
  const existing = document.getElementById('phishing-warning-modal');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'phishing-warning-modal';
  overlay.className = 'pw-overlay';

  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'pw-modal';

  // Header
  const header = document.createElement('div');
  header.className = 'pw-header';
  header.innerHTML = `
    <svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 19h20L12 2z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
    </svg>
    <span>Phishing Warning</span>
  `;

  // Warning text
  const body = document.createElement('div');
  body.className = 'pw-body';
  body.textContent = warningText;

  // Link display
  const linkDisplay = document.createElement('div');
  linkDisplay.className = 'pw-link';
  linkDisplay.textContent = linkUrl;

  // Buttons
  const buttons = document.createElement('div');
  buttons.className = 'pw-buttons';

  const goBackBtn = document.createElement('button');
  goBackBtn.className = 'pw-btn pw-btn-safe';
  goBackBtn.textContent = 'Go Back (Safe)';
  goBackBtn.addEventListener('click', () => {
    overlay.remove();
  });

  const reportBtn = document.createElement('button');
  reportBtn.className = 'pw-btn pw-btn-report';
  reportBtn.textContent = 'Report';
  reportBtn.addEventListener('click', () => {
    overlay.remove();
    showToast('Message reported. Thank you for helping keep the community safe.');
  });

  const proceedBtn = document.createElement('button');
  proceedBtn.className = 'pw-btn pw-btn-proceed';
  proceedBtn.textContent = 'Proceed Anyway';
  proceedBtn.addEventListener('click', () => {
    overlay.remove();
    // Mark link as approved so it does not trigger again this session
    approvedLinks.add(linkUrl);
    // Open the link in a new tab
    window.open(linkUrl, '_blank');
  });

  buttons.appendChild(goBackBtn);
  buttons.appendChild(reportBtn);
  buttons.appendChild(proceedBtn);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(linkDisplay);
  modal.appendChild(buttons);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close modal when clicking outside
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

// Show a brief toast notification
function showToast(message) {
  const existing = document.getElementById('phishing-warning-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'phishing-warning-toast';
  toast.className = 'pw-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
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
  // Find the closest anchor tag to the clicked element
  const link = e.target.closest('a[href]');
  if (!link) return;

  const linkUrl = link.href;

  // Only intercept external links — ignore Discord internal navigation
  if (!linkUrl.startsWith('http') ||
      linkUrl.includes('discord.com') ||
      linkUrl.includes('discord.gg')) {
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

      showWarningModal(linkUrl, response.warningText, null);
    }
  );
});