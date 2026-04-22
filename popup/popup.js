// Load saved API key on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get('geminiApiKey');
  const apiKeyInput = document.getElementById('apiKey');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
    statusDot.classList.add('active');
    statusText.textContent = 'API key set — extension active';
  } else {
    statusText.textContent = 'No API key set — extension inactive';
  }
});

// Toggle API key visibility
document.getElementById('toggleVisibility').addEventListener('click', () => {
  const input = document.getElementById('apiKey');
  const btn = document.getElementById('toggleVisibility');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
});

// Save API key to Chrome storage
document.getElementById('saveBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey) {
    showMessage('Please enter a valid API key.', 'error');
    return;
  }

  await chrome.storage.sync.set({ geminiApiKey: apiKey });

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  statusDot.classList.add('active');
  statusText.textContent = 'API key set — extension active';

  showMessage('API key saved successfully.', 'success');
});

// Clear API key from Chrome storage
document.getElementById('clearBtn').addEventListener('click', async () => {
  await chrome.storage.sync.remove('geminiApiKey');

  document.getElementById('apiKey').value = '';

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  statusDot.classList.remove('active');
  statusText.textContent = 'No API key set — extension inactive';

  showMessage('API key cleared.', 'success');
});

// Show a temporary status message
function showMessage(text, type) {
  // Remove existing message if present
  const existing = document.querySelector('.message');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.textContent = text;

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.parentNode.insertBefore(msg, saveBtn);

  setTimeout(() => msg.remove(), 3000);
}