import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/latin-400.css';
import '@fontsource/noto-naskh-arabic/arabic-600.css';
import '@fontsource/noto-naskh-arabic/arabic-700.css';
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
