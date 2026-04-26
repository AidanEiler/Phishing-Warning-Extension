// content.js
// Injected into Discord web pages.
// Intercepts link clicks, extracts message context,
// sends to background.js for analysis, and displays warning modal.
// Implements fully randomized polymorphic warning variations based on Anderson et al.

const approvedLinks = new Set();
let bypassNext = false;

// Full rainbow border color pool
const BORDER_COLORS = [
  '#ed4245', // red
  '#ff7043', // orange
  '#faa61a', // amber
  '#fee75c', // yellow
  '#57f287', // green
  '#1abc9c', // teal
  '#5865f2', // blue
  '#9b59b6', // purple
  '#e91e8c', // pink
  '#ffffff', // white
];

// Dark background tints matching each border color
const BACKGROUND_COLORS = [
  '#2d1f1f', // dark red
  '#2d221a', // dark orange
  '#2d2a1f', // dark amber
  '#2d2c1a', // dark yellow
  '#1a2d20', // dark green
  '#1a2d2a', // dark teal
  '#1a1f2d', // dark blue
  '#221a2d', // dark purple
  '#2d1a27', // dark pink
  '#2b2d31', // neutral dark
];

// SVG icon pool
const ICONS = [
  // Shield
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L3 7v5c0 5 4 9.3 9 10.3C17 21.3 21 17 21 12V7L12 2z"/>
  </svg>`,
  // Triangle warning
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 19h20L12 2z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
  </svg>`,
  // Lock
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>`,
  // Eye
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  // Bug
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M8 2l1.5 1.5M16 2l-1.5 1.5M9 9H5M19 9h-4M5 15H3M21 15h-2M12 22v-4"/>
    <path d="M12 6a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0v-4a4 4 0 0 1 4-4z"/>
  </svg>`,
  // Broken link
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    <line x1="8" y1="16" x2="8" y2="19"/>
    <line x1="16" y1="5" x2="16" y2="8"/>
  </svg>`,
  // Exclamation circle
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  // Fingerprint
  `<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 10a2 2 0 0 0-2 2v4"/>
    <path d="M10 8.5A4 4 0 0 1 16 12v4"/>
    <path d="M8 7A6 6 0 0 1 18 12v4"/>
    <path d="M6 5.5A8 8 0 0 1 20 12v4"/>
  </svg>`,
];

// Header text variations
const HEADER_TEXTS = [
  'Phishing Warning',
  'Security Alert',
  'Suspicious Link Detected',
  'Proceed with Caution',
  'Potential Threat Detected',
];

// Animation class pool
const ANIMATIONS = [
  'pw-anim-slide',
  'pw-anim-jiggle',
  'pw-anim-pulse',
  'pw-anim-shake-vertical',
  'pw-anim-bounce',
  'pw-anim-fade',
];

// Discord internal path prefixes that should never be analyzed
const DISCORD_INTERNAL_PATHS = [
  '/channels/',
  '/attachments/',
  '/external/',
  '/emojis/',
  '/stickers/',
  '/avatars/',
  '/icons/',
  '/banners/',
];

// Pick a random element from an array
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build a fully randomized variation each time a warning fires
function buildVariation() {
  const colorIndex = Math.floor(Math.random() * BORDER_COLORS.length);
  return {
    borderColor: BORDER_COLORS[colorIndex],
    backgroundColor: BACKGROUND_COLORS[colorIndex],
    icon: randomFrom(ICONS),
    iconAfter: Math.random() > 0.5,
    headerText: randomFrom(HEADER_TEXTS),
    animationClass: randomFrom(ANIMATIONS),
  };
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

// Determines whether a link should be skipped without analysis
function shouldSkipLink(hostname, pathname) {
  // Always skip Discord CDN and media domains entirely
  if (
    hostname === 'discordapp.net' ||
    hostname.endsWith('.discordapp.net') ||
    hostname === 'discordcdn.com' ||
    hostname.endsWith('.discordcdn.com') ||
    hostname === 'tenor.com' ||
    hostname.endsWith('.tenor.com')
  ) {
    return true;
  }

  // For discord.com and discordapp.com, only skip internal paths
  const isDiscordDomain =
    hostname === 'discord.com' ||
    hostname.endsWith('.discord.com') ||
    hostname === 'discord.gg' ||
    hostname.endsWith('.discord.gg') ||
    hostname === 'discordapp.com' ||
    hostname.endsWith('.discordapp.com');

  if (isDiscordDomain) {
    return DISCORD_INTERNAL_PATHS.some((path) => pathname.startsWith(path));
  }

  return false;
}

// Create and inject the warning modal with a fully randomized polymorphic variation
function showWarningModal(linkUrl, warningText) {
  const existing = document.getElementById('phishing-warning-modal');
  if (existing) existing.remove();

  const variation = buildVariation();

  const overlay = document.createElement('div');
  overlay.id = 'phishing-warning-modal';
  overlay.className = 'pw-overlay';

  const modal = document.createElement('div');
  modal.className = `pw-modal ${variation.animationClass}`;
  modal.style.borderColor = variation.borderColor;
  modal.style.backgroundColor = variation.backgroundColor;

  const header = document.createElement('div');
  header.className = 'pw-header';
  header.style.color = variation.borderColor;

  if (variation.iconAfter) {
    header.innerHTML = `
      <span>${variation.headerText}</span>
      ${variation.icon}
    `;
  } else {
    header.innerHTML = `
      ${variation.icon}
      <span>${variation.headerText}</span>
    `;
  }

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
  goBackBtn.textContent = 'Go Back';
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
  if (!linkUrl.startsWith('http')) return;

  // Parse the URL to get hostname and pathname
  let hostname, pathname;
  try {
    const parsed = new URL(linkUrl);
    hostname = parsed.hostname;
    pathname = parsed.pathname;
  } catch {
    return;
  }

  // Skip Discord internal links and media
  if (shouldSkipLink(hostname, pathname)) return;

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