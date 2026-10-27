export function parseWcag(wcag: string): { criterion: string; name: string }[] {
  if (!wcag) return []

  return wcag.split('; ').map((item) => {
    const space = item.indexOf(' ')
    if (space === -1) return { criterion: item, name: '' }
    return { criterion: item.slice(0, space), name: item.slice(space + 1) }
  })
}
