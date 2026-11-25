// script.js

// ---------------------------------------------------------------------------
// UI TOGGLES (Theme, Mobile Menu, Image Fallbacks)
// ---------------------------------------------------------------------------

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('#theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

// Theme toggle logic (localStorage + prefers-color-scheme)
function applyTheme(theme, persist = false) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = selectedTheme;

  if (themeToggle) {
    const nextTheme = selectedTheme === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    themeToggle.setAttribute('aria-pressed', String(selectedTheme === 'light'));
    themeToggle.title = `Switch to ${nextTheme} theme`;
  }

  if (themeColorMeta) {
    themeColorMeta.content = selectedTheme === 'light' ? '#f7f8f4' : '#0b1020';
  }

  if (persist) {
    try { localStorage.setItem('syum-portfolio-theme', selectedTheme); } catch {}
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });
  applyTheme(document.documentElement.dataset.theme);
}

// Mobile menu toggle logic
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

// Footer year
const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

// Consolidated Image Fallback logic
// If an uploaded image fails to load (broken link, deleted file), show the text fallback (e.g., STG or S.)
function attachImageFallback(selector) {
  document.querySelectorAll(selector).forEach((image) => {
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
}

attachImageFallback('.photo-wordmark img');
attachImageFallback('.hero-monogram img');

// ---------------------------------------------------------------------------
// DYNAMIC DATA (Contact info, Availability, CV Links)
// ---------------------------------------------------------------------------
(async function loadDynamicData() {
  let supabase, TABLES, publicFileUrl;
  try {
    const clientModule = await import("./supabase-client.js");
    supabase = clientModule.supabase;
    TABLES = clientModule.TABLES;
    publicFileUrl = clientModule.publicFileUrl;
  } catch {
    return; // supabase-client.js unavailable — keep defaults
  }
  if (!supabase) return; // Supabase not configured

  // ----- 1. WhatsApp + Telegram from site_settings -----
  try {
    const { data } = await supabase
      .from(TABLES.settings)
      .select("whatsapp_number, telegram_username")
      .eq("id", 1)
      .maybeSingle();

    if (data?.whatsapp_number) {
      const wa = document.getElementById("contact-whatsapp");
      if (wa) {
        wa.href = `https://wa.me/${data.whatsapp_number}`;
        wa.hidden = false;
      }
    }

    if (data?.telegram_username) {
      const tg = document.getElementById("contact-telegram");
      if (tg) {
        tg.href = `https://t.me/${data.telegram_username}`;
        tg.hidden = false;
      }
    }
  } catch (err) {
    console.warn("Could not load contact settings:", err);
  }

  // ----- 2. CV download links & Availability from portfolio_profile -----
  try {
    const { data } = await supabase
      .from(TABLES.profile)
      .select("cv_path, full_name, availability_status, available_from, now_learning")
      .maybeSingle();

    // Handle CV Download Links
    if (data?.cv_path) {
      const href = publicFileUrl(data.cv_path);
      const niceName = (data.full_name || "Syum-Teame-Gebreyesus").trim().replace(/\s+/g, "-") + "-CV.pdf";
      
      ["cv-download-hero", "cv-download-about"].forEach((id) => {
        const link = document.getElementById(id);
        if (link) {
          link.href = href;
          link.setAttribute("download", niceName);
        }
      });
    }

    // Handle Availability Badge
    const badge = document.getElementById("availability-badge");
    if (badge && data?.availability_status) {
      if (data.availability_status === "open") {
        badge.textContent = data.available_from ? `Available from ${data.available_from}` : "Open to opportunities";
        badge.classList.add("is-open");
        badge.hidden = false;
      } else if (data.availability_status === "freelance") {
        badge.textContent = "Available for freelance";
        badge.classList.add("is-freelance");
        badge.hidden = false;
      } else if (data.availability_status === "closed") {
        badge.textContent = "Not currently looking";
        badge.classList.add("is-closed");
        badge.hidden = false;
      }
    }

    // Handle "Currently Learning" Block
    const learningBlock = document.getElementById("now-learning-block");
    if (learningBlock && data?.now_learning) {
      learningBlock.hidden = false; // Just unhide, the text is injected by portfolio-data.js
    }

  } catch (err) {
    console.warn("Could not load profile settings:", err);
  }
})();