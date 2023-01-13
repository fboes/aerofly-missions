import { Test } from "../Cli/Test.js";
import { Quote } from "../Export/Quote.js";
export class QuoteTest extends Test {
    constructor(process) {
        super(process);
        this.group('Quote');
        {
            const test = '<a href="#abc">ABC</a>';
            const testAsXml = '&lt;a href=&quot;#abc&quot;&gt;ABC&lt;/a&gt;';
            this.assertEquals(Quote.html(test), testAsXml);
            this.assertEquals(Quote.unXml(testAsXml), test);
            this.assertEquals(Quote.unXml('<![CDATA[' + test + ']]>'), test);
            this.assertEquals(Quote.unXml('<![CDATA[' + testAsXml + ']]>'), testAsXml);
        }
    }
}
