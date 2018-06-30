const request = require("supertest");
const express = require("express");
const { Application } = require("probot");
const bunyan = require("bunyan");
const stripIndent = require("strip-indent");
const plugin = require("..");
const MockGetContent = require("./helpers/MockGetContent");

const pushEvent = require("./fixtures/push.signed-off");
const issueOpenedEvent = require("./fixtures/issues.opened");
const pullRequestOpenedEvent = require("./fixtures/pull_request.opened");

describe("auto-comment-bot", () => {
  let app;
  let github;
  let mockContent;

  beforeEach(() => {
    app = new Application();
    app.load(plugin);

    mockContent = new MockGetContent();

    github = {
      repos: {
        getContent: jest
          .fn()
          .mockImplementation(path => mockContent.respond(path))
          .mockName("repos.getContent"),
      },
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(() => Promise.resolve())
          .mockName("issues.createComment"),
      },
      pullRequests: {
        createComment: jest
          .fn()
          .mockImplementation(() => Promise.resolve())
          .mockName("pullRequests.createComment"),
      }
    };

    app.auth = () => Promise.resolve(github);

  });

  test("ignores non-issue/pull-request events", async () => {
    app.log.target.streams = [];
    await app.receive(pushEvent);

    expect(github.repos.getContent).not.toHaveBeenCalled();
    expect(github.issues.createComment).not.toHaveBeenCalled();
    expect(github.pullRequests.createComment).not.toHaveBeenCalled();
  });

  test("only queries the directory if there aren't any templates", async () => {
    app.log.target.streams = [];
    await app.receive(issueOpenedEvent);

    expect(github.repos.getContent).toHaveBeenCalledTimes(1);
    const args = github.repos.getContent.mock.calls[0][0];
    expect(args.path).toEqual(".github");
  });

  test("doesn't create a comment if there aren't any templates", async () => {
    app.log.target.streams = [];
    await app.receive(issueOpenedEvent);

    expect(github.issues.createComment).not.toHaveBeenCalled();
    expect(github.pullRequests.createComment).not.toHaveBeenCalled();
  });

  test("ignores random files inside '.github'", async () => {
    mockContent.add("1234", ".github/OTHER_FILE.md", "TESTING");

    await app.receive(issueOpenedEvent);

    expect(github.repos.getContent).toHaveBeenCalledTimes(1);
  })

  test("looks up templates", async () => {
    mockContent.add(
      "d6cd1e2bd19e03a81132a23b2025920577f84e37",
      ".github/AUTO_COMMENT.txt",
      "This is a test."
    );
    await app.receive(issueOpenedEvent);

    expect(github.repos.getContent).toHaveBeenCalledTimes(2);
  });

  test("posts a text template on issues", async () => {
    mockContent.add(
      "d6cd1e2bd19e03a81132a23b2025920577f84e37",
      ".github/AUTO_COMMENT.txt",
      "This is a test."
    );
    await app.receive(issueOpenedEvent);

    expect(github.issues.createComment).toHaveBeenCalledTimes(1);
    const comment = github.issues.createComment.mock.calls[0][0];
    expect(comment.body).toEqual("This is a test.");
  });

  test("posts a text template on pull requests", async () => {
    mockContent.add(
      "d6cd1e2bd19e03a81132a23b2025920577f84e37",
      ".github/AUTO_COMMENT.txt",
      "This is a test."
    );
    await app.receive(pullRequestOpenedEvent);

    expect(github.pullRequests.createComment).toHaveBeenCalledTimes(1);
    const comment = github.pullRequests.createComment.mock.calls[0][0];
    expect(comment.body).toEqual("This is a test.");
  });

  test("finds named templates", async () => {
    mockContent.add(
      "d6cd1e2bd19e03a81132a23b2025920577f84e37",
      ".github/AUTO_COMMENT_MY_PR_TEMPLATE.txt",
      "This is a test."
    );
    await app.receive(issueOpenedEvent);

    expect(github.issues.createComment).toHaveBeenCalledTimes(1);
  });

  test("compiles EJS templates", async () => {
    mockContent.add(
      "d6cd1e2bd19e03a81132a23b2025920577f84e37",
      ".github/AUTO_COMMENT.md.ejs",
      "Hello <%= payload.issue.title %>"
    );
    await app.receive(issueOpenedEvent);
    expect(github.issues.createComment).toHaveBeenCalledTimes(1);
    const comment = github.issues.createComment.mock.calls[0][0];
    expect(comment.body).toEqual("Hello Testing the autoresponder");
  });

  describe("variable insertion", async () => {

    let template;

    beforeEach(() => {
      template = `
        <%= payload.issue.title %>
        <%= event %>
        <%= action %>
      `;
      mockContent.add(
        "d6cd1e2bd19e03a81132a23b2025920577f84e37",
        ".github/AUTO_COMMENT.md.ejs",
        template
      );
    });

    test("with issue creation", async () => {
      await app.receive(issueOpenedEvent);
      const comment = github.issues.createComment.mock.calls[0][0];
      expect(comment.body).toEqual(`
        ${issueOpenedEvent.payload.issue.title}
        issues
        issues.opened
      `);
    });

    test("with pull request creation", async () => {
      await app.receive(pullRequestOpenedEvent);
      const comment = github.pullRequests.createComment.mock.calls[0][0];
      expect(comment.body).toEqual(`
        ${pullRequestOpenedEvent.payload.issue.title}
        pull_request
        pull_request.opened
      `);
    });

  });

  describe("templates with 'when' limiting to issues", () => {

    beforeEach(() => {
      mockContent.add(
        "d6cd1e2bd19e03a81132a23b2025920577f84e37",
        ".github/AUTO_COMMENT.md",
        stripIndent(`\
          ---
          when:
            action:
              $in:
                - issues.opened
          ---
          Hello!`)
      );
    });

    test("posts on issues", async () => {
      await app.receive(issueOpenedEvent);
      expect(github.issues.createComment).toHaveBeenCalled();
      const comment = github.issues.createComment.mock.calls[0][0];
      expect(comment.body).toEqual("Hello!");
    });

    test("doesn't post on pull requests", async () => {
      await app.receive(pullRequestOpenedEvent);
      expect(github.pullRequests.createComment).not.toHaveBeenCalled();
    });

  });

  describe("/meta", () => {

    describe("/package.json", () => {

      test("returns manifest", () => {
        const application = express();
        application.use(app.router);
        return request(application)
          .get("/meta/package.json")
          .expect(200)
          .then(res => {
            expect(typeof res.body).toEqual("object");
            expect(res.body.name).toEqual("auto-comment-bot");
          });
      });

    });

    describe("/version.json", () => {

      test("returns version", () => {
        const application = express();
        application.use(app.router);
        return request(application)
          .get("/meta/version.json")
          .expect(200)
          .then(res => {
            expect(typeof res.body.version).toEqual("string");
          });
      });

    });

  });

});
