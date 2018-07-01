const test = require("ava");
const Future = require("fluture");
const proxyquire = require("proxyquire");
const { Application } = require("probot");
const express = require("express");
const request = require("supertest");

test.beforeEach("mock plugin", t => {
  proxyquire.noPreserveCache();
  t.context.plugin = proxyquire("../../../../..", {
    "./lib/commitsSinceDate": function() {
      return Future.reject(new Error());
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

test("when error thrown", t => {
  t.plan(1);
  return request(t.context.app)
    .get("/meta/outdated/time.svg")
    .expect(302)
    .then(res => {
      t.is(res.headers.location, "https://img.shields.io/badge/last_deployment-unknown-red.svg");
    });
});
