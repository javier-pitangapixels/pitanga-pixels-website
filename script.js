/* ============================================================
   PITANGA PIXELS — script.js
   Functions:
   1. initNavScroll()       — scroll → nav dark bg
   2. initSectionObserver() — active nav link per section
   3. initRevealObserver()  — fade-up reveal on scroll
   4. initSmoothScroll()    — anchor click smooth scroll
   5. initMobileMenu()      — hamburger overlay toggle
   6. initContactForm()     — async Formspree submission
   7. initFooterYear()      — dynamic copyright year
============================================================ */

'use strict';

/* ============================================================
   1. NAV SCROLL
   Adds .nav--scrolled class when user scrolls past 60px,
   enabling backdrop blur and dark background.
============================================================ */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const THRESHOLD = 60;

  function onScroll() {
    nav.classList.toggle('nav--scrolled', window.scrollY > THRESHOLD);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page loads mid-scroll
}


/* ============================================================
   2. SECTION OBSERVER
   Highlights the correct nav link as sections enter the viewport.
============================================================ */
function initSectionObserver() {
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if (!navLinks.length) return;

  // Map each section id → nav link
  const linkMap = new Map();
  navLinks.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) linkMap.set(section, link);
  });

  if (!linkMap.size) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = linkMap.get(entry.target);
      if (!link) return;
      link.classList.toggle('is-active', entry.isIntersecting);
    });
  }, {
    rootMargin: `-${getNavHeight()}px 0px -40% 0px`,
    threshold: 0,
  });

  linkMap.forEach((link, section) => observer.observe(section));
}

function getNavHeight() {
  const nav = document.getElementById('nav');
  return nav ? nav.offsetHeight : 72;
}


/* ============================================================
   3. REVEAL OBSERVER
   Adds .is-visible to .reveal elements as they scroll into view.
   Respects prefers-reduced-motion — immediately marks all visible.
============================================================ */
function initRevealObserver() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // If user prefers reduced motion, skip animation entirely
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // only animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  elements.forEach(el => observer.observe(el));
}


/* ============================================================
   4. SMOOTH SCROLL
   Intercepts anchor link clicks and scrolls smoothly,
   offsetting for the fixed nav bar.
============================================================ */
function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navOffset = getNavHeight();
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  });
}


/* ============================================================
   5. MOBILE MENU
   Toggles full-screen overlay nav.
   Closes on link click or close button click.
   Traps focus within the overlay while open.
============================================================ */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('mobile-close');
  const mobileLinks = menu ? menu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta') : [];

  if (!hamburger || !menu) return;

  function openMenu() {
    menu.removeAttribute('hidden');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
    // Focus the close button for accessibility
    closeBtn && closeBtn.focus();
  }

  function closeMenu() {
    menu.setAttribute('hidden', '');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  closeBtn && closeBtn.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Close if user resizes to desktop width
  const mediaQuery = window.matchMedia('(min-width: 900px)');
  mediaQuery.addEventListener('change', e => {
    if (e.matches) closeMenu();
  });
}


/* ============================================================
   6. CONTACT FORM
   Async POST to Formspree with JSON response.
   Replaces form with inline success message on submit.
   Shows inline error message on failure.
============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('form-submit');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Clear any previous error messages
    const existingError = form.querySelector('.form-error-msg');
    if (existingError) existingError.remove();

    // Basic client-side validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Set loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        showFormSuccess(form);
      } else {
        const json = await response.json().catch(() => ({}));
        const message = json.error || 'Something went wrong. Please try again or email directly.';
        showFormError(form, submitBtn, originalText, message);
      }
    } catch {
      showFormError(
        form,
        submitBtn,
        originalText,
        'Network error — please check your connection and try again.'
      );
    }
  });
}

function showFormSuccess(form) {
  const wrapper = form.closest('.contact__form-wrapper') || form.parentElement;
  wrapper.innerHTML = `
    <div class="form-success" role="status" aria-live="polite">
      <div class="form-success__icon" aria-hidden="true">&#10003;</div>
      <h3 class="form-success__title">Message sent!</h3>
      <p class="form-success__body">Thanks for reaching out. I'll get back to you within one business day.</p>
    </div>
  `;
}

function showFormError(form, submitBtn, originalText, message) {
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;

  const errorEl = document.createElement('p');
  errorEl.className = 'form-error-msg';
  errorEl.setAttribute('role', 'alert');
  errorEl.textContent = message;
  submitBtn.insertAdjacentElement('afterend', errorEl);
}


/* ============================================================
   7. FOOTER YEAR
   Updates the copyright year dynamically.
============================================================ */
function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}


