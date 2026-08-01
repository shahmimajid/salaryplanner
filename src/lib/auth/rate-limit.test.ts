import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, RateLimitError } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows attempts under the max within the window", () => {
    const key = `test-under-${Math.random()}`;
    expect(() => checkRateLimit(key, 3, 1000)).not.toThrow();
    expect(() => checkRateLimit(key, 3, 1000)).not.toThrow();
    expect(() => checkRateLimit(key, 3, 1000)).not.toThrow();
  });

  it("throws RateLimitError once the max is exceeded within the window", () => {
    const key = `test-over-${Math.random()}`;
    checkRateLimit(key, 2, 1000);
    checkRateLimit(key, 2, 1000);
    expect(() => checkRateLimit(key, 2, 1000)).toThrow(RateLimitError);
  });

  it("resets the count once the window has elapsed", () => {
    const key = `test-reset-${Math.random()}`;
    checkRateLimit(key, 1, 1000);
    expect(() => checkRateLimit(key, 1, 1000)).toThrow(RateLimitError);

    vi.advanceTimersByTime(1001);

    expect(() => checkRateLimit(key, 1, 1000)).not.toThrow();
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    checkRateLimit(keyA, 1, 1000);
    expect(() => checkRateLimit(keyA, 1, 1000)).toThrow(RateLimitError);
    expect(() => checkRateLimit(keyB, 1, 1000)).not.toThrow();
  });
});
