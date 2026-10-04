type TapKeyEvent = Pick<KeyboardEvent, "key" | "repeat" | "preventDefault">;

export function handleTapKeyDown(event: TapKeyEvent, onTap: () => void): void {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (!event.repeat) onTap();
}
