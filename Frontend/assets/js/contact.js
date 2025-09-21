// Contact Form Validation & Message
const contactForm = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();

  // Get values
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  // Simple Validation
  if(name === '' || email === '' || subject === '' || message === '') {
    formMsg.style.color = 'red';
    formMsg.textContent = 'Please fill all fields!';
    return;
  }

  // Email format check
  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  if(!email.match(emailPattern)) {
    formMsg.style.color = 'red';
    formMsg.textContent = 'Please enter a valid email!';
    return;
  }

  // If valid, show success message
  formMsg.style.color = 'green';
  formMsg.textContent = 'Thank you! Your message has been sent.';

  // Clear form
  contactForm.reset();
});
