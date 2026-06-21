export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric chars
    .replace(/\s+/g, '-') // replace spaces with dashes
    .replace(/-+/g, '-'); // collapse duplicate dashes
}
