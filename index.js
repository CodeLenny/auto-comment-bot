const Future = require("fluture");
const path = require("path");
const moment = require("moment");
const fm = require("front-matter");
const ejs = require("ejs");
const head = require("./lib/head");
const filterTemplateWhen = require("./lib/filterTemplateWhen");
const lastModification = require("./lib/lastModification");
const commitsSinceDate = require("./lib/commitsSinceDate");
const packageMetadata = require("./package.json");

const TEMPLATE_FILE = /^AUTO_COMMENT/;

function getTemplateContents(context, file) {
  return Future
    .tryP(() => context.github.repos.getContent(context.repo({
      path: file.path,
    })))
    .map(fileContents => Buffer.from(fileContents.data.content, "base64").toString())
    .map(fm)
    .map(contents => {
      return {
        path: file.path,
        name: file.name,
        metadata: contents.attributes,
        frontmatter: contents.frontmatter,
        body: contents.body,
      };
    });
}

function getAllTemplates(context) {
  return Future
    .tryP(() => context.github.repos.getContent(context.repo({
      path: ".github",
    })))
    .map(contents => contents.data)
    .map(files => files.filter(file => TEMPLATE_FILE.test(file.name)))
    .chain(files => Future.parallel(Infinity, files.map(file => getTemplateContents(context, file))))
    .map(files => files.filter(file => typeof file === "object" && typeof file.body === "string" && file.body.length > 1));
}

function renderTemplate(context, template, data) {
  let body = template.body;
  const extension = path.extname(template.path);
  if(extension === ".ejs") {
    body = ejs.render(body, data);
  }
  return Future.of({
    body,
  });
}

function catchError(selector, cb, errCb = null) {
  if(!errCb) {
    errCb = (err) => err;
  }
  return function(err) {
    if(err instanceof selector || err.message === selector.message) {
      return cb(err);
    }
    return errCb(err);
  }
}

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {

  app.on([
    "issues.opened",
    "pull_request.opened",
  ], context => {

    const action = context.event.event + (context.payload.action ? "." + context.payload.action : "");
    const isIssue = action === "issues.opened";
    const isPullRequest = action === "pull_request.opened";

    const data = {
      event: context.event.event,
      action,
      payload: context.payload,
    };

    return getAllTemplates(context)
      .map(templates => templates.filter(template => filterTemplateWhen(template, data)))
      .chain(templates => Future.parallel(Infinity, templates.map(template => renderTemplate(context, template, data))))
      .chain(templates => {
        try {
          return Future.of(head(templates));
        }
        catch (e) {
          return Future.reject(e);
        }
      })
      .chain(comment => {
        // (context.issue works for both issues and PRs)
        const post = context.issue({
          body: comment.body,
        });
        if(isIssue) {
          return Future.tryP(() => context.github.issues.createComment(post));
        }
        else {
          return Future.tryP(() => context.github.pullRequests.createComment(post));
        }
      })
      .chainRej(catchError(RangeError, err => {
        context.log.warn(err);
        return Future.of();
      }, (err) => Future.reject(err)))
      .promise();
  });

  const meta = app.route("/meta");
  meta.get("/package.json", (req, res) => {
    res.json(packageMetadata);
  });

  meta.get("/version.json", (req, res) => {
    res.json({
      version: packageMetadata.version,
    });
  });

  meta.get("/last-deployment.json", (req, res) => {
    return lastModification()
      .map(modification => {
        return {
          deployed: modification.getTime(),
          ago: moment(modification).fromNow(),
        };
      })
      .map(data => res.json(data))
      .chainRej(err => {
        res.status(500).send("Error");
        return Future.of();
      })
      .promise();
  });

  meta.get("/outdated/commits.svg", (req, res) => {
    return commitsSinceDate("CodeLenny", "auto-comment-bot", lastModification())
      .map(commits => commits.length)
      .map(count => {
        if(count === 0) {
          return "up_to_date-brightgreen";
        }
        return `${count}_commits_out_of_date-` + (count < 10 ? "yellow" : "red");
      })
      .chainRej(err => Future.of(`unknown-red`))
      .map(right => `last_deployment-${right}`)
      .map(status => `https://img.shields.io/badge/${status}.svg`)
      .map(url => res.redirect(url))
      .promise();
  });

  meta.get("/outdated/time.svg", (req, res) => {
    const commits = commitsSinceDate("CodeLenny", "auto-comment-bot", lastModification())
      .map(commits => {
        commits = commits
          .map(commit => new Date(commit.commit.author.date))
          .sort();
        if(commits.length < 1) {
          return "up_to_date-brightgreen";
        }
        const first = moment(commits[0]);
        const last = moment();
        const diff = moment.duration(last.diff(first));
        const diffText = diff
          .humanize()
          .replace(" ", "_");
        return `${diffText}_out_of_date-` + (diff.asDays() < 5 ? "yellow" : "red");
      })
      .chainRej(err => Future.of(`unknown-red`))
      .map(right => `last_deployment-${right}`)
      .map(status => `https://img.shields.io/badge/${status}.svg`)
      .map(url => res.redirect(url))
      .promise();
  });

}
