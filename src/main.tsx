import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/bricolage-grotesque';
import './styles/tokens.css';
import './styles/base.css';
import './site/site.css';
import { App } from './App';

// After a redeploy, an open tab may ask for a lesson chunk that no longer exists (file names
// change with every build). Reload once to pick up the new index.html — at most every 30 s.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'unpacked:chunk-reload';
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    /* storage blocked */
  }
  if (Date.now() - last < 30_000) return; // already tried: let the page show its error state
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage blocked */
  }
  event.preventDefault();
  location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
