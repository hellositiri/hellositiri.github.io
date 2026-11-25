# Sitiri design system (1.8: the kanga meets the counsel's office)

A professional-services site with real Nairobi photography and an elegant serif, carried by the kanga: its colours, its border patterns, its central rings and its message band. Saffron is the band that covers names.

## Colour
| Token | Hex | Role |
|---|---|---|
| paper | #F6F8F7 | main page ground |
| stone | #ECF0EE | alternate light sections |
| teal | #0B4F4B | hero tint, privacy section, brand surfaces |
| teal-deep | #083B38 | hero ground under the photo |
| ink | #13233A | headings, buttons, contact section, footer, the band behind placeholders |
| saffron | #F4B62A | primary buttons, kanga patterns, placeholder text on ink, highlighter |
| ochre | #8C6400 | step numerals and other saffron-family accents on light grounds |

Saffron on ink is the redaction pair. Never saffron text on paper; use ochre.

## Type
- Bodoni Moda (variable, optical size) for headings at 500 to 600, the italic wordmark, the proverb and the step numerals.
- Atkinson Hyperlegible 400/700 for running text, buttons and forms.
- Intros at 20.5px; body 18px; headings break between phrases.

## Photography
- Free Unsplash photographs, stored in /img and credited in the footer: Nairobi skyline (Jay Omari), Nairobi sunset (Stephen Berenju), signing (Romain Dancre), meeting (Christina, wocintechchat.com).
- The hero skyline is turned grey and tinted teal under a left-to-right gradient so the text stays legible. The sunset sits to the right of the contact text.
- Photo frames carry a strip of kanga teeth along the bottom.
- Billboards and poster lettering are cropped or softened out.

## Kanga devices
- Pindo dots (saffron on ink) along the top of the page and above the privacy section; kanga teeth above the message band and the footer.
- The medallion rings: saffron over the hero, teal as a faint watermark behind "How it works".
- Large faint italic words as watermarks: "siri" behind privacy, "sitiri" behind contact.
- The message band: "Siri ya mtungi aijuaye kata" with its translation, on white, right under the hero.
- Service cards are topped with four different kanga patterns.

## Inline devices in body text
- Placeholder chips (saffron on ink) where the text mentions [Company 1] and the like.
- A saffron highlighter stroke on the one phrase that matters in a paragraph.

## Motion
One moment: on load the names in the sample lease show for a second, then saffron-on-ink bands sweep over them in turn. A link under the lease toggles it afterwards. Reduced motion shows the covered state at once.

## Rules
- Numbers only for real sequences.
- No all-caps labels, no eyebrows, no gradient text.
- Fonts, photos and scripts are stored with the site. Nothing loads from elsewhere.
