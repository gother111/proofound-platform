# Sign In Page Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/auth/SignIn.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Sign In page provides authentication for existing users. It features a centered card layout with email/password login, OAuth options (Google, GitHub), and decorative background elements with smooth animations. The page uses Framer Motion for entrance animations and interactive states.

---

## Page Container

- **Min Height**: `min-h-screen`
- **Background**: `bg-background` (theme-aware)
- **Display**: `flex items-center justify-center`
- **Padding**: `p-6` (24px all around)
- **Position**: `relative`
- **Overflow**: `overflow-hidden` (contains animated elements)

---

## Background Elements

### Flowing SVG Pattern
- **Position**: `absolute inset-0`
- **Opacity**: `opacity-20 dark:opacity-10` (light mode 20%, dark mode 10%)
- **Width/Height**: `w-full h-full`

#### Pattern Definition
- **ID**: "signin-pattern"
- **Pattern Units**: userSpaceOnUse
- **Pattern Size**: 60x60px (width="60" height="60")

**Pattern Elements:**
1. **Circle**:
   - Center: cx="30" cy="30"
   - Radius: r="2"
   - Fill: currentColor
   - Class: text-sage
   
2. **Connecting Lines**:
   - Path: "M 30 30 L 45 45 M 30 30 L 15 15"
   - Stroke: currentColor
   - Stroke Width: 0.5
   - Class: text-sage
   - Opacity: 0.3

### Floating Geometric Shapes

#### Top-Left Shape
- **Position**: `absolute top-20 left-20` (80px from top and left)
- **Size**: `w-32 h-32` (128x128px)
- **Shape**: `rounded-full` (circle)
- **Background**: `bg-gradient-to-br from-sage/10 to-teal/10`
- **Filter**: `blur-3xl` (48px blur)

**Animation:**
- **Animate**:
  - x: [0, 30, 0]
  - y: [0, -20, 0]
  - scale: [1, 1.2, 1]
- **Transition**:
  - Duration: 8s
  - Repeat: Infinity
  - Easing: easeInOut

#### Bottom-Right Shape
- **Position**: `absolute bottom-20 right-20` (80px from bottom and right)
- **Size**: `w-40 h-40` (160x160px)
- **Shape**: `rounded-full`
- **Background**: `bg-gradient-to-br from-proofound-terracotta/10 to-ochre/10`
- **Filter**: `blur-3xl` (48px blur)

**Animation:**
- **Animate**:
  - x: [0, -20, 0]
  - y: [0, 30, 0]
  - scale: [1, 1.1, 1]
- **Transition**:
  - Duration: 10s
  - Repeat: Infinity
  - Easing: easeInOut

---

## Back Button (Conditional)

**Display**: Only when `onBack` prop is provided

- **Position**: `absolute top-6 left-6` (24px from edges)
- **Display**: `flex items-center gap-2`
- **Color**: `text-muted-foreground`
- **Hover**: `hover:text-foreground`
- **Transition**: `transition-colors`

### Animation
- **Initial**: `opacity: 0, x: -20`
- **Animate**: `opacity: 1, x: 0`

### Elements
**Icon:**
- **Component**: ArrowLeft (Lucide)
- **Size**: `w-4 h-4` (16px)

**Text:**
- **Font Size**: text-sm (14px)
- **Content**: "Back"

---

## Sign In Card Container

### Motion Wrapper
- **Width**: `w-full max-w-md` (448px max)
- **Position**: `relative z-10` (above background elements)

### Animation
- **Initial**: `opacity: 0, y: 20` (faded, slightly down)
- **Animate**: `opacity: 1, y: 0` (visible, in position)
- **Transition**: `duration: 0.5` (500ms)

---

## Sign In Card

### Card Component
- **Padding**: `p-8` (32px)
- **Background**: `bg-card/95` (95% opacity)
- **Backdrop Filter**: `backdrop-blur-sm` (small blur for glassmorphism effect)

---

## Logo & Title Section

### Container
- **Text Align**: `text-center`
- **Margin Bottom**: `mb-8` (32px)

### Logo
- **Motion Wrapper**:
  - Initial: `scale: 0.8, opacity: 0`
  - Animate: `scale: 1, opacity: 1`
  - Transition: `delay: 0.2` (200ms delay)
  - Margin Bottom: `mb-4` (16px)

