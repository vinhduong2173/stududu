# DESIGN.md — Stududu Design System Specification
*Adheres to [Impeccable.style](https://impeccable.style/) & Human-First Interface Design*

## 1. Product & Brand Character
* **Brand Vibe:** Natural, friendly, human-first, approachable, and encouraging (Tandem-inspired).
* **Core Philosophy:** Clean and simple foundation, intentional color accents (60-30-10 rule), light from above, generous whitespace, and warm conversational feel.
* **Palette Identity:** Authentic, grounded Human Palette — Deep Nordic Ocean Teal (`#0D766E`), Obsidian Slate (`#0F172A`), Terracotta Rose (`#E11D48`), Honey Amber (`#D97706`). No synthetic dual-tone AI gradients.

---

## 2. Color Palette & Surface Tokens

```css
:root {
  /* Canvas Background: clean, soft off-white */
  --background: #F8FAFC;
  --surface: #FFFFFF;
  --surface-2: #F1F5F9;        /* Inset containers / inputs / chips */
  
  /* Text & Neutral Ink: deep slate, highly legible and natural (WCAG AAA) */
  --foreground: #0F172A;       /* Primary text */
  --muted: #475569;            /* Secondary & metadata text */
  
  /* Borders */
  --border: #E2E8F0;
  --border-strong: #CBD5E1;

  /* Human Brand Colors */
  --primary: #0D766E;          /* Deep Nordic Ocean Teal — Primary CTA, Active state */
  --primary-hover: #044E46;
  --secondary: #E11D48;        /* Terracotta Rose — "Learns" badge, Like actions */
  --secondary-hover: #BE123C;
  --accent: #D97706;           /* Honey Amber — Shared interests, star badges */
  --accent-blue: #0369A1;      /* Marine Blue — Information & wayfinding */
  
  /* Semantic Status */
  --success: #059669;          /* Online status dot, saved indicators */
  --warning: #D97706;
  --error: #E11D48;
}
```

---

## 3. Elevation & Lighting (Rule 1: Light Comes From The Sky)

* **Light Source:** Soft top-down natural ambient illumination.
* **Inset Elements (Recessed into surface):**
  * Text inputs, search boxes, chat bubbles from partners:
  * `bg-surface-2 border border-border focus:bg-surface focus:ring-2 focus:ring-primary/25`
* **Outset Elements (Floating cards):**
  * Profile Cards, MatchCards, Modals:
  * `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05);`
  * Hover state: `box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04); transform: translateY(-2px);`

---

## 4. Typography Hierarchy

* **Display Font:** Plus Jakarta Sans (`--font-display`) — Headings, brand titles.
* **Body Font:** Inter / System UI (`--font-inter`) — Body text, chats, descriptions.
* **Type Scale:**
  * `Display / H1`: 32px - 48px, ExtraBold, letter-spacing `-0.02em`.
  * `Heading / H2`: 22px - 28px, Bold, letter-spacing `-0.015em`.
  * `Subhead / H3`: 16px - 18px, SemiBold.
  * `Body`: 14px - 15px, Regular / Medium, line-height `1.5`.
  * `Badges / Chips`: 11px - 12px, Bold, letter-spacing `0.04em`.

---

## 5. Tandem-Specific UI Components & Layouts

* **Partner Cards (MatchCard):**
  * Large friendly Avatar + Bright Green Online Beacon.
  * Teal "Nói/Speaks" badge + Coral "Học/Learns" badge.
  * "💬 Cùng trò chuyện về: ..." conversation starter bubble.
  * Tandem-style Pill button for Like & Message.
* **Spacing & Rhythm:**
  * Generous whitespace, cards padded `p-5 md:p-6`, gutters `px-4 md:px-8`.
  * Rounded corners: `rounded-2xl` for cards, `rounded-xl` for items, `rounded-full` for chips, badges, and buttons.

---

## 6. Anti-Patterns to Avoid (Anti-AI Slop)

1. ❌ **No Heavy Artificial Glows or Blurred Orbs:** Keep shadows clean, soft, and natural.
2. ❌ **No Synthetic Multi-Color Gradients:** Use solid, confident brand colors with high contrast.
3. ❌ **No Side-Tab Borders (`border-l-4`):** Use natural uniform borders.
4. ❌ **No Kicker Above Headings:** Keep titles clean, punchy, and direct.
