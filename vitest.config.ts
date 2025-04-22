import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: "./lib/setupTests.ts",
        fakeTimers: {
            toFake: [...(configDefaults.fakeTimers.toFake ?? []), "performance"],
        },
    },
})
