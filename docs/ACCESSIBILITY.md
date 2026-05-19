# Accessibility Documentation

**Target**: WCAG 2.1 AA Compliance  
**Last Updated**: 2025-11-05  
**PRD Reference**: Part 8 (lines 1831-1834), Part 12.2

## Compliance Status

**Current Level**: WCAG 2.1 AA (In Progress)  
**Testing Status**: Automated testing configured, manual testing in progress  
**Color Contrast**: ≥4.5:1 verified on primary components

## Automated Testing

### Tools Configured

- **eslint-plugin-jsx-a11y**: Static analysis for React components
- **@axe-core/playwright**: E2E accessibility testing (to be configured)
- **Lighthouse**: Performance and accessibility auditing

### Configuration

ESLint accessibility rules are enabled in `.eslintrc.json`:

```json
{
  "extends": ["plugin:jsx-a11y/recommended"],
  "plugins": ["jsx-a11y"]
}
```

### Running Automated Tests

```bash
# Lint check for accessibility issues
npm run lint

# Run E2E tests with accessibility checks (when configured)
npm run test:e2e

# Run Lighthouse audit
npx lighthouse https://proofound.io --view
```

## Manual Testing

### Keyboard Navigation

**All interactive elements must be keyboard accessible.**

#### Critical Flows Tested:

1. **Login/Signup Flow**
   - ✅ Tab order is logical
   - ✅ Focus visible on all interactive elements
   - ✅ Enter/Space keys activate buttons
   - ✅ Escape key closes modals

2. **Profile Editing**
   - ✅ Tab navigates through all form fields
   - ✅ Mission/Vision editors keyboard accessible
   - ✅ Values selection keyboard accessible
   - ✅ Causes selection keyboard accessible

3. **Proof Portfolio and Proof Pack Workflows**
   - ✅ Proof Pack links and proof actions remain reachable by keyboard
   - ⚠️ Retained taxonomy pickers should keep basic Tab/Enter behavior where they appear inside proof flows

4. **Matching Hub**
   - ✅ Introduce/Pass/Snooze buttons keyboard accessible
   - ✅ Match cards navigable with Tab
   - ✅ Dialogs close with Escape

5. **Assignment Creation**
   - ✅ 5-step wizard fully keyboard navigable
   - ✅ Step navigation with keyboard
   - ✅ Form inputs accessible

#### Keyboard Shortcuts

| Key           | Action                                          |
| ------------- | ----------------------------------------------- |
| `Tab`         | Navigate forward                                |
| `Shift + Tab` | Navigate backward                               |
| `Enter`       | Activate button/link                            |
| `Space`       | Activate button/checkbox                        |
| `Escape`      | Close dialog/modal                              |
| `Arrow Keys`  | Navigate within components (e.g., select, menu) |

### Screen Reader Testing

**Tested with**: NVDA (Windows), VoiceOver (Mac)

#### Semantic HTML Verified:

- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Landmark regions (`<main>`, `<nav>`, `<aside>`, `<footer>`)
- ✅ Form labels associated with inputs
- ✅ Button and link purposes clear
- ✅ Alt text for images
- ✅ ARIA labels where needed

#### Dynamic Content:

- ✅ Toast notifications announced (using `sonner` library)
- ⚠️ Real-time updates (e.g., new matches) may need `aria-live` regions
- ✅ Loading states communicated

#### Focus Management:

- ✅ Focus moves to modal/dialog when opened
- ✅ Focus returns to trigger element when closed
- ✅ Focus never trapped unintentionally
- ✅ Skip-to-content link available

### Color Contrast

**Minimum Requirement**: 4.5:1 for normal text, 3:1 for large text

#### Verified Elements:

- ✅ Primary text on background: 7:1
- ✅ Secondary text on background: 5:1
- ✅ Button text on button background: 6:1
- ✅ Link text: Underlined + sufficient contrast
- ⚠️ Muted text: Verify meets 4.5:1

#### Color Palette:

```
Primary Background: #FFFFFF (White)
Primary Text: #2D3330 (Dark Forest)
Secondary Text: #6B7280 (Gray-600)
Proofound Forest: #2D3330
Proofound Sage: #9CAF88
```

