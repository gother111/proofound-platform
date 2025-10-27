# Proofound MVP - Layout Specifications

**Last Updated:** October 27, 2025  
**Purpose:** Comprehensive layout documentation for all pages in the Proofound MVP application  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## 📚 Overview

This directory contains detailed layout specifications for every page in the Proofound MVP application. Each document provides precise measurements, colors, spacing, typography, and responsive behavior for consistent implementation.

---

## 📂 Directory Structure

```
/layouts
├── README.md (this file)
├── dashboards/
│   ├── individual-dashboard.md
│   ├── organization-dashboard.md
│   └── admin-dashboard.md
├── profiles/
│   ├── individual-profile.md
│   ├── organization-profile.md
│   ├── government-profile.md
│   └── profile-edit.md
├── matching/
│   ├── matching-space.md
│   ├── individual-matching.md
│   └── organization-matching.md
├── settings/
│   ├── settings-overview.md
│   ├── individual-sections.md
│   └── organization-sections.md
├── expertise/
│   └── expertise-atlas.md
├── assignments/
│   └── assignment-builder.md
├── auth/
│   ├── signin.md
│   ├── individual-signup.md
│   └── organization-signup.md
└── other/
    ├── landing-page.md
    ├── zen-hub.md
    ├── messages.md
    └── verifications.md
```

---

## 🎯 Quick Navigation

### By Priority

#### 🔴 Critical Pages (Must Implement First)
- [Sign In](./auth/signin.md) - User authentication
- [Individual Dashboard](./dashboards/individual-dashboard.md) - Primary individual landing
- [Organization Dashboard](./dashboards/organization-dashboard.md) - Primary organization landing
- [Settings](./settings/settings-overview.md) - Account management

#### 🟡 High Priority
- [Landing Page](./other/landing-page.md) - Marketing homepage
- [Matching Space](./matching/matching-space.md) - Core matching feature
- [Individual Profile](./profiles/individual-profile.md) - User profiles
- [Organization Profile](./profiles/organization-profile.md) - Org profiles

#### 🟢 Medium Priority
- [Expertise Atlas](./expertise/expertise-atlas.md) - Skills visualization
- [Assignment Builder](./assignments/assignment-builder.md) - Job posting
- [Messages](./other/messages.md) - Communication
- [Zen Hub](./other/zen-hub.md) - Focus space

### By User Type

#### 👤 Individual Users
- [Individual Dashboard](./dashboards/individual-dashboard.md)
- [Individual Profile](./profiles/individual-profile.md)
- [Individual Matching](./matching/individual-matching.md)
- [Expertise Atlas](./expertise/expertise-atlas.md)
- [Settings (Individual)](./settings/individual-sections.md)

#### 🏢 Organization Users
- [Organization Dashboard](./dashboards/organization-dashboard.md)
- [Organization Profile](./profiles/organization-profile.md)
- [Organization Matching](./matching/organization-matching.md)
- [Assignment Builder](./assignments/assignment-builder.md)
- [Settings (Organization)](./settings/organization-sections.md)

#### 👑 Admin Users
- [Admin Dashboard](./dashboards/admin-dashboard.md)
- All other pages (full access)

### By Feature

#### 🔐 Authentication & Onboarding
- [Sign In](./auth/signin.md)
- [Individual Signup](./auth/individual-signup.md)
- [Organization Signup](./auth/organization-signup.md)

#### 🎯 Matching & Discovery
- [Matching Space](./matching/matching-space.md)
- [Individual Matching View](./matching/individual-matching.md)
- [Organization Matching View](./matching/organization-matching.md)

#### 📊 Profiles & Expertise
- [Individual Profile](./profiles/individual-profile.md)
- [Organization Profile](./profiles/organization-profile.md)
- [Profile Edit](./profiles/profile-edit.md)
- [Expertise Atlas](./expertise/expertise-atlas.md)

#### 💬 Communication
- [Messages](./other/messages.md)
- [Zen Hub](./other/zen-hub.md)

#### ⚙️ Management
- [Settings](./settings/settings-overview.md)
- [Admin Dashboard](./dashboards/admin-dashboard.md)

---

## 📐 Layout Standards

