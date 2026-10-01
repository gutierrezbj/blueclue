export const PREPARATION_SECONDS = 4;

export function preparePlayback(onTick: (seconds: number | null) => void, onReady: () => void): () => void {
  let remaining = PREPARATION_SECONDS;
  onTick(remaining);
  const timer = setInterval(() => {
    remaining -= 1;
    if (remaining === 0) {
      clearInterval(timer);
      onTick(null);
      onReady();
    } else {
      onTick(remaining);
    }
  }, 1000);
  return () => clearInterval(timer);
}
