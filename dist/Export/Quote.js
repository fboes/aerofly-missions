export const Quote = {
    xml(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    html(text) {
        return Quote.xml(text);
    },
    tmc(text) {
        return text.replace(/\]/g, '');
    }
};
