/**
 * DOM Utilities for UI Module System
 * 
 * Provides null-safe DOM manipulation and element checking utilities
 * to support graceful degradation in minimal UI scenarios.
 */

export const DOMUtils = {
    /**
     * Safely add event listener to element if it exists
     * @param {HTMLElement|null} element - DOM element or null
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     * @returns {boolean} True if listener was added
     */
    safeAddEventListener(element, event, handler, options = {}) {
        if (!element || typeof element.addEventListener !== 'function') {
            return false;
        }
        
        try {
            element.addEventListener(event, handler, options);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to add event listener:', error.message);
            return false;
        }
    },

    /**
     * Safely remove event listener from element if it exists
     * @param {HTMLElement|null} element - DOM element or null
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     * @returns {boolean} True if listener was removed
     */
    safeRemoveEventListener(element, event, handler, options = {}) {
        if (!element || typeof element.removeEventListener !== 'function') {
            return false;
        }
        
        try {
            element.removeEventListener(event, handler, options);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to remove event listener:', error.message);
            return false;
        }
    },

    /**
     * Check if element exists and is connected to DOM
     * @param {HTMLElement|null} element - Element to check
     * @returns {boolean} True if element exists and is connected
     */
    isElementValid(element) {
        return element && 
               element instanceof Element && 
               element.isConnected;
    },

    /**
     * Safely set element content
     * @param {HTMLElement|null} element - Target element
     * @param {string} content - Content to set
     * @param {string} method - Method to use: 'innerHTML', 'textContent', 'innerText'
     * @returns {boolean} True if content was set
     */
    safeSetContent(element, content, method = 'innerHTML') {
        if (!this.isElementValid(element)) {
            return false;
        }
        
        try {
            switch (method) {
                case 'innerHTML':
                    element.innerHTML = content;
                    break;
                case 'textContent':
                    element.textContent = content;
                    break;
                case 'innerText':
                    element.innerText = content;
                    break;
                default:
                    element.innerHTML = content;
            }
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to set element content:', error.message);
            return false;
        }
    },

    /**
     * Safely add CSS class to element
     * @param {HTMLElement|null} element - Target element
     * @param {string|string[]} classNames - Class name(s) to add
     * @returns {boolean} True if classes were added
     */
    safeAddClass(element, classNames) {
        if (!this.isElementValid(element)) {
            return false;
        }
        
        try {
            const classes = Array.isArray(classNames) ? classNames : [classNames];
            element.classList.add(...classes);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to add CSS class:', error.message);
            return false;
        }
    },

    /**
     * Safely remove CSS class from element
     * @param {HTMLElement|null} element - Target element
     * @param {string|string[]} classNames - Class name(s) to remove
     * @returns {boolean} True if classes were removed
     */
    safeRemoveClass(element, classNames) {
        if (!this.isElementValid(element)) {
            return false;
        }
        
        try {
            const classes = Array.isArray(classNames) ? classNames : [classNames];
            element.classList.remove(...classes);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to remove CSS class:', error.message);
            return false;
        }
    },

    /**
     * Safely toggle CSS class on element
     * @param {HTMLElement|null} element - Target element
     * @param {string} className - Class name to toggle
     * @param {boolean} force - Force add (true) or remove (false)
     * @returns {boolean} True if class was toggled
     */
    safeToggleClass(element, className, force = undefined) {
        if (!this.isElementValid(element)) {
            return false;
        }
        
        try {
            return element.classList.toggle(className, force);
        } catch (error) {
            console.warn('⚠️ Failed to toggle CSS class:', error.message);
            return false;
        }
    },

    /**
     * Safely append child to element
     * @param {HTMLElement|null} parent - Parent element
     * @param {HTMLElement} child - Child element to append
     * @returns {boolean} True if child was appended
     */
    safeAppendChild(parent, child) {
        if (!this.isElementValid(parent) || !this.isElementValid(child)) {
            return false;
        }
        
        try {
            parent.appendChild(child);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to append child:', error.message);
            return false;
        }
    },

    /**
     * Safely remove child from element
     * @param {HTMLElement|null} parent - Parent element
     * @param {HTMLElement} child - Child element to remove
     * @returns {boolean} True if child was removed
     */
    safeRemoveChild(parent, child) {
        if (!this.isElementValid(parent) || !this.isElementValid(child)) {
            return false;
        }
        
        try {
            parent.removeChild(child);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to remove child:', error.message);
            return false;
        }
    },

    /**
     * Safely set element style properties
     * @param {HTMLElement|null} element - Target element
     * @param {Object} styles - Style properties to set
     * @returns {boolean} True if styles were set
     */
    safeSetStyles(element, styles) {
        if (!this.isElementValid(element)) {
            return false;
        }
        
        try {
            Object.assign(element.style, styles);
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to set element styles:', error.message);
            return false;
        }
    },

    /**
     * Safely set element attributes
     * @param {HTMLElement|null} element - Target element
     * @param {Object} attributes - Attributes to set
     * @returns {boolean} True if attributes were set
     */
    safeSetAttributes(element, attributes) {
        if (!this.isElementValid(element)) {
            return false;
        }
        
        try {
            for (const [key, value] of Object.entries(attributes)) {
                element.setAttribute(key, value);
            }
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to set element attributes:', error.message);
            return false;
        }
    },

    /**
     * Create element with safe attribute setting
     * @param {string} tagName - HTML tag name
     * @param {Object} options - Element options
     * @param {Object} options.attributes - Attributes to set
     * @param {Object} options.styles - Styles to set
     * @param {string|string[]} options.classes - CSS classes to add
     * @param {string} options.content - Inner content
     * @returns {HTMLElement|null} Created element or null on failure
     */
    createElement(tagName, options = {}) {
        try {
            const element = document.createElement(tagName);
            
            if (options.attributes) {
                this.safeSetAttributes(element, options.attributes);
            }
            
            if (options.styles) {
                this.safeSetStyles(element, options.styles);
            }
            
            if (options.classes) {
                this.safeAddClass(element, options.classes);
            }
            
            if (options.content) {
                this.safeSetContent(element, options.content);
            }
            
            return element;
        } catch (error) {
            console.warn('⚠️ Failed to create element:', error.message);
            return null;
        }
    },

    /**
     * Query selector with null safety
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Context element (default: document)
     * @returns {HTMLElement|null} Found element or null
     */
    safeQuerySelector(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.warn('⚠️ Failed to query selector:', error.message);
            return null;
        }
    },

    /**
     * Query all selectors with null safety
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Context element (default: document)
     * @returns {NodeList|Array} Found elements or empty array
     */
    safeQuerySelectorAll(selector, context = document) {
        try {
            return context.querySelectorAll(selector);
        } catch (error) {
            console.warn('⚠️ Failed to query all selectors:', error.message);
            return [];
        }
    }
};

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOMUtils };
}