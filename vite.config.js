import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /proxy/openai/* calls → https://api.openai.com/*
      '/proxy/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/openai/, ''),
      },
      // All /proxy/gemini/* calls → https://generativelanguage.googleapis.com/*
      '/proxy/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/gemini/, ''),
      },
      // All /proxy/groq/* calls → https://api.groq.com/*
      '/proxy/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/groq/, ''),
      },
    },
  },
})