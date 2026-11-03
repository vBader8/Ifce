import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/base.css';
import './styles/book.css';
import './styles/components.css';
import { AppProvider } from './app/store';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

// Offline support for the multi-file build (service workers do not run from file://).
if (!__STANDALONE__ && 'serviceWorker' in navigator && location.protocol.startsWith('http') && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
