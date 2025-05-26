/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R;
      toBeNull(): R;
      toBe(expected: any): R;
      not: Matchers<R>;
    }
  }
}

export {};
