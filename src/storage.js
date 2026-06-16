// Local persistence layer. Swappable for a real backend later (same async shape).
const PREFIX = "lifetracker:";

export const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? null : { key, value: v };
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
      return { key, value };
    } catch (e) {
      console.error("storage.set failed", e);
      return null;
    }
  },
  async remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.error("storage.remove failed", e);
    }
  }
};
