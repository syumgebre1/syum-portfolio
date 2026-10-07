import { isSupabaseConfigured, supabase, TABLES } from "./supabase-client.js";

const definitions = {
  profile: {
    title: "Profile & contact",
    table: TABLES.profile,
    singleton: true,
    fields: [
      ["full_name", "Full name", "text", true],
      ["role", "Professional title", "text", true],
      ["location", "Location", "text", true],
      ["summary", "Short introduction", "textarea", true],
      ["about", "About section", "textarea", true],
      ["email", "Public email", "email", true],
      ["linkedin", "LinkedIn URL", "url", false],
      ["github", "GitHub URL", "url", false],
      ["phone", "Public phone (optional)", "tel", false],
      ["cgpa", "CGPA", "text", false],
      ["exit_score", "Exit exam score", "text", false],
      ["graduation_year", "Graduation year", "text", false],
      ["photo_path", "Profile photo", "file", false],
      ["cv_path", "CV file (PDF)", "file", false],
    ],
  },
  projects: {
    title: "Projects",
    table: TABLES.projects,
    fields: [
      ["title", "Project name", "text", true],
      ["description", "Description", "textarea", true],
      ["technologies", "Technologies (separate with commas)", "array", false],
      ["project_url", "Project link", "url", false],
      ["image_path", "Project image", "file", false],
      ["sort_order", "Display order (smaller numbers first)", "number", false],
    ],
  },
  certificates: {
    title: "Certificates",
    table: TABLES.certificates,
    fields: [
      ["title", "Certificate name", "text", true],
      ["issuer", "Issuing organization", "text", true],
      ["issued_on", "Date or year", "text", false],
      ["credential_url", "Credential link", "url", false],
      ["file_path", "Certificate file or image", "file", false],
      ["sort_order", "Display order (smaller numbers first)", "number", false],
    ],
  },
  experience: {
    title: "Experience",
    table: TABLES.experience,
    fields: [
      ["role", "Role", "text", true],
      ["company", "Company", "text", true],
      ["location", "Location", "text", false],
      ["start_date", "Start date", "text", false],
      ["end_date", "End date (or Present)", "text", false],
      ["description", "Description", "textarea", true],
      ["highlights", "Key contributions (separate with commas)", "array", false],
      ["sort_order", "Display order (smaller numbers first)", "number", false],
    ],
  },
  education: {
    title: "Education",
    table: TABLES.education,
    fields: [
      ["degree", "Degree or qualification", "text", true],
      ["institution", "School or institution", "text", true],
      ["graduation_date", "Graduation date", "text", false],
      ["details", "Additional details", "textarea", false],
      ["coursework", "Relevant coursework (separate with commas)", "array", false],
      ["cgpa", "CGPA", "text", false],
      ["exit_score", "Exit exam score", "text", false],
      ["sort_order", "Display order (smaller numbers first)", "number", false],
    ],
  },
  skills: {
    title: "Skills",
    table: TABLES.skills,
    fields: [
      ["category", "Skill group", "text", true],
      ["items", "Skills (separate with commas)", "array", true],
      ["sort_order", "Display order (smaller numbers first)", "number", false],
    ],
  },
  highlights: {
    title: "Achievements & languages",
    table: TABLES.highlights,
    fields: [
      ["category", "Type", "select", true, ["Achievement", "Language", "Award", "Other"]],
      ["title", "Name", "text", true],
      ["details", "Details", "textarea", false],
      ["url", "Related link", "url", false],
      ["file_path", "Image or document", "file", false],
      ["sort_order", "Display order (smaller numbers first)", "number", false],
    ],
  },
};

