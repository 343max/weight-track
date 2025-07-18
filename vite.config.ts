import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  root: "./frontend",
  build: {
    outDir: "../dist",
    assetsDir: "assets",
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
    allowedHosts: ["debian"],
  },
})
