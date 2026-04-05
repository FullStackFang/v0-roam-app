type Listener = () => void;
const listeners = new Set<Listener>();

export function onFirePress(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emitFirePress() {
  listeners.forEach((fn) => fn());
}