const elements = {
  setup: document.querySelector("#setup-message"),
  login: document.querySelector("#login-card"),
  dashboard: document.querySelector("#dashboard"),
  loginForm: document.querySelector("#login-form"),
  loginError: document.querySelector("#login-error"),
  signOut: document.querySelector("#sign-out"),
  nav: document.querySelector("#section-nav"),
  title: document.querySelector("#section-title"),
  kicker: document.querySelector("#section-kicker"),
  add: document.querySelector("#add-record"),
  message: document.querySelector("#panel-message"),
  list: document.querySelector("#record-list"),
  form: document.querySelector("#record-form"),
  formTitle: document.querySelector("#form-title"),
  formFields: document.querySelector("#form-fields"),
  formError: document.querySelector("#form-error"),
  cancel: document.querySelector("#cancel-form"),
  messageList: document.querySelector("#message-list"),
  settingsPanel: document.querySelector("#settings-panel"),
  settingsForm: document.querySelector("#settings-form"),
  settingsError: document.querySelector("#settings-error"),
};

let activeKey = "projects";
let activeRecord = null;

function setSignedIn(isSignedIn) {
  elements.login.hidden = isSignedIn;
  elements.dashboard.hidden = !isSignedIn;
  elements.signOut.hidden = !isSignedIn;
}

function showError(element, error) {
  element.textContent = error?.message || String(error);
}

function makeField(field, record = {}) {
  const [name, label, type, required, options] = field;
  const wrapper = document.createElement("div");
  wrapper.className = `field${type === "textarea" || type === "file" || type === "array" ? " full" : ""}`;
  const labelElement = document.createElement("label");
  labelElement.htmlFor = `field-${name}`;
  labelElement.textContent = label;
  let input;

  if (type === "textarea") {
    input = document.createElement("textarea");
    input.value = record[name] || "";
  } else if (type === "select") {
    input = document.createElement("select");
    for (const optionText of options) {
      const option = document.createElement("option");
      option.value = optionText;
      option.textContent = optionText;
      input.append(option);
    }
    input.value = record[name] || options[0];
  } else {
    input = document.createElement("input");
    input.type = type === "array" ? "text" : type;
    if (type === "file") input.accept = name === "photo_path" || name === "image_path" ? "image/*" : "image/*,.pdf";
    if (type === "number") input.step = "1";
    if (type === "array") input.value = Array.isArray(record[name]) ? record[name].join(", ") : "";
    else if (type !== "file") input.value = record[name] ?? "";
  }

  input.id = `field-${name}`;
  input.name = name;
  if (required) input.required = true;
  if (type === "file") {
    const note = document.createElement("small");
    const allowedFileTypes = name === "photo_path" || name === "image_path" ? "image" : "image or PDF";
    note.textContent = record[name] ? `Current file: ${record[name]}. Choose a file only to replace it.` : `Optional. Upload an ${allowedFileTypes}.`;
    wrapper.append(labelElement, input, note);
  } else {
    wrapper.append(labelElement, input);
  }
  return wrapper;
}

function createNav() {
  elements.nav.replaceChildren();
  for (const [key, definition] of Object.entries(definitions)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-button";
    button.dataset.section = key;
    button.setAttribute("aria-current", String(key === activeKey));
    button.textContent = definition.title;
    const count = document.createElement("span");
    count.className = "section-count";
    count.dataset.count = key;
    button.append(count);
    elements.nav.append(button);
  }
  const inboxButton = document.createElement("button");
  inboxButton.type = "button";
  inboxButton.className = "section-button";
  inboxButton.dataset.section = "messages";
  inboxButton.setAttribute("aria-current", String(activeKey === "messages"));
  inboxButton.textContent = "Messages";
  const unreadCount = document.createElement("span");
  unreadCount.className = "section-count";
  unreadCount.dataset.count = "messages";
  inboxButton.append(unreadCount);
  elements.nav.append(inboxButton);

  const settingsButton = document.createElement("button");
  settingsButton.type = "button";
  settingsButton.className = "section-button";
  settingsButton.dataset.section = "settings";
  settingsButton.setAttribute("aria-current", String(activeKey === "settings"));
  settingsButton.textContent = "Contact / Social";
  elements.nav.append(settingsButton);
}

