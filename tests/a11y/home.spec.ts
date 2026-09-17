import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe against the REAL home page, in the states a visitor actually puts it in.
 *
 * Why this file exists. `tests/a11y/fixtures.spec.ts` audits `/dev/a11y-fixtures`
 * and `/dev/animate-in` — pages that mount the STARTER's components. Not one of
 * the five Navy slices is on either, so for the whole build to date the a11y
 * gate was green and that green was not evidence about anything this site
 * ships (#24). Two serious violations were sitting on the live page the whole
 * time, and a closed-page audit could not see either:
 *
 *   - `color-contrast` 2.29:1 on the penthouse floor tab's label. The reference
 *     lightens the tab on HOVER (`#ffffff7d`, ref css:2321); composited over the
 *     firebrick band that is `#d49e97`, and the label stays white. Needs a
 *     pointer on the element — no at-rest audit reaches it.
 *   - `target-size` on the floor-plan download link, squeezed to an 11.3×50px
 *     hit area by two of the resident popups. Needs a popup OPEN.
 *
 * So the rule this file encodes: an a11y gate has to drive the interactions,
 * not just load the document. It audits the composed page rather than a
 * fixture, because a fixture is a claim that the fixture resembles the page.
 *
 * NOTE ON MOTION. The shared config forces `contextOptions.reducedMotion:
 * "reduce"` on every test (@reddoorla/maintenance playwright-a11y). The resident
 * popups BRANCH on that — `prefersReducedMotion()` decides whether the fade runs
 * or state flips synchronously — so inheriting it would audit only the
 * synchronous path and leave the timed one unaudited, which is exactly the
 * vacuum CLAUDE.md warns about. Each dialog is therefore audited under
 * `no-preference`, with the fade allowed to finish.
 */

/**
 * BUDGET. Playwright's default per-test timeout is 30s, and it is a per-TEST
 * budget — the two looping tests below run a full axe pass per interactive
 * state, so their cost scales with the number of states while the default does
 * not. Measured 2026-09-17 in one `pnpm verify` (every spec sharing the
 * machine): "every resident popup" took 31.0s at 1440px and FAILED on timeout,
 * while the identical 390px test PASSED at 29.9s — 0.1s of headroom — and
 * "every floor tab" passed at 26.0s. Re-run alone, both popup viewports pass,
 * 57.2s for the pair, exit 0. So the red was contention against a budget that
 * was never sized for the loop, not a defect in the page; at 7 popups x (1.0s
 * of fixed waits + an axe pass) the 30s default was always going to be decided
 * by machine load.
 *
 * The fleet's own generated a11y spec (@reddoorla/maintenance) reaches this
 * conclusion in almost these words — "we loop through every configured route in
 * a single test, so the budget needs to scale" — and sets five minutes. Match
 * that number rather than inventing a tighter one: this gate exists to find
 * violations, and a timeout is not one. A real hang still fails, five minutes
 * later.
 */
const LOOPED_AUDIT_TIMEOUT_MS = 5 * 60_000;

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const FLOOR_TRIGGER = '[aria-controls^="lofts-floor-panel-"]';
const DIALOG_TRIGGER = 'a[aria-haspopup="dialog"]';

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  // The default report is one line per rule; the useful unit here is the node,
  // since two of these rules fire on a single element in a single state.
  return violations.flatMap((v) =>
    v.nodes.map((n) => `[${v.impact}] ${v.id} ${JSON.stringify(n.target)} — ${v.help}`),
  );
}

for (const width of [1440, 390]) {
  test.describe(`home at ${width}px`, () => {
    test.use({ viewport: { width, height: width < 500 ? 844 : 900 } });

    test("at rest", async ({ page }) => {
      await page.goto("/");
      expect(await violations(page)).toEqual([]);
    });

    test("every floor tab, hovered and opened", async ({ page }) => {
      test.setTimeout(LOOPED_AUDIT_TIMEOUT_MS);
      await page.goto("/", { waitUntil: "networkidle" });
      const triggers = page.locator(FLOOR_TRIGGER);
      const n = await triggers.count();
      // Guard the loop bound: `toEqual([])` over zero iterations is the classic
      // way this kind of test passes while measuring nothing.
      expect(n).toBe(4);
      for (let i = 0; i < n; i++) {
        // hover THEN click: the contrast defect lives in :hover, and a panel
        // that is merely open does not reproduce it.
        await triggers.nth(i).scrollIntoViewIfNeeded();
        await triggers.nth(i).hover();
        await triggers.nth(i).click();
        await page.waitForTimeout(250);
        expect(await violations(page), `floor tab ${i + 1} hovered+open`).toEqual([]);
      }
    });

    test("every resident popup, open, with motion allowed", async ({ page }) => {
      test.setTimeout(LOOPED_AUDIT_TIMEOUT_MS);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      // WAIT FOR HYDRATION. The triggers are `<a href="#">` server-side; their
      // handler is attached on hydrate. A click that lands before that follows
      // the empty fragment, opens nothing, and leaves axe auditing the CLOSED
      // page — a green that means nothing, which is the failure this whole file
      // exists to stop. `load` is not enough; this cost one debugging round.
      await page.goto("/", { waitUntil: "networkidle" });
      const triggers = page.locator(DIALOG_TRIGGER);
      const n = await triggers.count();
      expect(n).toBe(7);
      for (let i = 0; i < n; i++) {
        const name = (await triggers.nth(i).innerText()).trim();
        await triggers.nth(i).scrollIntoViewIfNeeded();
        // NOT `{ force: true }`: a forced click dispatches at the element's
        // coordinates and lands on the hero overlay instead, so the popup never
        // opens and the audit silently measures the closed page.
        await triggers.nth(i).click();
        // Long enough for the fade to land; the popup is display:none until it
        // does, and axe skips hidden subtrees.
        await expect(page.locator('[role="dialog"]:visible')).toHaveCount(1);
        await page.waitForTimeout(600);
        expect(await violations(page), `popup "${name}" open`).toEqual([]);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
      }
    });
  });
}
