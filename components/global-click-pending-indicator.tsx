'use client';

import { useEffect } from 'react';

function markPending(element: HTMLElement) {
  element.dataset.clickPending = 'true';
  element.classList.add('ui-click-pending');
}

function clearPending(element: HTMLElement) {
  delete element.dataset.clickPending;
  element.classList.remove('ui-click-pending');
}

export function GlobalClickPendingIndicator() {
  useEffect(() => {
    const timers = new Map<HTMLElement, number>();

    const clearWithTimer = (element: HTMLElement, delayMs: number) => {
      if (timers.has(element)) window.clearTimeout(timers.get(element));
      const timerId = window.setTimeout(() => {
        if (element instanceof HTMLButtonElement) {
          element.disabled = false;
        }
        clearPending(element);
        timers.delete(element);
      }, delayMs);
      timers.set(element, timerId);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const button = target.closest('button');
      if (button) {
        const typeAttr = (button.getAttribute('type') || 'submit').toLowerCase();
        if (typeAttr === 'submit') return;

        if (button.dataset.clickPending === 'true') {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        markPending(button);
        button.disabled = true;
        clearWithTimer(button, 1200);
        return;
      }

      const link = target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;

      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('http://') || href.startsWith('https://')) return;

      if (link.dataset.clickPending === 'true') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      markPending(link);
      clearWithTimer(link, 3000);
    };

    const releaseAll = () => {
      document.querySelectorAll<HTMLElement>('[data-click-pending="true"]').forEach((element) => {
        if (element instanceof HTMLButtonElement) {
          element.disabled = false;
        }
        clearPending(element);
      });
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('pageshow', releaseAll);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('pageshow', releaseAll);
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  return null;
}
