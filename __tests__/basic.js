const fetch = require("node-fetch");
const sleep = require("then-sleep");
const retry = require("../lib");

test("return value", async () => {
  const val = await retry(async (bail, num) => {
    if (num < 2) {
      throw new Error("woot");
    }

    await sleep(50);
    return `woot ${num}`;
  });

  expect(val).toBe("woot 2");
});

test("return value no await", async () => {
  const val = await retry(async (bail, num) => num);

  expect(val).toBe(1);
});

test("chained promise", async () => {
  const res = await retry(async (bail, num) => {
    if (num < 2) {
      throw new Error("retry");
    }

    return fetch("https://www.wikipedia.org");
  });

  expect(res.status).toBe(200);
});

test("bail", async () => {
  try {
    await retry(
      async (bail, num) => {
        if (num === 2) {
          bail(new Error("Wont retry"));
        }

        throw new Error(`Test ${num}`);
      },
      { retries: 3 }
    );
  } catch (err) {
    expect(err.message).toBe("Wont retry");
  }
});

test("bail + return", async () => {
  let error;

  try {
    await Promise.resolve(
      retry(async bail => {
        await sleep(200);
        await sleep(200);
        bail(new Error("woot"));
      })
    );
  } catch (err) {
    error = err;
  }

  expect(error.message).toBe("woot");
});

test("bail error", async t => {
  let retries = 0;

  try {
    await retry(
      async () => {
        retries += 1;
        await sleep(100);
        const err = new Error("Wont retry");
        err.bail = true;
        throw err;
      },
      { retries: 3 }
    );
  } catch (err) {
    expect(err.message).toBe("Wont retry");
  }

  t.deepEqual(retries, 1);
});

test("with non-async functions", async () => {
  try {
    await retry(
      (bail, num) => {
        throw new Error(`Test ${num}`);
      },
      { retries: 2 }
    );
  } catch (err) {
    expect(err.message).toBe("Test 3");
  }
});

test("return non-async", async () => {
  const val = await retry(() => 5);

  expect(val).toBe(5);
});

test("with number of retries", async () => {
  let retries = 0;

  try {
    await retry(() => fetch("https://www.fakewikipedia.org"), {
      retries: 2,
      onRetry: (err, i) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log("Retry error : ", err);
        }

        retries = i;
      }
    });
  } catch (err) {
    expect(retries).toBe(2);
  }
});
