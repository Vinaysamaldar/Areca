/**
 * Main Application Script
 * Theme Toggling, Language Switching (English / Kannada), Mobile Menu
 */

// --- 1. THEME MANAGEMENT (DARK / LIGHT MODE) ---
function initTheme() {
  const savedTheme = localStorage.getItem('areca_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcons();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('areca_theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  const sunIcons = document.querySelectorAll('.theme-icon-sun');
  const moonIcons = document.querySelectorAll('.theme-icon-moon');
  
  sunIcons.forEach(el => el.classList.toggle('hidden', !isDark));
  moonIcons.forEach(el => el.classList.toggle('hidden', isDark));
}

// --- 2. LANGUAGE MANAGEMENT (ENGLISH / KANNADA) ---
let currentLang = localStorage.getItem('areca_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('areca_lang', lang);
  document.documentElement.setAttribute('lang', lang);

  // Update all elements with data-en and data-kn attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'kn' ? el.getAttribute('data-kn') : el.getAttribute('data-en');
    if (text) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });

  // Toggle active class on language toggle buttons
  const enBtns = document.querySelectorAll('.lang-btn-en');
  const knBtns = document.querySelectorAll('.lang-btn-kn');

  enBtns.forEach(b => {
    if (lang === 'en') {
      b.classList.add('bg-emerald-600', 'text-white', 'shadow');
      b.classList.remove('text-zinc-600', 'dark:text-zinc-300');
    } else {
      b.classList.remove('bg-emerald-600', 'text-white', 'shadow');
      b.classList.add('text-zinc-600', 'dark:text-zinc-300');
    }
  });

  knBtns.forEach(b => {
    if (lang === 'kn') {
      b.classList.add('bg-emerald-600', 'text-white', 'shadow');
      b.classList.remove('text-zinc-600', 'dark:text-zinc-300');
    } else {
      b.classList.remove('bg-emerald-600', 'text-white', 'shadow');
      b.classList.add('text-zinc-600', 'dark:text-zinc-300');
    }
  });

  // Trigger custom event so page-specific scripts (like detect.js) can update dynamic content
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

function toggleLanguage() {
  setLanguage(currentLang === 'en' ? 'kn' : 'en');
}

// --- 3. MOBILE MENU TOGGLING ---
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setLanguage(currentLang);
  initMobileMenu();

  // Attach theme button event listeners
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Attach language button event listeners
  document.querySelectorAll('.lang-btn-en').forEach(btn => {
    btn.addEventListener('click', () => setLanguage('en'));
  });
  document.querySelectorAll('.lang-btn-kn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage('kn'));
  });
});
