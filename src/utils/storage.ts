export const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.error("Storage access blocked", e);
  }
  return null;
};

export const setStorageItem = (key: string, value: string) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error("Storage access blocked", e);
  }
};
