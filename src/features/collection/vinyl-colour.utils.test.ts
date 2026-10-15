import { describe, expect, it } from 'vitest'

import {
  unrecognisedWords,
  vinylColour,
  vinylColours,
} from './vinyl-colour.utils'

// Format notes below are real, from Discogs Releases
const vinyl = (text?: string, qty = '1') => ({ name: 'Vinyl', qty, text })

describe('vinylColour', () => {
  it('is black when there is no format note', () => {
    expect(vinylColour([vinyl()])).toEqual({
      effect: 'solid',
      colours: [{ family: 'black', render: '#0a0a0b', translucent: false }],
      materials: [],
    })
    expect(vinylColour([])).toMatchObject({ colours: [{ family: 'black' }] })
  })

  it('is black when the note names no colour', () => {
    for (const text of [
      '180 Gram, Gatefold',
      'Gatefold, 180g',
      'Pitman Pressing',
      'Remix, 50th Anniversary Edition, Optimal Media Pressing, 180g',
    ])
      expect(vinylColour([vinyl(text)])).toMatchObject({
        effect: 'solid',
        colours: [{ family: 'black' }],
      })
  })

  it('is black when the colour named is the sleeve’s, not the disc’s', () => {
    for (const text of [
      'Red Cover',
      'Blue Cover, Santa Maria Pressing',
      'Specialty Pressing, Embossed Cover, Grey Print',
      'Pitman Pressing, Steamboat Label',
      'Goldisc Pressing',
      'Carrollton Pressing, Masterdisk, RL Etching',
    ])
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect: 'solid',
        colours: [{ family: 'black' }],
      })
  })

  it('leaves quoted edition names out', () => {
    expect(
      vinylColour([vinyl('Dark Brown [Ink Black], "The Black Dog"')]),
    ).toMatchObject({ effect: 'solid', colours: [{ family: 'brown' }] })
  })

  it('reads the first disc when discs differ', () => {
    expect(vinylColour([vinyl('Disc 1: Red, Disc 2: Blue', '2')])).toEqual(
      vinylColour([vinyl('Red')]),
    )
    expect(
      vinylColour([vinyl('LP1: Clear / LP2: Black Splatter', '2')]),
    ).toEqual(vinylColour([vinyl('Clear')]))
    expect(vinylColour([vinyl('Orange'), vinyl('Bone')])).toEqual(
      vinylColour([vinyl('Orange')]),
    )
  })

  it('reads the vinyl, not another format of the Release', () => {
    expect(
      vinylColour([
        { name: 'Box Set', qty: '1', text: 'Red Cloth' },
        { name: 'CD', qty: '1', text: 'Blue' },
        vinyl('Yellow'),
      ]),
    ).toMatchObject({ colours: [{ family: 'yellow' }] })
  })

  it('reads a solid colour, by name or by shade', () => {
    const cases: [string, string][] = [
      ['Red', 'red'],
      ['Oxblood Red', 'burgundy'],
      ['Burgundy', 'burgundy'],
      ['Bone', 'beige'],
      ['Mint', 'green'],
      ['Silver', 'silver'],
      ['Pink [Baby Pink]', 'pink'],
      ['Deep Blue', 'blue'],
      ['Opaque Green, Precision Record Pressing', 'green'],
      ['White Opaque, 180g', 'white'],
    ]
    for (const [text, family] of cases)
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect: 'solid',
        colours: [{ family, translucent: false }],
      })
  })

  it('reads a translucent colour, however the note puts it', () => {
    const cases: [string, string][] = [
      ['Blue Translucent', 'blue'],
      ['Translucent Green, Precision Record Pressing', 'green'],
      ['Red (Ruby) Translucent', 'red'],
      ['Magenta (Neon Translucent)', 'pink'],
      ['Blue Transparent [Curacao]', 'blue'],
      ['Curacao Blue Transparent', 'blue'],
      ['Curacao', 'blue'],
      ['Coke Bottle Clear', 'green'],
      ['Clear [Coke Bottle]', 'clear'],
      ['Green Translucent [Coke Bottle Clear]', 'green'],
    ]
    for (const [text, family] of cases)
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect: 'solid',
        colours: [{ family, translucent: true }],
      })
  })

  it('reads clear vinyl, and a bare "transparent" as clear', () => {
    for (const text of ['Clear', 'Crystal Clear', 'Transparent'])
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect: 'solid',
        colours: [{ family: 'clear', translucent: true }],
      })
  })

  it('reads the effect and its colours, the base first', () => {
    const cases: [string, string, string[]][] = [
      [
        'Clear w/ Black & White Splatter',
        'splatter',
        ['clear', 'black', 'white'],
      ],
      [
        'Yellow / Black Splatter, 180 Gr., Gatefold',
        'splatter',
        ['yellow', 'black'],
      ],
      ['Violet Marbled', 'marbled', ['purple']],
      [
        'Oxblood w/ Black + White Marble',
        'marbled',
        ['burgundy', 'black', 'white'],
      ],
      ['Gray Swirl [Black And White Galaxy], Gatefold', 'marbled', ['grey']],
      ['Gold Galaxy', 'marbled', ['gold']],
      ['Yellow / Red Split', 'split', ['yellow', 'red']],
      [
        'Clear With Split Orange And Black Liquid Fill',
        'split',
        ['clear', 'orange', 'black'],
      ],
      [
        'Red/Yellow/Green Tri-Color, Gatefold, 30th Anniversary Edition',
        'propeller',
        ['red', 'yellow', 'green'],
      ],
      ['Clear With Black Yolk', 'yolk', ['clear', 'black']],
      ['Blue/White [Blue Eye Yolk], Alt. Cover', 'yolk', ['blue', 'white']],
      ['Pink-In-Yellow Swirl', 'marbled', ['yellow', 'pink']],
      [
        'Black & Red Merge ["Black & Red Ink Spot"]',
        'ink-spot',
        ['black', 'red'],
      ],
      // Not seen on a Release yet: the Optimal Media names
      ['Black With Orange Corona', 'corona', ['black', 'orange']],
      ['Red / White Twister', 'twister', ['red', 'white']],
      ['Side D Etched', 'etched', ['black']],
    ]
    for (const [text, effect, families] of cases)
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect,
        colours: families.map((family) => ({ family })),
      })
  })

  it('reads splatter over another effect as its hybrid', () => {
    const cases: [string, string, string[]][] = [
      [
        'Blue Yolk-In-Clear With Pink And White Splatter [Enceladus Geysers]',
        'yolk-splatter',
        ['clear', 'blue', 'pink', 'white'],
      ],
      // Not seen on a Release yet
      [
        'Red / Blue Split With White Splatter',
        'split-splatter',
        ['red', 'blue', 'white'],
      ],
      [
        'Purple Marbled With Black Splatter',
        'marbled-splatter',
        ['purple', 'black'],
      ],
    ]
    for (const [text, effect, families] of cases)
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect,
        colours: families.map((family) => ({ family })),
      })
  })

  it('reads the material apart from the colours', () => {
    expect(vinylColour([vinyl('Red Sparkle')])).toMatchObject({
      effect: 'solid',
      colours: [{ family: 'red' }],
      materials: ['sparkle'],
    })
    // The glitter's gold is the material's, not a second colour
    expect(
      vinylColour([
        vinyl(
          'Orange Translucent With Gold Glitter [Portofino Orange Glitter], Sweat And Vanilla Perfume Edition',
        ),
      ]),
    ).toMatchObject({
      effect: 'solid',
      colours: [{ family: 'orange', translucent: true }],
      materials: ['sparkle'],
    })
    expect(
      vinylColour([
        vinyl(
          'Blue Translucent With Black Marbling And Gold Glitter [Lakeside Beach Blue Sparkle]',
        ),
      ]),
    ).toMatchObject({
      effect: 'marbled',
      colours: [{ family: 'blue' }, { family: 'black' }],
      materials: ['sparkle'],
    })
    expect(
      vinylColour([vinyl('Blue Translucent w/ Luminous Splatter')]),
    ).toMatchObject({
      effect: 'splatter',
      colours: [{ family: 'blue' }],
      materials: ['glow'],
    })
  })

  it('gives a material alone its own colour, not black', () => {
    expect(vinylColour([vinyl('Glow In The Dark')])).toMatchObject({
      materials: ['glow'],
      colours: [{ family: 'green' }],
    })
    expect(vinylColour([vinyl('Glow In The Dark [Day Glow]')])).toMatchObject({
      materials: ['glow'],
    })
  })

  it('reads a picture disc from the format descriptions too', () => {
    expect(
      vinylColour([
        { name: 'Vinyl', qty: '1', descriptions: ['LP', 'Picture Disc'] },
      ]),
    ).toMatchObject({ materials: ['picture-disc'] })
  })

  it('reads "w." as "with", not the end of a sentence', () => {
    expect(
      vinylColour([
        vinyl('Milky Clear w. Oxblood Splatter, 20th Anniversary Edition'),
      ]),
    ).toMatchObject({
      effect: 'splatter',
      colours: [{ family: 'clear' }, { family: 'burgundy' }],
    })
  })

  it('takes the shade and clarity a bracketed name adds to the same colour', () => {
    const curacao = vinylColour([vinyl('Curacao')]).colours[0]
    expect(vinylColour([vinyl('Blue [Transparent Curacao]')]).colours).toEqual([
      curacao,
    ])
    expect(
      vinylColour([vinyl('Brown Translucent Marbled [Mahogany Brown Marbled]')])
        .colours,
    ).toEqual([
      { ...vinylColour([vinyl('Mahogany')]).colours[0], translucent: true },
    ])
    // Another family in brackets is a marketing name, not a refinement
    expect(vinylColour([vinyl('Red [Oxblood]')]).colours).toEqual(
      vinylColour([vinyl('Red')]).colours,
    )
  })

  it('reads "half speed" as mastering, not a split', () => {
    expect(vinylColour([vinyl('Half Speed Master')])).toMatchObject({
      effect: 'solid',
      colours: [{ family: 'black' }],
    })
  })

  it('reads one colour in another as a yolk, the outer one the base', () => {
    expect(vinylColour([vinyl('Black In Red')])).toMatchObject({
      effect: 'yolk',
      colours: [{ family: 'red' }, { family: 'black' }],
    })
  })

  it('reads "clear" beside a colour as that colour, see-through', () => {
    for (const text of ['Clear Blue', 'Blue Clear'])
      expect(vinylColour([vinyl(text)]), text).toMatchObject({
        effect: 'solid',
        colours: [{ family: 'blue', translucent: true }],
      })
  })

  it('knows neon and rose gold', () => {
    expect(vinylColour([vinyl('Neon Yellow')])).toMatchObject({
      colours: [{ family: 'yellow' }],
    })
    expect(unrecognisedWords('Neon Yellow')).toEqual([])
    expect(vinylColour([vinyl('Rose Gold')])).toMatchObject({
      colours: [{ family: 'gold' }],
    })
  })

  it('keeps each colour’s own clarity', () => {
    expect(
      vinylColour([vinyl('Red Translucent & Black Split')]).colours,
    ).toMatchObject([
      { family: 'red', translucent: true },
      { family: 'black', translucent: false },
    ])
  })

  it('reads two colours with no effect named as a split', () => {
    expect(vinylColour([vinyl('Red & Black')])).toMatchObject({
      effect: 'split',
      colours: [{ family: 'red' }, { family: 'black' }],
    })
  })

  it('renders a named shade in its own colour, not its family’s', () => {
    const red = vinylColour([vinyl('Red')]).colours[0].render
    const oxblood = vinylColour([vinyl('Oxblood')]).colours[0]
    expect(oxblood.family).toBe('burgundy')
    expect(oxblood.render).not.toBe(red)
    expect(vinylColour([vinyl('Deep Blue')]).colours[0].render).not.toBe(
      vinylColour([vinyl('Blue')]).colours[0].render,
    )
  })
})

