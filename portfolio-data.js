import { isSupabaseConfigured, publicFileUrl, supabase, TABLES } from "./supabase-client.js";

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

function safeURL(value) {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function selectAll(table) {
  const { data, error } = await supabase.from(table).select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

function updateProfile(profile) {
  if (!profile) return;
  const setText = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };
  setText('[data-profile="role-location"]', [profile.role, profile.location].filter(Boolean).join(" · ").toUpperCase());
  document.querySelectorAll('[data-profile="summary"]').forEach((element) => {
    if (profile.summary) element.textContent = profile.summary;
  });
  const about = document.querySelector('[data-profile="about"]');
  if (about && profile.about) {
    about.replaceChildren(...profile.about.split(/\n\s*\n/).map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }));
  }
  setText('[data-profile="location"]', profile.location);
  setText('[data-profile="name"]', profile.full_name);
  setText('[data-profile="cgpa"]', profile.cgpa);
  setText('[data-profile="exit_score"]', profile.exit_score);
  if (profile.full_name) document.title = `${profile.full_name} — Portfolio`;

  const email = document.querySelector('[data-profile="email-link"]');
  if (email && profile.email) {
    email.href = `mailto:${profile.email}`;
    email.firstChild.textContent = profile.email + " ";
  }
  const phone = document.querySelector('[data-profile="phone-link"]');
  if (phone && profile.phone) {
    phone.href = `tel:${profile.phone.replace(/[^+\d]/g, "")}`;
    phone.textContent = profile.phone;
    phone.hidden = false;
  }
  for (const [attribute, value] of [["linkedin-link", profile.linkedin], ["linkedin-about", profile.linkedin], ["github-link", profile.github]]) {
    const link = document.querySelector(`[data-profile="${attribute}"]`);
    if (link && value) link.href = safeURL(value) || "#contact";
  }
  if (profile.photo_path) {
    const imageURL = publicFileUrl(profile.photo_path);
    document.querySelectorAll(".photo-wordmark img, .hero-monogram img").forEach((image) => {
      const fallback = image.nextElementSibling;
      image.hidden = false;
      if (fallback) fallback.style.visibility = "visible";
      image.onload = () => { if (fallback) fallback.style.visibility = "hidden"; };
      image.onerror = () => {
        image.hidden = true;
        if (fallback) fallback.style.visibility = "visible";
      };
      image.src = imageURL;
    });
  }
}

function renderProjects(records) {
  const target = document.querySelector('[data-portfolio="projects"]');
  if (!target || !records.length) return;
  target.innerHTML = records.map((project, index) => {
    const imageURL = publicFileUrl(project.image_path);
    const projectURL = safeURL(project.project_url);
    const title = escapeHTML(project.title);
    const titleContent = projectURL
      ? `<a href="${escapeHTML(projectURL)}" target="_blank" rel="noreferrer">${title} <span class="project-arrow" aria-hidden="true">↗</span></a>`
      : `${title}<span class="project-arrow" aria-hidden="true">↗</span>`;
    const image = imageURL
      ? `<img class="project-upload" src="${escapeHTML(imageURL)}" alt="" loading="lazy" />`
      : `<div class="project-placeholder" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>`;
    const tags = (project.technologies || []).map((tag) => `<li>${escapeHTML(tag)}</li>`).join("");
    return `<article class="project-card"><div class="project-visual uploaded-visual">${image}<span class="visual-label">${String(index + 1).padStart(2, "0")} — PROJECT</span></div><div class="project-info"><div class="project-title-row"><h3>${titleContent}</h3></div><p>${escapeHTML(project.description)}</p><ul class="tag-list" aria-label="Technologies">${tags}</ul></div></article>`;
  }).join("");
}

