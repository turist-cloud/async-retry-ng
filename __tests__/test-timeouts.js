const retry = require("../lib/retry");

test("testDefaultValues", () => {
  const timeouts = retry.timeouts();

  expect(timeouts.length).toBe(10);
  expect(timeouts[0]).toBe(1000);
  expect(timeouts[1]).toBe(2000);
  expect(timeouts[2]).toBe(4000);
});

test("testDefaultValuesWithRandomize", () => {
  const minTimeout = 5000;
  const timeouts = retry.timeouts({
    minTimeout,
    randomize: true,
  });

  expect(timeouts.length).toBe(10);
  expect(timeouts[0]).toBeGreaterThan(minTimeout);
  expect(timeouts[1]).toBeGreaterThan(timeouts[0]);
  expect(timeouts[2]).toBeGreaterThan(timeouts[1]);
});

test("testPassedTimeoutsAreUsed", () => {
  const timeoutsArray = [1000, 2000, 3000];
  const timeouts = retry.timeouts(timeoutsArray);

  expect(timeouts).toEqual(timeoutsArray);
  expect(timeouts).not.toBe(timeoutsArray);
});

test("testTimeoutsAreWithinBoundaries", () => {
  const minTimeout = 1000;
  const maxTimeout = 10000;
  const timeouts = retry.timeouts({
    minTimeout,
    maxTimeout,
  });

  for (let i = 0; i < timeouts; i++) {
    expect(timeouts[i]).toBeGreaterThanOrEqual(minTimeout);
    expect(timeouts[i]).toBeLessThanOrEqual(maxTimeout);
  }
});

test("testTimeoutsAreIncremental", () => {
  const timeouts = retry.timeouts();
  const lastTimeout = timeouts[0];

  for (let i = 0; i < timeouts; i++) {
    assert(timeouts[i]).toBeGreaterThan(lastTimeout);
    lastTimeout = timeouts[i];
  }
});

test("testTimeoutsAreIncrementalForFactorsLessThanOne", () => {
  const timeouts = retry.timeouts({
    retries: 3,
    factor: 0.5,
  });
  const expected = [250, 500, 1000];

  expect(expected).toEqual(timeouts);
});

test("testRetries", () => {
  const timeouts = retry.timeouts({ retries: 2 });

  expect(timeouts).toHaveLength(2);
});
