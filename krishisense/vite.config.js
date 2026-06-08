import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-is'],
  },
  server: {
    proxy: {
      "/modis": {
        target: "https://modis.ornl.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/modis/, ""),
      },
    },
  },
})
