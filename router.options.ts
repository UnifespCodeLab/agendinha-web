import type { RouterOptions } from "vue-router";

export default <RouterOptions>{
  routes: (routes) => {
    // Add a custom route
    routes.push({
      path: "/custom-page",
      component: () => import("~/pages/custom-page.vue"),
    });
    // Modify an existing route
    const aboutRoute = routes.find((route) => route.name === "about");
    if (aboutRoute) {
      aboutRoute.meta = { requiresAuth: true };
    }
    return routes;
  },
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
};
