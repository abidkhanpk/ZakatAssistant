'use client';

import { useEffect } from 'react';

function getProcessingText(form: HTMLFormElement, preferred?: string | null) {
  if (preferred) return preferred;
  const dir = form.getAttribute('dir') || document.documentElement.getAttribute('dir') || 'ltr';
  return dir === 'rtl' ? 'پروسیسنگ...' : 'Processing...';
}

function disableSubmitButton(button: HTMLButtonElement, form: HTMLFormElement) {
  if (button.dataset.submittingLocked === 'true') return;
  button.dataset.submittingLocked = 'true';
  button.dataset.originalHtml = button.innerHTML;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = getProcessingText(form, button.getAttribute('data-processing-text'));
}

function disableSubmitInput(input: HTMLInputElement, form: HTMLFormElement) {
  if (input.dataset.submittingLocked === 'true') return;
  input.dataset.submittingLocked = 'true';
  input.dataset.originalValue = input.value;
  input.disabled = true;
  input.setAttribute('aria-busy', 'true');
  input.value = getProcessingText(form, input.getAttribute('data-processing-text'));
}

function restoreSubmitStates() {
  document.querySelectorAll<HTMLButtonElement>('button[data-submitting-locked="true"]').forEach((button) => {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.submittingLocked;
    delete button.dataset.originalHtml;
  });

  document.querySelectorAll<HTMLInputElement>('input[type="submit"][data-submitting-locked="true"]').forEach((input) => {
    input.disabled = false;
    input.removeAttribute('aria-busy');
    if (input.dataset.originalValue) input.value = input.dataset.originalValue;
    delete input.dataset.submittingLocked;
    delete input.dataset.originalValue;
  });

  document.querySelectorAll<HTMLFormElement>('form[data-submitting="true"]').forEach((form) => {
    delete form.dataset.submitting;
  });
}

export function SubmitPendingIndicator() {
  useEffect(() => {
    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.dataset.submitting === 'true') return;
      if (form.dataset.skipSubmitPending === 'true') return;
      form.dataset.submitting = 'true';

      form.querySelectorAll<HTMLButtonElement>('button[type="submit"], button:not([type])').forEach((button) => {
        disableSubmitButton(button, form);
      });

      form.querySelectorAll<HTMLInputElement>('input[type="submit"]').forEach((input) => {
        disableSubmitInput(input, form);
      });

      const submitter = (event as SubmitEvent).submitter;
      if (submitter instanceof HTMLButtonElement) {
        disableSubmitButton(submitter, form);
      } else if (submitter instanceof HTMLInputElement && submitter.type === 'submit') {
        disableSubmitInput(submitter, form);
      }
    };

    const handlePageShow = () => restoreSubmitStates();

    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return null;
}
