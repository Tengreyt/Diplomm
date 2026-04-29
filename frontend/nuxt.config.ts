export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  tailwindcss: {
    cssPath: "./app/assets/css/main.css"
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:4001/api"
    }
  },
  compatibilityDate: "2025-01-01"
});
