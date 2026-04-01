import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCSRF } from "./services/api";

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration.scope);
        
        // Check for updates on page load
        registration.update();
        
        // Check for updates periodically (every 5 minutes in dev, every hour in prod)
        const updateInterval = import.meta.env.DEV ? 5 * 60 * 1000 : 60 * 60 * 1000;
        setInterval(() => {
          registration.update();
        }, updateInterval);
        
        // Handle updates - immediately activate new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available - skip waiting and reload
                console.log('[App] New content available, activating...');
                
                // Tell the new SW to skip waiting and take over
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                
                // Dispatch event for UI notification
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });

        // When the new SW takes over, reload the page to get fresh bundles
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('[App] New service worker activated, reloading...');
            window.location.reload();
          }
        });
      })
      .catch((error) => {
        console.error('[App] Service Worker registration failed:', error);
      });
  });
  
  // Expose function to manually clear SW caches (useful for debugging)
  (window as unknown as { clearSWCache: () => void }).clearSWCache = () => {
    navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHES' });
    console.log('[App] Cache clear requested');
  };
}

// Initialize CSRF protection on app startup, then render
initCSRF().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
