import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { afterLoadIdle } from "./afterLoadIdle";

let idleCallbacks: Array<() => void>;
let cancelledIdle: number[];

beforeEach(() => {
  idleCallbacks = [];
  cancelledIdle = [];
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => idleCallbacks.push(cb));
  vi.stubGlobal("cancelIdleCallback", (handle: number) => cancelledIdle.push(handle));
  Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete (document as { readyState?: unknown }).readyState;
});

describe("afterLoadIdle", () => {
  it("does not run until the browser reports idle", () => {
    const work = vi.fn();
    afterLoadIdle(work);
    expect(work).not.toHaveBeenCalled();
    idleCallbacks.forEach((cb) => cb());
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("waits for `load` first when the document is still loading", () => {
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    const work = vi.fn();
    afterLoadIdle(work);
    expect(idleCallbacks, "nothing is even queued before load").toHaveLength(0);
    window.dispatchEvent(new Event("load"));
    expect(idleCallbacks).toHaveLength(1);
    idleCallbacks[0]!();
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("falls back to a timer where requestIdleCallback does not exist (Safari)", () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.useFakeTimers();
    const work = vi.fn();
    afterLoadIdle(work);
    vi.advanceTimersByTime(999);
    expect(work).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("never runs if cancelled before the idle callback fires", () => {
    const work = vi.fn();
    const cancel = afterLoadIdle(work);
    cancel();
    expect(cancelledIdle).toHaveLength(1);
    idleCallbacks.forEach((cb) => cb()); // a browser that ignored the cancel
    expect(work).not.toHaveBeenCalled();
  });

  it("never runs if cancelled before `load`", () => {
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    const work = vi.fn();
    afterLoadIdle(work)();
    window.dispatchEvent(new Event("load"));
    expect(idleCallbacks).toHaveLength(0);
    expect(work).not.toHaveBeenCalled();
  });
});
