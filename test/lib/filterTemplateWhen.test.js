const filterTemplateWhen = require("../../lib/filterTemplateWhen");

describe("filterTemplateWhen", () => {

  describe("accepts templates without 'when'", () => {

    test("no metadata", () => {
      expect(filterTemplateWhen({}, {})).toEqual(true);
    });

    test("null metadata", () => {
      expect(filterTemplateWhen({ metadata: null }, {})).toEqual(true);
    });

    test("no 'when'", () => {
      expect(filterTemplateWhen({ metadata: {} }, {})).toEqual(true);
    });

    test("null 'when'", () => {
      expect(filterTemplateWhen({ metadata: { when: null } }, {})).toEqual(true);
    });

  });

  test("accepts empty queries", () => {
    expect(filterTemplateWhen(
      { metadata: { when: {} } },
      { action: "something" }
    )).toEqual(true);
  });

  test("evaluates queries", () => {
    const filter = {
      action: {
        $eq: "issues.opened"
      }
    };
    expect(filterTemplateWhen(
      { metadata: { when: filter } },
      {
        action: "issues.opened",
        something: "something else",
      }
    )).toEqual(true);
    expect(filterTemplateWhen(
      { metadata: { when: filter } },
      {
        action: "not a valid action",
        something: "something else",
      }
    )).toEqual(false);
  });

  describe("$re", () => {

    test("rejects non-string data", () => {
      const filter = {
        action: {
          $re: "^iss",
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: 15 }
      )).toEqual(false);
    });

    test("uses strings", () => {
      const filter = {
        action: {
          $re: "^iss",
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "issues.opened" }
      )).toEqual(true);
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "asdf issues.opened" }
      )).toEqual(false);
    });

    test("accepts 2-element arrays", () => {
      const filter = {
        action: {
          $re: ["^iss", "i"],
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "ISSUES.opened" }
      )).toEqual(true);
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "asdf ISSUES.opened" }
      )).toEqual(false);
    });

    test("accepts 1-element arrays", () => {
      const filter = {
        action: {
          $re: [ "^iss" ],
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "issues.opened" }
      )).toEqual(true);
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "asdf issues.opened" }
      )).toEqual(false);
    });

    test("accepts objects with pattern and flags", () => {
      const filter = {
        action: {
          $re: {
            pattern: "^iss",
            flags: "i",
          },
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "ISSUES.opened" }
      )).toEqual(true);
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "asdf ISSUES.opened" }
      )).toEqual(false);
    });

    test("accepts objects with patterns", () => {
      const filter = {
        action: {
          $re: {
            pattern: "^iss",
          },
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "issues.opened" }
      )).toEqual(true);
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "asdf issues.opened" }
      )).toEqual(false);
    });

    test("rejects objects without patterns", () => {
      const filter = {
        action: {
          $re: {
            someRandomKey: "asdf",
          },
        },
      };
      expect(filterTemplateWhen(
        { metadata: { when: filter } },
        { action: "asdf" }
      )).toEqual(false);
    });

  });

});