#### Logo Box
- **Size**: `w-16 h-16` (64x64px)
- **Margin**: `mx-auto` (centered)
- **Border Radius**: `rounded-2xl` (16px)
- **Background**: `bg-gradient-to-br from-proofound-forest to-sage`
- **Display**: `flex items-center justify-center`

**Logo Text:**
- **Font Size**: text-2xl (24px)
- **Font Family**: font-display (Crimson Pro)
- **Color**: text-white
- **Content**: "P"

### Title (h1)
- **Font Size**: text-2xl (24px)
- **Font Family**: font-display (Crimson Pro)
- **Font Weight**: font-semibold (600)
- **Color**: text-foreground (theme-aware)
- **Margin Bottom**: `mb-2` (8px)
- **Content**: "Welcome back"

### Subtitle
- **Font Size**: text-sm (14px)
- **Color**: text-muted-foreground (theme-aware)
- **Content**: "Sign in to your Proofound account"

---

## Error Message (Conditional)

**Display**: Only when `error` state exists

### Container
- **Margin Bottom**: `mb-6` (24px)
- **Border Radius**: `rounded-lg`
- **Background**: `bg-destructive/10` (red 10%)
- **Border**: `border border-destructive/20` (red 20%)
- **Padding**: `p-4` (16px)

### Animation
- **Initial**: `opacity: 0, y: -10`
- **Animate**: `opacity: 1, y: 0`

### Error Text
- **Font Size**: text-sm (14px)
- **Color**: text-destructive (red)
- **Font Weight**: font-medium (500)

---

## Sign In Form

### Form Container
- **Space Between Fields**: `space-y-5` (20px)
- **Method**: POST (handled by React Hook Form)

### Email Field

#### Field Container
- **Space Y**: `space-y-2` (8px between label, input, error)

#### Label
- **Display**: `flex items-center gap-2`
- **For**: "email"

**Icon:**
- **Component**: Mail (Lucide)
- **Size**: `w-4 h-4` (16px)
- **Color**: text-muted-foreground

**Label Text:**
- **Content**: "Email address"

#### Input
- **Component**: Input from UI library
- **ID**: "email"
- **Type**: email
- **Placeholder**: "you@example.com"
- **Auto Complete**: "email"
- **Disabled**: When `isLoading` is true
- **Validation**: Via React Hook Form with Zod schema

#### Error Message (Conditional)
- **Font Size**: text-sm (14px)
- **Color**: text-destructive (red)
- **Content**: From `errors.email.message`

### Password Field

#### Field Container
- **Space Y**: `space-y-2` (8px)

#### Label
- **Display**: `flex items-center gap-2`
- **For**: "password"

**Icon:**
- **Component**: Lock (Lucide)
- **Size**: `w-4 h-4` (16px)
- **Color**: text-muted-foreground

**Label Text:**
- **Content**: "Password"

#### Input Container
- **Position**: `relative` (for eye icon positioning)

#### Input
- **Component**: Input from UI library
- **ID**: "password"
- **Type**: Conditional - "text" or "password" (based on `showPassword` state)
- **Placeholder**: "••••••••"
- **Auto Complete**: "current-password"
- **Disabled**: When `isLoading` is true
- **Validation**: Via React Hook Form

#### Toggle Password Visibility Button
- **Type**: button
- **Position**: `absolute right-3 top-1/2 -translate-y-1/2`
- **Color**: `text-muted-foreground`
- **Hover**: `hover:text-foreground`
- **Transition**: `transition-colors`
- **Tab Index**: -1 (not in tab order)

**Icon (Conditional):**
- **When Hidden**: Eye icon, w-4 h-4
- **When Shown**: EyeOff icon, w-4 h-4

#### Error Message (Conditional)
- **Font Size**: text-sm (14px)
- **Color**: text-destructive
- **Content**: From `errors.password.message`

### Remember Me & Forgot Password Row

#### Container
- **Display**: `flex items-center justify-between`

#### Remember Me Section (Left)
- **Display**: `flex items-center gap-2`

**Checkbox:**
- **Component**: Checkbox from UI library
- **ID**: "remember"
- **State**: Controlled by `rememberMe`

