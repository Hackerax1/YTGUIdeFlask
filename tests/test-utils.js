/**
 * Test utilities for UI and integration tests
 * 
 * These utilities help simulate user interactions and test DOM behavior
 */

/**
 * Simulates a click event on a DOM element
 * 
 * @param {HTMLElement} element - The element to click
 * @param {Object} options - Optional click event options
 */
export function simulateClick(element, options = {}) {
    if (!element) {
        throw new Error('Cannot simulate click on null element');
    }
    
    const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        ...options
    });
    
    element.dispatchEvent(event);
    
    // If the element has an onclick handler, call it directly
    if (typeof element.onclick === 'function') {
        element.onclick(event);
    }
}

/**
 * Simulates a keyboard event on a DOM element
 * 
 * @param {HTMLElement} element - The element that receives the key press
 * @param {string} key - The key to simulate (e.g., 'Enter', 'Escape', 'Tab')
 * @param {Object} options - Optional keyboard event options
 */
export function simulateKeyPress(element, key, options = {}) {
    if (!element) {
        throw new Error('Cannot simulate key press on null element');
    }
    
    const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: key,
        code: key === 'Escape' ? 'Escape' : key === 'Tab' ? 'Tab' : `Key${key.toUpperCase()}`,
        keyCode: key === 'Escape' ? 27 : key === 'Tab' ? 9 : key.charCodeAt(0),
        which: key === 'Escape' ? 27 : key === 'Tab' ? 9 : key.charCodeAt(0),
        shiftKey: options.shiftKey || false,
        ctrlKey: options.ctrlKey || false,
        altKey: options.altKey || false,
        metaKey: options.metaKey || false,
        ...options
    });
    
    element.dispatchEvent(event);
    
    // If the element has a keydown handler, call it directly
    if (typeof element.onkeydown === 'function') {
        element.onkeydown(event);
    }
}

/**
 * Waits for an element to appear in the DOM
 * 
 * @param {string} selector - CSS selector for the element to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<HTMLElement>} - The found element
 */
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }
        
        const observer = new MutationObserver((mutations) => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found after ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Fill a form with given values
 * 
 * @param {string} formSelector - CSS selector for the form
 * @param {Object} values - Key-value pairs of form field IDs and values
 */
export function fillForm(formSelector, values) {
    const form = document.querySelector(formSelector);
    if (!form) {
        throw new Error(`Form not found: ${formSelector}`);
    }
    
    Object.entries(values).forEach(([id, value]) => {
        const element = form.querySelector(`#${id}`);
        if (!element) {
            throw new Error(`Form element not found: #${id}`);
        }
        
        if (element.tagName === 'SELECT') {
            element.value = value;
            simulateEvent(element, 'change');
        } else if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = !!value;
            simulateEvent(element, 'change');
        } else {
            element.value = value;
            simulateEvent(element, 'input');
        }
    });
}

/**
 * Simulates an event of any type on an element
 * 
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Type of event (e.g., 'input', 'change')
 * @param {Object} options - Event options
 */
export function simulateEvent(element, eventType, options = {}) {
    if (!element) {
        throw new Error(`Cannot simulate ${eventType} on null element`);
    }
    
    let event;
    
    if (eventType === 'input' || eventType === 'change') {
        event = new Event(eventType, {
            bubbles: true,
            cancelable: true,
            ...options
        });
    } else {
        event = new CustomEvent(eventType, {
            bubbles: true,
            cancelable: true,
            detail: options.detail || {},
            ...options
        });
    }
    
    element.dispatchEvent(event);
}