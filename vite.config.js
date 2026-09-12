import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/marginline/",
  plugins: [react()],
  server: {
    port: 5227,
    proxy: {
      "/api": "http://localhost:5000"
    }
  },
  build: {
    outDir: "dist"
  }
});
