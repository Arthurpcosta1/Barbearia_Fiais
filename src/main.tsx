// Ensure window.fetch has a setter if any environment script attempts assignment
(function initFetchAccessor() {
  try {
    if (typeof window !== 'undefined') {
      const origFetch = window.fetch ? window.fetch.bind(window) : undefined;
      let currFetch = origFetch;
      const desc = {
        get: () => currFetch,
        set: (fn: typeof fetch) => {
          currFetch = fn;
        },
        configurable: true,
        enumerable: true,
      };
      Object.defineProperty(window, 'fetch', desc);
      if (typeof globalThis !== 'undefined' && globalThis !== window) {
        try {
          Object.defineProperty(globalThis, 'fetch', desc);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
