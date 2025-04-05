import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './index.css';
import '@/assets/preview.png';
import '@/assets/favicon.png';


import router from '@/router';
import { ThemeProvider } from '@/components/ThemeProvider';
import Layout from '@/components/Layout';
const app = document.getElementById('app');

ReactDOM.createRoot(app).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="halkyonic-theme">
        <RouterProvider router={router}>
          <Layout />
        </RouterProvider>
      </ThemeProvider>
  </React.StrictMode>
);