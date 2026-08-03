/**
 * Global Security Guard
 * Prevents DevTools shortcuts, Right Click (Context Menu), and adds a Debugger Trap
 * to protect the application source code and runtime state across all pages.
 */
export const initSecurityGuard = () => {
  if (import.meta.env.MODE === 'development') {
    // In dev mode, we still allow F12 for debugging if needed, 
    // but in production or when enabled, it blocks everything.
  }

  // 1. Prevent Right Click (Context Menu)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 2. Prevent Keyboard Shortcuts for DevTools & View Source
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Cmd+Option+I/J/C on Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (View Source)
    if ((e.ctrlKey || e.metaKey) && ['U', 'u', 'S', 's'].includes(e.key)) {
      e.preventDefault();
      return false;
    }
  });

  // 3. DevTools Detection & Anti-Console Inspection (Debugger Trap)
  // Periodically triggers a debugger breakpoint if DevTools panel is open
  setInterval(() => {
    const startTime = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      // DevTools was opened and paused at debugger
      console.clear();
    }
  }, 1000);
};