describe('unrecognisedWords', () => {
  it('lists the words of the note the parser does not know', () => {
    expect(
      unrecognisedWords('Blue Translucent Marbled [Moonstone Blue Marbled]'),
    ).toEqual(['moonstone'])
    expect(unrecognisedWords('Seaglass Swirl, Gatefold')).toEqual(['seaglass'])
  })

  it('leaves out the words that are never a colour', () => {
    expect(unrecognisedWords('180 Gram, Gatefold')).toEqual([])
    expect(unrecognisedWords('Disc 1: Red, Disc 2: Blue')).toEqual([])
    expect(
      unrecognisedWords('Limited Edition Heavyweight Coloured Vinyl'),
    ).toEqual([])
  })

  it('leaves out the parts about the sleeve or the plant', () => {
    expect(unrecognisedWords('Pitman Pressing, Steamboat Label')).toEqual([])
    expect(unrecognisedWords('Red, Embossed Cover')).toEqual([])
  })
})

describe('vinylColours', () => {
  const families = (formats: Parameters<typeof vinylColours>[0]) =>
    vinylColours(formats).map(({ colours }) => colours[0].family)

  it('has one Vinyl colour per disc, across every vinyl format', () => {
    expect(families([vinyl('Black', '3')])).toEqual(['black', 'black', 'black'])
    expect(
      families([
        vinyl('Black', '2'),
        { name: 'CD', qty: '1', text: 'Blue' },
        vinyl('Red'),
      ]),
    ).toEqual(['black', 'black', 'red'])
  })
  it('counts a disc of unknown quantity as one', () => {
    expect(families([{ name: 'Vinyl' }])).toEqual(['black'])
    expect(families([vinyl('Red', '')])).toEqual(['red'])
  })

  it('has no disc when the Release has no vinyl', () => {
    expect(vinylColours([{ name: 'CD', qty: '2', text: 'Blue' }])).toEqual([])
    expect(vinylColours([])).toEqual([])
  })
  it('gives each disc its own colour when the note tells them apart', () => {
    expect(families([vinyl('Disc 1: Red, Disc 2: Blue', '2')])).toEqual([
      'red',
      'blue',
    ])
    expect(
      vinylColours([vinyl('LP1: Clear / LP2: Black Splatter', '2')]),
    ).toEqual([
      vinylColour([vinyl('Clear')]),
      vinylColour([vinyl('Black Splatter')]),
    ])
    expect(families([vinyl('LP 2: Bone; LP 1: Oxblood', '2')])).toEqual([
      'burgundy',
      'beige',
    ])
  })

  it('gives a disc the note doesn’t single out its format’s colour', () => {
    expect(families([vinyl('Red, Disc 3: Blue', '3')])).toEqual([
      'red',
      'red',
      'blue',
    ])
    expect(families([vinyl('Disc 1: Gold, Disc 2: Gatefold', '2')])).toEqual([
      'gold',
      'gold',
    ])
  })

  it('starts with the disc vinylColour reads for the Release', () => {
    for (const text of ['Disc 1: Red, Disc 2: Blue', 'Red, Disc 2: Blue'])
      expect(vinylColours([vinyl(text, '2')])[0]).toEqual(
        vinylColour([vinyl(text, '2')]),
      )
  })
})
