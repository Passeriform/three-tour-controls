import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        setupFiles: "./src/setupTests.ts",
        fakeTimers: {
            toFake: [...(configDefaults.fakeTimers.toFake ?? []), "performance"],
        },
    },
})
