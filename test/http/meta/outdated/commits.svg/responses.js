const test = require("ava");
const Future = require("fluture");
const proxyquire = require("proxyquire");
const { Application } = require("probot");
const express = require("express");
const request = require("supertest");

test.beforeEach("mock plugin", t => {
  proxyquire.noPreserveCache();
  t.context.commits = [];
  t.context.plugin = proxyquire("../../../../..", {
    "./lib/commitsSinceDate": function() {
      return Future.of(t.context.commits);
    },
  });
});

test.beforeEach("create robot", t => {
  t.context.robot = new Application();
  t.context.robot.load(t.context.plugin);
});

test.beforeEach("create express app", t => {
  t.context.app = express();
  t.context.app.use(t.context.robot.router);
});

test("when 'up to date'", t => {
  t.plan(1);
  t.context.commits = [];
  return request(t.context.app)
    .get("/meta/outdated/commits.svg")
    .expect(302)
    .then(res => {
      t.is(res.headers.location, "https://img.shields.io/badge/deployed-up_to_date-brightgreen.svg");
    });
});

test("when 5 commits behind", t => {
  t.plan(1);
  t.context.commits = [{}, {}, {}, {}, {}];
  return request(t.context.app)
    .get("/meta/outdated/commits.svg")
    .expect(302)
    .then(res => {
      t.is(res.headers.location, "https://img.shields.io/badge/deployed-5_commits_out_of_date-yellow.svg");
    });
});

test("when 10 commits behind", t => {
  t.plan(1);
  t.context.commits = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  return request(t.context.app)
    .get("/meta/outdated/commits.svg")
    .expect(302)
    .then(res => {
      t.is(res.headers.location, "https://img.shields.io/badge/deployed-10_commits_out_of_date-red.svg");
    });
});
