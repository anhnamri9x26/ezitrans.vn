"use client";

import { useEffect } from 'react';

export default function CraftScriptsInitializer() {

  useEffect(() => {
    const handleAccordionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Handle Accordion Header Click
      const titleWrap = target.closest('.craft-accordion-title-wrapper');
      if (titleWrap) {
        const item = titleWrap.closest('.craft-accordion-item');
        if (!item) return;

        const container = item.closest('.craft-accordion-container');
        if (!container) return;

        e.preventDefault();
        e.stopPropagation();
        
        const maxExpanded = container.getAttribute('data-max-expanded');
        const maxOne = maxExpanded === 'one';
        
        const isCurrentlyActive = item.classList.contains('active');
        const items = container.querySelectorAll('.craft-accordion-item');

        if (maxOne) {
          items.forEach((other) => {
            other.classList.remove('active');
            const iconWrap = other.querySelector('.craft-accordion-icon');
            if (iconWrap) {
              const inactiveSvg = iconWrap.getAttribute('data-inactive');
              if (inactiveSvg) {
                iconWrap.innerHTML = decodeURIComponent(inactiveSvg);
              }
            }
          });
        }

        if (isCurrentlyActive) {
          item.classList.remove('active');
          const iconWrap = item.querySelector('.craft-accordion-icon');
          if (iconWrap) {
            const inactiveSvg = iconWrap.getAttribute('data-inactive');
            if (inactiveSvg) {
              iconWrap.innerHTML = decodeURIComponent(inactiveSvg);
            }
          }
        } else {
          item.classList.add('active');
          const iconWrap = item.querySelector('.craft-accordion-icon');
          if (iconWrap) {
            const activeSvg = iconWrap.getAttribute('data-active');
            if (activeSvg) {
              iconWrap.innerHTML = decodeURIComponent(activeSvg);
            }
          }
        }
      }
    };

    // Remove snapshots left by older builds. Navigation is handled by Next.js
    // Link components (or by the browser for plain anchors); globally cloning
    // the document and intercepting clicks causes stale fixed overlays and
    // breaks scrolling/interactions when transitions overlap.
    document.getElementById('lexi-route-snapshot')?.remove();

    // Form Interactions
    const handleFormClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const prevBtn = target.closest('.craft-form-prev-btn');
      if (prevBtn) {
        e.preventDefault();
        const form = prevBtn.closest('.craft-form-element') as HTMLFormElement;
        if (!form) return;
        const pagesContainer = form.querySelector('.craft-form-pages-container');
        if (!pagesContainer) return;
        const pages = Array.from(pagesContainer.querySelectorAll('.craft-form-page'));
        const activePageIdx = pages.findIndex(p => (p as HTMLElement).style.display !== 'none');
        if (activePageIdx > 0) {
          (pages[activePageIdx] as HTMLElement).style.display = 'none';
          (pages[activePageIdx - 1] as HTMLElement).style.display = 'block';
          
          // Update indicators
          const stepsContainer = form.querySelector('.craft-form-steps');
          if (stepsContainer) {
            const indicators = stepsContainer.querySelectorAll('.craft-form-step-indicator');
            indicators.forEach((ind, i) => {
              ind.classList.remove('active');
              ind.classList.remove('completed');
              if (i === activePageIdx - 1) {
                ind.classList.add('active');
              } else if (i < activePageIdx - 1) {
                ind.classList.add('completed');
              }
            });
          }
        }
        return;
      }

      const nextBtn = target.closest('.craft-form-next-btn');
      if (nextBtn) {
        e.preventDefault();
        const form = nextBtn.closest('.craft-form-element') as HTMLFormElement;
        if (!form) return;
        
        const pagesContainer = form.querySelector('.craft-form-pages-container');
        if (!pagesContainer) return;
        const pages = Array.from(pagesContainer.querySelectorAll('.craft-form-page'));
        const activePageIdx = pages.findIndex(p => (p as HTMLElement).style.display !== 'none');
        const activePage = pages[activePageIdx] as HTMLElement;

        // Validation using Browser Validation API
        const inputs = Array.from(activePage.querySelectorAll('input, select, textarea')) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
        let isValid = true;

        inputs.forEach(input => {
          const errorMsgContainer = input.closest('.craft-form-field-wrapper')?.querySelector('.craft-form-error-msg') as HTMLElement;
          if (!input.checkValidity()) {
            isValid = false;
            input.style.borderColor = '#ef4444';
            if (errorMsgContainer) {
              const configBase64 = form.getAttribute('data-config') || '';
              let requiredMsg = 'Trường này là bắt buộc.';
              let invalidMsg = 'Dữ liệu không hợp lệ.';
              try {
                if (configBase64) {
                  const config = JSON.parse(atob(configBase64));
                  if (config.messages) {
                    requiredMsg = config.messages.required;
                    invalidMsg = config.messages.invalid;
                  }
                }
              } catch (e) {}
              errorMsgContainer.textContent = input.validity.valueMissing ? requiredMsg : invalidMsg;
              errorMsgContainer.style.display = 'block';
            }
          } else {
            // Restore original border color from inline style if it was overridden, or just empty string.
            // But wait, the original border color is set in style attribute. Clearing it resets to whatever CSS class has.
            // A safer approach: we can reset it to empty string.
            input.style.borderColor = '';
            if (errorMsgContainer) errorMsgContainer.style.display = 'none';
          }
        });

        if (isValid && activePageIdx < pages.length - 1) {

          activePage.style.display = 'none';
          (pages[activePageIdx + 1] as HTMLElement).style.display = 'block';
          
          // Update indicators
          const stepsContainer = form.querySelector('.craft-form-steps');
          if (stepsContainer) {
            const indicators = stepsContainer.querySelectorAll('.craft-form-step-indicator');
            indicators.forEach((ind, i) => {
              ind.classList.remove('active');
              ind.classList.remove('completed');
              if (i === activePageIdx + 1) {
                ind.classList.add('active');
              } else if (i < activePageIdx + 1) {
                ind.classList.add('completed');
              }
            });
          }
        }
      }
    };

    const handleFormSubmit = async (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form.classList.contains('craft-form-element')) return;
      
      e.preventDefault();
      
      const configBase64 = form.getAttribute('data-config');
      if (!configBase64) return;
      
      let config;
      try {
        config = JSON.parse(atob(configBase64));
      } catch (err) {
        console.error('Failed to parse form config', err);
        return;
      }

      const statusMsg = form.querySelector('.craft-form-status-msg') as HTMLElement;
      
      // Validate all pages
      const inputs = Array.from(form.querySelectorAll('input, select, textarea')) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
      let isValid = true;
      inputs.forEach(input => {
        const errorMsgContainer = input.closest('.craft-form-field-wrapper')?.querySelector('.craft-form-error-msg') as HTMLElement;
        if (!input.checkValidity()) {
          isValid = false;
          input.style.borderColor = '#ef4444';
          if (errorMsgContainer) {
            errorMsgContainer.textContent = input.validity.valueMissing ? (config.messages?.required || 'Required') : (config.messages?.invalid || 'Invalid');
            errorMsgContainer.style.display = 'block';
          }
        } else {
          input.style.borderColor = '';
          if (errorMsgContainer) errorMsgContainer.style.display = 'none';
        }
      });

      if (!isValid) {
        if (statusMsg) {
          statusMsg.textContent = config.messages?.error || 'Vui lòng kiểm tra lại dữ liệu.';
          statusMsg.style.backgroundColor = '#fef2f2';
          statusMsg.style.color = '#ef4444';
          statusMsg.style.display = 'block';
        }
        return;
      }

      // Submit data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Handle checkboxes array
      for (const [key, value] of formData.entries()) {
        if (key.endsWith('[]')) {
          const cleanKey = key.slice(0, -2);
          if (!data[cleanKey]) (data as any)[cleanKey] = [];
          (data as any)[cleanKey].push(value);
        }
      }

      const submitBtn = form.querySelector('.craft-form-submit-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
      }

      try {
        const res = await fetch('/api/forms/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId: form.getAttribute('data-form-id'),
            formName: decodeURIComponent(form.getAttribute('data-form-name') || ''),
            pageUrl: window.location.href,
            fields: data,
            config: config
          })
        });

        const result = await res.json();
        if (res.ok) {
          if (statusMsg) {
            statusMsg.textContent = config.messages?.success || 'Gửi form thành công!';
            statusMsg.style.backgroundColor = '#ecfdf5';
            statusMsg.style.color = '#10b981';
            statusMsg.style.display = 'block';
          }
          form.reset();
          
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
          }
        } else {
          throw new Error(result.error || 'Submit failed');
        }
      } catch (err: any) {
        if (statusMsg) {
          statusMsg.textContent = config.messages?.error || 'Có lỗi xảy ra: ' + err.message;
          statusMsg.style.backgroundColor = '#fef2f2';
          statusMsg.style.color = '#ef4444';
          statusMsg.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
        }
      }
    };

    document.body.addEventListener('click', handleFormClick);
    document.body.addEventListener('submit', handleFormSubmit);
    
    // Evaluate scripts injected by dangerouslySetInnerHTML
    const executeInjectedScripts = () => {
      const parts = document.querySelectorAll('[data-template-part]');
      parts.forEach(part => {
        const scripts = part.querySelectorAll('script');
        scripts.forEach(oldScript => {
          if (oldScript.getAttribute('data-executed') === 'true') return;
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          newScript.textContent = oldScript.textContent;
          newScript.setAttribute('data-executed', 'true');
          try {
            oldScript.parentNode?.replaceChild(newScript, oldScript);
          } catch (e) {
            console.error('Failed to execute injected script:', e);
          }
        });
      });
    };

    const handleFormInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('craft-form-input')) return;

      const input = target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const errorMsgContainer = input.closest('.craft-form-field-wrapper')?.querySelector('.craft-form-error-msg') as HTMLElement;
      const form = input.closest('.craft-form-element') as HTMLFormElement;
      
      if (!form) return;

      if (!input.checkValidity()) {
        input.style.borderColor = '#ef4444';
        if (errorMsgContainer) {
          const configBase64 = form.getAttribute('data-config') || '';
          let requiredMsg = 'Trường này là bắt buộc.';
          let invalidMsg = 'Dữ liệu không hợp lệ.';
          try {
            if (configBase64) {
              const config = JSON.parse(atob(configBase64));
              if (config.messages) {
                requiredMsg = config.messages.required;
                invalidMsg = config.messages.invalid;
              }
            }
          } catch (e) {}
          errorMsgContainer.textContent = input.validity.valueMissing ? requiredMsg : invalidMsg;
          errorMsgContainer.style.display = 'block';
        }
      } else {
        // Find the original border color from the dataset if we haven't saved it yet
        if (!input.dataset.originalBorderColor) {
          // It's possible the original was set via inline style, but once overridden by `#ef4444`,
          // setting it to '' clears the inline style, which falls back to the CSS class or inherits.
          // In renderer.ts, we inject `border: 1px solid #xxx` into the style attribute.
          // Wait, if we set input.style.borderColor = '', it clears the inline borderColor ONLY,
          // leaving the original border-width and border-style intact if they were shorthand `border:`?
          // Actually, if renderer sets `style="...;border:1px solid #e2e8f0;..."`, setting `input.style.borderColor = '#ef4444'` modifies the inline style.
          // Setting it to `''` will remove the inline borderColor, reverting to the shorthand's color or the class.
          // Wait, `border` shorthand expands to `borderColor`. Removing `borderColor` might clear the border completely!
        }
        
        // Better fix: if the form is valid, we can restore it by not touching it, but we need to revert the error.
        // For now, let's just remove the inline borderColor to see if it reverts.
        input.style.borderColor = '';
        if (errorMsgContainer) errorMsgContainer.style.display = 'none';
      }
    };

    document.body.addEventListener('submit', handleFormSubmit);
    document.body.addEventListener('click', handleFormClick);
    document.body.addEventListener('input', handleFormInput, true); // Use capture phase for input events
    document.body.addEventListener('change', handleFormInput, true);

    // Run after a short delay to ensure DOM is ready
    const timer = setTimeout(executeInjectedScripts, 100);

    return () => {
      document.body.removeEventListener('click', handleAccordionClick);
      document.body.removeEventListener('submit', handleFormSubmit);
      document.body.removeEventListener('click', handleFormClick);
      document.body.removeEventListener('input', handleFormInput, true);
      document.body.removeEventListener('change', handleFormInput, true);
      clearTimeout(timer);
    };
  }, []);

  return null;
}
