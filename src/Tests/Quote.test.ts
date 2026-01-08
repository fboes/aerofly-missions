import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { Quote } from "../Export/Quote.js";

describe("QuoteTest test", () => {
  it("should quote html and xml correctly", () => {
    const test = '<a href="#abc">ABC</a>';
    const testAsXml = "&lt;a href=&quot;#abc&quot;&gt;ABC&lt;/a&gt;";
    assert.equal(Quote.html(test), testAsXml);
    assert.equal(Quote.unXml(testAsXml), test);

    assert.equal(Quote.unXml("<![CDATA[" + test + "]]>"), test);
    assert.equal(Quote.unXml("<![CDATA[" + testAsXml + "]]>"), testAsXml);
  });
});
