import { services } from "../data/services";
import {
  getInitialState,
  getService,
  getServiceCatalog,
  getTomorrowDateString,
  STEP_LABELS,
  updateEstimate,
  validateStep,
  formatEstimate,
  type WizardState,
} from "../lib/booking-wizard";

const catalog = getServiceCatalog();
const params = new URLSearchParams(window.location.search);
const initialService = params.get("service") ?? undefined;
const skippedServicePicker = Boolean(
  initialService && catalog.some((s) => s.slug === initialService),
);
let showServiceChip = skippedServicePicker;

let state = getInitialState(initialService);

const shell = document.getElementById("booking-wizard")!;
const bookPage = document.getElementById("main")!;
const stepContainer = document.getElementById("wizard-step")!;
const progressFill = document.getElementById("wizard-progress-fill")!;
const progressTrack = progressFill.parentElement as HTMLElement;
const progressLabel = document.getElementById("wizard-progress-label")!;
const estimateHost = document.getElementById("wizard-estimate")!;
const backBtn = document.getElementById("wizard-back") as HTMLButtonElement;
const nextBtn = document.getElementById("wizard-next") as HTMLButtonElement;
const errorBanner = document.getElementById("wizard-error")!;

function setHasEstimate(hasEstimate: boolean) {
  shell.classList.toggle("book-shell--has-estimate", hasEstimate);
  bookPage.classList.toggle("book-page--has-estimate", hasEstimate);
}

const TOTAL_STEPS = STEP_LABELS.length;
let hasMounted = false;

