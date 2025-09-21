const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');

// Theme persistence
const savedTheme = localStorage.getItem('ui-theme');
if (savedTheme) {
  body.setAttribute('data-theme', savedTheme);
  themeToggle.checked = savedTheme === 'light';
} else {
  body.setAttribute('data-theme', 'dark');
  themeToggle.checked = false;
}

themeToggle.addEventListener('change', () => {
  const mode = themeToggle.checked ? 'light' : 'dark';
  body.setAttribute('data-theme', mode);
  localStorage.setItem('ui-theme', mode);
});

// Send message
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;
  appendMessage(text, 'user');
  inputEl.value = '';

  // Simulated AI response
  setTimeout(() => {
    appendMessage(mockResponse(text), 'ai');
  }, 700 + Math.random() * 700);
}

function appendMessage(text, who) {
  const wrap = document.createElement('div');
  wrap.className = 'bubble ' + (who === 'ai' ? 'ai' : 'user');
  wrap.setAttribute('role', 'listitem');
  wrap.innerHTML = `<div style="white-space:pre-wrap;">${escapeHtml(text)}</div>`;
  messagesEl.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function mockResponse(userText) {
  const replies = [
    "Got it. I'll help with that.",
    "Here's a suggestion: try breaking the task into smaller steps.",
    "I can generate code, explanations, and summaries. What would you like?",
    "Nice question — can you give a little more context?",
  ];
  return replies[Math.floor(Math.random() * replies.length)] + 
         "\n\n(You typed: " + userText.slice(0, 60) + ")";
}

sendBtn.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Hamburger menu toggle
hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Escape helper
function escapeHtml(str) {
  return str.replace(/[&<>\"']/g, function(tag) {
    const chars = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '\"': '&quot;',
      "'": '&#39;'
    };
    return chars[tag] || tag;
  });
}

// Welcome message
appendMessage(
  "Hello! I'm your AI assistant. Ask me anything or try the sample messages below.\n\n- 'Create a landing page for a SaaS product'\n- 'Explain closures in JavaScript'\n- 'Write a 7-day workout plan'",
  'ai'
);

// script.js
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
  });
});
