import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import flowmark from "@flowmark/astro";
import { fileURLToPath } from "node:url";

const compilerPath = fileURLToPath(
  new URL("../../target/debug/flowmark", import.meta.url),
);

export default defineConfig({
  site: "https://flowmark.example",
  integrations: [flowmark({ compilerPath })],
  vite: {
    plugins: [tailwindcss()],
  },
});
