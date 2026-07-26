import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom under Node exposes crypto.randomUUID, but guard just in case.
if (typeof crypto === 'undefined' || !('randomUUID' in crypto)) {
  throw new Error('crypto.randomUUID is required for the test environment');
}

// This jsdom build does not expose localStorage as a global; the app relies on
// it, so install a minimal in-memory Storage for the test run.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}

// jsdom lacks IntersectionObserver (used by the infinite-scroll feed) and
// Element.scrollIntoView (chat/comment auto-scroll). Provide inert stubs.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    configurable: true,
    writable: true,
  });
}

// jsdom's scrollIntoView logs "Not implemented"; replace it with a no-op.
Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
});
