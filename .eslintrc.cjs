module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "release/",
    "build/",
    "playwright-report/",
    "test-results/",
  ],
  extends: ["plugin:prettier/recommended"],
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: __dirname,
        createDefaultProgram: true,
      },
      extends: ["plugin:prettier/recommended"],
      rules: {
        "@typescript-eslint/prefer-optional-chain": "error",
      },
    },
    {
      files: ["**/*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".svelte"],
      },
      extends: ["plugin:svelte/recommended", "plugin:prettier/recommended"],
    },
  ],
};
