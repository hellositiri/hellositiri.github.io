# Sitiri design system (1.8: executive night)

The look is a kanga rendered as fine brass engraving on a night ground, with frosted glass used for one job: covering names. The kanga stays as composition (border, central motif, message band); the glass stays as meaning (privacy glass), never as decoration.

## Colour
| Token | Hex | Role |
|---|---|---|
| night | #0C1624 | front page ground, headers, footers |
| lift | #101E31 | alternate front-page sections |
| glow | #123C3D | the teal light behind the hero and privacy sections |
| brass | #C9A24E | primary buttons, engraving, pindo dots, numerals, focus ring; one accent per view |
| text-hi | #F3F6F5 | headings and strong text on night |
| text-mid | #B9C7CA | body text on night |
| text-low | #93A5AB | notes and captions on night |
| sheet | #FFFFFF | documents |
| ink | #13233A | text and buttons on light pages (tool, terms) |
| teal | #0B4F4B | accent on light pages |

Brass sits on night or behind night text. Never brass text on white. The front page is dark in every colour scheme; the tool and terms pages follow the visitor's light or dark setting.

## Type
- Bodoni Moda (variable, with optical size) for display: the italic wordmark at 600, headings at 500 to 600, numerals and service names in italic.
- Atkinson Hyperlegible 400/700 for all running text, buttons, forms and tables.
- Front page scale: 18 body, 19.5 lead, 24 h3, 34 to 54 h2, hero 44 to 74. Headings use `text-wrap: balance` and break between phrases.

## Glass
- Panes: rgba(255,255,255,.055) with backdrop blur 14 to 16px, a 1px inner edge and a top highlight. Used for the navigation bar, the case that holds the demo document, and the "check it yourself" panel. Nothing else.
- Frost strips: the names in the demo sit under white frosted strips (blur 5px) carrying the placeholder label in ink. Without backdrop-filter support the panes turn solid.

## Shape and depth
- Radius 4px on buttons, 8 to 10px on glass panes, 2px on paper.
- Shadows are long and soft: 0 60px 90px -40px rgba(0,0,0,.85) under glass.
- Lines are 1px: white at 10% between sections, brass at 45% above steps and services.

## Motion
- One moment: on load the names show for a beat, then frosted glass slides over each one in turn. A link under the case toggles it afterwards.
- prefers-reduced-motion shows the covered state at once.

## Rules
- Numbers only for real sequences (the three steps, the check steps).
- No all-caps except the kanga message band.
- No eyebrow labels, no same-size icon cards, no gradient text.
- Fonts, images and scripts are stored with the site. Nothing loads from elsewhere.