function renderMessages(messages) {
  elements.messageList.replaceChildren();
  const count = document.querySelector('[data-count="messages"]');
  const unread = messages.filter((message) => !message.read_at).length;
  if (count) count.textContent = unread ? `${unread} new` : String(messages.length);
  if (!messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No messages yet. New contact form submissions will appear here.";
    elements.messageList.append(empty);
    return;
  }

  for (const message of messages) {
    const article = document.createElement("article");
    article.className = `inbox-message${message.read_at ? " is-read" : " is-unread"}`;
    const heading = document.createElement("div");
    heading.className = "inbox-message-heading";
    const sender = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = message.name;
    const email = document.createElement("a");
    email.href = `mailto:${message.email}`;
    email.textContent = message.email;
    sender.append(name, email);
    const date = document.createElement("time");
    date.dateTime = message.created_at;
    date.textContent = new Date(message.created_at).toLocaleString();
    heading.append(sender, date);
    const subject = document.createElement("h3");
    subject.textContent = message.subject || "No subject";
    const body = document.createElement("p");
    body.textContent = message.message;
    article.append(heading, subject, body);
    if (!message.read_at) {
      const markRead = document.createElement("button");
      markRead.type = "button";
      markRead.className = "inbox-mark-read";
      markRead.dataset.messageId = message.id;
      markRead.textContent = "Mark as read";
      article.append(markRead);
    }
    elements.messageList.append(article);
  }
}

async function loadMessages() {
  elements.message.textContent = "Loading messages…";
  elements.list.hidden = true;
  elements.messageList.hidden = false;
  elements.form.hidden = true;
  elements.add.hidden = true;
  elements.settingsPanel.hidden = true;
  const { data, error } = await supabase
    .from(TABLES.messages)
    .select("id, name, email, subject, message, created_at, read_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  renderMessages(data || []);
  elements.title.textContent = "Contact messages";
  elements.kicker.textContent = "INBOX / PRIVATE MESSAGES";
  elements.message.textContent = "Only signed-in admins can view these messages.";
}

async function loadSettings() {
  const { data, error } = await supabase
    .from(TABLES.settings)
    .select("whatsapp_number, telegram_username")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return {
    whatsapp_number: data?.whatsapp_number ?? "",
    telegram_username: data?.telegram_username ?? "",
  };
}

async function showSettingsPanel() {
  elements.message.textContent = "Loading contact details…";
  elements.list.hidden = true;
  elements.messageList.hidden = true;
  elements.form.hidden = true;
  elements.add.hidden = true;
  elements.settingsError.textContent = "";
  elements.settingsForm.reset();
  elements.settingsPanel.hidden = false;

  elements.title.textContent = "Contact / Social";
  elements.kicker.textContent = "MANAGE / SITE SETTINGS";
  elements.message.textContent = "These details appear on your public portfolio.";

  try {
    const current = await loadSettings();
    elements.settingsForm.elements.whatsapp_number.value = current.whatsapp_number;
    elements.settingsForm.elements.telegram_username.value = current.telegram_username;
  } catch (error) {
    showError(elements.settingsError, error);
  }
}

function previewText(record) {
  if (activeKey === "profile") return record.role || record.email || "Portfolio profile";
  if (activeKey === "projects") return (record.technologies || []).join(" · ");
  if (activeKey === "certificates") return [record.issuer, record.issued_on].filter(Boolean).join(" · ");
  if (activeKey === "experience") return [record.company, record.start_date, record.end_date].filter(Boolean).join(" · ");
  if (activeKey === "education") return [record.institution, record.graduation_date].filter(Boolean).join(" · ");
  if (activeKey === "skills") return (record.items || []).join(" · ");
  return [record.category, record.details].filter(Boolean).join(" · ");
}

function renderRecords(records) {
  elements.list.replaceChildren();
  const count = document.querySelector(`[data-count="${activeKey}"]`);
  if (count) count.textContent = String(records.length);

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = activeKey === "profile" ? "Your profile hasn’t been set up yet. Choose Edit profile to add it." : "Nothing here yet. Use Add new to create your first item.";
    elements.list.append(empty);
    return;
  }

  for (const record of records) {
    const row = document.createElement("article");
    row.className = "record-row";
    const copy = document.createElement("div");
    copy.className = "record-copy";
    const title = document.createElement("strong");
    title.textContent = record.title || record.full_name || record.role || record.degree || record.category || "Untitled";
    const description = document.createElement("small");
    description.textContent = previewText(record);
    copy.append(title, description);
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.dataset.id = record.id;
    edit.textContent = activeKey === "profile" ? "Edit profile" : "Edit";
    actions.append(edit);
    if (!definitions[activeKey].singleton) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.dataset.action = "delete";
      remove.dataset.id = record.id;
      remove.textContent = "Delete";
      actions.append(remove);
    }
    row.append(copy, actions);
    elements.list.append(row);
  }
}

