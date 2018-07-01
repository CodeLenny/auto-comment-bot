const test = require("ava");
const proxyquire = require("proxyquire");
const Future = require("fluture");

test.beforeEach("mock commitsSinceDate", t => {
  t.context.getCommits = () => [];
  t.context.nextPage = () => [];
  t.context.hasNextPage = () => false;
  t.context.params = [];
  proxyquire.noPreserveCache();
  t.context.commitsSinceDate = proxyquire("../../../../lib/commitsSinceDate", {
    "@octokit/rest": function() {
      return {
        repos: {
          getCommits: (...args) => t.context.getCommits(...args),
        },
        hasNextPage: (...args) => t.context.hasNextPage(...args),
        getNextPage: (...args) => t.context.getNextPage(...args),
      };
    },
  });
});

test("finds commits", t => {
  t.plan(2);
  t.context.getCommits = opts => {
    t.is(opts.since, '1970-01-01T00:00:00.000Z');
    return Promise.resolve({data: [{}, {}]});
  };
  return t.context.commitsSinceDate("CodeLenny", "auto-comment-bot", new Date(0))
    .map(commits => t.is(commits.length, 2))
    .promise();
});

test("handles Future dates", t => {
  t.plan(1);
  t.context.getCommits = opts => {
    t.is(opts.since, '1970-01-01T00:00:00.000Z');
    return Promise.resolve({data: [{}, {}]});
  };
  return t.context.commitsSinceDate("CodeLenny", "auto-comment-bot", Future.of(new Date(0)))
    .promise();
});

test("fetches all pages", t => {
  t.plan(3);
  let secondPage = true;
  let pages = 0;
  t.context.getCommits = opts => {
    ++pages;
    return Promise.resolve({data: [{}, {}]});
  };
  t.context.hasNextPage = opts => {
    return Promise.resolve(secondPage);
  };
  t.context.getNextPage = opts => {
    ++pages;
    secondPage = false;
    return Promise.resolve({data: [{}, {}]});
  };
  return t.context.commitsSinceDate("CodeLenny", "auto-comment-bot", new Date(0))
    .map(commits => {
      t.is(secondPage, false);
      t.is(pages, 2);
      t.is(commits.length, 4);
    })
    .promise();
});