### Common Design Tokens

All layouts reference the centralized design system in `lib/design-tokens.ts`:

#### Colors
```typescript
// Primary Palette
Forest:      #1C4D3A  // Primary brand, CTAs
Terracotta:  #C76B4A  // Secondary accent
Sage:        #7A9278  // Success, active states
Teal:        #5C8B89  // Gradients, info
Ochre:       #D4A574  // Highlights, warnings

// Backgrounds
Parchment:   #F7F6F1  // Light mode page background
Charcoal:    #2D3330  // Dark mode, primary text
Off-white:   #FDFCFA  // Cards, headers
Stone:       #E8E6DD  // Borders, subtle backgrounds

// Text
Primary:     #2D3330  // Main text
Secondary:   #6B6760  // Meta text, labels
Muted:       #9B9891  // Disabled, placeholders
```

#### Typography
```typescript
// Font Families
Display:     'Crimson Pro'  // Headings, titles
Body:        'Inter'         // UI, body text

// Scale
text-xs:     12px
text-sm:     14px
text-base:   16px
text-lg:     18px
text-xl:     20px
text-2xl:    24px
text-3xl:    30px
text-4xl:    36px
text-5xl:    48px
text-7xl:    72px
text-8xl:    96px

// Weights
Regular:     400
Medium:      500
Semibold:    600
Bold:        700
```

#### Spacing
```typescript
// Base Unit: 4px
0:     0px
0.5:   2px
1:     4px
2:     8px
3:     12px
4:     16px
5:     20px
6:     24px
8:     32px
10:    40px
12:    48px
14:    56px
16:    64px
20:    80px
24:    96px
32:    128px
```

#### Breakpoints
```typescript
// Tailwind Defaults
sm:   640px   // Small tablets
md:   768px   // Tablets
lg:   1024px  // Desktops
xl:   1280px  // Large desktops
2xl:  1536px  // Extra large desktops
```

### Common Layout Patterns

#### Page Container
```css
.page-container {
  min-height: 100vh;
  background: #F7F6F1;  /* Parchment */
  overflow-y: auto;
}
```

#### Header (Sticky)
```css
.header {
  height: 56px;           /* h-14 */
  position: sticky;
  top: 0;
  z-index: 50;
  background: #FDFCFA;    /* Off-white */
  border-bottom: 1px solid rgba(232, 230, 221, 0.6);
  padding: 16px;          /* px-4 */
}
```

#### Sidebar Navigation
```css
.sidebar {
  width: 56px;            /* Collapsed: w-14 */
  width: 208px;           /* Expanded: w-52 */
  background: #FDFCFA;
  border-right: 1px solid rgba(232, 230, 221, 0.6);
  transition: all 300ms;
}
```

#### Main Content Area
```css
.main-content {
  max-width: 1400px;      /* max-w-[1400px] */
  margin: 0 auto;
  padding: 16px;          /* p-4 */
}
```

#### Card
```css
.card {
  padding: 16px-24px;     /* p-4 to p-6 */
  border: 1px solid rgba(232, 230, 221, 0.6);
  border-radius: 12px;    /* rounded-xl */
  background: white;
  box-shadow: 0 1px 2px rgba(45, 51, 48, 0.05);
}
```

#### Grid Layouts
```css
/* Dashboard Grid (3 columns on desktop) */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;              /* Mobile */
  grid-template-columns: repeat(3, 1fr);   /* lg: */
  gap: 16px;                                /* gap-4 */
}

/* Settings Grid (Sidebar + Content) */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr;              /* Mobile */
  grid-template-columns: 1fr 3fr;          /* lg: */
  gap: 32px;                                /* gap-8 */
}
```

---

## 🎨 Design Patterns

### Card-Based Layouts
Most pages use a card-based layout with consistent styling:
- **Dashboards**: Multiple cards in grid
- **Settings**: Cards for each settings group
- **Profiles**: Sections wrapped in cards

### Sidebar Navigation
Two styles of sidebar navigation:
1. **Application Sidebar** (Dashboards): Collapsible, icon-based
2. **Settings Sidebar**: Fixed width, section-based

