const path = require("path");

class MockGetContent {

  constructor(user, repo) {
    this.user = user;
    this.repo = repo;
    this.files = [];
  }

  add(sha, path, contents) {
    this.files.push({ sha, path, contents });
  }

  directoryResponse(dir) {
    const apiURL = `https://api.github.com/repos/${this.user}/${this.repo}`;
    const htmlURL = `https://github.com/${this.user}/${this.repo}`;
    const files = this
      .files
      .filter(file => file.path.indexOf(dir) == 0)
      .map(file => {
        return {
          type: "file",
          encoding: "base64",
          size: 1000,
          name: path.basename(file.path),
          path: file.path,
          sha: file.sha,
          url: `${apiURL}/contents/${file.path}`,
          git_url: `${apiURL}/git/blobs/${file.sha}`,
          html_url: `${htmlURL}/blob/master/${file.path}`,
          download_url: `https://raw.githubusercontent.com/${this.user}/${this.repo}/master/${file.path}`,
          _links: {
            self: `${apiURL}/contents/${file.path}`,
            git: `${apiURL}/git/blobs/${file.sha}`,
            html: `${htmlURL}/blob/master/${file.path}`,
          },
        };
      });
      return Promise.resolve({
        data: files,
      });
  }

  fileResponse(filePath) {
    const apiURL = `https://api.github.com/repos/${this.user}/${this.repo}`;
    const htmlURL = `https://github.com/${this.user}/${this.repo}`;
    const files = this.files.filter(file => file.path === filePath);
    if(files.length < 1) {
      return Promise.reject(new Error(`Requested unknown file: ${filePath}`));
    }
    const file = files[0];
    return Promise.resolve({
      data: {
        type: "file",
        encoding: "base64",
        size: 1000,
        name: path.basename(file.path),
        path: file.path,
        content: Buffer.from(file.contents).toString("base64"),
        sha: file.sha,
        url: `${apiURL}/contents/${file.path}`,
        git_url: `${apiURL}/git/blobs/${file.sha}`,
        html_url: `${htmlURL}/blob/master/${file.path}`,
        download_url: `https://raw.githubusercontent.com/${this.user}/${this.repo}/master/${file.path}`,
        _links: {
          git: `${apiURL}/git/blobs/${file.sha}`,
          self: `${apiURL}/contents/${file.path}`,
          html: `${htmlURL}/blob/master/${file.path}`
        },
      },
    });
  }

  respond(request) {
    if(request.path === ".github") {
      return this.directoryResponse(request.path);
    }
    else {
      return this.fileResponse(request.path);
    }
  }

}

module.exports = MockGetContent;
