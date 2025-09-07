import { configDefaults, defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.mts"

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: "./setupTests.ts",
    },
})
