# Rezon Bio Design and Motion Reference

Reference: [Rezon Bio by Widelab](https://portfolio.widehue.co/rezonbio/)

This document records the visual system, interaction patterns, and animation choreography observed on the reference site. It is an implementation guide for adapting those ideas to this Next.js and shadcn/ui project, not a specification for copying the brand, artwork, copy, or proprietary assets.

## 1. Design direction

The site combines a clinical, high-trust subject with expressive editorial motion:

- Large, plain-language headlines carry most of the hierarchy.
- Clean white and pale-lavender surfaces offset saturated violet sections.
- Scientific imagery and abstract molecular video provide the visual energy.
- Rounded containers soften almost every major surface without making it look like a conventional card dashboard.
- Motion explains progression: scrolling advances a story, scrubs media, changes active panels, and moves galleries.
- Shadows are largely avoided. Contrast, scale, borders, color blocks, and overlap establish depth.
- Most sections contain one dominant interaction instead of many competing effects.

For this product, preserve the structure and motion principles while using RecoveryAI content, data, and brand assets.

## 2. Visual language

### Color system

Observed reference colors:

- Deep ink violet: `#1A126E` — primary headings and high-contrast actions.
- Brand violet: `#2A2292` — hero and alternating service panels.
- Dark violet: `#241C7F` — large editorial section.
- Bright violet: `#6554DE` — media wells and supporting accents.
- Pale lavender: `#EFF2FF` — page sections, panels, and mobile navigation.
- Soft translucent lavender: `rgba(241, 244, 255, 0.4)` — overlay story cards.
- Warm yellow: `#FADD80` — rotating hero keyword.
- Neutral gray: `#7B7B7B` — supporting copy.
- White: `#FFFFFF` — page surface and reversed text.

Recommended RecoveryAI adaptation:

- Keep the existing dashboard tokens unchanged.
- Scope the editorial palette to a marketing wrapper such as `.marketing-theme`; do not replace global dashboard colors.
- Use one primary violet, one pale surface, and one warm highlight. Avoid adding extra gradients or unrelated accents.
- Retain semantic success, warning, and destructive colors where product data requires them.

### Typography

The reference uses Stolzl with a geometric, friendly shape:

- Hero: approximately `80px / 1.02`, weight 400, `-0.04em` tracking on desktop.
- Section heading: approximately `64px / 1.04`, weight 400, `-0.04em` tracking.
- Mobile hero: approximately `44px / 1.04`.
- Body: `16px / 1.48`, weight 300.
- Eyebrow label: `12px / 1.44`, weight 500.
- Navigation and buttons: `14–16px`, weight 400–500.

Use Geist Sans for the adaptation unless a licensed geometric display face is provided. The important qualities are open counters, restrained weight, tight headline tracking, and generous line lengths—not an exact font match.

Suggested Tailwind styles:

- Hero: `text-[clamp(2.75rem,5.55vw,5rem)] leading-[1.02] tracking-[-0.04em]`.
- Section heading: `text-[clamp(2.25rem,4.45vw,4rem)] leading-[1.04] tracking-[-0.04em]`.
- Body: `text-base leading-[1.48] text-muted-foreground`.
- Eyebrow: `text-xs font-medium`.

### Shape and depth

- Major panels use `20–32px` corner radii.
- Standard controls use roughly `12px`.
- Mobile header and menu surfaces use approximately `20px`.
- Media is clipped to the same radius as its parent well.
- Borders are thin and low contrast.
- Layered sections use physical overlap and sticky positioning instead of heavy shadows.

Use `rounded-[1.25rem]` for compact surfaces and `rounded-[2rem]` for large editorial cards. Keep the current shadcn radius for ordinary product controls.

### Spacing and containers

- Full-bleed sections hold background color or video.
- A wide container sits about `10–16px` from the viewport edge.
- Editorial content uses a narrower desktop container near `1170px`.
- Desktop section padding is often around `160px` above and `200px` below.
- Mobile sections collapse to comfortable `24–32px` gutters and much shorter vertical spacing.

Recommended primitives:

- `container-wide`: `mx-auto w-full max-w-[1424px] px-4`.
- `container-editorial`: `mx-auto w-full max-w-[1172px] px-6 md:px-8`.
- Section rhythm: `py-20 md:py-32 xl:py-40`.

## 3. Page composition patterns

### Inset adaptive header

- Header floats inside the viewport rather than touching its edges.
- It is wide, rounded, and visually grouped as a single bar.
- The desktop version shows logo, primary navigation, language, and a CTA.
- The header swaps between light and dark modes according to the section under it.
- Mobile reduces the bar to logo plus a large rounded menu toggle.
- The open mobile menu is a separate rounded, scrollable violet panel with accordion rows and hairline dividers.

shadcn mapping:

- `NavigationMenu` for desktop links.
- `Sheet` for the mobile overlay, customized to be inset and rounded rather than edge-to-edge.
- `Accordion` for nested mobile groups.
- `Button` with an icon-only variant for the menu toggle.
- Keep an explicit `aria-label`, `aria-expanded`, and focus return on close.

### Hero with kinetic keyword

- Full-viewport violet field with animated scientific video behind the copy.
- Headline is left-aligned and oversized.
- The final highlighted word rotates vertically through a short list.
- Video remains legible but does not compete with white and warm-yellow copy.
- A loader delays the initial content entrance on the reference site.
- A scroll affordance moves directly to the following story section.

For RecoveryAI, the rotating word should communicate outcomes such as “Recovery”, “Clarity”, “Compliance”, or “Confidence.” Use a purpose-made product visualization rather than the reference molecular media.

### Scroll-driven story

- A long pale section behaves like three viewport-height chapters.
- Media remains visually fixed while the active text panel changes with scroll progress.
- Only one text panel is active at a time.
- Characters brighten progressively from low opacity to full opacity.
- Video time is directly scrubbed by page scroll.
- A horizontal progress indicator reflects completion.

This pattern is best for a three-step product explanation, not for essential content. All chapter content must remain available without animation.

### Stacked service panels

- Four large rounded panels alternate light and dark surfaces.
- Each panel divides into a media well and a content column.
- As the next panel approaches the top, the previous panel scales to `0.8` and blurs to `5px`.
- The stack creates depth without shadows.
- Alternating background color prevents the repeated layout from becoming monotonous.

Use this for high-level platform capabilities. On mobile, remove blur and scale if they reduce readability; render a normal vertical card sequence.

### Pinned horizontal editorial gallery

- A dark section introduces the company story.
- A horizontal strip combines text and image slides.
- The strip pins when centered and translates horizontally while vertical scroll continues.
- Cards use a consistent `26px` radius.
- Partner marks fade upward as they enter.

Treat the horizontal movement as progressive enhancement. On touch screens, prefer a native horizontal `Carousel` or snap-scrolling list.

### Horizontal statistics rail

- Metric cards form another horizontally moving rail on desktop.
- Numbers are oversized and labels stay short.
- Mobile should become a vertical grid or touch-scroll carousel.
- Statistics use restrained decoration so the values remain dominant.

### Facilities accordion

- A large image and a text accordion share the viewport.
- Two location rows toggle which image and expanded content are active.
- The switch occurs around the halfway point of the section’s scroll progress.
- Inactive content collapses to a compact location bar.

For product use, this maps well to comparing workflow stages, recovery channels, or lender portfolios.

### Cursor-reactive separator

- A decorative grid separates major content groups.
- Grid marks within roughly `80px` of the pointer rotate toward it.
- Each mark returns to rest with a `300ms ease-out` transition.
- The effect is decorative and should not capture pointer events or communicate state.

### Oversized CTA and animated footer

- The closing CTA uses two very large rounded actions.
- A floating utility box scales away as the CTA enters, avoiding visual competition.
- The footer is another clipped, rounded composition with media behind an inner pale panel.
- Its alternate state activates after roughly `35.5%` of the footer scroll range.

## 4. Motion specification

The reference uses GSAP 3.12.2 with ScrollTrigger, SplitText, and ScrollToPlugin, plus a small number of CSS keyframes.

### Initial load

- Loader count: `000` to `100` over `2.75s`, linear.
- Loader enters its completed state, then becomes hidden after `1.5s`.
- Hero content: starts at `opacity: 0` and `translateY(100px)`, then animates for `1.25s` after a `3.75s` delay.
- Floating/sticky UI uses the same `1.25s` duration and delay, entering from `translateY(-100px)`.
- Hero media fades over `1.25s` after about `3.25s`.

Do not reproduce the long blocking loader in the app. It is appropriate for an editorial showcase but harmful to repeat visits and task-focused product flows. Use an immediate first paint and start nonessential motion after content is readable.

### Rotating hero word

- CSS animation duration: `15s`, linear, infinite.
- Start delay: `4s`.
- Words move as one vertical list through a clipped line-height viewport.
- Duplicate the first word at the end for a seamless loop.

Implementation note: use transform-only keyframes. Pause the animation when the tab is hidden and disable it under reduced motion.

### Section heading reveal

- Split label, heading, and description into masked words.
- Start each word at `translateY(100px)` and `autoAlpha: 0`.
- Animate for `1s` with `0.05s` word stagger.
- Trigger when the heading reaches about `80%` of viewport height.
- Reverse when scrolling back.
- Unsplittable supporting content uses `translateY(30px)`, opacity fade, `0.8s`, `power2.out`.

Avoid visually splitting text in a way that damages screen-reader output. Keep the original semantic string and mark visual fragments `aria-hidden`.

### Scroll story

- Section length: approximately `4.5` viewport heights for three chapters.
- Active chapter index derives from normalized scroll progress.
- Character base opacity: `0.2`.
- Character highlight fills during the first `80%` of each chapter’s segment.
- Character tween duration: `0.65s`.
- Video `currentTime` maps directly to normalized section progress.
- Progress bar updates linearly with a short `0.1s` smoothing tween.

### Service stack

- Trigger range: panel top at `65%` of the viewport to panel top at viewport top.
- Previous panel animates to `scale(0.8)` and `blur(5px)`.
- Scroll smoothing: `scrub: 1`.
- Transform origin should stay centered unless visual testing indicates a better anchor.

### Horizontal rails

- Pin when the rail wrapper reaches the viewport center.
- Scroll distance equals `inner scroll width - viewport width`.
- Translate the rail by that exact overflow distance.
- Use linear easing and `scrub: 1`.
- Refresh measurements after fonts and media load.

### Small transitions

- Partner marks: `opacity: 0`, `translateY(30px)` to visible over `0.8s`, `power2.out`.
- Sticky CTA utility: scale between `1` and `0` over `0.3s`.
- Cursor grid: `transform 0.3s ease-out`.
- Smooth anchor jump: `0.5s`, linear.

## 5. Responsive behavior

### Desktop

- Full navigation is visible.
- Hero fills the viewport.
- Story chapters use sticky media and scroll scrubbing.
- Service cards use scale and blur depth.
- About and statistics sections use pinned horizontal motion.
- Facilities behave as a scroll-controlled accordion.

### Tablet

- Reduce headline sizes with `clamp()`.
- Keep the inset header but collapse links before they wrap.
- Preserve sticky stories only when the viewport has enough height.
- Convert complex horizontal sections to drag or snap scrolling when pinning feels cramped.

### Mobile

- Header becomes logo plus rounded menu toggle.
- Menu opens as a rounded, internally scrollable accordion panel.
- Hero copy stacks into short lines over full-bleed media.
- Use a mobile-specific media crop.
- Story media can remain behind text, but content must not disappear between scroll states.
- Service panels become a conventional vertical list.
- Horizontal galleries use touch scrolling with `scroll-snap`.
- Facilities become a tap-controlled accordion.
- Oversized CTA buttons stack vertically.

Suggested breakpoints:

- Mobile: below `768px`.
- Tablet/navigation transition: below `992px`.
- Wide typography and spacing: from `1280px`.

## 6. shadcn/ui implementation map

Use shadcn primitives for controls and accessibility behavior, then compose custom editorial sections around them:

- Header: `NavigationMenu`, `Sheet`, `Accordion`, `Button`.
- Story progress: `Progress`.
- Service content: customized `Card`, without default dashboard padding or shadow.
- Mobile galleries: `Carousel`.
- Facilities: `Accordion`.
- CTA: `Button` with a dedicated `hero` size and violet variants.
- Footer navigation: semantic `nav` elements; no card component is needed.

Do not force every editorial wrapper into a `Card`. Full-bleed sections, sticky tracks, media wells, and decorative grids should remain purpose-built semantic components.

Suggested component boundaries:

- `MarketingHeader`
- `KineticHero`
- `ScrollStory`
- `ServiceStack`
- `HorizontalStoryRail`
- `MetricRail`
- `FacilityAccordion`
- `ReactiveSeparator`
- `ClosingCta`
- `MarketingFooter`

Each animation-heavy section should be a client component with its own setup and cleanup. Static headings, copy, and media should remain server-rendered wherever possible.

## 7. Project-specific setup notes

This repository currently uses Next.js 15, React 19, Tailwind CSS 3.4, Radix packages, and local shadcn-style components.

`components.json` is currently only a migration comment rather than valid shadcn configuration. Repair it before running `shadcn add`; otherwise the CLI cannot reliably detect paths or component settings.

Recommended setup sequence when implementation begins:

1. Replace `components.json` with valid project configuration using the existing aliases and `src/app/globals.css`.
2. Keep the Radix base because the project already uses Radix primitives.
3. Add only missing primitives such as `sheet`, `accordion`, `navigation-menu`, `progress`, and `carousel`.
4. Add GSAP only if these scroll-linked effects are approved. CSS and Intersection Observer are sufficient for ordinary reveals.
5. Scope the marketing color tokens so the existing dark product dashboard remains stable.

## 8. Accessibility and performance requirements

- Respect `prefers-reduced-motion: reduce`.
- Under reduced motion, show the first hero keyword, reveal all text immediately, stop video scrubbing, remove pinning, and render rails as standard lists.
- Do not gate content behind a loader.
- Preserve semantic heading order and readable DOM order.
- Keep keyboard focus visible against both light and violet surfaces.
- Mobile menu must trap focus, close on Escape, and restore focus to its trigger.
- Accordion controls must expose expanded state and remain operable without scrolling animation.
- Decorative video should be muted, use `playsInline`, and include a poster.
- Avoid autoplaying large video on constrained connections; serve responsive codecs and poster-first loading.
- Animate `transform` and `opacity` where possible.
- Blur is expensive; limit it to one outgoing service card and disable it on lower-powered/mobile devices.
- Create each ScrollTrigger once, clean it up on unmount, and recalculate after font and media loading.
- Test pinned sections for cumulative layout shift and browser address-bar resizing.

## 9. What to preserve versus adapt

Preserve:

- Editorial scale.
- A disciplined violet/pale-surface contrast.
- Rounded inset compositions.
- One meaningful motion concept per section.
- Scroll progression that reinforces the content sequence.
- Strong mobile simplification.

Adapt:

- Use RecoveryAI language, outcomes, visuals, and data.
- Replace proprietary footage and brand marks.
- Shorten the initial animation timeline.
- Keep product pages task-focused; reserve cinematic motion for the public landing and pitch experience.
- Use accessible shadcn controls for menus, accordions, carousels, and actions.
