// cv.js - Fetches data and renders the CV layout

import { isSupabaseConfigured, supabase, TABLES } from "./supabase-client.js";

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

async function selectAll(table) {
  const { data, error } = await supabase.from(table).select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

if (isSupabaseConfigured) {
  try {
    const [profileResult, projects, certificates, experience, education, skills] = await Promise.all([
      supabase.from(TABLES.profile).select("*").maybeSingle(),
      selectAll(TABLES.projects),
      selectAll(TABLES.certificates),
      selectAll(TABLES.experience),
      selectAll(TABLES.education),
      selectAll(TABLES.skills),
    ]);

    const profile = profileResult.data;
    if (profile) {
      document.querySelectorAll('[data-profile="name"]').forEach(el => el.textContent = profile.full_name);
      document.querySelectorAll('[data-profile="role"]').forEach(el => el.textContent = profile.role);
      document.querySelectorAll('[data-profile="email"]').forEach(el => el.textContent = profile.email);
      document.querySelectorAll('[data-profile="location"]').forEach(el => el.textContent = profile.location);
      document.querySelectorAll('[data-profile="summary"]').forEach(el => el.textContent = profile.summary);
      
      if (profile.phone) {
        document.querySelector('[data-profile="phone"]').textContent = profile.phone;
      } else {
        document.querySelector('[data-profile="phone"]').remove();
      }

      // Handle Links
      const li = document.querySelector('[data-profile="linkedin"]');
      if (li && profile.linkedin) { li.innerHTML = `<a href="${escapeHTML(profile.linkedin)}" target="_blank">LinkedIn</a>`; }
      else if (li) li.remove();

      const gh = document.querySelector('[data-profile="github"]');
      if (gh && profile.github) { gh.innerHTML = `<a href="${escapeHTML(profile.github)}" target="_blank">GitHub</a>`; }
      else if (gh) gh.remove();
    }

    // EXPERIENCE
    const expTarget = document.querySelector('[data-portfolio="experience"]');
    if (expTarget && experience.length) {
      expTarget.innerHTML = experience.map(item => `
        <div class="cv-item">
          <div class="dates">${escapeHTML(item.start_date)} — ${escapeHTML(item.end_date)}</div>
          <h3>${escapeHTML(item.role)} <span class="company">at ${escapeHTML(item.company)}</span></h3>
          <p>${escapeHTML(item.description)}</p>
          ${item.highlights?.length ? `<ul class="bullets">${item.highlights.map(h => `<li>${escapeHTML(h)}</li>`).join('')}</ul>` : ''}
        </div>
      `).join("");
    }

    // PROJECTS
    const projTarget = document.querySelector('[data-portfolio="projects"]');
    if (projTarget && projects.length) {
      projTarget.innerHTML = projects.map(item => `
        <div class="cv-item">
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>
          ${item.technologies?.length ? `<div class="tag-list">${item.technologies.map(t => `<span>${escapeHTML(t)}</span>`).join('')}</div>` : ''}
        </div>
      `).join("");
    }

    // EDUCATION (No CGPA/Exit Score)
    const eduTarget = document.querySelector('[data-portfolio="education"]');
    if (eduTarget && education.length) {
      eduTarget.innerHTML = education.map(item => `
        <div class="cv-item">
          <div class="dates">${escapeHTML(item.graduation_date)}</div>
          <h3>${escapeHTML(item.degree)}</h3>
          <p>${escapeHTML(item.institution)}</p>
        </div>
      `).join("");
    }

    // SKILLS
    const skillTarget = document.querySelector('[data-portfolio="skills"]');
    if (skillTarget && skills.length) {
      skillTarget.innerHTML = skills.map(skill => `
        <div class="skill-group">
          <strong>${escapeHTML(skill.category)}:</strong>
          <span>${(skill.items || []).map(escapeHTML).join(", ")}</span>
        </div>
      `).join("");
    }

    // CERTIFICATES
    const certTarget = document.querySelector('[data-portfolio="certificates"]');
    if (certTarget && certificates.length) {
      certTarget.innerHTML = `<ul class="bullets">${certificates.map(item => `
        <li><strong>${escapeHTML(item.title)}</strong> — ${escapeHTML(item.issuer)} (${escapeHTML(item.issued_on)})</li>
      `).join('')}</ul>`;
    }

  } catch (err) {
    console.error("Failed to load CV data:", err);
  }
}