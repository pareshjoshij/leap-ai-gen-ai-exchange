/* ===================== VARIABLES ===================== */
const body = document.body;
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const themeToggle = document.getElementById('themeToggle');
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const sendBtn = document.getElementById('sendBtn');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const downloadPDF = document.getElementById('downloadPDF');
const newChatBtn = document.getElementById('newChatBtn');
const welcomeMessage = document.getElementById('welcomeMessage');

newChatBtn.addEventListener('click', () => {
  // Clear all messages
  messages.innerHTML = '';

  // Show welcome message again
  if(welcomeMessage) welcomeMessage.style.display = 'flex';

  // Optionally, scroll to top
  messages.scrollTop = 0;

  // Optional: focus input
  input.value = '';
  input.focus();
});

/* ===================== THEME ===================== */
// Restore theme
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
} else {
  body.classList.remove('dark');
}

// Toggle theme
themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
});

/* ===================== SIDEBAR ===================== */
// Restore sidebar state
if (localStorage.getItem('sidebar') === 'collapsed') {
  sidebar.classList.add('collapsed');
} else {
  sidebar.classList.remove('collapsed');
}

// Toggle sidebar
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('sidebar', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
});

/* ===================== LOGIN/SIGNUP MODAL ===================== */
loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
closeModal.addEventListener('click', () => loginModal.style.display = 'none');
window.addEventListener('click', (e) => { if(e.target === loginModal) loginModal.style.display = 'none'; });

switchToSignup.addEventListener('click', () => {
  loginForm.style.display = 'none';
  signupForm.style.display = 'flex';
});
switchToLogin.addEventListener('click', () => {
  signupForm.style.display = 'none';
  loginForm.style.display = 'flex';
});

// Optional: auto-open login modal after 3s
window.addEventListener('load', () => {
  setTimeout(() => { loginModal.style.display = 'block'; }, 3000);
});

/* ===================== CHAT ===================== */
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
  if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function sendMessage() {
  const text = input.value.trim();
  if(!text) return;
  appendMessage('user', text);
  input.value = '';

  setTimeout(() => { appendMessage('ai', 'This is a dummy AI response.'); }, 1000);
}

function appendMessage(role, text) {
  const li = document.createElement('li');
  li.className = `message ${role}`;
  li.textContent = text;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

/* ===================== DOWNLOAD PDF ===================== */
downloadPDF.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  document.querySelectorAll('.message').forEach(msg => {
    const prefix = msg.classList.contains('user') ? 'You: ' : 'AI: ';
    doc.text(prefix + msg.textContent, 10, y);
    y += 10;
  });

  doc.save('chat.pdf');
});

sendBtn.addEventListener("click", () => {
  if(input.value.trim() !== "") {
    if(welcomeMessage) welcomeMessage.style.display = "none"; // hide welcome
    const li = document.createElement("li");
    li.className = "message user";
    li.textContent = input.value;
    messages.appendChild(li);
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  }
});

