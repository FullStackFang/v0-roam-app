export type Debounced<T extends (...args: any[]) => any> = T & { cancel: () => void };

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): Debounced<T> {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  }) as Debounced<T>;
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
