import { createEslintConfig } from "@reddoorla/maintenance/configs/eslint";
import svelteConfig from "./svelte.config.js";

export default [
  ...createEslintConfig({ svelteConfig }),
  {
    // The Phase 0 reference capture: the live site's own HTML, CSS and
    // JavaScript, downloaded byte-for-byte by matching/capture-reference.mjs so
    // Phase 1 has something to grep after the cutover. It is git-ignored but
    // present on disk, which is the same shape the shared config already
    // ignores `docs/superpowers/` and `scratchpad/` for — linting third-party
    // minified bundles produced 745 errors here (Webflow's two chunks plus
    // jQuery 3.5.1) and `pnpm verify` went red on the first capture.
    //
    // Scoped to matching/spec/ and NOT to matching/, deliberately: the probes
    // and gate scripts in matching/ are ours and must stay linted.
    ignores: ["matching/spec/"],
  },
];
