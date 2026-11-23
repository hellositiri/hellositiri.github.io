# Sitiri design system

The look is a kanga: a bordered cloth with a central motif and a message band. It is used as composition, not as trim.

## Color
| Token | Hex | Role |
|---|---|---|
| ink | #13233A | text, dark sections, kanga border ground |
| teal | #0B4F4B | brand field, primary surfaces |
| saffron | #F4B62A | the band that covers names; one accent per view |
| paper | #F6F8F7 | page ground |
| sheet | #FFFFFF | documents |
| manila | #E3C68C | file covers behind documents |
| rule | #C3D0D6 | hairlines, quiet borders |

Saffron on ink and ink on saffron are the redaction pair. Never put saffron text on paper.

## Type
- Bricolage Grotesque (variable 200 to 800): the wordmark at 800, headings at 600 to 700, large statements at 300.
- Atkinson Hyperlegible 400/700: all running text, forms and tables.
- Scale: 18 body, 22 lead, 28 h3, 40 h2, 56 to 72 statement, wordmark clamp(96px, 20vw, 260px).

## Shape and depth
- Radius 4px on controls, 2px on paper. Documents get a real paper shadow: 0 1px 0 #B9C2BF, 0 24px 48px -28px rgba(19,35,58,.45).
- Borders are 2px ink for controls the user acts on, 1px rule elsewhere.

## Motion
- One orchestrated moment per page: on the front page the band sweeps across the wordmark once and lifts off. The demo document runs once when it scrolls into view and then waits for the button.
- Everything respects prefers-reduced-motion.

## Rules
- Numbers only for real sequences.
- No all-caps labels except the kanga message band, which is how a kanga is printed.
- Fonts, images and scripts are stored with the site. Nothing loads from elsewhere.
