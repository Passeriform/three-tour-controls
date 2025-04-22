import "vitest"

interface CustomMatchers<R = unknown> {
    toBeCloseToArray(received: number[], precision?: number): R
}

declare module "vitest" {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
