export const Quote = {
  xml(text: string): string {
    return text.replace(/[<>"&']/g, (m) => {
      switch (m) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '"':
          return '&quot;';
        case "'":
          return '&apos;';
        default:
          return m
      }
    });
  },

  unXml(text: string): string {
    const cdataMatch = text.match(/^<!\[CDATA\[(.+?)\]\]>$/);
    return cdataMatch 
      ? cdataMatch[1] 
      : text.replace(/&([a-z]+);/g, (m, inner: string) => {
          switch (inner) {
            case 'lt':
              return '<';
            case 'gt':
              return '>';
            case 'amp':
              return '&';
            case 'quot':
              return '"';
            case 'apos':
              return "'";
            default:
              return m
          }
        })
    ;
  },

  html(text: string): string {
    return Quote.xml(text);
  },

  tmc(text: string): string {
    return text.replace(/\]/g, '')
  }
}
