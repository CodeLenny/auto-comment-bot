const sift = require("sift");

sift.use({
  $re: function(selector, string) {
    let regex;
    if(typeof string !== "string") {
      return false;
    }
    if(typeof selector === "string") {
      regex = new RegExp(selector);
    }
    else if(Array.isArray(selector) && selector.length >= 2) {
      regex = new RegExp(selector[0], selector[1]);
    }
    else if(Array.isArray(selector) && selector.length === 1) {
      regex = new RegExp(selector[0]);
    }
    else if(typeof selector === "object" && selector.pattern) {
      if(selector.flags) {
        regex = new RegExp(selector.pattern, selector.flags);
      }
      else {
        regex = new RegExp(selector.pattern);
      }
    }
    else {
      return false;
    }
    return regex.test(string);
  },
});

/**
 * Process any 'when' phrases in the template's metadata.
 * @param {Object} template the parsed template.
 * @param {Object} data the data associated with the webhook.
 * @return {boolean} `true` if the template passes the 'when' phrase in the metadata
 *   (or the template has no `when` data)
*/
function filterTemplateWhen(template, data) {
  if(typeof template.metadata !== "object"
      || !template.metadata
      || typeof template.metadata.when !== "object"
      || !template.metadata.when) {
    return true;
  }
  const tester = sift(template.metadata.when);
  return tester(data);
}

module.exports = filterTemplateWhen;
