const listeners = new Map();

export const gameBus = {
  on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => this.off(type, fn);
  },
  off(type, fn) {
    listeners.get(type)?.delete(fn);
  },
  emit(type, payload) {
    const set = listeners.get(type);
    if (!set) return;
    [...set].forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[gameBus] ${type}`, err);
      }
    });
  },
};
