import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import Chai from './chai'; // Ensure Chai is imported correctly


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Chai />
  </React.StrictMode>
);


