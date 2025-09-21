document.addEventListener("DOMContentLoaded", () => {
  // Select elements
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  // Toggle mobile menu
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    menuToggle.classList.toggle('active');
  });

  // Close mobile menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('show');
      menuToggle.classList.remove('active');
    });
  });

  // Smooth scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});

  const authModal = document.getElementById("authModal");
  const closeModal = document.getElementById("closeModal");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const switchToSignup = document.getElementById("switchToSignup");
  const switchToLogin = document.getElementById("switchToLogin");

  // Show login form by default
  loginForm.style.display = "flex";
  signupForm.style.display = "none";
  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  // Tab buttons
  loginTab.addEventListener("click", () => {
    loginForm.style.display = "flex";
    signupForm.style.display = "none";
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
  });

  signupTab.addEventListener("click", () => {
    signupForm.style.display = "flex";
    loginForm.style.display = "none";
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
  });

  // Switch links inside forms
  switchToSignup.addEventListener("click", () => {
    signupForm.style.display = "flex";
    loginForm.style.display = "none";
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
  });

  switchToLogin.addEventListener("click", () => {
    loginForm.style.display = "flex";
    signupForm.style.display = "none";
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
  });

  // Close modal
  closeModal.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  // Close modal by clicking outside
  window.addEventListener("click", (e) => {
    if(e.target === authModal){
      authModal.style.display = "none";
    }
  });

  // Auto open modal after 3 seconds
  window.addEventListener("load", () => {
    setTimeout(() => {
      authModal.style.display = "block";
    }, 3000);
  });

