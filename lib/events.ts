type Listener = () => void;
const fireListeners = new Set<Listener>();
const cityListeners = new Set<Listener>();

export function onFirePress(fn: Listener) {
  fireListeners.add(fn);
  return () => { fireListeners.delete(fn); };
}

export function emitFirePress() {
  fireListeners.forEach((fn) => fn());
}

export function onCityPickerToggle(fn: Listener) {
  cityListeners.add(fn);
  return () => { cityListeners.delete(fn); };
}

export function emitCityPickerToggle() {
  cityListeners.forEach((fn) => fn());
}
