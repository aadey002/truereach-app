/**
 * TrueReach - Phone Validation Widget
 * Verifying connections, providing care
 * Real-time phone validation for EHR and Pharmacy Management systems
 * 
 * Usage:
 *   <script src="https://your-domain.replit.app/phone-validator-widget.js"></script>
 *   <script>
 *     PhoneValidatorWidget.init({
 *       apiUrl: 'https://your-domain.replit.app',
 *       apiKey: 'your-api-key' // Optional for authenticated requests
 *     });
 *   </script>
 */

(function(window) {
  'use strict';

  const PhoneValidatorWidget = {
    config: {
      apiUrl: '',
      apiKey: '',
      debounceMs: 500,
      country: 'US'
    },

    /**
     * Initialize the widget
     * @param {Object} options - Configuration options
     * @param {string} options.apiUrl - Base URL of the validation API
     * @param {string} options.apiKey - Optional API key for authentication
     * @param {number} options.debounceMs - Debounce time in milliseconds (default: 500)
     * @param {string} options.country - Default country code (default: 'US')
     */
    init: function(options) {
      this.config = Object.assign({}, this.config, options);
      this.injectStyles();
      console.log('[PhoneValidator] Widget initialized');
    },

    /**
     * Validate a phone number
     * @param {string} phone - Phone number to validate
     * @returns {Promise<Object>} Validation result
     */
    validate: async function(phone) {
      if (!phone || !phone.trim()) {
        return { valid: false, error: 'Phone number is required' };
      }

      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        const response = await fetch(`${this.config.apiUrl}/api/validate-realtime`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            phone: phone.trim(),
            country: this.config.country
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Validation failed');
        }

        const result = await response.json();
        return {
          valid: result.valid,
          phoneType: result.phone_type,
          canReceiveSms: result.can_receive_sms,
          carrier: result.carrier,
          formatted: result.formatted,
          localFormat: result.local_format,
          warnings: result.warnings || [],
          status: result.valid ? 'valid' : 'invalid'
        };
      } catch (error) {
        console.error('[PhoneValidator] Validation error:', error);
        return {
          valid: false,
          status: 'error',
          error: error.message
        };
      }
    },

    /**
     * Attach validation to an input field
     * @param {string|HTMLElement} input - Input selector or element
     * @param {Object} options - Validation options
     * @param {Function} options.onValidate - Callback when validation completes
     * @param {Function} options.onChange - Callback when input changes
     * @param {boolean} options.showInline - Show inline validation UI (default: true)
     * @param {boolean} options.validateOnBlur - Validate on blur event (default: true)
     * @param {boolean} options.validateOnType - Validate while typing (default: false)
     */
    attach: function(input, options = {}) {
      const element = typeof input === 'string' ? document.querySelector(input) : input;
      
      if (!element) {
        console.error('[PhoneValidator] Input element not found:', input);
        return;
      }

      const settings = {
        onValidate: () => {},
        onChange: () => {},
        showInline: true,
        validateOnBlur: true,
        validateOnType: false,
        ...options
      };

      let debounceTimer = null;
      let validationContainer = null;

      // Create inline validation UI
      if (settings.showInline) {
        validationContainer = document.createElement('div');
        validationContainer.className = 'phone-validator-result';
        element.parentNode.insertBefore(validationContainer, element.nextSibling);
      }

      const validateAndDisplay = async () => {
        const phone = element.value;
        
        if (!phone || !phone.trim()) {
          if (validationContainer) {
            validationContainer.innerHTML = '';
            validationContainer.className = 'phone-validator-result';
          }
          return;
        }

        if (validationContainer) {
          validationContainer.innerHTML = '<div class="phone-validator-loading">Validating...</div>';
          validationContainer.className = 'phone-validator-result phone-validator-loading-state';
        }

        const result = await this.validate(phone);
        
        if (settings.onValidate) {
          settings.onValidate(result, element);
        }

        if (validationContainer) {
          this.renderResult(validationContainer, result);
        }
      };

      // Blur event (most common for EHR forms)
      if (settings.validateOnBlur) {
        element.addEventListener('blur', validateAndDisplay);
      }

      // Typing event (with debounce)
      if (settings.validateOnType) {
        element.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(validateAndDisplay, this.config.debounceMs);
          
          if (settings.onChange) {
            settings.onChange(element.value, element);
          }
        });
      }

      console.log('[PhoneValidator] Attached to input:', element);
    },

    /**
     * Render validation result in a container
     * @param {HTMLElement} container - Container element
     * @param {Object} result - Validation result
     */
    renderResult: function(container, result) {
      container.className = 'phone-validator-result';

      if (result.status === 'error') {
        container.className += ' phone-validator-error';
        container.innerHTML = `
          <div class="phone-validator-message phone-validator-error-message">
            <span class="phone-validator-icon">⚠️</span>
            <span>${result.error || 'Validation service unavailable'}</span>
          </div>
        `;
        return;
      }

      if (result.valid) {
        container.className += ' phone-validator-valid';
        const smsIcon = result.canReceiveSms ? '<span class="phone-validator-badge">📱 SMS OK</span>' : '';
        container.innerHTML = `
          <div class="phone-validator-message phone-validator-success-message">
            <span class="phone-validator-icon">✓</span>
            <span>Valid ${result.phoneType} ${smsIcon}</span>
          </div>
          ${result.carrier ? `<div class="phone-validator-detail">Carrier: ${result.carrier}</div>` : ''}
          ${result.formatted ? `<div class="phone-validator-detail">Format: ${result.formatted}</div>` : ''}
        `;
      } else {
        container.className += ' phone-validator-invalid';
        container.innerHTML = `
          <div class="phone-validator-message phone-validator-error-message">
            <span class="phone-validator-icon">✗</span>
            <span>Invalid phone number</span>
          </div>
        `;
      }

      // Add warnings
      if (result.warnings && result.warnings.length > 0) {
        const warningsHtml = result.warnings.map(w => 
          `<div class="phone-validator-warning">⚠️ ${w}</div>`
        ).join('');
        container.innerHTML += warningsHtml;
      }
    },

    /**
     * Inject default styles
     */
    injectStyles: function() {
      if (document.getElementById('phone-validator-styles')) {
        return; // Already injected
      }

      const styles = `
        .phone-validator-result {
          margin-top: 8px;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .phone-validator-loading-state {
          color: #64748b;
          font-style: italic;
        }

        .phone-validator-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 6px;
          font-weight: 500;
        }

        .phone-validator-success-message {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .phone-validator-error-message {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .phone-validator-icon {
          font-style: normal;
          font-size: 16px;
        }

        .phone-validator-detail {
          color: #64748b;
          font-size: 12px;
          margin-top: 4px;
          padding-left: 4px;
        }

        .phone-validator-badge {
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .phone-validator-warning {
          background: #fef3c7;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 6px;
          font-size: 13px;
          border: 1px solid #fde047;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .phone-validator-success-message {
            background: #064e3b;
            color: #86efac;
            border-color: #065f46;
          }

          .phone-validator-error-message {
            background: #7f1d1d;
            color: #fca5a5;
            border-color: #991b1b;
          }

          .phone-validator-warning {
            background: #713f12;
            color: #fde047;
            border-color: #854d0e;
          }

          .phone-validator-detail {
            color: #94a3b8;
          }
        }
      `;

      const styleElement = document.createElement('style');
      styleElement.id = 'phone-validator-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    },

    /**
     * Batch validate multiple phone numbers
     * @param {Array<string>} phones - Array of phone numbers
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Array>} Array of validation results
     */
    validateBatch: async function(phones, onProgress) {
      const results = [];
      const total = phones.length;

      for (let i = 0; i < phones.length; i++) {
        const result = await this.validate(phones[i]);
        results.push({
          phone: phones[i],
          ...result
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            percent: Math.round(((i + 1) / total) * 100)
          });
        }

        // Rate limiting - wait 300ms between requests
        if (i < phones.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      return results;
    }
  };

  // Export to global scope
  window.PhoneValidatorWidget = PhoneValidatorWidget;

  console.log('[PhoneValidator] Widget loaded. Call PhoneValidatorWidget.init() to start.');

})(window);
