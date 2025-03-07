import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Set a fixed port
    strictPort: true, // Prevent using another port if 5173 is taken
  },
})
