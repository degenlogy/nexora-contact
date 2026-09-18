/**
 * NEXORA Contact Form Logic
 * Vanilla JavaScript (No Frameworks)
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       Application State
       ========================================================================== */
    const State = {
        theme: 'system',
        touchedFields: new Set(),
        draftData: {},
        isSubmitting: false,
        requiredFields: ['name', 'email', 'type', 'subject', 'message', 'privacy'],
        totalRequired: 6
    };

    /* ==========================================================================
       DOM References
       ========================================================================== */
    const DOM = {
        // Theme & Nav
        themeToggle: document.getElementById('theme-toggle'),
        mobileBtn: document.getElementById('mobile-menu-btn'),
        mobileDrawer: document.getElementById('mobile-drawer'),
        mobileOverlay: document.getElementById('mobile-overlay'),
        closeMenuBtn: document.getElementById('close-menu-btn'),
        
        // Form Elements
        formPanel: document.getElementById('form-panel'),
        successPanel: document.getElementById('success-panel'),
        form: document.getElementById('contact-form'),
        btnSubmit: document.getElementById('btn-submit'),
        btnSubmitText: document.querySelector('#btn-submit .btn-text'),
        btnReset: document.getElementById('btn-reset'),
        btnResetSuccess: document.getElementById('btn-reset-success'),
        btnClearDraft: document.getElementById('btn-clear-draft'),
        
        // Form Inputs
        inputs: {
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            company: document.getElementById('company'),
            type: document.getElementById('type'),
            subject: document.getElementById('subject'),
            message: document.getElementById('message'),
            privacy: document.getElementById('privacy')
        },
        
        // UI Indicators
        charCounter: document.getElementById('char-counter'),
        progressFill: document.getElementById('form-progress'),
        progressText: document.getElementById('progress-text'),
        
        // Modals & Extras
        btnPrivacyModal: document.getElementById('btn-privacy-modal'),
        privacyModal: document.getElementById('privacy-modal-overlay'),
        closeModalBtns: document.querySelectorAll('.close-modal-btn'),
        accordions: document.querySelectorAll('.accordion-trigger'),
        toastContainer: document.getElementById('toast-container')
    };

    /* ==========================================================================
       Initialization
       ========================================================================== */
    function init() {
        initTheme();
        bindEvents();
        restoreDraft();
        updateFormProgress();
    }

    /* ==========================================================================
       Event Listeners Binding
       ========================================================================== */
    function bindEvents() {
        // Navigation & Theme
        DOM.themeToggle?.addEventListener('click', toggleTheme);
        DOM.mobileBtn?.addEventListener('click', openMobileMenu);
        DOM.closeMenuBtn?.addEventListener('click', closeMobileMenu);
        DOM.mobileOverlay?.addEventListener('click', closeMobileMenu);
        
        document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Form Interactions
        Object.values(DOM.inputs).forEach(input => {
            if (!input) return;
            
            // Mark as touched on blur
            input.addEventListener('blur', () => {
                State.touchedFields.add(input.name);
                validateField(input);
                updateFormProgress();
            });

            // Re-validate and autosave on input
            input.addEventListener('input', () => {
                if (State.touchedFields.has(input.name)) {
                    validateField(input);
                }
                if (input.name === 'message') {
                    updateCharacterCount();
                }
                updateFormProgress();
                debounceSaveDraft();
            });

            // Special handling for change events (select/checkbox)
            if (input.type === 'checkbox' || input.tagName === 'SELECT') {
                input.addEventListener('change', () => {
                    State.touchedFields.add(input.name);
                    validateField(input);
                    updateFormProgress();
                    debounceSaveDraft();
                });
            }
        });

        DOM.form?.addEventListener('submit', handleFormSubmit);
        DOM.btnReset?.addEventListener('click', () => resetForm(true));
        DOM.btnResetSuccess?.addEventListener('click', () => {
            resetForm(true);
            DOM.successPanel.hidden = true;
            DOM.formPanel.hidden = false;
        });
        DOM.btnClearDraft?.addEventListener('click', clearDraft);

        // Accordion
        DOM.accordions.forEach(acc => {
            acc.addEventListener('click', () => {
                const expanded = acc.getAttribute('aria-expanded') === 'true';
                // Optional: close others
                DOM.accordions.forEach(a => a.setAttribute('aria-expanded', 'false'));
                acc.setAttribute('aria-expanded', !expanded);
            });
        });

        // Modals
        DOM.btnPrivacyModal?.addEventListener('click', () => openModal(DOM.privacyModal));
        DOM.closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(DOM.privacyModal)));
        DOM.privacyModal?.addEventListener('click', (e) => {
            if (e.target === DOM.privacyModal) closeModal(DOM.privacyModal);
        });

        // Global Esc Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal(DOM.privacyModal);
                closeMobileMenu();
            }
        });
    }

    /* ==========================================================================
       Theme System
       ========================================================================== */
    function initTheme() {
        const savedTheme = localStorage.getItem('nexora_theme') || 'system';
        applyTheme(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme;
        if (currentTheme === 'light') newTheme = 'dark';
        else if (currentTheme === 'dark') newTheme = 'system';
        else newTheme = 'light';
        
        applyTheme(newTheme);
        localStorage.setItem('nexora_theme', newTheme);
        showToast(`Theme updated to ${newTheme}`, 'info');
    }

    function applyTheme(theme) {
        if (!['light', 'dark', 'system'].includes(theme)) theme = 'system';
        State.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        const iconWrap = DOM.themeToggle;
        
        let iconSvg = '';
        if (theme === 'dark') {
            iconSvg = `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        } else if (theme === 'light') {
            iconSvg = `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
        } else {
            // System Monitor Icon
            iconSvg = `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
        }
        iconWrap.innerHTML = iconSvg;
    }

    /* ==========================================================================
       Navigation Modals
       ========================================================================== */
    function openMobileMenu() {
        DOM.mobileDrawer.classList.add('active');
        DOM.mobileOverlay.classList.add('active');
        DOM.mobileBtn?.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        DOM.mobileDrawer.classList.remove('active');
        DOM.mobileOverlay.classList.remove('active');
        DOM.mobileBtn?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /* ==========================================================================
       Form Validation Logic
       ========================================================================== */
    const Validators = {
        name: (val) => val.trim().length >= 2 ? '' : 'Please enter your full name (min 2 chars).',
        email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Please enter a valid email address.',
        phone: (val) => val.trim() === '' || /^[\d\s\+\-\(\)]+$/.test(val) ? '' : 'Please enter a valid phone number.',
        type: (val) => val !== '' ? '' : 'Please select a project type.',
        subject: (val) => val.trim().length >= 3 ? '' : 'Please enter a subject (min 3 chars).',
        message: (val) => {
            const len = val.trim().length;
            if (len < 10) return 'Message must be at least 10 characters.';
            if (len > 1000) return 'Message cannot exceed 1000 characters.';
            return '';
        },
        privacy: (checked) => checked ? '' : 'You must agree to the privacy policy.'
    };

    function validateField(input) {
        const name = input.name;
        const val = input.type === 'checkbox' ? input.checked : input.value;
        
        let errorMsg = '';
        if (Validators[name]) {
            errorMsg = Validators[name](val);
        } else if (input.required && !val) {
            errorMsg = 'This field is required.';
        }

        const formGroup = input.closest('.form-group');
        const errorEl = document.getElementById(`${name}-error`);

        if (errorMsg) {
            formGroup.classList.add('is-invalid');
            if(errorEl) errorEl.textContent = errorMsg;
            return false;
        } else {
            formGroup.classList.remove('is-invalid');
            if(errorEl) errorEl.textContent = '';
            return true;
        }
    }

    function validateAll() {
        let isValid = true;
        let firstInvalid = null;

        Object.values(DOM.inputs).forEach(input => {
            State.touchedFields.add(input.name);
            const fieldValid = validateField(input);
            if (!fieldValid) {
                isValid = false;
                if (!firstInvalid) firstInvalid = input;
            }
        });

        if (firstInvalid) {
            firstInvalid.focus();
        }

        return isValid;
    }

    function updateCharacterCount() {
        const len = DOM.inputs.message.value.length;
        DOM.charCounter.textContent = `${len} / 1000 characters`;
        
        DOM.charCounter.classList.remove('limit-near', 'limit-reached');
        if (len >= 1000) DOM.charCounter.classList.add('limit-reached');
        else if (len >= 900) DOM.charCounter.classList.add('limit-near');
    }

    function updateFormProgress() {
        let validCount = 0;
        
        State.requiredFields.forEach(fieldName => {
            const input = DOM.inputs[fieldName];
            const val = input.type === 'checkbox' ? input.checked : input.value;
            
            // Check if it passes validation without marking UI as touched yet if user hasn't interacted
            if (Validators[fieldName]) {
                if (Validators[fieldName](val) === '') validCount++;
            }
        });

        const percentage = Math.round((validCount / State.totalRequired) * 100);
        DOM.progressFill.style.width = `${percentage}%`;
        DOM.progressText.textContent = percentage;
    }

    /* ==========================================================================
       Draft Management
       ========================================================================== */
    let saveTimeout;
    function debounceSaveDraft() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveDraft, 500);
    }

    function saveDraft() {
        const draft = {
            name: DOM.inputs.name.value,
            email: DOM.inputs.email.value,
            phone: DOM.inputs.phone.value,
            company: DOM.inputs.company.value,
            type: DOM.inputs.type.value,
            subject: DOM.inputs.subject.value,
            message: DOM.inputs.message.value
            // Deliberately not saving privacy checkbox state
        };
        
        // Only save if there's substantial data
        const hasData = Object.values(draft).some(v => v.trim() !== '');
        
        if (hasData) {
            localStorage.setItem('nexora_draft', JSON.stringify(draft));
            DOM.btnClearDraft.hidden = false;
        } else {
            clearDraft();
        }
    }

    function restoreDraft() {
        try {
            const saved = localStorage.getItem('nexora_draft');
            if (saved) {
                const draft = JSON.parse(saved);
                
                DOM.inputs.name.value = draft.name || '';
                DOM.inputs.email.value = draft.email || '';
                DOM.inputs.phone.value = draft.phone || '';
                DOM.inputs.company.value = draft.company || '';
                DOM.inputs.type.value = draft.type || '';
                DOM.inputs.subject.value = draft.subject || '';
                DOM.inputs.message.value = draft.message || '';
                
                updateCharacterCount();
                
                // Show clear draft button
                DOM.btnClearDraft.hidden = false;
                
                // Optional: show a silent toast
                setTimeout(() => showToast('Draft restored', 'info'), 500);
            }
        } catch (e) {
            console.error('Failed to restore draft', e);
        }
    }

    function clearDraft() {
        localStorage.removeItem('nexora_draft');
        DOM.btnClearDraft.hidden = true;
    }

    /* ==========================================================================
       Form Submission & Reset
       ========================================================================== */
    function handleFormSubmit(e) {
        e.preventDefault();
        if (State.isSubmitting) return;

        if (validateAll()) {
            submitForm();
        } else {
            showToast('Please fix the highlighted errors.', 'error');
        }
    }

    function submitForm() {
        State.isSubmitting = true;
        
        // UI Loading State
        const originalText = DOM.btnSubmitText.textContent;
        DOM.btnSubmitText.textContent = 'Sending...';
        DOM.btnSubmit.disabled = true;
        
        // Simulate Network Request
        setTimeout(() => {
            // Restore button
            DOM.btnSubmitText.textContent = originalText;
            DOM.btnSubmit.disabled = false;
            State.isSubmitting = false;
            
            // Show Success Panel
            DOM.formPanel.hidden = true;
            DOM.successPanel.hidden = false;
            
            clearDraft();
            showToast('Message prepared successfully.', 'success');
        }, 1500);
    }

    function resetForm(showToastMsg = false) {
        if(DOM.inputs.message.value.length > 50 && !confirm("Are you sure you want to reset the form? Your message will be lost.")) {
            return;
        }

        DOM.form.reset();
        State.touchedFields.clear();
        
        // Clear Error UI
        document.querySelectorAll('.form-group.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
            const errorSpan = el.querySelector('.error-msg');
            if(errorSpan) errorSpan.textContent = '';
        });
        
        updateCharacterCount();
        updateFormProgress();
        clearDraft();
        
        if(showToastMsg) showToast('Form reset.', 'info');
    }

    /* ==========================================================================
       Toast Notifications
       ========================================================================== */
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        } else {
            iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `
            ${iconSvg}
            <span class="toast-msg">${message}</span>
            <button class="toast-close" aria-label="Close notification">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        DOM.toastContainer.appendChild(toast);
        
        // Trigger reflow & animate in
        void toast.offsetWidth;
        toast.classList.add('active');

        // Close logic
        const removeToast = () => {
            toast.classList.remove('active');
            toast.classList.add('closing');
            setTimeout(() => toast.remove(), 400);
        };

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', removeToast);
        
        setTimeout(removeToast, 4000);
    }

    // Run Initialization
    init();
});