### Centered Forms
Authentication and form pages use centered card approach:
- **Sign In/Signup**: Centered card on background
- **Verification**: Centered form with visual elements

### Full-Height Layouts
Some pages use full viewport height:
- **Landing Page**: Scroll-based sections
- **Zen Hub**: Immersive focus environment
- **Messages**: Chat interface

---

## 📱 Responsive Design

### Mobile-First Approach
All layouts are designed mobile-first:
1. Single column stacking (default)
2. Touch-friendly tap targets (40px minimum)
3. Readable text sizes (14px minimum)
4. Adequate spacing (16px minimum padding)

### Tablet Adjustments (768px+)
- Two-column grids where appropriate
- Visible sidebar navigation
- Larger typography scale
- More spacious layouts

### Desktop Optimization (1024px+)
- Full grid layouts (3-4 columns)
- Sticky sidebars
- Maximum width constraints (1280px-1400px)
- Enhanced hover states
- Keyboard shortcuts

---

## ♿ Accessibility Standards

### Focus Management
- **Visible Focus Rings**: 3px, Forest color at 20% opacity
- **Skip Links**: Jump to main content
- **Keyboard Navigation**: All interactive elements accessible
- **Tab Order**: Logical flow

### Color Contrast
- **Text on Parchment**: AAA compliant
- **Text on White**: AAA compliant
- **Action Colors**: AA compliant minimum
- **Error States**: Clear visual indicators

### Semantic HTML
- **Headings**: Proper hierarchy (h1→h2→h3)
- **Landmarks**: nav, main, aside, footer
- **Lists**: For navigation and content
- **Buttons**: For actions (not divs)

### Screen Reader Support
- **ARIA Labels**: For icon-only buttons
- **ARIA Live**: For dynamic updates
- **Alt Text**: For meaningful images
- **Form Labels**: Properly associated

### Motion Preferences
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Animation Toggle**: Optional (implement in settings)

---

## 🔍 How to Use This Documentation

### For Developers

1. **Starting a New Page**:
   - Find the corresponding layout spec
   - Review the complete specifications
   - Reference `lib/design-tokens.ts` for values
   - Implement section by section
   - Test responsiveness at each breakpoint

2. **Maintaining Existing Pages**:
   - Consult the layout spec before making changes
   - Ensure changes maintain design consistency
   - Update the spec if making intentional deviations
   - Test across all viewports

3. **Component Reuse**:
   - Check "Related Components" section in each spec
   - Use UI library components where specified
   - Reference component catalog in `design-tokens.ts`

### For Designers

1. **Design Updates**:
   - Update Figma first
   - Document changes in corresponding .md file
   - Note any breaking changes
   - Communicate with development team

2. **New Pages**:
   - Create Figma designs following patterns
   - Document using existing .md files as templates
   - Include all measurements and specifications
   - Add to this README navigation

### For QA/Testing

1. **Visual Regression**:
   - Compare implementation to specifications
   - Check measurements with browser dev tools
   - Verify colors match exactly (use eyedropper)
   - Test all interactive states

2. **Responsive Testing**:
   - Test at each documented breakpoint
   - Verify mobile usability (touch targets)
   - Check tablet layout transitions
   - Confirm desktop maximum widths

3. **Accessibility Testing**:
   - Keyboard navigation flow
   - Screen reader announcements
   - Color contrast verification
   - Focus indicator visibility

---

## 📝 Documentation Format

Each layout specification includes:

### 1. Metadata
- Last updated date
- Source file reference
- Figma link

### 2. Overview
- Page purpose
- Key features
- User personas

### 3. Layout Structure
- Container specifications
- Section breakdown
- Grid/flexbox layouts
- Z-index layering

### 4. Component Specifications
- Dimensions (width, height, padding, margin)
- Colors (backgrounds, text, borders)
- Typography (family, size, weight, line height)
- Spacing (gaps, padding, margins)
- Border radius and shadows
- States (default, hover, active, focus, disabled)

### 5. Responsive Behavior
- Mobile specifications (<768px)
- Tablet specifications (768px-1023px)
- Desktop specifications (≥1024px)
- Breakpoint-specific changes

### 6. Interactive States
- Hover effects
- Active states
- Focus indicators
- Disabled appearance
- Loading states
- Error states

