import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
    build: {
        lib: {
            entry: "lib/index.ts",
            name: "TourControls",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "mjs": "cjs"}`,
        },
        rollupOptions: {
            external: ["three"],
            output: {
                globals: {
                    three: "THREE",
                },
            },
        },
        outDir: "dist",
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
            tsconfigPath: "./tsconfig.json",
        }),
    ],
})
