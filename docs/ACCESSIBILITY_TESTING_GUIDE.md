# Accessibility Testing Guide

**PRD:** Part 8 (lines 1831-1834), Part 12.2  
**Target:** WCAG 2.1 AA Compliance

This guide provides step-by-step instructions for manual accessibility testing of Proofound platform.

## Table of Contents

1. [Overview](#overview)
2. [Testing Tools](#testing-tools)
3. [Keyboard Navigation Testing](#keyboard-navigation-testing)
4. [Screen Reader Testing](#screen-reader-testing)
5. [Color Contrast Testing](#color-contrast-testing)
6. [Focus Management Testing](#focus-management-testing)
7. [ARIA Labels Audit](#aria-labels-audit)
8. [Testing Checklist](#testing-checklist)

---

## Overview

WCAG 2.1 Level AA compliance ensures our platform is accessible to users with disabilities. This includes:

- **Perceivable:** Content must be presentable to users in ways they can perceive
- **Operable:** UI components and navigation must be operable
- **Understandable:** Information and operation must be understandable
- **Robust:** Content must be robust enough for assistive technologies

---

## Testing Tools

### Required Tools

1. **Screen Readers:**
   - **NVDA (Windows):** [Download](https://www.nvaccess.org/download/)
   - **JAWS (Windows):** [30-minute demo mode](https://www.freedomscientific.com/products/software/jaws/)
   - **VoiceOver (Mac):** Built-in (Cmd + F5 to enable)
2. **Browser Extensions:**
   - **axe DevTools:** [Chrome](https://chrome.google.com/webstore) | [Firefox](https://addons.mozilla.org/en-US/firefox/)
   - **WAVE:** [Chrome/Firefox](https://wave.webaim.org/extension/)
   - **Accessibility Insights:** [Chrome](https://accessibilityinsights.io/)

3. **Color Contrast Tools:**
   - **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
   - **Colour Contrast Analyser:** [Desktop app](https://www.tpgi.com/color-contrast-checker/)

4. **Automated Testing:**
   - **Playwright with axe-core:** Already configured (run `npm run test:a11y`)

---

## Keyboard Navigation Testing

### Critical User Flows to Test

Test these flows using **keyboard only** (no mouse):

#### 1. **Profile Creation Flow (I-01 to I-05)**

**Steps:**

1. Navigate to signup page using Tab
2. Fill form fields using Tab and Shift+Tab
3. Submit form with Enter/Space
4. Navigate through profile creation steps using Tab
5. Complete mission/vision forms
6. Add skills using keyboard
7. Save each section with Enter/Space

**Checklist:**

- [ ] Skip link appears when Tab is pressed first
- [ ] All form fields are reachable with Tab
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Shift+Tab moves focus backwards
- [ ] Enter/Space activates buttons
- [ ] Focus is visible on all elements
- [ ] No keyboard traps (can always Tab out)
- [ ] Form validation errors are announced
- [ ] Success messages are announced

#### 2. **Dashboard Navigation**

**Steps:**

1. Log in using keyboard only
2. Navigate dashboard widgets with Tab
3. Open sidebar menus with Enter/Space
4. Navigate through menu items with Arrow keys
5. Close menus with Escape

**Checklist:**

- [ ] All widgets are keyboard accessible
- [ ] Menus can be opened with Enter or Space
- [ ] Arrow keys navigate menu items
- [ ] Escape closes menus
- [ ] Focus returns to trigger after menu closes
- [ ] Custom components (modals, dropdowns) trap focus appropriately

#### 3. **Assignment Creation Flow (O-01 to O-07)**

**Steps:**

1. Navigate to assignments page
2. Click "New Assignment" with Enter/Space
3. Complete 5-step wizard using Tab/Shift+Tab
4. Navigate between steps with Tab or Arrow keys
5. Submit assignment with Enter/Space

**Checklist:**

- [ ] All wizard steps are keyboard navigable
- [ ] Step indicator shows current step
- [ ] Can move forward/backward with keyboard
- [ ] Required field errors are announced
- [ ] Form controls (dropdowns, checkboxes) work with keyboard
- [ ] Skill search/autocomplete works with keyboard

### Keyboard Shortcuts to Test

| Action               | Key            |
| -------------------- | -------------- |
| Move focus forward   | Tab            |
| Move focus backward  | Shift + Tab    |
| Activate button/link | Enter or Space |
| Navigate menu items  | Arrow Keys     |
| Close modal/menu     | Escape         |
| Select checkbox      | Space          |
| Select radio button  | Space          |
| Open dropdown        | Space or Enter |

---

## Screen Reader Testing

### Testing with NVDA (Windows)

1. **Start NVDA:** Ctrl + Alt + N
2. **Stop NVDA:** Insert + Q
3. **Read current line:** Insert + Up Arrow
4. **Read next line:** Down Arrow
5. **Navigate by heading:** H (previous: Shift + H)
6. **Navigate by landmark:** D (previous: Shift + D)
7. **Navigate by link:** K (previous: Shift + K)
8. **Navigate by form field:** F (previous: Shift + F)

### Testing with VoiceOver (Mac)

1. **Start VoiceOver:** Cmd + F5
2. **Stop VoiceOver:** Cmd + F5
3. **Start/stop reading:** VO + A (VO = Ctrl + Option)
4. **Next item:** VO + Right Arrow
5. **Previous item:** VO + Left Arrow
6. **Activate link/button:** VO + Space
7. **Open rotor:** VO + U (navigate by headings, links, forms)

### What to Listen For

**✅ Good Accessibility:**

- Page title is announced when page loads
- Headings announce their level (h1, h2, etc.)
- Buttons and links announce their purpose
- Form fields announce their labels
- Required fields are indicated
- Error messages are read immediately
- Success confirmations are announced
- Loading states are communicated ("Loading..." or "Busy")
- Modal dialogs announce their title when opened
- Focus changes are announced

**❌ Poor Accessibility:**

- "Button" or "Link" without context
- Images without alt text (screen reader says "Image")
- Unlabeled form fields
- Silent errors or success messages
- Unclear navigation structure
- No landmark regions (header, nav, main, footer)
- Dynamic content changes without announcement

### Pages to Test

1. **Homepage** - Should announce main heading, navigation, and content structure
2. **Login/Signup** - Form fields must have clear labels
3. **Dashboard** - Widgets should have descriptive headings
4. **Profile Editor** - All form fields must be labeled
5. **Expertise Hub** - Skill list should be navigable
6. **Matching Hub** - Match cards should announce key information
7. **Zen Hub** - Well-being forms must be accessible
8. **Settings** - All privacy controls must be labeled

---

## Color Contrast Testing

### WCAG AA Requirements

- **Normal text (< 18pt):** Contrast ratio ≥ 4.5:1
- **Large text (≥ 18pt or 14pt bold):** Contrast ratio ≥ 3:1
- **UI components and graphics:** Contrast ratio ≥ 3:1

### Testing Process

1. **Install** Colour Contrast Analyser (CCA)
2. **Open** the app
3. **Use eyedropper** to select foreground color from browser
4. **Use eyedropper** to select background color
5. **Check** if Pass/Fail indicators show WCAG AA compliance

### Colors to Test

| Element             | Foreground          | Background      | Min Ratio |
| ------------------- | ------------------- | --------------- | --------- |
| Body text           | #2D3330 (Dark Sage) | #FFFFFF (White) | 4.5:1     |
| Headings            | #2D3330             | #FFFFFF         | 4.5:1     |
| Links               | #7A9D54 (Sage)      | #FFFFFF         | 4.5:1     |
| Buttons (primary)   | #FFFFFF             | #2D3330         | 4.5:1     |
| Buttons (secondary) | #2D3330             | #E8E6DD (Linen) | 3:1       |
| Error text          | #DC2626 (Red)       | #FFFFFF         | 4.5:1     |
| Success text        | #16A34A (Green)     | #FFFFFF         | 4.5:1     |
| Focus indicator     | #7A9D54             | #FFFFFF         | 3:1       |

### Common Issues to Check

- [ ] Text over images has sufficient contrast
- [ ] Placeholder text is visible
- [ ] Disabled form fields are distinguishable
- [ ] Link text is distinguishable from body text
- [ ] Error messages have sufficient contrast
- [ ] Focus indicators are visible on all elements

---

## Focus Management Testing

### Focus Indicator Requirements

- Focus must be **visually distinct** (outline, border, or background change)
- Focus indicator must meet **3:1 contrast ratio** against adjacent colors
- Focus must **never be completely removed** (outline: none is a violation)

### Testing Checklist

- [ ] Tab once - first interactive element should show focus
- [ ] Continue tabbing - focus indicator should be visible on every element
- [ ] Focus indicator should be consistent across all components
- [ ] Custom components (modals, dropdowns) should show focus
- [ ] Focus should never disappear when navigating

### Focus Trapping in Modals

When a modal/dialog opens:

- [ ] Focus moves to modal (ideally first focusable element or modal itself)
- [ ] Tab cycles through modal elements only
- [ ] Shift+Tab cycles backwards within modal
- [ ] Cannot Tab outside the modal
- [ ] Escape closes modal
- [ ] Focus returns to trigger element when modal closes

---

## ARIA Labels Audit

### Required ARIA Attributes

| Element Type          | Required Attributes                   | Example                                       |
| --------------------- | ------------------------------------- | --------------------------------------------- |
| Button with icon only | `aria-label`                          | `<button aria-label="Close">×</button>`       |
| Link with icon only   | `aria-label`                          | `<a href="#" aria-label="Home"><Icon /></a>`  |
| Form input            | `aria-label` or `<label>`             | `<input aria-label="Email" />`                |
| Modal/Dialog          | `role="dialog"`, `aria-labelledby`    | `<div role="dialog" aria-labelledby="title">` |
| Navigation region     | `role="navigation"`, `aria-label`     | `<nav aria-label="Main navigation">`          |
| Main content          | `role="main"` or `<main>`             | `<main id="main-content">`                    |
| Loading spinner       | `role="status"`, `aria-live="polite"` | `<div role="status">Loading...</div>`         |

### Manual Audit Checklist

- [ ] All buttons have accessible names (text content or aria-label)
- [ ] All form inputs have labels (via `<label for="id">` or aria-label)
- [ ] All images have alt text (or role="presentation" if decorative)
- [ ] Icon-only buttons have aria-label
- [ ] Landmark regions are properly defined (header, nav, main, footer)
- [ ] Page has exactly one h1
- [ ] Headings follow logical order (h1 → h2 → h3, no skipping)
- [ ] Error messages use aria-live="assertive" or aria-describedby
- [ ] Loading states use aria-live="polite" or role="status"

---

## Testing Checklist

### Pre-Release Checklist

Before deploying to production, complete this checklist:

#### Automated Tests

- [ ] Run `npm run test:a11y` - all tests pass
- [ ] Run axe DevTools on all pages - zero violations
- [ ] Run WAVE extension on all pages - zero errors

#### Manual Keyboard Testing

- [ ] All interactive elements are reachable with Tab
- [ ] Tab order is logical
- [ ] Focus is visible on all elements
- [ ] No keyboard traps
- [ ] Modals trap focus appropriately
- [ ] Escape closes modals/menus
- [ ] Skip to main content link works

#### Manual Screen Reader Testing

Test **at least one** critical flow with **one** screen reader:

- [ ] **NVDA (Windows)** or **VoiceOver (Mac)**
- [ ] Homepage is announced correctly
- [ ] Form fields are labeled
- [ ] Buttons announce their purpose
- [ ] Errors are announced
- [ ] Loading states are communicated
- [ ] Modal titles are announced

#### Color Contrast

- [ ] All text meets 4.5:1 ratio (or 3:1 for large text)
- [ ] UI components meet 3:1 ratio
- [ ] Focus indicators are visible

#### Focus Management

- [ ] Focus indicator is visible on all interactive elements
- [ ] Focus indicator meets 3:1 contrast ratio
- [ ] Modals trap focus
- [ ] Focus returns to trigger after modal closes

#### ARIA & Semantics

- [ ] All buttons/links have accessible names
- [ ] All form inputs have labels
- [ ] All images have alt text
- [ ] Landmark regions are defined
- [ ] Headings are in logical order
- [ ] Error/loading states use ARIA live regions

---

## Quick Reference

### Most Common WCAG AA Violations

1. **Missing form labels** - Use `<label>` or `aria-label`
2. **Low color contrast** - Text must be 4.5:1, UI elements 3:1
3. **Missing alt text** - All images need `alt` attribute
4. **Keyboard inaccessible** - All interactive elements must be focusable
5. **No focus indicator** - Never use `outline: none` without replacement
6. **Unlabeled buttons** - Icon-only buttons need `aria-label`
7. **Missing skip link** - First tab should reveal "Skip to main content"
8. **Inaccessible modals** - Must trap focus and announce title

### Resources

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Checklist:** https://webaim.org/standards/wcag/checklist
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/

---

## Support

For questions or issues with accessibility testing:

- Review [WCAG 2.1 documentation](https://www.w3.org/WAI/WCAG21/quickref/)
- File issues in our issue tracker with the `accessibility` label
- Consult with the accessibility team before making exceptions

**Last Updated:** November 7, 2025  
**Next Review:** February 7, 2026
