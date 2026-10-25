import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#131929',
            color: '#f1f5f9',
            border: '1px solid #1e2d4a',
            borderRadius: '8px',
            fontSize: '14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#131929',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#131929',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
