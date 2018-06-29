================
auto-comment-bot
================

Automatically post comments when issues and pull requests are opened.

Features
========

- Support for multiple templates per-repository
- Conditionally comment depending on GitHub variables such as title, body, author, time of post, etc.
- Templating support for all the GitHub variables

Setup
=====

* Copy ``.env.example`` into ``.env``

* Choose a webhook secret in ``.env``.

* If developing locally or from behind a firewall, sign up for Smee: https://smee.io/new
  Copy the smee URL into ``.env``, under ``WEBHOOK_PROXY_URL``

* Create a new GitHub App: https://github.com/settings/apps/new

  * If you are using smee, use the URL provided.  Otherwise, use the address of the server.
  * Use the webhook secret from ``.env``.
  * Select **read-only** permission for the repository, and **read/write** access for issues and pull requests
  * Select issue and pull requests for webhooks

* Download a private key for the app.  Save it inside the ``auto-comment-bot`` folder.

* Run ``npm install``

* Run ``npm start``
