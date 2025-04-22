import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Buffer } from 'buffer';

// Polyfill Buffer if not available
if (!window.Buffer) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.Buffer = Buffer;
}

// Set initial background color to #141414 instead of black
document.body.style.backgroundColor = '#141414';
document.documentElement.style.backgroundColor = '#141414';

// Add Google Fonts dynamically
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
document.head.appendChild(linkElement);

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
