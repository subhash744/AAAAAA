/**
 * Prompt Variables Module - Pro Feature
 * Handles {{variable}} substitution with inline popup for value entry
 */

const PromptVariables = (function() {
  const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
  let isPro = false;
  let activePopup = null;
  
  /**
   * Initialize the module
   */
  async function init() {
    isPro = await License.isPro();
  }
  
  /**
   * Check if text contains variables
   * @param {string} text
   * @returns {boolean}
   */
  function hasVariables(text) {
    if (!isPro) return false;
    return VARIABLE_REGEX.test(text);
  }
  
  /**
   * Extract all variables from text
   * @param {string} text
   * @returns {string[]} - Array of variable names (without {{}})
   */
  function extractVariables(text) {
    if (!isPro) return [];
    const matches = [];
    let match;
    VARIABLE_REGEX.lastIndex = 0; // Reset regex
    while ((match = VARIABLE_REGEX.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  }
  
  /**
   * Show variable input popup
   * @param {string} originalText - The prompt text with {{variables}}
   * @param {HTMLElement} targetElement - The composer element to insert into
   * @param {Function} onComplete - Callback with substituted text
   * @param {Function} onCancel - Callback if user cancels
   */
  function showVariablePopup(originalText, targetElement, onComplete, onCancel) {
    if (!isPro) {
      // For free users, just insert without variables
      onComplete(originalText);
      return;
    }
    
    const variables = extractVariables(originalText);
    if (variables.length === 0) {
      onComplete(originalText);
      return;
    }
    
    // Close any existing popup
    closeActivePopup();
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'pa-variable-popup';
    popup.style.cssText = `
      position: fixed;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      padding: 20px;
      z-index: 10002;
      min-width: 280px;
      max-width: 360px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Position near the target element
    const rect = targetElement.getBoundingClientRect();
    popup.style.left = Math.min(rect.left, window.innerWidth - 380) + 'px';
    popup.style.top = Math.min(rect.bottom + 10, window.innerHeight - 300) + 'px';
    
    // Build form
    let formHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-size:15px;font-weight:600;margin-bottom:4px;">Fill in variables</div>
        <div style="font-size:12px;color:#6b7280;">Your prompt contains placeholders to customize</div>
      </div>
    `;
    
    variables.forEach((variable, index) => {
      const placeholder = variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ');
      formHTML += `
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;font-weight:500;color:#374151;margin-bottom:4px;text-transform:capitalize;">
            ${placeholder}
          </label>
          <input type="text" 
                 id="pa-var-${variable}" 
                 data-variable="${variable}"
                 placeholder="Enter ${placeholder.toLowerCase()}..."
                 style="width:100%;padding:8px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;transition:border-color 0.2s;"
                 ${index === 0 ? 'autofocus' : ''}>
        </div>
      `;
    });
    
    formHTML += `
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button id="pa-var-insert" style="flex:1;padding:10px 16px;border:none;border-radius:8px;background:linear-gradient(135deg,#10a37f 0%,#059669 100%);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">
          Insert Prompt
        </button>
        <button id="pa-var-cancel" style="padding:10px 16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#374151;font-size:13px;font-weight:500;cursor:pointer;">
          Cancel
        </button>
      </div>
    `;
    
    popup.innerHTML = formHTML;
    document.body.appendChild(popup);
    activePopup = popup;
    
    // Focus first input
    setTimeout(() => {
      const firstInput = popup.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 10);
    
    // Handle insert
    popup.querySelector('#pa-var-insert').addEventListener('click', () => {
      const values = {};
      let hasEmpty = false;
      
      variables.forEach(variable => {
        const input = popup.querySelector(`#pa-var-${variable}`);
        const value = input.value.trim();
        if (!value) hasEmpty = true;
        values[variable] = value;
      });
      
      if (hasEmpty) {
        // Highlight empty fields
        popup.querySelectorAll('input').forEach(input => {
          if (!input.value.trim()) {
            input.style.borderColor = '#dc2626';
            input.addEventListener('input', () => input.style.borderColor = '#d1d5db', { once: true });
          }
        });
        return;
      }
      
      // Substitute variables
      let finalText = originalText;
      Object.entries(values).forEach(([variable, value]) => {
        const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
        finalText = finalText.replace(regex, value);
      });
      
      closeActivePopup();
      onComplete(finalText);
      
      // Track usage
      Analytics.send('prompt_variables_used', { 
        variable_count: variables.length,
        prompt_length: finalText.length 
      });
    });
    
    // Handle cancel
    popup.querySelector('#pa-var-cancel').addEventListener('click', () => {
      closeActivePopup();
      if (onCancel) onCancel();
    });
    
    // Close on Escape
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        closeActivePopup();
        if (onCancel) onCancel();
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        popup.querySelector('#pa-var-insert').click();
      }
    };
    document.addEventListener('keydown', keyHandler);
    popup._keyHandler = keyHandler;
    
    // Close on click outside
    setTimeout(() => {
      const clickHandler = (e) => {
        if (!popup.contains(e.target)) {
          closeActivePopup();
          if (onCancel) onCancel();
        }
      };
      document.addEventListener('click', clickHandler, { once: true });
      popup._clickHandler = clickHandler;
    }, 100);
  }
  
  /**
   * Close active variable popup
   */
  function closeActivePopup() {
    if (activePopup) {
      document.removeEventListener('keydown', activePopup._keyHandler);
      activePopup.remove();
      activePopup = null;
    }
  }
  
  /**
   * Substitute variables directly (without popup - for batch operations)
   * @param {string} text
   * @param {Object} values - { variableName: value }
   * @returns {string}
   */
  function substituteVariables(text, values) {
    let result = text;
    Object.entries(values).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }
  
  /**
   * Preview what variables are in a prompt (for display in lists)
   * @param {string} text
   * @returns {string} - e.g., "{{company}}, {{product}}"
   */
  function getVariablePreview(text) {
    if (!isPro) return '';
    const vars = extractVariables(text);
    if (vars.length === 0) return '';
    return vars.map(v => `{{${v}}}`).join(', ');
  }
  
  /**
   * Check Pro status and update
   */
  async function refreshProStatus() {
    isPro = await License.isPro();
  }
  
  // Public API
  return {
    init,
    hasVariables,
    extractVariables,
    showVariablePopup,
    substituteVariables,
    getVariablePreview,
    refreshProStatus,
    closeActivePopup
  };
})();

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PromptVariables.init());
} else {
  PromptVariables.init();
}
