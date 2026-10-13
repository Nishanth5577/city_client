import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px', padding: '12px 16px', fontSize: '13px',
                background: 'var(--card-elevated)', color: 'var(--t2)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--dropdown-shadow)',
              },
              success: { iconTheme: { primary: '#059669', secondary: 'var(--card-elevated)' } },
              error: { iconTheme: { primary: '#DC2626', secondary: 'var(--card-elevated)' } },
            }}
          />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
