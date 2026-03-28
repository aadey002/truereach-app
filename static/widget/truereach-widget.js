/**
 * TrueReach Phone Validation Widget v1.0
 * Drop-in script for any PMS or healthcare platform
 *
 * Usage:
 *   <script
 *     src="https://your-truereach-url.replit.app/widget/truereach-widget.js"
 *     data-api-key="YOUR_TRUEREACH_API_KEY"
 *     data-org-id="ORG_123"
 *     data-user-id="TECH_456"
 *   ></script>
 *
 * Targets (in priority order):
 *   1. input[type="tel"]
 *   2. .truereach-phone
 *   3. #phone, #phone_number, #primary_phone, #alt_phone, #telephone
 *   4. input[name*="phone"], input[name*="tel"], input[name*="mobile"]
 *   5. input[placeholder*="phone"], input[placeholder*="Phone"]
 */

(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────────────────
  const SCRIPT_TAG = document.currentScript || (function () {
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  const CONFIG = {
    apiKey:    SCRIPT_TAG.getAttribute("data-api-key")  || "DEMO_KEY",
    orgId:     SCRIPT_TAG.getAttribute("data-org-id")   || "demo-org",
    userId:    SCRIPT_TAG.getAttribute("data-user-id")  || "unknown-user",
    apiBase:   SCRIPT_TAG.getAttribute("data-api-base") || "https://flask-data-viz-aadey002.replit.app",
    debounce:  600,
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const COLORS = {
    valid:    { border: "#22c55e", glow: "0 0 0 3px rgba(34,197,94,0.2)",   bg: "#f0fdf4", text: "#15803d" },
    landline: { border: "#3b82f6", glow: "0 0 0 3px rgba(59,130,246,0.2)",  bg: "#eff6ff", text: "#1d4ed8" },
    invalid:  { border: "#ef4444", glow: "0 0 0 3px rgba(239,68,68,0.2)",   bg: "#fef2f2", text: "#dc2626" },
    checking: { border: "#94a3b8", glow: "none",                             bg: "#f8fafc", text: "#64748b" },
  };

  const LABELS = {
    valid:    { icon: "\u2713", text: "Valid & SMS-capable" },
    landline: { icon: "\u260E", text: "Valid \u2014 Landline only" },
    invalid:  { icon: "\u2715", text: "Invalid number" },
    checking: { icon: "\u27F3", text: "Validating\u2026" },
  };

  // ── Inject global CSS once ─────────────────────────────────────────────────
  if (!document.getElementById("truereach-styles")) {
    var style = document.createElement("style");
    style.id = "truereach-styles";
    style.textContent = "\
      .truereach-wrapper {\
        position: relative;\
        display: inline-block;\
        width: 100%;\
      }\
      .truereach-wrapper input {\
        transition: border-color 0.3s ease, box-shadow 0.3s ease !important;\
      }\
      .truereach-badge {\
        position: absolute;\
        right: 8px;\
        top: 50%;\
        transform: translateY(-50%);\
        font-size: 11px;\
        font-weight: 700;\
        padding: 2px 8px;\
        border-radius: 20px;\
        pointer-events: none;\
        white-space: nowrap;\
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\
        letter-spacing: 0.03em;\
        z-index: 9999;\
        transition: opacity 0.2s ease;\
      }\
      .truereach-tooltip {\
        position: absolute;\
        bottom: calc(100% + 8px);\
        left: 0;\
        background: #1e293b;\
        color: #f1f5f9;\
        font-size: 12px;\
        padding: 8px 12px;\
        border-radius: 8px;\
        white-space: nowrap;\
        pointer-events: none;\
        z-index: 10000;\
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);\
        opacity: 0;\
        transition: opacity 0.2s ease;\
      }\
      .truereach-tooltip::after {\
        content: '';\
        position: absolute;\
        top: 100%;\
        left: 16px;\
        border: 5px solid transparent;\
        border-top-color: #1e293b;\
      }\
      .truereach-wrapper:hover .truereach-tooltip,\
      .truereach-wrapper:focus-within .truereach-tooltip {\
        opacity: 1;\
      }\
      .truereach-spinner {\
        display: inline-block;\
        animation: tr-spin 0.8s linear infinite;\
      }\
      @keyframes tr-spin {\
        to { transform: rotate(360deg); }\
      }\
      .truereach-powered {\
        display: inline-flex;\
        align-items: center;\
        gap: 4px;\
        font-size: 10px;\
        color: #94a3b8;\
        margin-top: 3px;\
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\
      }\
      .truereach-powered span {\
        color: #7c3aed;\
        font-weight: 600;\
      }\
    ";
    document.head.appendChild(style);
  }

  // ── Phone field selector strategy ─────────────────────────────────────────
  function findPhoneInputs() {
    var selectors = [
      'input[type="tel"]',
      '.truereach-phone',
      '#phone', '#phone_number', '#primary_phone', '#alt_phone',
      '#telephone', '#mobile', '#cell_phone', '#contact_phone',
      'input[name*="phone"]', 'input[name*="tel"]',
      'input[name*="mobile"]', 'input[name*="cell"]',
      'input[placeholder*="phone" i]', 'input[placeholder*="telephone" i]',
    ];
    var found = new Set();
    selectors.forEach(function (sel) {
      try {
        document.querySelectorAll(sel).forEach(function (el) {
          if (el.tagName === "INPUT" && !el.dataset.truereachAttached) {
            found.add(el);
          }
        });
      } catch (e) {}
    });
    return Array.from(found);
  }

  // ── Wrap input in positioning container ───────────────────────────────────
  function wrapInput(input) {
    if (input.parentElement && input.parentElement.classList.contains("truereach-wrapper")) {
      return input.parentElement;
    }
    var wrapper = document.createElement("div");
    wrapper.className = "truereach-wrapper";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    return wrapper;
  }

  // ── Apply visual status to input ──────────────────────────────────────────
  function applyStatus(input, wrapper, status, meta) {
    meta = meta || {};
    var c = COLORS[status];
    var l = LABELS[status];
    if (!c) return;

    input.style.borderColor  = c.border;
    input.style.boxShadow    = c.glow;
    input.style.paddingRight = "120px";

    var badge = wrapper.querySelector(".truereach-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "truereach-badge";
      wrapper.appendChild(badge);
    }
    badge.style.background = c.bg;
    badge.style.color       = c.text;
    badge.style.border      = "1px solid " + c.border;
    badge.innerHTML = status === "checking"
      ? '<span class="truereach-spinner">' + l.icon + '</span> ' + l.text
      : l.icon + ' ' + l.text;

    var tooltip = wrapper.querySelector(".truereach-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "truereach-tooltip";
      wrapper.appendChild(tooltip);
    }

    if (status === "invalid") {
      tooltip.textContent = "\u26A0 " + (meta.reason || "This number cannot receive calls or texts");
      tooltip.style.borderLeft = "3px solid #ef4444";
    } else if (status === "landline") {
      tooltip.textContent = "\u260E " + (meta.carrier || "Landline/VoIP") + " \u2014 SMS not supported";
      tooltip.style.borderLeft = "3px solid #3b82f6";
    } else if (status === "valid") {
      tooltip.textContent = "\u2713 " + (meta.carrier || "Mobile") + " \u2014 SMS reminders enabled";
      tooltip.style.borderLeft = "3px solid #22c55e";
    } else {
      tooltip.textContent = "Checking with TrueReach\u2026";
      tooltip.style.borderLeft = "none";
    }

    if (!wrapper.querySelector(".truereach-powered")) {
      var powered = document.createElement("div");
      powered.className = "truereach-powered";
      powered.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#7c3aed" stroke-width="1.5"/><path d="M3 5l1.5 1.5L7 3.5" stroke="#7c3aed" stroke-width="1.2" stroke-linecap="round"/></svg> Validated by <span>TrueReach</span>';
      wrapper.parentNode && wrapper.parentNode.insertBefore(powered, wrapper.nextSibling);
    }
  }

  // ── Log event to TrueReach dashboard ──────────────────────────────────────
  function logEvent(eventType, payload) {
    try {
      fetch(CONFIG.apiBase + "/api/truereach/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({
          api_key:    CONFIG.apiKey,
          org_id:     CONFIG.orgId,
          user_id:    CONFIG.userId,
          event_type: eventType,
          timestamp:  new Date().toISOString(),
          page_url:   window.location.href,
        }, payload)),
      });
    } catch (e) {
      // Silent fail
    }
  }

  // ── Core validation call ───────────────────────────────────────────────────
  function validatePhone(phoneNumber, input, wrapper) {
    var digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 7) return;

    applyStatus(input, wrapper, "checking");

    fetch(CONFIG.apiBase + "/api/validate?phone=" + encodeURIComponent(phoneNumber) + "&key=" + CONFIG.apiKey)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var status, meta;
        if (!data.valid) {
          status = "invalid";
          meta   = { reason: data.reason || "Number could not be validated" };
          logEvent("invalid_detected", { phone_last4: digits.slice(-4), reason: meta.reason });
        } else if (data.line_type === "mobile" || data.is_sms_capable) {
          status = "valid";
          meta   = { carrier: data.carrier || "Mobile carrier" };
          logEvent("valid_sms", { phone_last4: digits.slice(-4), carrier: meta.carrier });
        } else {
          status = "landline";
          meta   = { carrier: data.carrier || "Landline/VoIP" };
          logEvent("valid_landline", { phone_last4: digits.slice(-4), carrier: meta.carrier });
        }
        applyStatus(input, wrapper, status, meta);
        input.dataset.truereachStatus = status;
      })
      .catch(function () {
        input.style.borderColor = "";
        input.style.boxShadow   = "";
      });
  }

  // ── Debounce helper ────────────────────────────────────────────────────────
  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  // ── Attach to a single input ───────────────────────────────────────────────
  function attachToInput(input) {
    if (input.dataset.truereachAttached) return;
    input.dataset.truereachAttached = "true";

    var wrapper = wrapInput(input);

    if (input.value && input.value.replace(/\D/g, "").length >= 7) {
      validatePhone(input.value, input, wrapper);
    }

    var lastValue = input.value;
    var debouncedValidate = debounce(function (val) {
      validatePhone(val, input, wrapper);
      if (val !== lastValue) {
        logEvent("phone_updated", {
          phone_last4: val.replace(/\D/g, "").slice(-4),
          previous_status: input.dataset.truereachStatus || "unknown",
        });
        lastValue = val;
      }
    }, CONFIG.debounce);

    input.addEventListener("blur", function () {
      if (input.value !== lastValue || !input.dataset.truereachStatus) {
        debouncedValidate(input.value);
      }
    });

    input.addEventListener("input", function () {
      if (input.dataset.truereachStatus) {
        input.style.borderColor = "#94a3b8";
        input.style.boxShadow   = "none";
        var badge = wrapper.querySelector(".truereach-badge");
        if (badge) badge.style.opacity = "0.4";
      }
    });
  }

  // ── Watch for dynamically added phone fields (SPA support) ────────────────
  function observeDOM() {
    var observer = new MutationObserver(function () {
      findPhoneInputs().forEach(attachToInput);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    findPhoneInputs().forEach(attachToInput);
    observeDOM();
    console.log("%cTrueReach Widget v1.0 active \u2014 org: " + CONFIG.orgId, "color: #7c3aed; font-weight: bold;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
