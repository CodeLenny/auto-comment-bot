const Future = require("fluture");
const octokit = require("@octokit/rest")();

/**
 * Return the list of commits since the date provided.
 * @param {Date|Future<Date>} date the date to query on.
 * @return {Future<Array>} the commits since the given date.
*/
function commitsSinceDate(owner, repo, date, ref = "master", perPage = 100) {
  if(!Future.isFuture(date)) {
    date = Future.of(date);
  }
  return date
    .map(d => d.toISOString())
    .chain(d => Future.tryP(() => octokit.repos.getCommits({
      owner,
      repo,
      sha: ref,
      since: d,
      per_page: perPage,
    })))
    .chain(res => Future.do(function*() {
      let { data } = res;
      while(octokit.hasNextPage(res)) {
        res = yield Future.tryP(() => octokit.getNextPage(res));
        data = data.concat(res.data);
      }
      return data;
    }));
}

module.exports = commitsSinceDate;
