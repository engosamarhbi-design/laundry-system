import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app under /<repo>/
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    fs: {
      // يسمح باستيراد ملفات من مجلد المشروع الأعلى (مثل laundry-system-with-auth.jsx)
      allow: [path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')],
    },
  },
})
