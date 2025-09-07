import { expect } from "vitest"

expect.extend({
    toBeCloseToArray(received: number[], expected: number[], precision = 3) {
        if (received.length !== expected.length) {
            return {
                pass: false,
                expected,
                received,
                message: () =>
                    `Expected arrays to have the same length, received array length ${received.length}, but expected ${expected.length}`,
            }
        }

        for (let i = 0; i < received.length; i++) {
            if (Math.abs((received[i] ?? 0) - (expected[i] ?? 0)) > Math.pow(10, -precision)) {
                return {
                    pass: false,
                    expected,
                    received,
                    message: () =>
                        `Expected element at index ${i} to be close to ${expected[i]} (received ${received[i]}), with precision ${precision}`,
                }
            }
        }

        return {
            pass: true,
            expected,
            received,
            message: () => `Expected arrays to be close to each other`,
        }
    },
})