function scrollStepIntoView() {
  const target =
    document.querySelector<HTMLElement>(".book-shell__body") ?? shell;
  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    block: "start",
    behavior: prefersReduced ? "auto" : "smooth",
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function priceUnitLabel(unit: string): string {
  if (unit === "week") return "week";
  if (unit === "visit") return "visit";
  return "project";
}

function formatTimeWindow(window: string): string {
  switch (window) {
    case "morning":
      return "Morning (8am – 12pm)";
    case "afternoon":
      return "Afternoon (12pm – 5pm)";
    default:
      return "Flexible";
  }
}

function formatReviewDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function renderProgress() {
  const currentLabel = STEP_LABELS[state.step - 1];
  progressLabel.textContent = `Step ${state.step} of ${TOTAL_STEPS} — ${currentLabel}`;

  const fillRatio = state.step / TOTAL_STEPS;
  progressFill.style.transform = `scaleX(${fillRatio})`;
  progressTrack.setAttribute("aria-valuenow", String(state.step));
  progressTrack.setAttribute(
    "aria-valuetext",
    `Step ${state.step} of ${TOTAL_STEPS}: ${currentLabel}`,
  );

  renderEstimate();
}

function renderPriceBreakdown(): string {
  state = updateEstimate(state);
  const estimate = state.estimate;
  if (!estimate) return "";

  return `
    <details class="wizard-breakdown">
      <summary>See price breakdown</summary>
      <table class="wizard-breakdown__table">
        <tbody>
          ${estimate.lineItems
            .map(
              (item) =>
                `<tr><td>${item.label}</td><td class="mono">$${item.amount}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </details>`;
}

function updateStep2Breakdown() {
  const host = document.getElementById("wizard-breakdown-host");
  if (!host) return;
  host.innerHTML = renderPriceBreakdown();
}

function renderEstimate() {
  if (state.step < 2) {
    estimateHost.hidden = true;
    estimateHost.innerHTML = "";
    setHasEstimate(false);
    return;
  }

  state = updateEstimate(state);
  const estimate = state.estimate;
  if (!estimate) {
    estimateHost.hidden = true;
    estimateHost.innerHTML = "";
    setHasEstimate(false);
    return;
  }

  estimateHost.hidden = false;
  setHasEstimate(true);
  estimateHost.innerHTML = `
    <div class="wizard-estimate__main">
      <p class="wizard-estimate__label">Your estimate</p>
      <p class="wizard-estimate__price mono">${formatEstimate(state)}</p>
      <p class="wizard-estimate__service">${escapeHtml(estimate.serviceTitle)}</p>
    </div>`;
}

function fieldHint(fieldId: string): string {
  const hints: Record<string, string> = {
    sqft: "Include basement or garage if you want them cleaned.",
    bathrooms: "Include half-baths.",
    restrooms: "Staff and customer restrooms combined.",
  };
  return hints[fieldId] ?? "";
}

function renderStepperField(
  field: (typeof services)[0]["pricingFields"][0],
  value: string | number,
) {
  const numValue = Number(value);
  const min = field.min ?? 0;
  const max = field.max ?? 99;
  const hint = fieldHint(field.id);
  const hintHtml = hint ? `<p class="field-hint">${hint}</p>` : "";

  return `
    <div class="field field--stepper">
      <label for="field-${field.id}">${field.label}</label>
      <div class="wizard-stepper">
        <button
          type="button"
          class="wizard-stepper__btn"
          data-stepper-dec
          data-field="${field.id}"
          aria-label="Remove ${field.label.toLowerCase()}"
          ${numValue <= min ? "disabled" : ""}
        >−</button>
        <span class="wizard-stepper__value mono" data-stepper-value="${field.id}" aria-live="polite">${numValue}</span>
        <button
          type="button"
          class="wizard-stepper__btn"
          data-stepper-inc
          data-field="${field.id}"
          aria-label="Add ${field.label.toLowerCase()}"
          ${numValue >= max ? "disabled" : ""}
        >+</button>
        <input
          id="field-${field.id}"
          name="${field.id}"
          type="number"
          class="sr-only"
          data-pricing-field
          value="${numValue}"
          min="${min}"
          max="${max}"
          step="${field.step ?? 1}"
          tabindex="-1"
          aria-hidden="true"
          readonly
        />
      </div>
      ${hintHtml}
      <p class="field-error" id="error-${field.id}" hidden></p>
    </div>`;
}

function renderField(
  field: (typeof services)[0]["pricingFields"][0],
  value: string | number,
) {
  if (field.type === "number") {
    return renderStepperField(field, value);
  }

  const hint = fieldHint(field.id);
  const hintHtml = hint ? `<p class="field-hint">${hint}</p>` : "";

  if (field.type === "select" && field.options) {
    return `
      <div class="field">
        <label for="field-${field.id}">${field.label}</label>
        <select id="field-${field.id}" name="${field.id}" data-pricing-field>
          ${field.options
            .map(
              (opt) =>
                `<option value="${opt.value}" ${String(value) === opt.value ? "selected" : ""}>${opt.label}</option>`,
            )
            .join("")}
        </select>
        ${hintHtml}
        <p class="field-error" id="error-${field.id}" hidden></p>
      </div>`;
  }

  return "";
}

function renderStep1() {
  const selected = getService(state.serviceSlug)!;
  return `
    <h2 class="wizard-step__title">What do you need cleaned?</h2>
    <div class="wizard-services">
      ${catalog
        .map(
          (service) => `
        <label class="wizard-service ${state.serviceSlug === service.slug ? "is-selected" : ""}">
          <input type="radio" name="serviceSlug" value="${service.slug}" ${state.serviceSlug === service.slug ? "checked" : ""} />
          <span class="wizard-service__indicator" aria-hidden="true"></span>
          <span class="wizard-service__copy">
            <span class="wizard-service__title">${service.title}</span>
            <span class="wizard-service__price mono">From $${service.startingPrice}/${priceUnitLabel(service.priceUnit)}</span>
          </span>
        </label>`,
        )
        .join("")}
    </div>
    ${
      state.serviceSlug
        ? `<p class="wizard-service-oneline">${selected.description.split(".")[0]}.</p>`
        : ""
    }
    <p class="field-error" id="error-serviceSlug" hidden></p>`;
}

function renderStep2() {
  const service = getService(state.serviceSlug)!;
  const chipHtml =
    showServiceChip && state.step === 2
      ? `<button type="button" class="wizard-service-chip" data-change-service>${service.title} · Change</button>`
      : "";

  return `
    ${chipHtml}
    <h2 class="wizard-step__title">About your home</h2>
    <div class="wizard-fields">${service.pricingFields.map((field) => renderField(field, state.pricingDetails[field.id] ?? field.defaultValue)).join("")}</div>
    <div id="wizard-breakdown-host" class="wizard-breakdown-host">${renderPriceBreakdown()}</div>`;
}

function renderStep3() {
  return `
    <h2 class="wizard-step__title">When &amp; how to reach you</h2>
    <div class="wizard-section">
      <h3 class="wizard-section__title">When should we come?</h3>
      <div class="wizard-fields">
        <div class="field">
          <label for="preferredDate">First visit date</label>
          <input id="preferredDate" name="preferredDate" type="date" min="${getTomorrowDateString()}" value="${state.preferredDate}" />
          <p class="field-error" id="error-preferredDate" hidden></p>
        </div>
        <fieldset class="wizard-fieldset">
          <legend>Time of day</legend>
          <div class="wizard-segments">
            ${[
              ["morning", "Morning", "8am – 12pm"],
              ["afternoon", "Afternoon", "12pm – 5pm"],
              ["flexible", "Flexible", "We confirm"],
            ]
              .map(
                ([value, title, sub]) => `
              <label class="wizard-segment">
                <input type="radio" name="timeWindow" value="${value}" ${state.timeWindow === value ? "checked" : ""} />
                <span>${title}<span class="wizard-segment__sub">${sub}</span></span>
              </label>`,
              )
              .join("")}
          </div>
          <p class="field-error" id="error-timeWindow" hidden></p>
        </fieldset>
      </div>
    </div>
    <div class="wizard-section">
      <h3 class="wizard-section__title">Your info</h3>
      <div class="wizard-fields">
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" name="name" type="text" autocomplete="name" value="${escapeHtml(state.name)}" required />
          <p class="field-error" id="error-name" hidden></p>
        </div>
        <div class="field">
          <label for="phone">Phone</label>
          <input id="phone" name="phone" type="tel" autocomplete="tel" class="mono-field" placeholder="(407) 555-0123" value="${escapeHtml(state.phone)}" required />
          <p class="field-error" id="error-phone" hidden></p>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" placeholder="you@email.com" value="${escapeHtml(state.email)}" required />
          <p class="field-error" id="error-email" hidden></p>
        </div>
        <div class="field">
          <label for="streetAddress">Street address</label>
          <input id="streetAddress" name="streetAddress" type="text" autocomplete="street-address" value="${escapeHtml(state.streetAddress)}" required />
          <p class="field-error" id="error-streetAddress" hidden></p>
        </div>
        <div class="field">
          <label for="city">City</label>
          <input id="city" name="city" type="text" autocomplete="address-level2" value="${escapeHtml(state.city)}" required />
          <p class="field-error" id="error-city" hidden></p>
        </div>
        <details class="wizard-notes">
          <summary>Anything else we should know? (optional)</summary>
          <div class="field">
            <label for="notes" class="sr-only">Notes</label>
            <textarea id="notes" name="notes" rows="2">${escapeHtml(state.notes)}</textarea>
          </div>
        </details>
      </div>
    </div>`;
}

function renderStep4() {
  state = updateEstimate(state);
  const service = getService(state.serviceSlug)!;
  return `
    <h2 class="wizard-step__title">Looks good?</h2>
    <div class="wizard-review">
      <div class="wizard-review__header">
        <p class="wizard-review__price mono">${formatEstimate(state)}</p>
        <p class="wizard-review__service">${service.title}</p>
      </div>
      <ul class="wizard-review__list">
        <li><span>Date</span><span class="mono">${formatReviewDate(state.preferredDate)}</span></li>
        <li><span>Time</span><span>${formatTimeWindow(state.timeWindow)}</span></li>
        <li><span>Name</span><span>${escapeHtml(state.name)}</span></li>
        <li><span>Phone</span><span class="mono">${escapeHtml(state.phone)}</span></li>
        <li><span>Email</span><span>${escapeHtml(state.email)}</span></li>
        <li><span>Address</span><span>${escapeHtml(state.streetAddress)}, ${escapeHtml(state.city)}</span></li>
        ${state.notes ? `<li><span>Notes</span><span>${escapeHtml(state.notes)}</span></li>` : ""}
      </ul>
    </div>`;
}

function clearInlineErrors() {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
    (el as HTMLElement).hidden = true;
  });
  document.querySelectorAll("[aria-invalid]").forEach((el) => {
    el.removeAttribute("aria-invalid");
  });
}

function showInlineErrors(errors: Record<string, string>) {
  clearInlineErrors();
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return;

  errorBanner.hidden = false;
  errorBanner.textContent = errors[firstKey];

  for (const [key, message] of Object.entries(errors)) {
    const errorEl = document.getElementById(`error-${key}`);
    const fieldEl =
      document.getElementById(key) ??
      document.getElementById(`field-${key}`) ??
      document.querySelector(`[name="${key}"]`);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    if (fieldEl instanceof HTMLElement) {
      fieldEl.setAttribute("aria-invalid", "true");
      if (key === firstKey && fieldEl.tabIndex !== -1 && !fieldEl.hasAttribute("aria-hidden")) {
        fieldEl.focus();
      }
    }
  }
}

function bindStepListeners() {
  if (state.step === 1) {
    stepContainer.querySelectorAll<HTMLInputElement>('input[name="serviceSlug"]').forEach((input) => {
      input.addEventListener("change", () => {
        readStepInputs();
        stepContainer.innerHTML = renderStep1();
        bindStepListeners();
        renderEstimate();
      });
    });
  }

  if (state.step === 2) {
    stepContainer.querySelectorAll<HTMLSelectElement>("select[data-pricing-field]").forEach((el) => {
      el.addEventListener("change", () => {
        readPricingFieldsOnly();
        renderEstimate();
        updateStep2Breakdown();
      });
    });

    stepContainer.querySelectorAll<HTMLButtonElement>("[data-stepper-dec]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        adjustStepper(btn.dataset.field!, -1);
      });
    });

    stepContainer.querySelectorAll<HTMLButtonElement>("[data-stepper-inc]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        adjustStepper(btn.dataset.field!, 1);
      });
    });

    const changeBtn = stepContainer.querySelector<HTMLButtonElement>("[data-change-service]");
    changeBtn?.addEventListener("click", () => {
      showServiceChip = false;
      state.step = 1;
      renderStep();
    });
  }
}

function adjustStepper(fieldId: string, direction: -1 | 1) {
  const service = getService(state.serviceSlug)!;
  const field = service.pricingFields.find((f) => f.id === fieldId);
  if (!field || field.type !== "number") return;

  const input = stepContainer.querySelector<HTMLInputElement>(`#field-${fieldId}`);
  if (!input) return;

  const min = field.min ?? 0;
  const max = field.max ?? 99;
  const step = field.step ?? 1;
  const next = Math.min(max, Math.max(min, Number(input.value) + direction * step));
  input.value = String(next);
  state.pricingDetails[fieldId] = next;
  state = updateEstimate(state);

  const valueEl = stepContainer.querySelector(`[data-stepper-value="${fieldId}"]`);
  if (valueEl) valueEl.textContent = String(next);

  const decBtn = stepContainer.querySelector<HTMLButtonElement>(
    `[data-stepper-dec][data-field="${fieldId}"]`,
  );
  const incBtn = stepContainer.querySelector<HTMLButtonElement>(
    `[data-stepper-inc][data-field="${fieldId}"]`,
  );
  if (decBtn) decBtn.disabled = next <= min;
  if (incBtn) incBtn.disabled = next >= max;

  renderEstimate();
  updateStep2Breakdown();
}

function readPricingFieldsOnly() {
  stepContainer.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-pricing-field]").forEach((el) => {
    state.pricingDetails[el.name] =
      el instanceof HTMLInputElement && el.type === "number" ? Number(el.value) : el.value;
  });
  state = updateEstimate(state);
}