### 7. Animations
- Entrance animations
- Scroll-triggered effects
- Hover transitions
- State changes

### 8. Accessibility
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

### 9. Implementation Notes
- Dependencies
- State management
- API integration
- Performance considerations
- TODO items

---

## 🛠️ Tools & Resources

### Design Tokens
- **File**: `lib/design-tokens.ts`
- **Exports**: colors, typography, spacing, componentDimensions, componentStates, componentPatterns, componentCatalog
- **Usage**: Import and use throughout the application for consistency

### UI Component Library
- **Location**: `components/ui/`
- **Source**: shadcn/ui (customized)
- **Components**: 45+ components built on Radix UI

### Animation Libraries
- **Framer Motion**: Page/component animations
- **GSAP**: Advanced scroll animations (landing page)

### Styling
- **Framework**: Tailwind CSS
- **Config**: `tailwind.config.ts`
- **Custom Classes**: Defined in `globals.css`

---

## 🐛 Common Issues & Solutions

### Layout Shift
**Problem**: Content jumps during page load  
**Solution**: Use skeleton loaders, reserve space for dynamic content

### Z-Index Conflicts
**Problem**: Elements overlap incorrectly  
**Solution**: Follow documented z-index system:
- Base content: 0
- Sticky elements: 10
- Dropdowns: 20
- Modals/Dialogs: 50
- Toasts: 100

### Responsive Breakpoints
**Problem**: Layout breaks between documented breakpoints  
**Solution**: Test at actual breakpoint values (768px, 1024px), use min-width media queries

### Color Inconsistency
**Problem**: Colors don't match design  
**Solution**: Always use design tokens from `design-tokens.ts`, never hardcode hex values

### Spacing Issues
**Problem**: Spacing doesn't match spec  
**Solution**: Use Tailwind spacing scale (matches 4px base unit), verify with browser dev tools

---

## 📊 Progress Tracking

### Completed Specifications ✅
- [x] Individual Dashboard
- [x] Organization Dashboard
- [x] Settings Overview
- [x] Sign In
- [x] Landing Page
- [x] Matching Space (Individual + Organization views)
- [x] Messages View (Real-time chat)
- [x] Individual Profile View
- [x] Organization Profile View
- [x] Expertise Atlas
- [x] Assignment Builder (5-step wizard)
- [x] Zen Hub (Mental wellbeing)

### Optional Remaining 🔵
- [ ] Admin Dashboard
- [ ] Assignment Builder
- [ ] Signup Pages
- [ ] Messages
- [ ] Zen Hub
- [ ] Verifications

### Planned 📅
- Additional persona-specific sections
- Edge case documentation
- Animation specifications refinement
- Dark mode specific notes

---

## 🤝 Contributing

### Adding New Specifications

1. **Create File**: Use appropriate subdirectory
2. **Follow Template**: Use existing specs as template
3. **Be Precise**: Include all measurements
4. **Add Screenshots**: If helpful (reference Figma)
5. **Update README**: Add to navigation
6. **Review**: Have team review before merging

### Updating Existing Specifications

1. **Document Reason**: Why the change is needed
2. **Update All Sections**: Ensure consistency
3. **Note Breaking Changes**: If applicable
4. **Update Last Modified**: Date at top
5. **Notify Team**: Communication is key

---

## 📞 Support

### Questions?
- **Design**: Check Figma first, then ask design team
- **Implementation**: Consult existing code, then ask dev team
- **Accessibility**: Reference WCAG 2.1 AA standards

### Found an Issue?
1. Check if it's a documentation or implementation issue
2. Create detailed bug report
3. Reference specific section in layout spec
4. Include screenshots if visual issue

---

## 📚 Additional Resources

- [Figma Design File](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)
- [Design Tokens](../lib/design-tokens.ts)
- [Component Catalog](../DESIGN_SYSTEM_DOCUMENTATION.md)
- [CLAUDE.md](../CLAUDE.md) - Project overview for AI
- [README.md](../README.md) - Project setup and overview

---

**Last Updated:** October 27, 2025  
**Maintained By:** Proofound Development Team  
**Version:** 1.0.0

