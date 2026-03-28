const COLOR_NAMES = [
  'red',
  'blue',
  'green',
  'yellow',
  'black',
  'white',
  'purple',
  'orange',
  'pink',
  'brown',
  'gray',
  'grey',
  'silver',
  'gold',
  'violet',
  'clear',
  'translucent',
]

const COLOR_REGEX = new RegExp(COLOR_NAMES.join('|'), 'gi')

export function extractColors(text: string): string[] {
  const matches = text.match(COLOR_REGEX) ?? []
  return [...new Set(matches.map((c) => c.toLowerCase()))]
}
