<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Cleaning Weekly
description: Affordable, local recurring cleaning — warm, trustworthy, booked in minutes.
---

# Design System: Cleaning Weekly

## 1. Overview

**Creative North Star: "The Trusted Counter"**

Cleaning-weekly should feel like walking up to the counter at a well-run local service business — not a startup landing page, not a gig app. Warm teal carries the brand with confidence; typography splits the job between a human display voice and mono-sharp numbers for quotes and pricing. Surfaces are committed, not timid: color does real work, but every screen still reads clearly and calmly.

The system rejects generic SaaS marketing grammar — purple gradients, stock-photo heroes, identical feature-card grids, and "Schedule a demo" energy. It also rejects gig-economy clutter and discount-site urgency. Reference lane: well-designed local service sites (plumber, landscaper, boutique gym) where trust and clarity come before flash.

Motion is responsive: buttons, forms, and state changes give tactile feedback; nothing scroll-choreographed or bouncy. Depth is tonal, not glassy.

**Key Characteristics:**
- Committed warm-teal surfaces with generous neutral breathing room for copy and forms
- Display headlines for warmth; mono accents for prices, quotes, and schedule details
- Flat-by-default elevation; depth through color steps, not drop shadows
- Local-business trust signals integrated into layout, not bolted-on badge strips
- Quote and call CTAs treated as equally legitimate paths

## 2. Colors

Committed color strategy: warm teal is the brand carrier — headers, primary buttons, key sections, and trust bands — targeting 30–60% of any given screen. Neutrals stay cool-tinted toward teal, not warm cream defaults.

### Primary
- **Trusted Teal** [to be resolved during implementation]: Primary brand color. Hero bands, primary buttons, active nav, section headers that need authority without corporate stiffness.

### Neutral
- **Clean Ground** [to be resolved during implementation]: Main page background — true off-white or very light cool neutral, not sand/cream/paper tints.
- **Ink** [to be resolved during implementation]: Body text and headings on light surfaces. Prioritize readability over muted-gray elegance.
- **Soft Surface** [to be resolved during implementation]: Form fields, quote cards, secondary panels — one step above ground.
- **Border Quiet** [to be resolved during implementation]: Dividers, input strokes, subtle separation.

### Named Rules
**The Committed Teal Rule.** Warm teal owns meaningful surface area on every page — not just buttons and links. If the page reads as gray-with-a-teal-button, the strategy failed.

**The No-Cream Default Rule.** Body backgrounds stay chroma-neutral or teal-tinted. Warm sand, parchment, and linen bands are prohibited unless explicitly revisited in a future scan.

## 3. Typography

**Display Font:** [font pairing to be chosen at implementation — serif or soft humanist display with warmth]
**Body Font:** [font pairing to be chosen at implementation — clean sans for UI and long copy]
**Label/Mono Font:** [mono family to be chosen at implementation — for prices, quote totals, schedule times, phone number]

**Character:** Display carries the neighbor-you-trust voice; body stays plain and scannable; mono handles anything numeric or transactional so quotes feel precise, not salesy.

### Hierarchy
- **Display** (light-to-regular weight, clamp-based, tight leading): Hero headlines, section titles on landing. Use `text-wrap: balance`.
- **Headline** (semibold, stepped sizes): Subsection headers, trust-block titles.
- **Title** (medium, component-level): Card titles, form section labels.
- **Body** (regular, 16–18px, 1.5–1.6 line-height, max ~70ch): Explanatory copy, service details, FAQ answers.
- **Label** (medium, mono for numeric): Quote line items, pricing, phone CTA, office hours.

### Named Rules
**The Quote Mono Rule.** Any number a customer uses to decide — price, frequency, square footage, time slot — renders in mono. Prose stays in sans.

## 4. Elevation

Flat by default. Depth comes from committed teal bands, soft surface tints, and border-quiet separation — not card shadows or glass blur. Hover states may lift slightly (subtle translate or background shift) but shadow vocabulary stays minimal.

Responsive motion energy implies light state feedback, not layered floating panels.

## 5. Components

[Components section omitted — no implementation yet. Re-run `/impeccable document` after the first build pass to capture buttons, forms, nav, and quote modules.]

## 6. Do's and Don'ts

### Do:
- **Do** lead with warm teal on heroes, CTAs, and trust sections so the brand reads committed, not accidental.
- **Do** pair a warm display face with mono for quotes, pricing, and phone numbers.
- **Do** surface local trust (insured, background-checked, service area) before the quote form.
- **Do** give "Get a quote" and "Call us" equal visual legitimacy — different paths, same care.
- **Do** honor `prefers-reduced-motion` on every transition.

### Don't:
- **Don't** ship generic SaaS landing-page clichés — purple gradients, stock handshakes, hero metrics, identical icon-card grids.
- **Don't** borrow gig-economy marketplace visuals — cluttered maps, anonymous worker cards, surge-pricing urgency.
- **Don't** use discount-site patterns — countdown timers, screaming yellow CTAs, coupon-code culture.
- **Don't** default to warm cream/sand/parchment body backgrounds.
- **Don't** hide quote pricing behind corporate "Contact sales" patterns.
