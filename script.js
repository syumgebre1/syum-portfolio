const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('is-open', !isOpen);
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

document.querySelectorAll('.photo-wordmark img').forEach((image) => {
  const fallback = image.nextElementSibling;
  if (!(fallback instanceof HTMLElement)) return;

  const showFallback = () => {
    image.hidden = true;
    fallback.style.visibility = 'visible';
  };

  image.addEventListener('load', () => {
    fallback.style.visibility = 'hidden';
  }, { once: true });
  image.addEventListener('error', showFallback, { once: true });
  if (image.complete) {
    if (image.naturalWidth === 0) showFallback();
    else fallback.style.visibility = 'hidden';
  }
});

document.querySelectorAll('.hero-monogram img').forEach((image) => {
  const fallback = image.nextElementSibling;
  if (!(fallback instanceof HTMLElement)) return;

  const showFallback = () => {
    image.hidden = true;
    fallback.style.visibility = 'visible';
  };

  image.addEventListener('load', () => {
    fallback.style.visibility = 'hidden';
  }, { once: true });
  image.addEventListener('error', showFallback, { once: true });
  if (image.complete) {
    if (image.naturalWidth === 0) showFallback();
    else fallback.style.visibility = 'hidden';
  }
});
