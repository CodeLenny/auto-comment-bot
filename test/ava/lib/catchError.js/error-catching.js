const test = require("ava");
const Future = require("fluture");
const catchError = require("../../../../lib/catchError");

test("ignores non-errors", t => {
  t.plan(1);
  return Future
    .of(true)
    .mapRej(catchError(Error, err => t.fail("Matched Error"), err => t.fail("Unknown error")))
    .map(() => t.pass())
    .promise();
});

test("matches error types", t => {
  t.plan(1);
  return Future
    .reject(new TypeError("This is an error."))
    .chainRej(catchError(
      TypeError,
      err => {
        t.pass("Matched Error");
        return Future.of();
      },
      err => {
        t.fail("Didn't match error");
        return Future.reject(err);
      }
    ))
    .promise();
});

test("matches error messages", t => {
  t.plan(1);
  return Future
    .reject(new TypeError("This is an error."))
    .chainRej(catchError(
      {
        message: "This is an error.",
      },
      err => {
        t.pass("Matched Error");
        return Future.of();
      },
      err => {
        t.fail("Didn't match error");
        return Future.reject(err);
      }
    ))
    .promise();
})

test("correctly ignores unmatched errors", t => {
  t.plan(1);
  return Future
    .reject(new TypeError("This is an error."))
    .chainRej(catchError(
      RangeError,
      err => {
        t.fail("Matched Error");
        return Future.reject(err);
      },
      err => {
        t.pass("Ignored Error");
        return Future.of();
      }
    ))
    .promise();
});

test("defaults to a pass-through function if errCb not provided", t => {
  t.plan(1);
  const fn = catchError(TypeError, (err) => t.fail("Matched error."));
  const err = new RangeError("Test");
  t.is(err, fn(err));
});
