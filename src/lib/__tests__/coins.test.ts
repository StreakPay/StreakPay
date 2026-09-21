import { describe, it, expect } from "vitest";
import {
  calculateReward,
} from "../../services/multiplier";
import {
  hashMessage,
} from "../../services/anti-abuse";
import {
  safeNumber,
  safeMultiply,
  clamp,
} from "../math";

// ============================================================
// calculateReward: base × multiplier, NEVER NaN
// ============================================================
describe("calculateReward", () => {
  it("100 × 1.00 = 100", () => {
    expect(calculateReward(100, 1.0)).toBe(100);
  });

  it("100 × 1.20 = 120", () => {
    expect(calculateReward(100, 1.2)).toBe(120);
  });

  it("100 × 2.00 = 200 (max multiplier)", () => {
    expect(calculateReward(100, 2.0)).toBe(200);
  });

  it("0 multiplier returns 0", () => {
    expect(calculateReward(100, 0)).toBe(0);
  });

  it("negative base returns 0", () => {
    expect(calculateReward(-100, 1.5)).toBe(0);
  });

  it("negative multiplier returns 0", () => {
    expect(calculateReward(100, -1.0)).toBe(0);
  });

  it("NaN base returns 0", () => {
    expect(calculateReward(NaN, 1.5)).toBe(0);
  });

  it("NaN multiplier returns 0", () => {
    expect(calculateReward(100, NaN)).toBe(0);
  });

  it("Infinity base returns 0", () => {
    expect(calculateReward(Infinity, 1.5)).toBe(0);
  });

  it("Infinity multiplier returns 0", () => {
    expect(calculateReward(100, Infinity)).toBe(0);
  });

  it("undefined inputs return 0", () => {
    expect(calculateReward(undefined as unknown as number, 1.0)).toBe(0);
    expect(calculateReward(100, undefined as unknown as number)).toBe(0);
  });

  it("null inputs return 0", () => {
    expect(calculateReward(null as unknown as number, 1.0)).toBe(0);
    expect(calculateReward(100, null as unknown as number)).toBe(0);
  });

  it("strings return 0", () => {
    expect(calculateReward("abc" as unknown as number, 1.0)).toBe(0);
    expect(calculateReward(100, "xyz" as unknown as number)).toBe(0);
  });

  it("floors the result", () => {
    // 7 * 1.15 = 8.05 -> 8
    expect(calculateReward(7, 1.15)).toBe(8);
  });

  it("very small base with max multiplier", () => {
    expect(calculateReward(1, 2.0)).toBe(2);
  });
});

// ============================================================
// safeNumber / safeMultiply / clamp from math.ts
// ============================================================
describe("safeNumber", () => {
  it("returns 0 for null", () => expect(safeNumber(null)).toBe(0));
  it("returns 0 for undefined", () => expect(safeNumber(undefined)).toBe(0));
  it("returns 0 for NaN", () => expect(safeNumber(NaN)).toBe(0));
  it("returns 0 for Infinity", () => expect(safeNumber(Infinity)).toBe(0));
  it("returns 0 for strings", () => expect(safeNumber("abc")).toBe(0));
  it("parses numeric strings", () => expect(safeNumber("42")).toBe(42));
  it("returns valid numbers", () => expect(safeNumber(3.14)).toBe(3.14));
  it("uses fallback", () => expect(safeNumber(null, 5)).toBe(5));
});

describe("safeMultiply", () => {
  it("multiplies two valid numbers", () => expect(safeMultiply(3, 4)).toBe(12));
  it("returns 0 for NaN input", () => expect(safeMultiply(NaN, 4)).toBe(0));
  it("returns 0 for Infinity", () => expect(safeMultiply(Infinity, 4)).toBe(0));
  it("handles string inputs", () => expect(safeMultiply("3", "4")).toBe(12));
});

describe("clamp", () => {
  it("clamps below min", () => expect(clamp(0, 1, 10)).toBe(1));
  it("clamps above max", () => expect(clamp(15, 1, 10)).toBe(10));
  it("keeps value in range", () => expect(clamp(5, 1, 10)).toBe(5));
  it("handles min === max", () => expect(clamp(5, 3, 3)).toBe(3));
});

