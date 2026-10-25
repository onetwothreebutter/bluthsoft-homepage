/**
 * Splits text into words that each keep their trailing space, so they can be
 * animated one at a time and still read as the original text. The hero card
 * streams Bluth AI's reply in this way, and times the steps after it by the
 * word count.
 */
export function splitWords(text: string): string[] {
  return text.split(/(?<=\s)/);
}
