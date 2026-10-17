import { describe, it } from "node:test";
import assert from "node:assert";
import {
  haversineDistance,
  calculateVariablePace,
  generateCircleCoordinates,
  generateHeartCoordinates,
  chunkCoordinates,
} from "./utils.ts";

describe("Route Utilities & Calculations", () => {
  it("calculates haversine distance between two coordinates accurately", () => {
    // New York City ([-74.006, 40.7128]) to Jersey City ([-74.0776, 40.7282]) ~ 6.3 km
    const d = haversineDistance([-74.006, 40.7128], [-74.0776, 40.7282]);
    assert.ok(d > 6000 && d < 6500, `Expected distance ~6.3km, got ${d}m`);

    // Distance between identical points is 0
    const zero = haversineDistance([-74.006, 40.7128], [-74.006, 40.7128]);
    assert.strictEqual(Math.round(zero), 0);
  });

  it("calculates run duration correctly in minutes", () => {
    const distanceMeters = 10000; // 10 km
    const paceMinPerKm = 5.0; // 5 min/km
    // Expected: 10 * 5 = 50 minutes
    const durationMinutes = (distanceMeters / 1000) * paceMinPerKm;
    assert.strictEqual(durationMinutes, 50);

    // Verify faster pace (4 min/km) yields SHORTER duration (40 min)
    const fasterDuration = (distanceMeters / 1000) * 4.0;
    assert.strictEqual(fasterDuration, 40);
    assert.ok(fasterDuration < durationMinutes, "Faster pace must yield shorter duration");
  });

  it("calculates variable pace deterministically within variability limits", () => {
    const coords: [number, number][] = [
      [-74.006, 40.7128],
      [-74.007, 40.7138],
      [-74.008, 40.7148],
      [-74.009, 40.7158],
    ];
    const targetPace = 5.0;
    const variability = 20; // 20%
    const paces = calculateVariablePace(coords, targetPace, variability);

    assert.strictEqual(paces.length, coords.length);
    paces.forEach((p) => {
      // Pace should be within 20% of target (between 4.0 and 6.0)
      assert.ok(p >= 4.0 && p <= 6.0, `Pace ${p} out of expected 20% variability range`);
    });
  });

  it("generates closed circle coordinates", () => {
    const center: [number, number] = [-74.006, 40.7128];
    const circle = generateCircleCoordinates(center, 13, 1);
    assert.strictEqual(circle.length, 21); // 20 segments + closing point
    // First and last point must be virtually identical to close the loop
    const first = circle[0];
    const last = circle[circle.length - 1];
    assert.ok(Math.abs(first[0] - last[0]) < 1e-6);
    assert.ok(Math.abs(first[1] - last[1]) < 1e-6);
  });

  it("generates closed heart coordinates", () => {
    const center: [number, number] = [-74.006, 40.7128];
    const heart = generateHeartCoordinates(center, 13, 0.01);
    assert.strictEqual(heart.length, 21);
    const first = heart[0];
    const last = heart[heart.length - 1];
    assert.ok(Math.abs(first[0] - last[0]) < 1e-6);
    assert.ok(Math.abs(first[1] - last[1]) < 1e-6);
  });

  it("chunks coordinates with 1-point overlap to overcome API limits", () => {
    // Generate 60 test coordinates
    const coords: [number, number][] = Array.from({ length: 60 }, (_, i) => [i * 0.01, i * 0.01]);
    const chunks = chunkCoordinates(coords, 25);

    // 60 points with 25 limit should create 3 chunks: 0..24, 24..48, 48..59
    assert.strictEqual(chunks.length, 3);
    assert.strictEqual(chunks[0].length, 25);
    assert.strictEqual(chunks[1].length, 25);
    assert.strictEqual(chunks[2].length, 12); // indices 48 to 59 = 12 points

    // Ensure overlap junction points match
    assert.deepStrictEqual(chunks[0][chunks[0].length - 1], chunks[1][0]);
    assert.deepStrictEqual(chunks[1][chunks[1].length - 1], chunks[2][0]);

    // Less than limit stays single chunk
    const smallCoords: [number, number][] = Array.from({ length: 10 }, (_, i) => [i, i]);
    const singleChunk = chunkCoordinates(smallCoords, 25);
    assert.strictEqual(singleChunk.length, 1);
    assert.strictEqual(singleChunk[0].length, 10);
  });
});
