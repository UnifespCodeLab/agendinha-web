// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
export default defineNuxtConfig({
  app: {
    pageTransition: { name: "slide-right", mode: "out-in" },
  },
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  build: {
    transpile: ["vuetify"],
  },
  modules: [
    "@nuxt/test-utils/module",
    "@pinia/nuxt",
    "@nuxt/eslint",
    "@nuxtjs/eslint-module",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@vite-pwa/nuxt",
    "@pinia/nuxt",
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config: any) => {
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  pwa: {
    manifest: {
      name: "Agendinha",
      description: "Agendinha",
      short_name: "Agendinha",
      display: "standalone",
      background_color: "#ffffff",
    },
    workbox: {
      navigateFallback: "/",
    },
    devOptions: {
      enabled: true,
      type: "module"
    }
  },
  icon: {
    customCollections: [
      {
        prefix: "icons",
        dir: "./app/assets/icons",
      },
    ],
  },
  eslint: {},
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:8080/",
      googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID,
      vapidPublicKey: process.env.NUXT_VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.NUXT_VAPID_PRIVATE_KEY,
    },
  },
  css: ["~/assets/css/main.css"],
});
