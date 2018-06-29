const Future = require("fluture");

function head(arr) {
  if(Future.isFuture(arr)) {
    return arr.chain(arr => {
      try {
        return Future.of(head(arr));
      } catch (e) {
        return Future.reject(e);
      }
    });
  }
  if(!Array.isArray(arr)) {
    throw new TypeError("head() expected Array");
  }
  if(arr.length < 1) {
    throw new RangeError("head() given array without any elements.");
  }
  return arr[0];
}

module.exports = head;
