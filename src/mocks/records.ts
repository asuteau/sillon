export type Record = {
  id: string
  title: string
  artist: string
  year: number
  label: string
}

export const records: Record[] = [
  {
    id: '1',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: 1959,
    label: 'Columbia',
  },
  {
    id: '2',
    title: 'Dummy',
    artist: 'Portishead',
    year: 1994,
    label: 'Go! Beat',
  },
  {
    id: '3',
    title: 'Loveless',
    artist: 'My Bloody Valentine',
    year: 1991,
    label: 'Creation',
  },
  {
    id: '4',
    title: 'Mezzanine',
    artist: 'Massive Attack',
    year: 1998,
    label: 'Virgin',
  },
  {
    id: '5',
    title: 'OK Computer',
    artist: 'Radiohead',
    year: 1997,
    label: 'Parlophone',
  },
]
