/**
 * Wrapper to use in Fluture's `mapRej`/`chainRej`.
 * @param {Class|Object} selector Either an `Error` class or object with a message to match.
 * @param {Function} cb A function to call on errors found.  Return value is passed to `chainRej`.
 * @param {Function} [errCb] Callback called when the selector is not matched.  By default, returns the error provided.
 * @return {Function} To pass to `mapRej` or `chainRej`.
*/
function catchError(selector, cb, errCb = null) {
  if(!errCb) {
    errCb = (err) => err;
  }
  return function(err) {
    if((typeof selector === "function" && err instanceof selector) || err.message === selector.message) {
      return cb(err);
    }
    return errCb(err);
  }
}

module.exports = catchError;
