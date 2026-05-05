import { describe, expect, it } from "bun:test";

/**
 * Calculates the Euclidean distance between two points (x1, y1) and (x2, y2).
 */
export function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

describe("Math Utils - Euclidean Distance", () => {
  it("should calculate the distance between (0,0) and (3,4) as 5", () => {
    expect(euclideanDistance(0, 0, 3, 4)).toBe(5);
  });

  it("should return 0 for the same point", () => {
    expect(euclideanDistance(10, 10, 10, 10)).toBe(0);
  });

  it("should handle negative coordinates", () => {
    // Distance between (-1, -1) and (2, 3) should be sqrt( (2 - -1)^2 + (3 - -1)^2 ) = sqrt(3^2 + 4^2) = 5
    expect(euclideanDistance(-1, -1, 2, 3)).toBe(5);
  });

  it("should be commutative", () => {
    const d1 = euclideanDistance(1, 2, 4, 6);
    const d2 = euclideanDistance(4, 6, 1, 2);
    expect(d1).toBe(d2);
  });
});
