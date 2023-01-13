export const Quote = {
    xml(text) {
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
                    return m;
            }
        });
    },
    unXml(text) {
        const cdataMatch = text.match(/^<!\[CDATA\[(.+?)\]\]>$/);
        return cdataMatch
            ? cdataMatch[1]
            : text.replace(/&([a-z]+);/g, (m, inner) => {
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
                        return m;
                }
            });
    },
    html(text) {
        return Quote.xml(text);
    },
    tmc(text) {
        return text.replace(/\]/g, '');
    }
};
