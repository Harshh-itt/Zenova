import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import bodyHtml from './legacyBody.html?raw';
import { initZenovaRuntime } from './runtime';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cleanup = initZenovaRuntime();
    setReady(true);
    return cleanup;
  }, []);

  return <div id="zenova-root" data-react="true" data-ready={ready} dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}

createRoot(document.getElementById('root')).render(<App />);
