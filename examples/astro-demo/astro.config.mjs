import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import flowmark from "@flowmark/astro";

export default defineConfig({
  site: "https://flowmark.example",
  integrations: [flowmark()],
  vite: {
    plugins: [tailwindcss()],
  },
});