async function loadRecords() {
  const definition = definitions[activeKey];
  elements.message.textContent = "Loading…";
  elements.messageList.hidden = true;
  elements.settingsPanel.hidden = true;
  elements.list.hidden = false;
  elements.list.replaceChildren();
  const query = definition.singleton
    ? await supabase.from(definition.table).select("*").maybeSingle()
    : await supabase.from(definition.table).select("*").order("sort_order", { ascending: true });
  if (query.error) throw query.error;
  const records = definition.singleton ? (query.data ? [query.data] : []) : query.data || [];
  renderRecords(records);
  elements.message.textContent = "";
  elements.title.textContent = definition.title;
  elements.kicker.textContent = `MANAGE / ${activeKey.toUpperCase()}`;
  elements.add.hidden = definition.singleton;
}

function openForm(record = null) {
  activeRecord = record;
  elements.form.reset();
  elements.formFields.replaceChildren();
  const definition = definitions[activeKey];
  for (const field of definition.fields) elements.formFields.append(makeField(field, record || {}));
  elements.formTitle.textContent = record ? (definition.singleton ? "Edit profile" : "Edit item") : "Add new item";
  elements.formError.textContent = "";
  elements.form.hidden = false;
  elements.form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeForm() {
  activeRecord = null;
  elements.form.hidden = true;
  elements.form.reset();
}

function formData() {
  const values = {};
  for (const field of definitions[activeKey].fields) {
    const [name, , type] = field;
    const input = elements.form.elements.namedItem(name);
    if (type === "file") {
      values[name] = activeRecord?.[name] || "";
      continue;
    }
    if (type === "array") {
      values[name] = input.value.split(",").map((value) => value.trim()).filter(Boolean);
    } else if (type === "number") {
      values[name] = Number(input.value) || 0;
    } else {
      values[name] = input.value.trim();
    }
  }
  return values;
}

function safeFileName(name) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100) || "upload";
}

