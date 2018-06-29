const Future = require("fluture");
const head = require("../../lib/head");

describe("head()", () => {

  test("provides first element in array", () => {
    expect(head([0, 1])).toEqual(0);
  });

  test("throws error if given empty array", () => {
    expect(() => head([])).toThrow(RangeError);
  });

  test("throws error if given non-array", () => {
    expect(() => head()).toThrow(TypeError);
    expect(() => head("asdf")).toThrow(TypeError);
    expect(() => head(1)).toThrow(TypeError);
  });

  test("handles Future arrays", async () => {
    const arr = Future.of([0, 1]);
    const first = await head(arr).promise();
    expect(first).toEqual(0);
  });

  test("rejects Future on errors", async () => {
    expect(head(Future.of("asdf")).promise()).rejects.toThrow(TypeError);
  });

});
