import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/contracts",
  "packages/domain",
  "packages/application",
  "packages/config",
  "packages/adapters-stub",
  "packages/adapters-rdap",
  "apps/api",
]);
