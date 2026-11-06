import { useAuthStore } from "~/stores/auth";
import { useLoaderStore } from "~/stores/loader";

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const loader = useLoaderStore();
  const token = useCookie("token");
  const { user } = storeToRefs(auth);

  if (token.value) {
    loader.startLoading();
    await auth.refreshAuth();
    loader.endLoading();
  }

  const requiredRole = to.meta.requiresRole as string | string[] | undefined;

  if (!token.value && requiredRole) {
    const firstTime = useCookie("firsttime");
    const target = firstTime.value === "false" ? "/login" : "/boas-vindas";

    if (to.path !== target) return navigateTo(target);
  }

  if (token.value && requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(user.value.role)) {
      const target = user.value.role == "ROLE_ADMIN" ? "/admin" : "/";
      return navigateTo(target);
    }
  }

});