import { isSupabaseConfigured, supabase } from "./supabase-client.js";

const panel = document.querySelector("#password-reset-panel");
const form = document.querySelector("#password-reset-form");
const fields = document.querySelector("#password-reset-fields");
const passwordInput = document.querySelector("#password-reset-new");
const confirmInput = document.querySelector("#password-reset-confirm");
const submitButton = document.querySelector("#password-reset-submit");
const status = document.querySelector("#password-reset-status");
const adminLink = document.querySelector(".password-reset-admin-link");

if (panel && form && fields && passwordInput && confirmInput && submitButton && status && adminLink) {
  const recoveryParams = new URLSearchParams(window.location.search);
  for (const [key, value] of new URLSearchParams(window.location.hash.slice(1))) {
    recoveryParams.set(key, value);
  }

  const showRecoveryForm = () => {
    panel.hidden = false;
    fields.hidden = false;
    submitButton.hidden = false;
    status.textContent = "";
    passwordInput.focus();
  };

  const showRecoveryError = (message) => {
    panel.hidden = false;
    fields.hidden = true;
    submitButton.hidden = true;
    status.textContent = message;
  };

  if (!isSupabaseConfigured || !supabase) {
    if (recoveryParams.get("type") === "recovery" || recoveryParams.has("error_description")) {
      showRecoveryError("Password reset is unavailable because the account service is not configured.");
    }
  } else {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") showRecoveryForm();
    });

    if (recoveryParams.get("type") === "recovery") {
      showRecoveryForm();
    } else if (recoveryParams.has("error_description")) {
      showRecoveryError("This recovery link is invalid or expired. Ask the administrator to send a new recovery email.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.classList.remove("is-success");

      if (passwordInput.value !== confirmInput.value) {
        status.textContent = "The passwords do not match.";
        confirmInput.focus();
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        showRecoveryError("Password reset is unavailable because the account service is not configured.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Updating password…";
      status.textContent = "";

      try {
        const { error } = await supabase.auth.updateUser({ password: passwordInput.value });
        if (error) throw error;

        fields.hidden = true;
        submitButton.hidden = true;
        status.classList.add("is-success");
        status.textContent = "Your password was updated. You can now sign in to the admin.";
        window.history.replaceState(null, document.title, window.location.pathname);
      } catch (error) {
        status.textContent = error?.message || "Could not update the password. Request a new recovery email and try again.";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Update password";
      }
    });
  }
}