**Label:**
- **Component**: Label from UI library
- **For**: "remember"
- **Font Size**: text-sm (14px)
- **Font Weight**: font-normal (400)
- **Cursor**: cursor-pointer
- **Content**: "Remember me"

#### Forgot Password Link (Right)
- **Type**: button
- **Font Size**: text-sm (14px)
- **Color**: text-primary (theme-aware)
- **Hover**: `hover:underline`
- **Action**: Router push to '/forgot-password'
- **Content**: "Forgot password?"

### Submit Button
- **Component**: Button from UI library
- **Type**: submit
- **Width**: `w-full`
- **Size**: lg (large)
- **Disabled**: When `isLoading` is true
- **Content**: "Signing in..." (when loading) or "Sign in"

---

## Divider Section

### Container
- **Position**: `relative`
- **Margin**: `my-6` (24px top and bottom)

### Separator
- **Component**: Separator from UI library (horizontal line)

### Divider Text
- **Position**: `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`
- **Background**: `bg-card` (matches card background)
- **Padding**: `px-2` (8px horizontal)
- **Font Size**: text-xs (12px)
- **Color**: text-muted-foreground
- **Content**: "Or continue with"

---

## Social Sign In Buttons

### Grid Container
- **Display**: `grid grid-cols-2` (2 columns)
- **Gap**: `gap-3` (12px)

### Google Button
- **Component**: Button from UI library
- **Type**: button
- **Variant**: outline
- **Width**: Full of grid column
- **Disabled**: When `isLoading` is true
- **Action**: `handleOAuthLogin('google')`

#### Google Icon (SVG)
- **Class**: `mr-2 h-5 w-5` (20px, 8px margin right)
- **ViewBox**: "0 0 24 24"
- **Fill**: currentColor
- **Paths**: 4 paths for Google logo (full G icon)

#### Button Text
- **Content**: "Google"

### GitHub Button
- **Component**: Button from UI library
- **Type**: button
- **Variant**: outline
- **Width**: Full of grid column
- **Disabled**: When `isLoading` is true
- **Action**: `handleOAuthLogin('github')`

#### GitHub Icon (SVG)
- **Class**: `mr-2 h-5 w-5` (20px, 8px margin right)
- **Fill**: currentColor
- **ViewBox**: "0 0 24 24"
- **Path**: Single path for GitHub logo (cat icon)

#### Button Text
- **Content**: "GitHub"

---

## Create Account Link

### Container
- **Margin Top**: `mt-6` (24px)
- **Text Align**: `text-center`

### Text
- **Font Size**: text-sm (14px)
- **Color**: text-muted-foreground

**Regular Text:**
- **Content**: "Don't have an account? "

**Link Button:**
- **Type**: button
- **Color**: text-primary
- **Hover**: `hover:underline`
- **Font Weight**: font-medium (500)
- **Action**: `onCreateAccount` callback or router push to '/signup'
- **Content**: "Create account"

---

## Footer Text

### Container
- **Margin Top**: `mt-6` (24px)
- **Text Align**: `text-center`
- **Font Size**: text-xs (12px)
- **Color**: text-muted-foreground

### Content
**Regular Text:**
- "By signing in, you agree to our "

**Terms Link:**
- **Tag**: `<a>`
- **Href**: "/terms"
- **Class**: `underline hover:text-foreground`
- **Content**: "Terms of Service"

**Separator:**
- " and "

**Privacy Link:**
- **Tag**: `<a>`
- **Href**: "/privacy"
- **Class**: `underline hover:text-foreground`
- **Content**: "Privacy Policy"

---

## Typography Scale

### Page Elements
- **H1 (Title)**: Crimson Pro, text-2xl (24px), font-semibold (600)
- **Logo Text**: Crimson Pro, text-2xl (24px)
- **Subtitle**: Inter, text-sm (14px)
- **Labels**: Inter, default size
- **Input Text**: Inter, default size
- **Button Text**: Inter, default size (varies by button size)
- **Helper Text**: Inter, text-sm (14px)
- **Footer Text**: Inter, text-xs (12px)

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (error messages, create account link)
- **Semibold**: 600 (title)

---

## Color Palette

