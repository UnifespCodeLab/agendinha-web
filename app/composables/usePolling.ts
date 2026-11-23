export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs = 30_000,
) {
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (!document.hidden) callback();
  };

  onMounted(() => {
    timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick); // volta para a aba
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
  });
}