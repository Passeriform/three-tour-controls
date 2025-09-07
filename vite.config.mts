import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
    build: {
        lib: {
            entry: "lib/index.ts",
            name: "TourControls",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],
})
