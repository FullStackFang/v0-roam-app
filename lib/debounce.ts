export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  }) as unknown as T;
}
