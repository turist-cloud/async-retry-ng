const retry = require("../lib/retry");

function getLib() {
  return {
    fn1: function() {},
    fn2: function() {},
    fn3: function() {}
  };
}

test("wrapAll", () => {
  const lib = getLib();

  retry.wrap(lib);

  expect(lib.fn1.name).toBe("bound retryWrapper");
  expect(lib.fn2.name).toBe("bound retryWrapper");
  expect(lib.fn3.name).toBe("bound retryWrapper");
});

test("wrapAllPassOptions", () => {
  const lib = getLib();

  retry.wrap(lib, { retries: 2 });

  expect(lib.fn1.name).toBe("bound retryWrapper");
  expect(lib.fn2.name).toBe("bound retryWrapper");
  expect(lib.fn3.name).toBe("bound retryWrapper");
  expect(lib.fn1.options.retries).toBe(2);
  expect(lib.fn2.options.retries).toBe(2);
  expect(lib.fn3.options.retries).toBe(2);
});

test("wrapDefined", () => {
  const lib = getLib();

  retry.wrap(lib, ["fn2", "fn3"]);

  expect(lib.fn1.name).not.toBe("bound retryWrapper");
  expect(lib.fn2.name).toBe("bound retryWrapper");
  expect(lib.fn3.name).toBe("bound retryWrapper");
});

test("wrapDefinedAndPassOptions", () => {
  const lib = getLib();

  retry.wrap(lib, { retries: 2 }, ["fn2", "fn3"]);

  expect(lib.fn1.name).not.toBe("bound retryWrapper");
  expect(lib.fn2.name).toBe("bound retryWrapper");
  expect(lib.fn3.name).toBe("bound retryWrapper");
  expect(lib.fn2.options.retries).toBe(2);
  expect(lib.fn3.options.retries).toBe(2);
});

test("runWrappedWithoutError", () => {
  let callbackCalled;
  const lib = {
    method: function(a, b, callback) {
      expect(a).toBe(1);
      expect(b).toBe(2);
      expect(typeof callback).toBe("function");
      callback();
    }
  };
  retry.wrap(lib);
  lib.method(1, 2, function() {
    callbackCalled = true;
  });
  expect(callbackCalled).toBeTruthy();
});

test("runWrappedSeveralWithoutError", () => {
  let callbacksCalled = 0;
  const lib = {
    fn1: function(a, callback) {
      expect(a).toBe(1);
      expect(typeof callback).toBe("function");
      callback();
    },
    fn2: function(a, callback) {
      expect(a).toBe(2);
      expect(typeof callback).toBe("function");
      callback();
    }
  };
  retry.wrap(lib, {}, ["fn1", "fn2"]);
  lib.fn1(1, function() {
    callbacksCalled++;
  });
  lib.fn2(2, function() {
    callbacksCalled++;
  });
  expect(callbacksCalled).toBe(2);
});

test("runWrappedWithError", () => {
  let callbackCalled;
  const lib = {
    method: function(callback) {
      callback(new Error("Some error"));
    }
  };
  retry.wrap(lib, { retries: 1 });
  lib.method(function(err) {
    callbackCalled = true;
    expect(err instanceof Error).toBeTruthy();
  });
  expect(callbackCalled).toBeFalsy();
});