function renderStep() {
  renderProgress();
  errorBanner.hidden = true;
  errorBanner.textContent = "";
  clearInlineErrors();

  switch (state.step) {
    case 1:
      stepContainer.innerHTML = renderStep1();
      break;
    case 2:
      stepContainer.innerHTML = renderStep2();
      break;
    case 3:
      stepContainer.innerHTML = renderStep3();
      break;
    case 4:
      stepContainer.innerHTML = renderStep4();
      break;
  }

  bindStepListeners();

  backBtn.hidden = state.step === 1;
  backBtn.textContent = state.step === 4 ? "Back to edit" : "Back";
  nextBtn.textContent = state.step === 4 ? "Book my cleaning" : "Next";
  nextBtn.disabled = false;

  if (hasMounted) {
    scrollStepIntoView();
  } else {
    hasMounted = true;
  }
}

function readStepInputs() {
  if (state.step === 1) {
    const selected = stepContainer.querySelector<HTMLInputElement>('input[name="serviceSlug"]:checked');
    if (selected) {
      state.serviceSlug = selected.value;
      const service = getService(state.serviceSlug)!;
      state.pricingDetails = Object.fromEntries(
        service.pricingFields.map((field) => [field.id, field.defaultValue]),
      );
      state = updateEstimate(state);
    }
  }

  if (state.step === 2) {
    readPricingFieldsOnly();
  }

  if (state.step === 3) {
    state.preferredDate =
      stepContainer.querySelector<HTMLInputElement>("#preferredDate")?.value ?? state.preferredDate;
    const timeWindow = stepContainer.querySelector<HTMLInputElement>('input[name="timeWindow"]:checked')?.value as
      | WizardState["timeWindow"]
      | undefined;
    if (timeWindow) state.timeWindow = timeWindow;
    state.name = stepContainer.querySelector<HTMLInputElement>("#name")?.value ?? "";
    state.email = stepContainer.querySelector<HTMLInputElement>("#email")?.value ?? "";
    state.phone = stepContainer.querySelector<HTMLInputElement>("#phone")?.value ?? "";
    state.streetAddress = stepContainer.querySelector<HTMLInputElement>("#streetAddress")?.value ?? "";
    state.city = stepContainer.querySelector<HTMLInputElement>("#city")?.value ?? "";
    state.notes = stepContainer.querySelector<HTMLTextAreaElement>("#notes")?.value ?? "";
  }
}

