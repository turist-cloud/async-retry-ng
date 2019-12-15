const retry = require("../lib/retry");

test("testForeverUsesFirstTimeout", () => {
  return new Promise(done => {
    const operation = retry.operation({
      retries: 0,
      minTimeout: 100,
      maxTimeout: 100,
      forever: true
    });

    operation.attempt(function(numAttempt) {
      console.log(">numAttempt", numAttempt);
      const err = new Error("foo");
      if (numAttempt === 10) {
        operation.stop();
        done();
      }

      if (operation.retry(err)) {
      }
    });
  });
});