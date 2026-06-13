# Design System Strategy: The Sonic Intelligence Interface

## 1. Overview & Creative North Star
**Creative North Star: "The Obsidian Conductor"**
This design system moves away from the "cluttered dashboard" trope of tele-calling software. Instead, it treats AI-driven data as a premium, curated experience. By leveraging the depth of a dark-mode palette (`#060e20`) and high-contrast accents, we create a "Command Center" feel that is both authoritative and effortless.

The layout rejects the rigid, boxy constraints of traditional SaaS. We utilize **intentional asymmetry**—placing heavy data visualizations against airy, minimalist controls—and **tonal nesting** to guide the eye. This is not just a tool; it is a sophisticated environment where the AI does the heavy lifting, and the UI provides the clarity.

---

## 2. Colors & Surface Philosophy
The palette is built on deep cosmic blues and electric purples, designed to feel luminous against the dark backdrop.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections.
Boundaries are established through background shifts. A `surface-container-low` section sitting on a `surface` background provides all the separation needed. This creates a seamless, "molded" look rather than a "stitched" one.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of obsidian and frosted glass:
*   **Base Layer:** `surface` (#060e20) – The infinite background.
*   **Sectional Layer:** `surface-container-low` (#091328) – For large layout groupings.
*   **Content Cards:** `surface-container` (#0f1930) – For primary data units.
*   **Active/Elevated Elements:** `surface-container-highest` (#192540) – For interaction states.

### The "Glass & Gradient" Rule
To add "soul" to the AI experience:
*   **Glassmorphism:** For floating modals or navigation rails, use `surface-variant` at 60% opacity with a `24px` backdrop-blur. 
*   **Signature Gradients:** Main Action buttons and AI-status indicators should utilize a linear gradient from `primary` (#85adff) to `secondary` (#c180ff) at a 135-degree angle.

---

## 3. Typography
We use a dual-font strategy to balance industrial precision with editorial elegance.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. High-contrast headlines in `display-lg` should feel like a magazine header, commanding attention.
*   **Body & Labels (Inter):** The workhorse. Used for high-density data. Inter’s tall x-height ensures readability even at `label-sm` (0.6875rem) when monitoring live call transcripts.
*   **Visual Hierarchy:** Use `on-surface-variant` (#a3aac4) for secondary metadata to ensure the `primary` content "pops" against the dark background.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not structural scaffolding.

*   **The Layering Principle:** Place a `surface-container-lowest` (#000000) card inside a `surface-container-high` (#141f38) area to create a "sunken" effect for input fields or secondary logs.
*   **Ambient Shadows:** For floating elements (like the AI Assistant bubble), use an ultra-diffused shadow: `0px 24px 48px rgba(0, 0, 0, 0.4)`. The shadow should feel like a soft glow rather than a harsh drop.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#40485d) at **15% opacity**. It should be felt, not seen.
*   **High-Contrast Data:** Visualizations (charts/graphs) must use `tertiary` (#8ce7ff) and `secondary` (#c180ff) against the `surface` to ensure 7:1 contrast ratios for critical KPIs.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `secondary`), `xl` (1.5rem) corner radius. No border. Text is `on-primary-fixed` (Black) for maximum punch.
*   **Secondary:** `surface-container-highest` fill with a `primary` text color.
*   **Tertiary:** Transparent background, `primary` text, underlined only on hover.

### Input Fields
*   **Style:** `surface-container-lowest` fill. No border. `lg` (1rem) corner radius.
*   **State:** On focus, a subtle `primary` outer glow (4px spread, 20% opacity).

### Cards & Lists
*   **The Anti-Divider Rule:** Forbid 1px dividers between list items. Instead, use a `12px` vertical gap.
*   **Call Log Item:** Use `surface-container` with a `lg` radius. On hover, shift background to `surface-container-high`.

### AI Sentiment Chips
*   **Positive:** `tertiary-container` fill with `on-tertiary-container` text.
*   **Negative:** `error-container` fill with `on-error-container` text.
*   *Note:* Use a `full` (pill) radius for all chips.

### Additional Signature Component: The "Waveform Monitor"
*   A custom component for live tele-calling. Use a `secondary` to `tertiary` gradient for the waveform, rendered on a `surface-container-lowest` track to visualize AI voice analysis in real-time.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use whitespace as a separator. If in doubt, double the margin.
*   **DO** use `surface-bright` (#1f2b49) for hover states on dark components to create a "light-up" effect.
*   **DO** ensure all data visualizations use the `tertiary` (#8ce7ff) color for "AI-generated" insights to distinguish them from manual data.

### Don’t:
*   **DON'T** use pure white (#FFFFFF) for body text; use `on-surface` (#dee5ff) to reduce eye strain in dark mode.
*   **DON'T** use standard `md` or `sm` rounded corners. This system requires the "Premium Softness" of `lg` and `xl` radii.
*   **DON'T** use 100% opaque borders. They break the "Obsidian" immersion.