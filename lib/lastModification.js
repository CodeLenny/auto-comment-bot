const Future = require("fluture");
const fs = require("fs-extra");
const path = require("path");

/**
 * Get the date that the project was last updated on.
 * @return {Future<Date>} the last date that the project was modified on
*/
function lastModification() {
  return Future
    .tryP(() => fs.stat(path.resolve(__dirname, "../", "package.json")))
    .map(stats => stats.mtime);
}

module.exports = lastModification;
