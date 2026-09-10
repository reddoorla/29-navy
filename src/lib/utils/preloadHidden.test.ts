import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { preloadHidden } from "./preloadHidden";

/** Records every Image() the util constructs, in assignment order, so a test
 *  can see WHAT was set and in WHICH order — the srcset-before-src rule is an
 *  ordering rule and is invisible to a test that only reads final values. */
class RecordingImage {
  static made: RecordingImage[] = [];
  order: string[] = [];
  fetchPriority = "";
  decoding = "";
  #src = "";
  #srcset = "";
  #sizes = "";
  constructor() {
    RecordingImage.made.push(this);
  }
  set src(v: string) {
    this.#src = v;
    this.order.push(`src=${v}`);
  }
  get src() {
    return this.#src;
  }
  set srcset(v: string) {
    this.#srcset = v;
    this.order.push(`srcset=${v}`);
  }
  get srcset() {
    return this.#srcset;
  }
  set sizes(v: string) {
    this.#sizes = v;
    this.order.push(`sizes=${v}`);
  }
  get sizes() {
    return this.#sizes;
  }
}

const idle: Array<() => void> = [];

beforeEach(() => {
  RecordingImage.made = [];
  idle.length = 0;
  vi.stubGlobal("Image", RecordingImage);
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
    idle.push(cb);
    return idle.length;
  });
  vi.stubGlobal("cancelIdleCallback", vi.fn());
  Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
});
afterEach(() => vi.unstubAllGlobals());

const flush = () => idle.forEach((cb) => cb());

describe("preloadHidden", () => {
  it("fetches nothing until the browser is idle", () => {
    preloadHidden(["/a.png"]);
    // Scheduled, not started: warming during load would compete with the hero
    // and the LCP image for connections on exactly the slow links where it hurts.
    expect(RecordingImage.made).toEqual([]);
    flush();
    expect(RecordingImage.made.length).toBe(1);
  });

  it("waits for `load` when the document is still loading", () => {
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    preloadHidden(["/a.png"]);
    flush();
    expect(RecordingImage.made, "warmed before load fired").toEqual([]);
    window.dispatchEvent(new Event("load"));
    flush();
    expect(RecordingImage.made.length).toBe(1);
  });

  it("sets srcset and sizes BEFORE src", () => {
    // The browser resolves the candidate when src is assigned. Setting srcset
    // afterwards fetches the wrong one first — for the floor plans that means
    // pulling the 2402w original and then the 1600w candidate the <img> uses:
    // two fetches, and the pop-in this exists to prevent.
    preloadHidden([{ src: "/plan.png", srcset: "/plan-800.png 800w", sizes: "100vw" }]);
    flush();
    expect(RecordingImage.made[0].order).toEqual([
      "sizes=100vw",
      "srcset=/plan-800.png 800w",
      "src=/plan.png",
    ]);
  });

  it("accepts bare URLs and skips empty entries", () => {
    preloadHidden(["/a.png", null, undefined, { src: null }, "/b.png"]);
    flush();
    expect(RecordingImage.made.map((i) => i.src)).toEqual(["/a.png", "/b.png"]);
  });

  it("asks for low priority so it never outranks visible content", () => {
    preloadHidden(["/a.png"]);
    flush();
    expect(RecordingImage.made[0].fetchPriority).toBe("low");
  });

  it("abandons in-flight fetches when torn down after warming", () => {
    const stop = preloadHidden([{ src: "/a.png", srcset: "/a-800.png 800w" }]);
    flush();
    stop();
    expect(RecordingImage.made[0].src).toBe("");
    expect(RecordingImage.made[0].srcset).toBe("");
  });

  it("warms nothing at all if torn down before the idle callback runs", () => {
    const stop = preloadHidden(["/a.png"]);
    stop();
    flush();
    expect(RecordingImage.made).toEqual([]);
  });
});
