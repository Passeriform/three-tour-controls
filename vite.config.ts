import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
    build: {
        lib: {
            entry: "lib/index.ts",
            name: "TourControls",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format}.js`,
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
            tsconfigPath: "./tsconfig.json",
        }),
    ],
})
