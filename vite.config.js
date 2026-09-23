import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the repository name: GitHub Pages serves the app at
// https://pyw0w.github.io/projectflow-test/
export default defineConfig({
  base: '/projectflow-test/',
  plugins: [react()],
})
