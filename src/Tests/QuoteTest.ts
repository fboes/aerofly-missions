import { Test } from "../Cli/Test.js";
import { Quote } from "../Export/Quote.js";

export class QuoteTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group('Quote');
    {
      this.assertEquals(Quote.html('<a href="#abc">ABC</a>'), '&lt;a href=&quot;#abc&quot;&gt;ABC&lt;/a&gt;')
    }
  }
}