function renderExperience(records) {
  const target = document.querySelector('[data-portfolio="experience"]');
  if (!target || !records.length) return;
  target.innerHTML = records.map((item) => {
    const period = [item.start_date, item.end_date].filter(Boolean).map(escapeHTML).join(" — ");
    const points = (item.highlights || []).map((point) => `<li>${escapeHTML(point)}</li>`).join("");
    return `<div class="experience-date"><span>${period || "EXPERIENCE"}</span></div><div class="experience-main"><p class="eyebrow">${escapeHTML(item.location)}</p><h3>${escapeHTML(item.role)} <span>at ${escapeHTML(item.company)}</span></h3><p>${escapeHTML(item.description)}</p>${points ? `<ul class="experience-points">${points}</ul>` : ""}</div><div class="experience-mark" aria-hidden="true">${escapeHTML((item.company || "").slice(0, 2).toUpperCase())}<span>↗</span></div>`;
  }).join("");
  target.classList.toggle("multiple-experiences", records.length > 1);
}

function renderSkills(records) {
  const target = document.querySelector('[data-portfolio="skills"]');
  if (!target || !records.length) return;
  target.innerHTML = records.map((skill) => `<div class="skill-row"><h3>${escapeHTML(skill.category)}</h3><p>${(skill.items || []).map(escapeHTML).join(", ")}</p></div>`).join("");
}

function renderEducation(education, certificates) {
  const target = document.querySelector('[data-portfolio="education"]');
  if (!target || (!education.length && !certificates.length)) return;
  const educationHTML = education.map((item) => `<article class="education-record"><p class="eyebrow">${escapeHTML(item.degree)}</p><h3>${escapeHTML(item.institution)}</h3><p class="education-school">${escapeHTML(item.graduation_date)}</p>${item.cgpa || item.exit_score ? `<div class="education-stats">${item.cgpa ? `<div><strong>${escapeHTML(item.cgpa)}</strong><small>CGPA</small></div>` : ""}${item.exit_score ? `<div><strong>${escapeHTML(item.exit_score)}</strong><small>Exit examination</small></div>` : ""}</div>` : ""}${item.details ? `<p class="education-details">${escapeHTML(item.details)}</p>` : ""}${item.coursework?.length ? `<div class="coursework"><h4>Relevant coursework</h4><p>${item.coursework.map(escapeHTML).join(" · ")}</p></div>` : ""}</article>`).join("");
  const certificateHTML = certificates.length ? `<div class="certifications"><h4>Certifications</h4><ul>${certificates.map((item) => {
    const credential = safeURL(item.credential_url) || (item.file_path ? publicFileUrl(item.file_path) : "");
    const title = escapeHTML(item.title);
    return `<li>${credential ? `<a href="${escapeHTML(credential)}" target="_blank" rel="noreferrer">${title} ↗</a>` : title}<span>${[item.issuer, item.issued_on].filter(Boolean).map(escapeHTML).join(" · ")}</span></li>`;
  }).join("")}</ul></div>` : "";
  target.innerHTML = `${educationHTML}${certificateHTML}`;
}

function renderHighlights(records) {
  const section = document.querySelector('[data-portfolio="highlights"]');
  const grid = section?.querySelector(".highlights-grid");
  if (!section || !grid || !records.length) return;
  grid.innerHTML = records.map((item) => {
    const link = safeURL(item.url) || (item.file_path ? publicFileUrl(item.file_path) : "");
    return `<article class="highlight-card"><p class="eyebrow">${escapeHTML(item.category)}</p><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.details)}</p>${link ? `<a href="${escapeHTML(link)}" target="_blank" rel="noreferrer">View details ↗</a>` : ""}</article>`;
  }).join("");
  section.hidden = false;
}

if (isSupabaseConfigured) {
  try {
    const [profileResult, projects, certificates, experience, education, skills, highlights] = await Promise.all([
      supabase.from(TABLES.profile).select("*").maybeSingle(),
      selectAll(TABLES.projects),
      selectAll(TABLES.certificates),
      selectAll(TABLES.experience),
      selectAll(TABLES.education),
      selectAll(TABLES.skills),
      selectAll(TABLES.highlights),
    ]);
    if (profileResult.error) throw profileResult.error;
    updateProfile(profileResult.data);
    renderProjects(projects);
    renderExperience(experience);
    renderSkills(skills);
    renderEducation(education, certificates);
    renderHighlights(highlights);
  } catch (error) {
    console.error("Could not load the live portfolio content:", error.message);
  }
}