async function submitBooking() {
  nextBtn.disabled = true;
  nextBtn.textContent = "Booking…";
  errorBanner.hidden = true;

  try {
    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceSlug: state.serviceSlug,
        pricingDetails: state.pricingDetails,
        preferredDate: state.preferredDate,
        timeWindow: state.timeWindow,
        name: state.name.trim(),
        email: state.email.trim(),
        phone: state.phone.trim(),
        streetAddress: state.streetAddress.trim(),
        city: state.city.trim(),
        notes: state.notes.trim(),
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Booking failed");
    }

    const query = new URLSearchParams({
      id: result.bookingId,
      price: String(result.estimatedPrice),
      unit: result.priceUnit,
    });
    window.location.href = `/book/confirmation?${query.toString()}`;
  } catch (error) {
    errorBanner.hidden = false;
    errorBanner.textContent =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";
    nextBtn.disabled = false;
    nextBtn.textContent = "Book my cleaning";
  }
}

backBtn.addEventListener("click", () => {
  if (state.step > 1) {
    state.step -= 1;
    renderStep();
  }
});

nextBtn.addEventListener("click", async () => {
  readStepInputs();
  const errors = validateStep(state);
  if (Object.keys(errors).length > 0) {
    showInlineErrors(errors);
    return;
  }

  if (state.step === 4) {
    await submitBooking();
    return;
  }

  state.step += 1;
  renderStep();
});

renderStep();
