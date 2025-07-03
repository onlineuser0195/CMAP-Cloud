import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   hmr: {
  //     overlay: false
  //   },
  //   host: true,
  //   port: 80,
  //   // port: 443,
  //   allowedHosts: ['cloud-voy.com', 'cmap.eastus.cloudapp.azure.com'],
  //   proxy: {
  //       '/api': {
  //         target: 'http://localhost:5000', // Node.js Backend server URL
  //         changeOrigin: true,
  //         secure: false,
  //       },
  //       '/python-api': {
  //         target: 'http://localhost:8000', // FastAPI backend
  //         changeOrigin: true,
  //         secure: false,
  //         rewrite: (path) => path.replace(/^\/python-api/, ''),
  //         ws: true // Enable WebSockets if needed
  //       }
  //   },
  // },
})
