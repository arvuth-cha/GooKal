import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration';
import { loadAccessibilitySettings, applyAccessibilityToDOM } from './utils/accessibilityService';

// Initialize Accessibility & Theme on startup
applyAccessibilityToDOM(loadAccessibilitySettings());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker to enable asset caching and offline support
registerServiceWorker();


