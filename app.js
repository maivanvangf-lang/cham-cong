const STORAGE_KEY = "daily-attendance-records";
const SETTINGS_KEY = "daily-attendance-settings";

const state = {
  records: readStorage(STORAGE_KEY, []),
  settings: readStorage(SETTINGS_KEY, { hourlyRate: 0, overtimeRate: 1.5 })
};

const elements = {
  form: document.querySelector("#attendance-form"),
  date: document.querySelector("#work-date"),
  regular: document.querySelector("#regular-hours"),
  overtime: document.querySelector("#overtime-input"),
  note: document.querySelector("#work-note"),
  message: document.querySelector("#form-message"),
  salaryForm: document.querySelector("#salary-form"),
  hourlyRate: document.querySelector("#hourly-rate"),
  overtimeRate: document.querySelector("#overtime-rate"),
  body: document.querySelector("#records-body"),
  empty: document.querySelector("#empty-state"),
  clearAll: document.querySelector("#clear-all"),
  days: document.querySelector("#total-days"),
  hours: document.querySelector("#total-hours"),
  overtimeHours: document.querySelector("#overtime-hours"),
  totalPay: document.querySelector("#total-pay"),
  regularPay: document.querySelector("#regular-pay"),
  overtimePay: document.querySelector("#overtime-pay")
};

const today = new Date();
elements.date.value = formatDateInput(today);
elements.hourlyRate.value = state.settings.hourlyRate || "";
elements.overtimeRate.value = state.settings.overtimeRate;

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: elements.date.value,
    regular: Number(elements.regular.value),
    overtime: Number(elements.overtime.value),
    note: elements.note.value.trim()
  };

  if (!record.date || record.regular < 0 || record.overtime < 0) return;
  const existingIndex = state.records.findIndex((item) => item.date === record.date);
  if (existingIndex >= 0) {
    state.records[existingIndex] = { ...state.records[existingIndex], ...record };
    showMessage("Đã cập nhật ngày công.");
  } else {
    state.records.push(record);
    showMessage("Đã lưu ngày công.");
  }
  saveAndRender();
  elements.note.value = "";
});

elements.salaryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    hourlyRate: Math.max(0, Number(elements.hourlyRate.value) || 0),
    overtimeRate: Math.max(0, Number(elements.overtimeRate.value) || 0)
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  renderSummary();
  showMessage("Đã cập nhật mức lương.");
});

elements.body.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;
  state.records = state.records.filter((record) => record.id !== button.dataset.deleteId);
  saveAndRender();
});

elements.clearAll.addEventListener("click", () => {
  if (!state.records.length || !window.confirm("Bạn có chắc muốn xóa toàn bộ ngày công không?")) return;
  state.records = [];
  saveAndRender();
});

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  renderRecords();
  renderSummary();
}

function renderRecords() {
  const records = [...state.records].sort((a, b) => b.date.localeCompare(a.date));
  elements.empty.hidden = records.length > 0;
  elements.body.innerHTML = records.map((record) => `
    <tr>
      <td>${escapeHtml(formatDate(record.date))}</td>
      <td>${formatHours(record.regular)} giờ</td>
      <td>${formatHours(record.overtime)} giờ</td>
      <td><span class="hours-pill">${formatHours(record.regular + record.overtime)} giờ</span></td>
      <td>${escapeHtml(record.note || "—")}</td>
      <td><button class="delete-button" type="button" data-delete-id="${record.id}" aria-label="Xóa ngày ${record.date}">×</button></td>
    </tr>
  `).join("");
}

function renderSummary() {
  const regularHours = state.records.reduce((sum, record) => sum + Number(record.regular), 0);
  const overtimeHours = state.records.reduce((sum, record) => sum + Number(record.overtime), 0);
  const regularPay = regularHours * state.settings.hourlyRate;
  const overtimePay = overtimeHours * state.settings.hourlyRate * state.settings.overtimeRate;
  elements.days.textContent = state.records.length;
  elements.hours.textContent = formatHours(regularHours + overtimeHours);
  elements.overtimeHours.textContent = formatHours(overtimeHours);
  elements.totalPay.textContent = formatMoney(regularPay + overtimePay);
  elements.regularPay.textContent = formatMoney(regularPay);
  elements.overtimePay.textContent = formatMoney(overtimePay);
}

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function formatDateInput(date) { return date.toISOString().slice(0, 10); }
function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
function formatHours(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}
function showMessage(message) {
  elements.message.textContent = message;
  window.setTimeout(() => { elements.message.textContent = ""; }, 2500);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

renderRecords();
renderSummary();
