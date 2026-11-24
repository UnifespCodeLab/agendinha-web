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
      background_color: "#ffffff",
      icons: [
        {
          src: "icons/icon-48x48.png",
          sizes: "48x48",
          type: "image/png"
        },
        {
          src: "icons/icon-72x72.png",
          sizes: "72x72",
          type: "image/png"
        },
        {
          src: "icons/icon-96x96.png",
          sizes: "96x96",
          type: "image/png"
        },
        {
          src: "icons/icon-144x144.png",
          sizes: "144x144",
          type: "image/png"
        },
        {
          src: "icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
      ]
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
