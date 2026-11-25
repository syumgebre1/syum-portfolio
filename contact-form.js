// contact-form.js
// ---------------------------------------------------------------------------
// Handles the public contact form submission.
// 
// SECURITY: This script only INSERTS data into the `contact_messages` table.
// It uses the public anon key, which means anyone can submit a form, but
// Row Level Security (RLS) in Supabase blocks them from reading, updating, 
// or deleting those messages.
// ---------------------------------------------------------------------------

import { isSupabaseConfigured, supabase, TABLES } from "./supabase-client.js";

const form = document.querySelector("#contact-form");
const status = document.querySelector("#contact-form-status");
const submitButton = form?.querySelector('button[type="submit"]');

// Basic email regex to catch typos before hitting the server
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Prevents double-submissions if the user clicks the button rapidly
let isSubmitting = false;

if (form && status && submitButton) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    // Reset UI status
    status.className = "contact-form-status";
    status.textContent = "";

    // Extract form data
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();
    const emailInput = form.elements.namedItem("email");

    // 1. Client-side Validation
    emailInput.setCustomValidity(email && !emailPattern.test(email) ? "Enter a valid email address, for example name@example.com." : "");
    if (!form.reportValidity()) return; // Stops if HTML5 validation fails (empty fields)

    if (!name || !message) {
      status.textContent = "Please enter your name and message.";
      status.classList.add("is-error");
      return;
    }

    // 2. Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      status.textContent = "The contact form isn’t connected yet. Please use the email link below instead.";
      status.classList.add("is-error");
      return;
    }

    // 3. Submit to Supabase
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.dataset.originalLabel = submitButton.textContent;
    submitButton.textContent = "Sending…";
    status.textContent = "Sending your message…";

    try {
      const { error } = await supabase.from(TABLES.messages).insert({ name, email, subject, message });
      if (error) throw error;

      // Success!
      form.reset();
      status.textContent = "Thanks—your message has been sent successfully. I’ll be in touch soon.";
      status.classList.add("is-success");
      
    } catch (error) {
      console.error("Contact form submission failed:", error);
      
      // Developer-friendly error if the SQL script hasn't been run yet
      const schemaMissing = error?.code === "42P01" || error?.code === "PGRST205";
      status.textContent = schemaMissing
        ? "Supabase cannot see the message inbox yet. Run the contact_messages SQL block from supabase-setup.sql in the SQL Editor."
        : "Sorry, your message couldn’t be sent. Please try again shortly or use the email link below.";
      status.classList.add("is-error");
      
    } finally {
      // Reset button state regardless of success or failure
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = "Send message ↗";
    }
  });
}