### Common Issues & Fixes

#### 1. Missing Alt Text

**Issue**: Images without alt attributes  
**Fix**: Add descriptive alt text or `alt=""` for decorative images

```tsx
// Good
<img src="profile.jpg" alt="User profile photo" />

// Decorative (empty alt)
<img src="decoration.svg" alt="" role="presentation" />
```

#### 2. Missing Form Labels

**Issue**: Input fields without associated labels  
**Fix**: Use `<Label>` component with proper `htmlFor` attribute

```tsx
// Good
<Label htmlFor="mission">Mission Statement</Label>
<Input id="mission" name="mission" />
```

#### 3. Insufficient Color Contrast

**Issue**: Text not readable against background  
**Fix**: Adjust color values or add background

```tsx
// Before: text-gray-400 (insufficient contrast)
<p className="text-gray-400">Description</p>

// After: text-gray-600 (sufficient contrast)
<p className="text-gray-600">Description</p>
```

#### 4. Missing Focus Indicators

**Issue**: No visible focus state  
**Fix**: Ensure `focus:` styles are applied

```tsx
// Good - visible focus ring
<button className="... focus:ring-2 focus:ring-proofound-forest focus:ring-offset-2">
  Click me
</button>
```

#### 5. Unlabeled Icons

**Issue**: Icon buttons without text labels  
**Fix**: Add `aria-label` or `<span className="sr-only">`

```tsx
// Good
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Also good
<button>
  <X className="h-4 w-4" />
  <span className="sr-only">Close dialog</span>
</button>
```

## ARIA Attributes Guide

### Common ARIA Labels

- `aria-label`: Provides accessible name for element
- `aria-labelledby`: References element(s) that label this element
- `aria-describedby`: References element(s) that describe this element
- `aria-hidden`: Hides element from screen readers
- `aria-live`: Announces dynamic content changes

### Usage Examples

```tsx
// Modal dialog
<div role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">Are you sure you want to proceed?</p>
</div>

// Live region for notifications
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>

// Icon button
<button aria-label="Delete item">
  <Trash2 />
</button>
```

## Known Issues

### High Priority (P1)

None identified yet.

### Medium Priority (P2)

1. **Retained taxonomy pickers**: richer arrow-key navigation would improve efficiency where taxonomy pickers appear in proof flows
2. **Real-time Updates**: Some dynamic content may not announce to screen readers
3. **Complex Forms**: Multi-step forms could benefit from progress announcements

### Low Priority (P3)

1. **Keyboard Shortcuts**: Custom shortcuts could improve efficiency
2. **High Contrast Mode**: Support for Windows High Contrast Mode
3. **Reduced Motion**: Respect `prefers-reduced-motion` for all animations

## Testing Procedures

### Before Each Release

1. **Automated Linting**

   ```bash
   npm run lint
   ```

2. **Keyboard Navigation**
   - Test all critical user flows
   - Verify tab order is logical
   - Ensure focus is visible

3. **Screen Reader**
   - Test with NVDA or VoiceOver
   - Verify all interactive elements are announced
   - Check form labels and error messages

4. **Color Contrast**
   - Use browser DevTools or WebAIM Contrast Checker
   - Verify all text meets 4.5:1 minimum

5. **Lighthouse Audit**
   ```bash
   npx lighthouse https://proofound.io --view
   ```
   Target: Accessibility score ≥90

## Resources

### Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [React Accessibility](https://react.dev/learn/accessibility)

### Screen Readers

- [NVDA](https://www.nvaccess.org/) (Windows, free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, paid)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (Mac/iOS, built-in)

## Contact

For accessibility concerns or issues, please contact:

- **Email**: accessibility@proofound.io
- **Support**: support@proofound.io

## Commitment

Proofound is committed to ensuring our platform is accessible to all users, regardless of ability. We continuously work to improve accessibility and welcome feedback from our community.

---

**Next Steps**:

1. Configure @axe-core/playwright for automated E2E testing
2. Complete manual keyboard navigation testing for all flows
3. Conduct comprehensive screen reader testing
4. Address any identified P1/P2 issues
5. Schedule quarterly accessibility reviews
