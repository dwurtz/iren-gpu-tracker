import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // was '/iren-gpu-tracker/' for project pages; must be '/' for a custom domain
})
