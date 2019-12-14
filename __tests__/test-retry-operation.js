const retry = require("../lib/retry");

test("testReset", done => {
  const error = new Error("some error");
  const operation = retry.operation([1, 2, 3]);
  let attempts = 0;

  var expectedFinishes = 1;
  var finishes = 0;

  var fn = function() {
    operation.attempt(function(currentAttempt) {
      attempts++;
      expect(currentAttempt).toBe(attempts);
      if (operation.retry(error)) {
        return;
      }

      finishes++;
      expect(expectedFinishes).toBe(finishes);
      expect(attempts).toBe(4);
      expect(operation.attempts()).toBe(attempts);
      expect(operation.mainError()).toBe(error);

      if (finishes < 2) {
        attempts = 0;
        expectedFinishes++;
        operation.reset();
        fn();
      } else {
        done();
      }
    });
  };

  fn();
});

test("testError", () => {
  const operation = retry.operation();

  const error = new Error("some error");
  const error2 = new Error("some other error");

  operation._errors.push(error);
  operation._errors.push(error2);

  expect(operation.errors()).toEqual([error, error2]);
});

test("testMainErrorReturnsMostFrequentError", () => {
  const operation = retry.operation();
  const error = new Error("some error");
  const error2 = new Error("some other error");

  operation._errors.push(error);
  operation._errors.push(error2);
  operation._errors.push(error);

  expect(operation.mainError()).toEqual(error);
});

test("testMainErrorReturnsLastErrorOnEqualCount", () => {
  const operation = retry.operation();
  const error = new Error("some error");
  const error2 = new Error("some other error");

  operation._errors.push(error);
  operation._errors.push(error2);

  expect(operation.mainError()).toEqual(error2);
});

test("testAttempt", () => {
  const operation = retry.operation();
  const fn = new Function();

  const timeoutOpts = {
    timeout: 1,
    cb: function() {}
  };
  operation.attempt(fn, timeoutOpts);

  expect(fn).toBe(operation._fn);
  expect(timeoutOpts.timeout).toBe(operation._operationTimeout);
  expect(timeoutOpts.cb).toBe(operation._operationTimeoutCb);
});

test("testRetry", done => {
  const error = new Error("some error");
  const operation = retry.operation([1, 2, 3]);
  let attempts = 0;

  const fn = function() {
    operation.attempt(function(currentAttempt) {
      attempts++;
      expect(currentAttempt).toBe(attempts);
      if (operation.retry(error)) {
        return;
      }

      expect(attempts).toBe(4);
      expect(operation.attempts()).toBe(attempts);
      expect(operation.mainError()).toBe(error);
      done();
    });
  };

  fn();
});

test("testRetryForever", done => {
  const error = new Error("some error");
  const operation = retry.operation({ retries: 3, forever: true });
  let attempts = 0;

  const fn = function() {
    operation.attempt(function(currentAttempt) {
      attempts++;
      expect(currentAttempt).toBe(attempts);
      if (attempts !== 6 && operation.retry(error)) {
        return;
      }

      expect(attempts).toBe(6);
      expect(operation.attempts()).toBe(attempts);
      expect(operation.mainError()).toBe(error);
      done();
    });
  };

  fn();
});

test("testRetryForeverNoRetries", done => {
  const error = new Error("some error");
  const delay = 50;
  const operation = retry.operation({
    retries: null,
    forever: true,
    minTimeout: delay,
    maxTimeout: delay
  });

  let attempts = 0;
  const startTime = new Date().getTime();

  const fn = function() {
    operation.attempt(function(currentAttempt) {
      attempts++;
      expect(currentAttempt).toBe(attempts);
      if (attempts !== 4 && operation.retry(error)) {
        return;
      }

      var endTime = new Date().getTime();
      var minTime = startTime + delay * 3;
      var maxTime = minTime + 20; // add a little headroom for code execution time
      expect(endTime).toBeGreaterThanOrEqual(minTime);
      expect(endTime).toBeLessThan(maxTime);
      expect(attempts).toBe(4);
      expect(operation.attempts()).toBe(attempts);
      expect(operation.mainError()).toBe(error);
      done();
    });
  };

  fn();
});

test("testStop", done => {
  const error = new Error("some error");
  const operation = retry.operation([1, 2, 3]);
  let attempts = 0;

  const fn = function() {
    operation.attempt(function(currentAttempt) {
      attempts++;
      expect(currentAttempt).toBe(attempts);

      if (attempts === 2) {
        operation.stop();

        expect(attempts).toBe(2);
        expect(operation.attempts()).toBe(attempts);
        expect(operation.mainError()).toBe(error);
        done();
      }

      if (operation.retry(error)) {
        return;
      }
    });
  };

  fn();
});

test("testMaxRetryTime", () => {
  const error = new Error("some error");
  const maxRetryTime = 30;
  const operation = retry.operation({
    minTimeout: 1,
    maxRetryTime: maxRetryTime
  });
  let attempts = 0;

  const longAsyncFunction = function(wait, callback) {
    setTimeout(callback, wait);
  };

  return new Promise((resolve, reject) => {
    const startTime = new Date().getTime();
    operation.attempt(function(currentAttempt) {
      attempts++;
      expect(currentAttempt).toBe(attempts);

      if (attempts !== 2) {
        if (operation.retry(error)) {
          return;
        }
      } else {
        const curTime = new Date().getTime();
        longAsyncFunction(maxRetryTime - (curTime - startTime - 1), function() {
          if (operation.retry(error)) {
            reject(new Error("timeout should be occurred"));
            return;
          }

          expect(operation.mainError()).toBe(error);
          resolve();
        });
      }
    });
  });
});
