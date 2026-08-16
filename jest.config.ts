import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // "server-only" throws unconditionally under Jest's default module
    // resolution condition; swap in its no-op "react-server" build instead.
    "^server-only$": "<rootDir>/node_modules/server-only/empty.js",
  },
};

export default createJestConfig(config);