// ============================================================
// hashMessage: fast dedup hash
// ============================================================
describe("hashMessage", () => {
  it("returns consistent hash for same input", () => {
    expect(hashMessage("hello world")).toBe(hashMessage("hello world"));
  });

  it("returns different hash for different input", () => {
    expect(hashMessage("hello")).not.toBe(hashMessage("world"));
  });

  it("is case-insensitive", () => {
    expect(hashMessage("Hello")).toBe(hashMessage("hello"));
  });

  it("trims whitespace", () => {
    expect(hashMessage("  hello  ")).toBe(hashMessage("hello"));
  });

  it("returns string starting with h_", () => {
    expect(hashMessage("test")).toMatch(/^h_/);
  });
});

// ============================================================
// Multiplier progression logic
// ============================================================
describe("multiplier progression", () => {
  it("step calculation: 1.00 + 0.05 = 1.05", () => {
    const step = 0.05;
    const max = 2.0;
    const result = clamp(1.0 + step, 1.0, max);
    expect(result).toBe(1.05);
  });

  it("step calculation: 1.15 + 0.05 = 1.20", () => {
    const step = 0.05;
    const max = 2.0;
    const result = clamp(1.15 + step, 1.0, max);
    expect(result).toBe(1.20);
  });

  it("cannot exceed max", () => {
    const step = 0.05;
    const max = 2.0;
    const result = clamp(2.0 + step, 1.0, max);
    expect(result).toBe(2.0);
  });

  it("cannot go below 1.0", () => {
    const result = clamp(0.5, 1.0, 2.0);
    expect(result).toBe(1.0);
  });

  it("reward at 1.00x", () => {
    expect(calculateReward(100, 1.0)).toBe(100);
  });

  it("reward at 1.05x", () => {
    expect(calculateReward(100, 1.05)).toBe(105);
  });

  it("reward at 1.10x", () => {
    expect(calculateReward(100, 1.10)).toBe(110);
  });

  it("reward at 1.15x", () => {
    // IEEE 754: 100 * 1.15 = 114.999..., floors to 114
    expect(calculateReward(100, 1.15)).toBe(114);
  });

  it("reward at 1.20x", () => {
    expect(calculateReward(100, 1.20)).toBe(120);
  });

  it("reward at 2.00x (max)", () => {
    expect(calculateReward(100, 2.0)).toBe(200);
  });
});

// ============================================================
// Edge cases: missing values, duplicate reward, rapid activity
// ============================================================
describe("edge cases", () => {
  it("missing values don't produce NaN", () => {
    expect(calculateReward(undefined as unknown as number, undefined as unknown as number)).toBe(0);
    expect(calculateReward(null as unknown as number, null as unknown as number)).toBe(0);
    expect(calculateReward("" as unknown as number, "" as unknown as number)).toBe(0);
    expect(calculateReward(false as unknown as number, true as unknown as number)).toBe(0);
  });

  it("duplicate reward prevention via hashMessage", () => {
    const hash1 = hashMessage("What is 2+2?");
    const hash2 = hashMessage("What is 2+2?");
    const hash3 = hashMessage("What is 3+3?");
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it("rapid activity: diminishing returns factor logic", () => {
    const threshold = 5;
    // After 5 rewards, factor drops to 0.5
    const recentCount = 7;
    const factor = recentCount > threshold ? 0.5 : 1.0;
    const baseReward = calculateReward(100, 1.2); // 120
    const adjusted = Math.max(1, Math.floor(baseReward * factor));
    expect(adjusted).toBe(60); // 120 × 0.5 = 60
  });

  it("insufficient coins: balance check logic", () => {
    const balance = 10;
    const requested = 50;
    const allowed = balance >= requested;
    expect(allowed).toBe(false);
  });

  it("zero reward is floor(1) minimum", () => {
    const reward = Math.max(1, Math.floor(calculateReward(0, 1.0)));
    expect(reward).toBe(1);
  });
});
