export const Quote = {
  xml(text: string): string {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  html(text: string): string {
    return Quote.xml(text);
  },

  tmc(text: string): string {
    return text.replace(/\]/g, '')
  }
}
