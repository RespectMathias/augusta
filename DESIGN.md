# Design.md — Card-Based Presentation Slide Design (PowerPoint .pptx)

## 1. Core Concept
Every slide consists entirely of **Explanation Cards**. 
* There must be **no floating text elements** on the slide canvas background—all content must reside inside a card.
* The only two exceptions allowed outside of cards are the **Slide Title** and the **Page Number**.
* **Core Principle:** *"The card is the unit of thought—one card, one point."*

## 2. Slide Structure (Canvas)
* **Slide Dimensions:** 16:9 Widescreen (13.33" × 7.5")
* **Slide Margins:** 0.5" on all sides
* **Top Title Area Height:** ~0.9" (Title 36–40pt bold, left-aligned)
* **Card Zone:** From below the Title area down to the bottom margin
* **Gutter (Spacing between cards):** 0.3" fixed throughout the entire deck
* **Slide Canvas Background:** Solid white (`#FFFFFF`) or a dark theme color (choose one and maintain consistency throughout the deck)

## 3. Card Anatomy
Every card follows the exact same top-to-bottom layout hierarchy:
1. **Icon inside a colored circle** (diameter ~0.45") at the top-left corner of the card.
2. **Card Title** — 18–20pt bold, 1 line (maximum 2 lines).
3. **Explanatory Body Content** — 13–14pt, left-aligned, 2–5 lines.
4. *(Optional)* **Hero Number / Tag** — Large stat number (28–36pt) or a small tag (10pt).

### Card Styling
* **Card Background:** A subtle tint or slightly contrasting color compared to the canvas background (e.g., light grey `#F4F5F7` on a white background).
* **Corner Radius:** 8–12pt (use a single consistent value across the entire deck).
* **Shadow:** Faint drop shadow (either use it across the entire deck or do not use it at all—never mix styles).
* **Internal Padding:** 0.2–0.25" on all sides.
* **Prohibited:** Side color bands (edge stripes) or accent underlines below headers—rely entirely on background tint, icons, and shadows instead.

## 4. Layout Grid System (Flexible based on card count)
The number of cards per slide is flexible and adjusts based on the content using this standard grid guide:

| Card Count | Layout Style | Approximate Card Dimensions |
| :--- | :--- | :--- |
| **1 Card** | Full-width area (Hero Card) | ~12.3" × 5.6" |
| **2 Cards**| 2 side-by-side columns | ~6.0" × 5.6" |
| **3 Cards**| 3 columns OR 1 large card left + 2 stacked right | ~4.0" × 5.6" |
| **4 Cards**| 2×2 grid layout | ~6.0" × 2.65" |
| **5 Cards**| 2 top + 3 bottom (or vice versa) mixed rows | Mixed by row |
| **6 Cards**| 3×2 grid layout | ~4.0" × 2.65" |
| **7+ Cards**| Break into a new slide—**never exceed 6 cards per slide** | — |

### Grid Rules:
* Cards in the same row **must always have equal height** and align perfectly to the same grid line.
* The most crucial card can expand to span 2 grid columns (**Featured Card**), limited to a maximum of 1 per slide.
* If content runs long, **reduce the card count** instead of shrinking the font size below 12pt.
* Never use the exact same layout for more than 2 consecutive slides—vary the card count and grid patterns to maintain visual engagement.

## 5. Typography and Color Palette
### Color Palette (Select 1 theme and stick to it across the entire deck)
* **Structure:** Primary Color (60–70% visual weight) + Secondary Color + 1 Accent Color.
* **Accent Color Usage:** Strictly reserved for icon circles, hero numbers, and tags only.
* *Examples of suitable themes:* **Charcoal Minimal** (`#36454F` / `#F2F2F2` / `#212121`) or **Teal Trust** (`#028090` / `#00A896` / `#02C39A`). Tailor the choice to the deck's actual subject matter; do not default to standard corporate blue.

### Typography (Use standard Office fonts for cross-platform stability)
* **Slide Title:** Cambria Bold (36–40pt)
* **Card Title:** Calibri Bold (18–20pt)
* **Card Content:** Calibri (13–14pt)
* **Tags / Sub-captions:** Calibri (10–11pt, muted color)
* **Alignment:** Content must always be left-aligned. Center alignment is only permitted for slide titles and hero numbers.
* **Contrast:** Text-to-card contrast must be exceptionally sharp (avoid light grey text on light backgrounds).

## 6. Card Variants
Maintain structural consistency but vary the inner configuration to keep the deck dynamic:
* **Concept Card:** Icon + Title + Description (Default style).
* **Stat Card:** Large hero number (28–36pt) + small label beneath the number.
* **Step Card:** Sequential number inside a circle instead of an icon (used for processes or timelines).
* **Compare Card:** Paired side-by-side cards (Before/After, Pros/Cons) using slightly contrasting background tints.
* **Quote/Highlight Card:** Emphasized text in italics, limited to a maximum of 1 per slide.

## 7. Quality Assurance (QA) Checklist
Review every slide against these checks before final delivery:
* [ ] All text items are enclosed within a card. No floating text outside cards (except slide titles and page numbers).
* [ ] No text overflows or is cut off at the card edges.
* [ ] Cards in the same row are equal in height, with a consistent 0.3" gutter.
* [ ] Margin from the slide edge is ≥ 0.5" on all sides.
* [ ] Corner radius, shadows, and internal padding are completely uniform across all cards.
* [ ] Maximum of 6 cards per slide.
* [ ] Icons and text provide crisp contrast against the card background.
* [ ] Visually inspect rendered previews (text overflow is the most common bug).

## 8. Sample Slide Wireframe
```text
┌──────────────────────────────────────────────┐
│  Slide Title 36pt Bold                       │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ ◉ Icon   │ │ ◉ Icon   │ │ ◉ Icon   │      │
│  │ Title    │ │ Title    │ │ Title    │      │
│  │ Desc     │ │ Desc     │ │ Desc     │      │
│  │ 2–4 Lines│ │ 2–4 Lines│ │ 2–4 Lines│      │
│  └──────────┘ └──────────┘ └──────────┘      │
│                                        p.3   │
└──────────────────────────────────────────────┘
```
