import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://flowmark.example",
  vite: {
    plugins: [tailwindcss()],
  },
});