/* ============================================================
   8. HERO GLITCH
   After the hero headline fades in via reveal, scrambles the text
   with random characters then resolves back to the correct text.
   Retro terminal / pixel aesthetic.
============================================================ */
function initHeroGlitch() {
  const el = document.querySelector('.hero__headline');
  if (!el) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&!?<>';
  const finalText = el.textContent.trim();
  const DURATION = 900;
  const FRAMES = 28;
  const FRAME_TIME = DURATION / FRAMES;

  function scramble() {
    let frame = 0;
    const interval = setInterval(() => {
      const progress = frame / FRAMES;
      const charsRevealed = Math.floor(progress * finalText.length);

      let result = finalText.slice(0, charsRevealed);
      for (let i = charsRevealed; i < finalText.length; i++) {
        if (finalText[i] === ' ') {
          result += ' ';
        } else {
          result += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
      }
      el.textContent = result;
      frame++;

      if (frame > FRAMES) {
        clearInterval(interval);
        el.textContent = finalText;
      }
    }, FRAME_TIME);
  }

  // Wait for the reveal animation to complete before glitching
  setTimeout(scramble, 1000);
}


/* ============================================================
   9. STAT COUNTERS
   When the hero stats bar scrolls into view, animates each
   number counting up from 0 to its target value.
============================================================ */
function initCounters() {
  const statNumbers = document.querySelectorAll('.hero__stat-number');
  if (!statNumbers.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCount(el, target, duration) {
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOutQuart(progress) * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.textContent, 10);
      if (!isNaN(target)) animateCount(el, target, 1400);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}


/* ============================================================
   10. CARD TILT
   Applies a subtle 3D perspective tilt to service and case
   study cards as the user moves their mouse over them.
   Resets smoothly on mouse leave.
============================================================ */
function initCardTilt() {
  const cards = document.querySelectorAll('.service-card, .case-card');
  if (!cards.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Only enable on non-touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const MAX_TILT = 7;

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('is-tilting');
    });

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -MAX_TILT;
      const rotateY = ((x - cx) / cx) * MAX_TILT;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });
}


/* ============================================================
   11. PASSWORD WALL
   Blocks the page behind a password prompt.
   Stores the unlocked state in localStorage so the user is
   not asked again. Remove this function (and its call in init)
   when the site is ready to go public.
============================================================ */
function initPasswordWall() {
  const STORAGE_KEY = 'pp_unlocked';
  const PASSWORD    = 'testitonprod';

  const wall     = document.getElementById('password-wall');
  const form     = document.getElementById('password-form');
  const input    = document.getElementById('password-input');
  const errorMsg = document.getElementById('password-error');

  if (!wall || !form) return;

  // Already unlocked this session — remove overlay immediately
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    wall.remove();
    return;
  }

  // Lock scroll while wall is visible
  document.body.style.overflow = 'hidden';
  input.focus();

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (input.value === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      document.body.style.overflow = '';
      wall.classList.add('is-hiding');
      wall.addEventListener('transitionend', () => wall.remove(), { once: true });
    } else {
      errorMsg.hidden = false;
      input.classList.add('is-error');
      input.value = '';
      input.focus();
      input.addEventListener('animationend', () => {
        input.classList.remove('is-error');
      }, { once: true });
    }
  });
}


/* ============================================================
   INIT — run all functions after DOM is ready
============================================================ */
function init() {
  initPasswordWall();
  initNavScroll();
  initSectionObserver();
  initRevealObserver();
  initSmoothScroll();
  initMobileMenu();
  initContactForm();
  initFooterYear();
  initHeroGlitch();
  initCounters();
  initCardTilt();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
