const Future = require("fluture");
const commitsSinceDate = require("../../lib/commitsSinceDate");

describe("commitsSinceDate", () => {

  test("finds commits", () => {
    return commitsSinceDate("CodeLenny", "auto-comment-bot", new Date(0))
      .map(commits => expect(commits.length > 1).toEqual(true))
      .promise();
  });

  test("fetches all pages", () => {
    return commitsSinceDate("CodeLenny", "auto-comment-bot", Future.of(new Date(0)), "master", 20)
      .map(commits => expect(commits.length > 20).toEqual(true))
      .promise();
  });

});
