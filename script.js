const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('#theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

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
    try {
      localStorage.setItem('syum-portfolio-theme', selectedTheme);
    } catch {
      // The selected theme still applies for this page if browser storage is unavailable.
    }
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });
  applyTheme(document.documentElement.dataset.theme);
}

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

// ---------------------------------------------------------------------------
// Contact settings (WhatsApp + Telegram) and CV download link.
// These read from Supabase and silently update the page — no placeholders.
// ---------------------------------------------------------------------------
(async function loadDynamicContactInfo() {
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

  // ----- WhatsApp + Telegram from site_settings -----
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
  } catch {
    // Ignore — buttons stay hidden if the settings row can't be read
  }

  // ----- CV download links from portfolio_profile.cv_path -----
  try {
    const { data } = await supabase
      .from(TABLES.profile)
      .select("cv_path, full_name")
      .maybeSingle();

    if (data?.cv_path) {
      const href = publicFileUrl(data.cv_path);
      const niceName =
        (data.full_name || "Syum-Teame-Gebreyesus")
          .trim()
          .replace(/\s+/g, "-") + "-CV.pdf";

      ["cv-download-hero", "cv-download-about"].forEach((id) => {
        const link = document.getElementById(id);
        if (!link) return;
        link.href = href;
        link.setAttribute("download", niceName);
      });
    }
  } catch {
    // Ignore — keep the bundled assets/… CV fallback
  }
})();