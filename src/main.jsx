
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { StoreProvider } from './hooks/useStore.jsx'

console.log("✨ Seitu App v1.0.34 - Startup");

// FINAL RENDER - ErrorBoundary removed for React 19 compatibility
// GLOBAL ERROR HANDLER
window.onerror = function (message, source, lineno, colno, error) {
    console.error("GLOBAL ERROR:", error);
    alert("CRASH DETECTADO:\n" + message + "\n\nEn: " + source + ":" + lineno + ":" + colno);
    return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <StoreProvider>
        <App />
    </StoreProvider>
)