### Backgrounds
- **Page**: bg-background (theme-aware - #F7F6F1 light, dark in dark mode)
- **Card**: bg-card/95 (95% opacity, theme-aware)
- **Logo Box**: gradient from proofound-forest (#1C4D3A) to sage (#7A9278)
- **Error Box**: bg-destructive/10 (red 10%)
- **Floating Shapes**: 
  - Top-left: sage/10 to teal/10 gradient
  - Bottom-right: terracotta/10 to ochre/10 gradient

### Text Colors
- **Primary**: text-foreground (theme-aware)
- **Secondary**: text-muted-foreground (theme-aware)
- **Logo**: text-white
- **Error**: text-destructive (red)
- **Links**: text-primary (theme color)

### Pattern & Shapes
- **Pattern**: text-sage (#7A9278)
- **Shapes**: Semi-transparent gradients with blur

### Borders
- **Error Box**: border-destructive/20 (red 20%)
- **Buttons**: Default outline variant borders

---

## Spacing System

### Layout Spacing
- **Page Padding**: `p-6` (24px)
- **Card Padding**: `p-8` (32px)

### Section Spacing
- **Logo Section**: `mb-8` (32px)
- **Logo**: `mb-4` (16px)
- **Title**: `mb-2` (8px)
- **Error Message**: `mb-6` (24px)
- **Divider**: `my-6` (24px vertical)
- **Create Account**: `mt-6` (24px)
- **Footer**: `mt-6` (24px)

### Form Spacing
- **Form Fields**: `space-y-5` (20px)
- **Field Internals**: `space-y-2` (8px)
- **Label Icons**: `gap-2` (8px)
- **Remember Me**: `gap-2` (8px)
- **Social Buttons**: `gap-3` (12px)

### Element Positioning
- **Back Button**: 24px from top and left
- **Floating Shapes**: 80px from respective corners
- **Password Toggle**: right-3 (12px from right edge)

---

## Responsive Behavior

### Desktop (All Sizes)
- **Card Max Width**: 448px (max-w-md)
- **Centered**: Via flex center on page
- **Floating Shapes**: Visible
- **Back Button**: Absolute positioned
- **Two-Column**: Social buttons grid

### Tablet (768px - 1023px)
- **Same as Desktop**: Minimal changes
- **Card**: Same max-width, stays centered

### Mobile (<768px)
- **Page Padding**: Maintained (p-6)
- **Card**: Full width minus padding, up to max-w-md
- **Floating Shapes**: Still visible but might overflow on very small screens
- **Social Buttons**: Still 2 columns (grid-cols-2)
- **Form**: Stacks naturally
- **All text**: Maintains sizes

**Note**: Layout is inherently mobile-friendly due to centered card approach

---

## Interactive States

### Buttons
- **Default**: Defined by variant (primary, outline)
- **Hover**: Specific hover states per button
- **Disabled**: Reduced opacity, no pointer events
- **Loading**: Text changes, disabled state

### Inputs
- **Default**: Standard border
- **Focus**: Focus ring (from UI library)
- **Error**: Shows error message below
- **Disabled**: Reduced opacity

### Links
- **Default**: Colored text
- **Hover**: Underline appears
- **Transition**: Smooth color transitions

### Checkbox
- **Unchecked**: Empty box
- **Checked**: Checkmark appears
- **Hover**: Subtle highlight

### Password Toggle
- **Default**: text-muted-foreground
- **Hover**: text-foreground
- **Transition**: transition-colors

---

## Animations

### Page Entry
**Card Container:**
- **Initial**: opacity 0, y +20px
- **Animate**: opacity 1, y 0
- **Duration**: 500ms

**Logo:**
- **Initial**: scale 0.8, opacity 0
- **Animate**: scale 1, opacity 1
- **Delay**: 200ms

**Back Button:**
- **Initial**: opacity 0, x -20px
- **Animate**: opacity 1, x 0
- **No specific duration** (uses default)

### Background Animations

**Top-Left Shape:**
- **Loop**: Infinite
- **Duration**: 8s
- **Easing**: easeInOut
- **Transforms**: x, y, scale

**Bottom-Right Shape:**
- **Loop**: Infinite
- **Duration**: 10s
- **Easing**: easeInOut
- **Transforms**: x, y, scale

### Error Message
**When Error Appears:**
- **Initial**: opacity 0, y -10px
- **Animate**: opacity 1, y 0
- **Duration**: Default (likely 200-300ms)

### Transitions
- **Colors**: transition-colors (150ms default)
- **All**: Buttons and interactive elements

---

## Accessibility

### Form Accessibility
- **Labels**: Properly associated via htmlFor/id
- **Auto Complete**: email and current-password for password managers
- **Error Messages**: Associated with inputs via ARIA (from React Hook Form)
- **Password Toggle**: Tab index -1 (not in tab order, but clickable)

### Keyboard Navigation
- **Tab Order**: Email → Password → Remember Me → Forgot Password → Sign In → Google → GitHub → Create Account
- **Focus Indicators**: From UI library (should have visible focus rings)
- **Enter Key**: Submits form from any input

### Screen Readers
- **Icon-only Buttons**: Password toggle should have ARIA label (TODO)
- **Form Errors**: Announced via React Hook Form integration
- **Loading States**: Button text changes announce loading

### Semantic HTML
- **Form**: Proper `<form>` element
- **Heading**: `<h1>` for page title
- **Links**: `<a>` for Terms and Privacy
- **Buttons**: `<button>` for actions

---

## Z-Index Layering

- **Background Pattern**: absolute, no specific z-index (behind)
- **Floating Shapes**: absolute, no specific z-index (behind)
- **Card Container**: `z-10` (relative, above background)
- **Back Button**: absolute, no specific z-index (above background due to stacking context)

---

## State Management

### Component State
- **showPassword**: boolean (toggles password visibility)
- **rememberMe**: boolean (checkbox state, not implemented functionality)
- **isLoading**: boolean (during auth operations)
- **error**: string | null (error messages)

### Form State (React Hook Form)
- **email**: string (validated via Zod)
- **password**: string (validated via Zod)
- **errors**: Form errors object
- **Form methods**: register, handleSubmit, formState

---

## API Integration

### Email/Password Sign In
- **Method**: `supabase.auth.signInWithPassword()`
- **Parameters**: email, password
- **Success Action**: 
  - Track login event (analytics)
  - Router push to '/home'
  - Router refresh
- **Error Handling**: Display error message in card

### OAuth Sign In
- **Method**: `supabase.auth.signInWithOAuth()`
- **Providers**: google, github
- **Redirect**: `${window.location.origin}/auth/callback`
- **Success Action**: Track login event
- **Error Handling**: Display error message, stop loading

### Analytics
- **Function**: `trackLogin()`
- **Parameters**: 'email', 'google', or 'linkedin' (github tracked as linkedin)
- **Timing**: After successful authentication

---

## Validation

### Email Field
- **Schema**: loginSchema from validations
- **Required**: Yes
- **Format**: Valid email address
- **Error Messages**: From Zod schema

### Password Field
- **Schema**: loginSchema from validations
- **Required**: Yes
- **Min Length**: As defined in schema
- **Error Messages**: From Zod schema

---

## Notes for Implementation

1. **OAuth Providers**: GitHub and Google configured, others can be added

2. **Remember Me**: Checkbox present but functionality not implemented (TODO)

3. **Forgot Password**: Link navigates to '/forgot-password' (must exist)

4. **Background Effects**: Pure visual, no functionality, safe to disable for performance

5. **Glassmorphism**: Card uses backdrop-blur-sm for subtle effect

6. **Theme Support**: Uses theme-aware colors (bg-background, text-foreground, etc.)

7. **Loading State**: Disables all buttons and inputs during auth

8. **Error Display**: Single error message shown above form

9. **Success Redirect**: Always goes to '/home' after login

10. **Analytics Integration**: Tracks login method for analytics

11. **Social Logos**: Embedded as inline SVG paths

12. **Password Visibility**: Toggle button at input level, not form level

13. **Callback Props**: onBack and onCreateAccount allow integration in different contexts

14. **Legal Links**: Terms and Privacy in footer

15. **Animations**: Can be reduced for accessibility preferences (TODO: respect prefers-reduced-motion)

---

**Implementation Priority**: CRITICAL - Required for user access

**Related Components**:
- Button, Input, Label, Card, Separator, Checkbox from UI library
- Framer Motion for animations
- React Hook Form for form management
- Zod for validation
- Supabase for authentication
- Analytics for tracking

**Design Features**:
- Flowing geometric pattern background
- Animated floating shapes
- Glassmorphism card effect
- Smooth entrance animations
- Professional OAuth integration
- Mobile-optimized centered layout

