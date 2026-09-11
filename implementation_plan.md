# Implementation Plan: RajMahal Luxury Upgrade

This plan details the visual and interactive enhancements that will elevate the RajMahal Palace Hotel website to an ultra-premium, production-grade luxury web presence. The upgrades are designed to be applied globally and non-destructively through the core stylesheets (`style.css` and `components.css`) and scripts (`main.js`).

---

## 1. Aesthetic Polish & Typography Design System (`css/style.css`)

### Typography Refining
- Add fine-grained sub-pixel smoothing, selective text shadows, and enhanced letter tracking to headings.
- Establish a glowing text selection style using RajMahal's signature gold color.
- Make all paragraphs look more readable, clean, and elegant using subtle line-height adjustments and refined tracking (`font-weight: 300`, `letter-spacing: 0.05em`).

### Cinematic Radial Overlays
- Introduce layered, low-opacity background gradients to emulate candle-light shadows and royal depth:
  - Deep golden halos behind headers and key text elements.
  - Soft royal maroon and gold glow highlights in the background of dark panels.

### Premium Scrollbar & Selection Styles
- Customize the browser selection colors globally.
- Enhance the custom webkit-scrollbar with a high-end golden metallic gradient look, making it thinner and more integrated into the dark luxury vibe.

### Fine Art Separator
- Upgrade the simple diamond `◆` separator in `.section-divider` to a beautifully detailed, vector-stylized golden mandala line art element using SVG-in-CSS.

---

## 2. Luxury Visual Controls (`css/components.css`)

### Cinematic Ken Burns Slider Effect
- Enhance the `.hero-slide` transitions. When active, slides will perform a slow, high-end cinematic Ken Burns scale animation (zooming from `scale(1)` to `scale(1.08)` over 7 seconds), giving the hero section a majestic, slow-pan movie intro feel.

### Shimmering Light-Sweep Button Effect
- Introduce a continuous (or hover-triggered) shimmering light reflection sweeping across all `.btn-gold` buttons. This gives the buttons an exquisite metallic gleam, reminiscent of gold-leaf craftsmanship.

### High-End Custom Dual-Ring Cursor
- Style two custom elements:
  - `.custom-cursor-dot`: A tiny, solid golden dot directly centered on the coordinate.
  - `.custom-cursor-ring`: An outer, lag-free golden ring that follows the dot with smooth momentum.
- Create dynamic cursor hover states:
  - **Hover Expand:** When hovering links/buttons, the inner dot expands and the ring scales up with a glowing golden halo.
  - **Card Highlight:** When hovering over room cards, gallery images, or restaurant showcase images, the ring expands significantly and reveals a tiny, elegant uppercase word `"VIEW"` or `"EXPLORE"` centered inside it.

### Premium Hover Animations on Cards & Showcase Images
- Make room and dining cards feel incredibly tactile by adding an elegant border glow that shifts from transparent to a gold-accented metallic outline on hover, coupled with smooth 3D-inspired lifting and depth shadows.
- Scale and translate card images organically when hovered for a parallax feel.

---

## 3. Cinematic Scripting Engine (`js/main.js`)

### Performance-Optimized Mouse Cursor Tracking
- Build a smooth cursor tracking system using linear interpolation (lerp) inside a `requestAnimationFrame` loop. This avoids the lag common in standard cursor implementations, ensuring 60fps responsiveness.
- Automatically bind mouseenter/mouseleave listeners to all interactive items (`a`, `button`, interactive cards).
- Include standard touch-device matching (`pointer: coarse`) to automatically disable and hide the custom cursor on mobile and tablet devices, preventing bugs or layout issues.

### SPA-Like Cinematic Page Transition Engine
- Inject an internal link listener across all navigation links.
- When an internal link is clicked, prevent instant loading.
- Trigger a smooth closure: close the page elegantly (either circular preloader iris-in or soft viewport fade).
- Wait for the transition to finish, then navigate to the next HTML file.
- The next page will naturally trigger its preloader (doing an iris-out circular reveal), creating a seamless, uninterrupted web experience!

---

## 4. Verification & Testing

1. **Local Link Flow Check:** Navigate through all pages (Home, Suites, Dining, Wellness, Events, Gallery, Heritage, Reservations) to verify link interception and circular transition continuity.
2. **Interactive Elements:** Hover over navigation links, booking inputs, luxury CTA buttons, and images to observe the custom cursor expansion, shimmer button highlights, and image parallax translate.
3. **Responsive Stability:** Validate that custom cursors are automatically hidden on touch screens and the layout scales elegantly from wide screens to mobile sizes.