async function uploadSelectedFiles(values) {
  for (const field of definitions[activeKey].fields) {
    const [name, , type] = field;
    if (type !== "file") continue;
    const input = elements.form.elements.namedItem(name);
    const file = input.files?.[0];
    if (!file) continue;
    if (file.size > 10 * 1024 * 1024) throw new Error("Each upload must be 10 MB or smaller.");
    const path = `${activeKey}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("portfolio-files").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    values[name] = path;
  }
}

async function saveRecord(event) {
  event.preventDefault();
  elements.formError.textContent = "";
  const definition = definitions[activeKey];
  const values = formData();
  try {
    await uploadSelectedFiles(values);
    let query;
    if (definition.singleton) {
      query = await supabase.from(definition.table).upsert({ ...values, id: true, updated_at: new Date().toISOString() }).select().single();
    } else if (activeRecord) {
      query = await supabase.from(definition.table).update(values).eq("id", activeRecord.id);
    } else {
      query = await supabase.from(definition.table).insert(values);
    }
    if (query?.error) throw query.error;
    closeForm();
    elements.message.textContent = "Saved. Your portfolio is updated.";
    await loadRecords();
    elements.message.textContent = "Saved. Your portfolio is updated.";
  } catch (error) {
    showError(elements.formError, error);
  }
}

async function saveSettings(event) {
  event.preventDefault();
  elements.settingsError.textContent = "";

  const form = elements.settingsForm;
  const wa = form.elements.whatsapp_number.value.replace(/\D/g, "");
  const tg = form.elements.telegram_username.value.replace(/^@+/, "").trim();

  if (wa && !/^\d{8,15}$/.test(wa)) {
    elements.settingsError.textContent = "WhatsApp number must be 8–15 digits, including the country code.";
    return;
  }
  if (tg && !/^[A-Za-z0-9_]{3,32}$/.test(tg)) {
    elements.settingsError.textContent = "Telegram username must be 3–32 characters (letters, numbers, underscore).";
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const { error } = await supabase
      .from(TABLES.settings)
      .upsert({ id: 1, whatsapp_number: wa, telegram_username: tg, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    form.elements.whatsapp_number.value = wa;
    form.elements.telegram_username.value = tg;
    elements.settingsError.textContent = "Saved. Your portfolio will show the new links on next load.";
  } catch (error) {
    showError(elements.settingsError, error);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function removeRecord(id) {
  const record = activeRecord;
  if (!window.confirm("Delete this item from your portfolio? This cannot be undone.")) return;
  const definition = definitions[activeKey];
  const { error } = await supabase.from(definition.table).delete().eq("id", id);
  if (error) throw error;
  if (record) {
    const paths = [record.image_path, record.file_path].filter(Boolean);
    if (paths.length) await supabase.storage.from("portfolio-files").remove(paths);
  }
  elements.message.textContent = "Deleted.";
  await loadRecords();
}

function setSection(key) {
  if (key !== "messages" && key !== "settings" && !definitions[key]) return;
  activeKey = key;
  activeRecord = null;
  elements.form.hidden = true;
  createNav();
  const load = key === "messages" ? loadMessages : key === "settings" ? showSettingsPanel : loadRecords;
  load().catch((error) => showError(elements.message, error));
}

async function startDashboard() {
  setSignedIn(true);
  createNav();
  try {
    await loadRecords();
  } catch (error) {
    showError(elements.message, error);
  }
}

if (!isSupabaseConfigured) {
  elements.setup.hidden = false;
} else {
  const { data, error } = await supabase.auth.getSession();
  if (error) showError(elements.loginError, error);
  setSignedIn(Boolean(data?.session));
  if (data?.session) await startDashboard();
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.loginError.textContent = "";
  const form = new FormData(elements.loginForm);
  const { error } = await supabase.auth.signInWithPassword({ email: form.get("email"), password: form.get("password") });
  if (error) showError(elements.loginError, error);
  else await startDashboard();
});

elements.signOut.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) elements.message.textContent = error.message;
  else setSignedIn(false);
});

elements.nav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (button) setSection(button.dataset.section);
});

elements.add.addEventListener("click", () => openForm());
elements.cancel.addEventListener("click", closeForm);
elements.form.addEventListener("submit", saveRecord);

if (elements.settingsForm) elements.settingsForm.addEventListener("submit", saveSettings);

elements.list.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const definition = definitions[activeKey];
  if (button.dataset.action === "edit") {
    try {
      const query = definition.singleton
        ? await supabase.from(definition.table).select("*").maybeSingle()
        : await supabase.from(definition.table).select("*").eq("id", button.dataset.id).single();
      if (query.error) throw query.error;
      openForm(query.data);
    } catch (error) {
      showError(elements.message, error);
    }
  } else if (button.dataset.action === "delete") {
    try {
      const query = await supabase.from(definition.table).select("*").eq("id", button.dataset.id).single();
      if (query.error) throw query.error;
      activeRecord = query.data;
      await removeRecord(button.dataset.id);
    } catch (error) {
      showError(elements.message, error);
    }
  }
});

elements.messageList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-message-id]");
  if (!button) return;
  button.disabled = true;
  const { error } = await supabase
    .from(TABLES.messages)
    .update({ read_at: new Date().toISOString() })
    .eq("id", button.dataset.messageId);
  if (error) {
    button.disabled = false;
    showError(elements.message, error);
    return;
  }
  await loadMessages().catch((loadError) => showError(elements.message, loadError));
});