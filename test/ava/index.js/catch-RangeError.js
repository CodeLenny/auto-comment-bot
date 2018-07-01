const test = require("ava");
const Future = require("fluture");
const proxyquire = require("proxyquire");
const { Application } = require("probot");

const MockGetContent = require("../../helpers/MockGetContent");
const issueOpenedEvent = require("../../fixtures/issues.opened");

test.beforeEach("mock plugin", t => {
  t.context.createComment = () => Promise.resolve();
  t.context.mockContent = new MockGetContent();
  proxyquire.noPreserveCache();
  t.context.plugin = proxyquire("../../..", {
  });
});

test.beforeEach("create robot", t => {
  t.context.robot = new Application();
  t.context.robot.load(t.context.plugin);
});

test.beforeEach("mock GitHub", t => {
  t.context.github = {};

  t.context.github.repos = {};
  t.context.github.repos.getContent = path => t.context.mockContent.respond(path);

  t.context.github.issues = {};
  t.context.github.issues.createComment = (...args) => t.context.createComment(...args);

  t.context.robot.auth = () => Promise.resolve(t.context.github);
})

test.beforeEach("add content", t => {
  t.context.mockContent.add(
    "d6cd1e2bd19e03a81132a23b2025920577f84e37",
    ".github/AUTO_COMMENT.txt",
    "This is a test."
  );
});

test("catches RangeError", t => {
  t.plan(1);
  t.context.robot.log.target.streams = [];
  t.context.createComment = () => Promise.reject(new RangeError("This is an error"));
  return t.context.robot
    .receive(issueOpenedEvent)
    .then(() => t.pass())
    .catch(() => t.fail("Rejected."));
});

test("doesn't catch other errors", t => {
  t.plan(1);
  t.context.robot.log.target.streams = [];
  t.context.createComment = () => Promise.reject(new TypeError("This is an error"));
  return t.context.robot
    .receive(issueOpenedEvent)
    .then(() => t.fail("Didn't reject."))
    .catch(() => {
      t.pass();
      return true;
    });
});
