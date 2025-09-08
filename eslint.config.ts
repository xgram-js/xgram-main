import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser }
    },
    tseslint.configs.recommended,
    { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
    {
        rules: {
            "@typescript-eslint/explicit-member-accessibility": "error",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "no-empty-function": "off",
            "@typescript-eslint/no-empty-function": "off"
        }
    },
    {
        ignores: ["dist/*"]
    }
]);
