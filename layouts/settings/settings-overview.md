# Settings Page Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `Settings.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Settings page allows users to manage their account preferences, security, notifications, appearance, and data. The layout uses a sidebar navigation with content panels that change based on the selected section. The page adapts based on account type (individual vs. organization).

---

## Page Container

- **Min Height**: `min-h-screen`
- **Background**: `#F7F6F1` (Parchment)
- **Display**: `flex flex-col` (implicit)
- **Overflow**: Scrollable

---

## Header Section

### Container
- **Border Bottom**: `border-b`, color `#E8E6DD`
- **Background**: `#FDFCFA` (Off-white)
- **Padding**: Not directly on container (applied to inner)

### Inner Container
- **Max Width**: `max-w-7xl` (1280px)
- **Margin**: `mx-auto` (centered)
- **Padding**: `px-6 py-6` (24px horizontal, 24px vertical)

### Header Layout

#### Top Row (Title + Badge)
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-6` (24px)

##### Page Title
- **Tag**: `h1`
- **Font Family**: Font-display (Crimson Pro)
- **Font Size**: text-3xl (30px)
- **Font Weight**: font-semibold (600)
- **Color**: `#2D3330` (Charcoal)
- **Text**: "Settings"

##### Account Type Badge
- **Display**: `flex items-center gap-2`
- **Padding**: `px-3 py-1.5` (12px horizontal, 6px vertical)
- **Border Radius**: `rounded-full`
- **Background**: `#E8E6DD` (Stone)

**Badge Icon:**
- **Size**: `w-4 h-4` (16px)
- **Color (Organization)**: `#C76B4A` (Terracotta)
- **Color (Individual)**: `#7A9278` (Sage)
- **Icon (Organization)**: Building2
- **Icon (Individual)**: User

**Badge Text:**
- **Font Size**: text-sm (14px)
- **Font Weight**: font-medium (500)
- **Color**: `#2D3330`
- **Content**: "Organization settings" or "Individual settings"

#### Search Bar Row
- **Max Width**: `max-w-md` (448px)
- **Position**: relative (for icon positioning)

##### Search Icon
- **Icon**: Search (Lucide)
- **Size**: `w-4 h-4` (16px)
- **Color**: `#6B6760`
- **Position**: `absolute left-3 top-1/2 -translate-y-1/2`

##### Search Input
- **Component**: Input from UI library
- **Padding Left**: `pl-10` (40px - accommodates icon)
- **Border Radius**: `rounded-full`
- **Background**: `#EFEBE3` (lighter Stone variant)
- **Placeholder**: "Search settings..."
- **Font**: text-sm (14px)

---

## Main Content Area

### Container
- **Max Width**: `max-w-7xl` (1280px)
- **Margin**: `mx-auto` (centered)
- **Padding**: `px-6 py-8` (24px horizontal, 32px vertical)

### Grid Layout
- **Display**: `grid`
- **Columns**:
  - Default: `grid-cols-1` (single column on mobile)
  - Large screens: `lg:grid-cols-4` (4-column grid on desktop)
- **Gap**: `gap-8` (32px)

---

## Sidebar Navigation

### Grid Column
- **Span**: `lg:col-span-1` (1 of 4 columns on desktop)

### Card Container
- **Component**: Card from UI library
- **Padding**: `p-4` (16px)
- **Position**: `sticky top-32` (sticky positioning, 128px from top)
- **Transition**: 
  - **Animation**: `initial={{ opacity: 0, x: -20 }}`, `animate={{ opacity: 1, x: 0 }}`
  - **Duration**: 0.3s

### Navigation List
- **Tag**: `nav`
- **Space Between Items**: `space-y-1` (4px)

### Navigation Item (Button)
- **Width**: `w-full`
- **Display**: `flex items-center gap-3`
- **Padding**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Border Radius**: `rounded-xl` (12px)
- **Font Size**: text-sm (14px)
- **Transition**: `transition-all duration-200`

#### Active State
- **Background**: `rgba(122, 146, 120, 0.1)` (#7A9278 with 10% opacity)
- **Text Color**: `#7A9278` (Sage)

#### Inactive/Default State
- **Background**: transparent
- **Text Color**: `#6B6760`
- **Hover Background**: `#E8E6DD` (Stone)

#### Nav Item Icon
- **Size**: `w-4 h-4` (16px)
- **Flex Shrink**: 0

#### Nav Item Label
- **Tag**: `span`
- **Font Size**: text-sm (14px)

#### Active Indicator (ChevronRight)
- **Size**: `w-4 h-4` (16px)
- **Margin**: `ml-auto` (pushed to right)
- **Display**: Only when item is active

### Organization Sections
1. **Organization Profile** (Building2 icon)
2. **Members & Roles** (Users icon)
3. **Security & Access** (Shield icon)
4. **Billing & Subscription** (CreditCard icon)
5. **Integrations** (Plug icon)

### Individual Sections
1. **Profile** (User icon)
2. **Security & Privacy** (Shield icon)
3. **Notifications** (Bell icon)
4. **Appearance** (Palette icon)
5. **Data & Connections** (Database icon)

---

## Content Panel

### Grid Column
- **Span**: `lg:col-span-3` (3 of 4 columns on desktop)

### Section Animation
- **Animation**: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
- **Applied**: Per section render

---

## Profile Section

### Container
- **Space Between Elements**: `space-y-6` (24px)

### Section Header
- **Margin Bottom**: Not specified (within container space-y-6)

#### Title
- **Tag**: `h2`
- **Font Size**: text-2xl (24px)
- **Font Family**: font-display (Crimson Pro)
- **Font Weight**: font-semibold (600)
- **Color**: `#2D3330`
- **Margin Bottom**: `mb-2` (8px)
- **Content**: "Organization Profile" or "Profile" (based on account type)

#### Description
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`
- **Content**: Dynamic based on account type

### Profile Card
- **Component**: Card
- **Padding**: `p-6` (24px)

#### Avatar Section
- **Display**: `flex items-center gap-6`
- **Margin Bottom**: `mb-6` (24px)

##### Avatar
- **Component**: Avatar from UI library
- **Size**: `w-20 h-20` (80px)

##### Avatar Fallback
- **Font Size**: text-xl (20px)
- **Background**: `#7A9278` (Sage)
- **Text Color**: white
- **Content**: Initials (first 2 letters of name parts)

##### Change Avatar Section
- **Display**: `flex flex-col`

**Button:**
- **Variant**: outline
- **Size**: sm
- **Text**: "Change Avatar"

**Help Text:**
- **Font Size**: text-xs (12px)
- **Margin Top**: `mt-2` (8px)
- **Color**: `#6B6760`
- **Content**: "JPG, PNG or GIF. Max size 2MB"

#### Form Fields
- **Container**: `space-y-4` (16px between fields)

##### Two-Column Grid (Name + Email)
- **Grid**: `grid-cols-1 md:grid-cols-2` (1 column on mobile, 2 on tablet+)
- **Gap**: `gap-4` (16px)

**Full Name Field:**
- **Label**: "Full Name"
- **Input**: Standard Input component
- **Placeholder**: "Enter your name"

**Email Field:**
- **Label**: "Email"
- **Input**: Standard Input, type="email", disabled
- **Background**: `bg-muted` (muted gray)
- **Help Text**: text-xs, mt-1, color #6B6760, "Contact support to change your email"

##### Tagline Field
- **Label**: "Tagline"
- **Input**: Standard Input
- **Placeholder**: "Brief description of what you do"
- **Max Length**: 100 characters

##### Bio Field
- **Label**: "Bio"
- **Component**: Textarea
- **Placeholder**: "Tell us about yourself"
- **Rows**: 4

##### Two-Column Grid (Location + Website)
- **Grid**: `grid-cols-1 md:grid-cols-2`
- **Gap**: `gap-4`

**Location Field:**
- **Label**: "Location"
- **Container**: position relative
- **Icon**: MapPin, w-4 h-4, color #6B6760
  - Position: `absolute left-3 top-1/2 -translate-y-1/2`
- **Input**: `pl-10` (padding left 40px)
- **Placeholder**: "City, Country"

**Website Field:**
- **Label**: "Website"
- **Container**: position relative
- **Icon**: Globe, w-4 h-4, color #6B6760
  - Position: `absolute left-3 top-1/2 -translate-y-1/2`
- **Input**: `pl-10`
- **Placeholder**: "https://example.com"

##### Save Button Section
- **Padding Top**: `pt-4` (16px)

**Button:**
- **Background**: `#1C4D3A` (Forest)
- **Hover**: `hover:bg-[#1C4D3A]/90` (90% opacity)
- **Text Color**: white
- **Text**: "Save Changes" or "Saving..." (when loading)
- **Disabled**: When `isLoading` is true

---

## Security & Privacy Section

### Container
- **Space Between Elements**: `space-y-6` (24px)

### Section Header
- **Structure**: Same as Profile section
- **Title**: "Security & Privacy"
- **Description**: "Manage your account security and privacy preferences"

### Password Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Tag**: `h3`
- **Font Weight**: font-semibold (600)
- **Color**: `#2D3330`
- **Margin Bottom**: `mb-4` (16px)
- **Text**: "Password"

#### Form Fields
- **Container**: `space-y-4` (16px)

**Current Password:**
- **Label**: "Current Password"
- **Input**: type="password", placeholder="••••••••"

**New Password:**
- **Label**: "New Password"
- **Input**: type="password", placeholder="••••••••"

**Update Button:**
- **Variant**: outline

### Privacy Settings Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Text**: "Privacy Settings"
- **Style**: Same as Password card title

#### Settings Toggles
- **Container**: `space-y-4` (16px)

##### Individual Toggle Item
- **Display**: `flex items-center justify-between`

**Label Section:**
- **Tag**: `div` wrapper

**Label:**
- **Component**: Label from UI
- **Text**: e.g., "Show email on profile"

**Description:**
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`
- **Text**: Description of setting

**Switch Control:**
- **Component**: Switch from UI library
- **Position**: Right side (justify-between)

##### Separator
- **Component**: Separator from UI
- **Between items**: Yes

**Privacy Toggle Items:**
1. **Show email on profile** - "Let others see your email address"
2. **Show location on profile** - "Display your location to potential matches"

### Two-Factor Authentication Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Text**: "Two-Factor Authentication"

#### Description
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Text**: "Add an extra layer of security to your account"

#### Enable Button
- **Variant**: outline
- **Text**: "Enable 2FA"

### Danger Zone Card
- **Padding**: `p-6` (24px)
- **Border**: `border-destructive/50` (red/destructive color at 50% opacity)

#### Card Title
- **Text**: "Danger Zone"
- **Color**: `text-destructive` (red/destructive color)
- **Margin Bottom**: `mb-4` (16px)

#### Action Buttons
- **Container**: `space-y-3` (12px)

**Sign Out Button:**
- **Variant**: outline
- **Width**: `w-full`
- **Justify**: `justify-start` (left-aligned content)
- **Icon**: LogOut, w-4 h-4, mr-2
- **Text**: "Sign Out"

**Delete Account Button:**
- **Variant**: destructive (red)
- **Width**: `w-full`
- **Justify**: `justify-start`
- **Icon**: Trash2, w-4 h-4, mr-2
- **Text**: "Delete Account"

---

## Notifications Section

### Container
- **Space Between Elements**: `space-y-6` (24px)

### Section Header
- **Title**: "Notifications"
- **Description**: "Manage how you receive notifications"

### Email Notifications Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Text**: "Email Notifications"
- **Margin Bottom**: `mb-4` (16px)

#### Notification Toggles
- **Container**: `space-y-4` (16px)
- **Structure**: Same as Privacy Settings toggles

**Toggle Items:**
1. **All email notifications** - "Receive notifications via email"
   - Separator after
2. **New matches** - "Get notified when you have new matches"
   - Separator after
3. **New messages** - "Get notified when you receive messages"

---

## Appearance Section

### Container
- **Space Between Elements**: `space-y-6` (24px)

### Section Header
- **Title**: "Appearance"
- **Description**: "Customize how Proofound looks"

### Theme Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Text**: "Theme"
- **Margin Bottom**: `mb-4` (16px)

#### Theme Options Grid
- **Grid**: `grid-cols-1 md:grid-cols-3` (1 column on mobile, 3 on tablet+)
- **Gap**: `gap-4` (16px)

##### Individual Theme Button
- **Tag**: `button`
- **Padding**: `p-6` (24px)
- **Border Radius**: `rounded-lg`
- **Border**: `border-2`
- **Border Color (Active)**: `#7A9278` (Sage)
- **Border Color (Inactive)**: `border` (default border color)
- **Transition**: `transition-all`

**Light Theme Button:**
- **Icon**: Sun, w-8 h-8, color #D4A574 (Gold)
- **Icon Margin**: `mx-auto mb-2` (centered, 8px bottom)
- **Text**: "Light", font-medium, color #2D3330

**Dark Theme Button:**
- **Icon**: Moon, w-8 h-8, color #5C8B89 (Teal)
- **Icon Margin**: `mx-auto mb-2`
- **Text**: "Dark", font-medium, color #2D3330

**Auto Theme Button (Disabled):**
- **Opacity**: `opacity-50`
- **Cursor**: `cursor-not-allowed`
- **Icon Container**: `flex gap-2 justify-center mb-2`
  - Icons: Sun + Moon, w-4 h-4 each
- **Text**: "Auto (Soon)", font-medium, text-sm, color #6B6760

---

## Data & Connections Section

### Container
- **Space Between Elements**: `space-y-6` (24px)

### Section Header
- **Title**: "Data & Connections"
- **Description**: "Manage your data and connected accounts"

### Export Data Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Text**: "Export Your Data"
- **Margin Bottom**: `mb-4` (16px)

#### Description
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Text**: "Download a copy of your Proofound data"

#### Export Button
- **Variant**: outline
- **Text**: "Request Data Export"

### Connected Accounts Card
- **Padding**: `p-6` (24px)

#### Card Title
- **Text**: "Connected Accounts"
- **Margin Bottom**: `mb-4` (16px)

#### Description
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Text**: "Manage your connected social accounts"

#### Account List
- **Container**: `space-y-2` (8px)

##### Individual Account Item
- **Display**: `flex items-center justify-between`
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Background**: `bg-muted/30` (muted color at 30% opacity)

**Account Name:**
- **Font Size**: text-sm (14px)
- **Text**: e.g., "Google"

**Disconnect Button:**
- **Variant**: ghost
- **Size**: sm
- **Text**: "Disconnect"

---

## Coming Soon Placeholder

### Container
- **Component**: Card
- **Padding**: `p-12` (48px)
- **Text Align**: `text-center`

### Title
- **Font Size**: text-lg (18px)
- **Font Weight**: font-semibold (600)
- **Color**: `#2D3330`
- **Margin Bottom**: `mb-2` (8px)
- **Text**: "Coming Soon"

### Description
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`
- **Text**: "This section is under development"

**Shown for:** Members, Billing, Integrations sections (organization only)

---

## Typography Scale

### Page Elements
- **H1 (Page Title)**: Crimson Pro, text-3xl (30px), font-semibold (600), #2D3330
- **H2 (Section Title)**: Crimson Pro, text-2xl (24px), font-semibold (600), #2D3330
- **H3 (Card Title)**: Inter, font-semibold (600), #2D3330
- **Label**: Inter, text-sm (14px)
- **Body Text**: Inter, text-sm (14px), #2D3330
- **Help Text**: Inter, text-xs (12px), #6B6760
- **Nav Items**: Inter, text-sm (14px)

### Font Weights
- **Regular**: 400 (body text, labels)
- **Medium**: 500 (badge text, buttons)
- **Semibold**: 600 (titles, headings)

---

## Color Palette

### Backgrounds
- **Page**: `#F7F6F1` (Parchment)
- **Header**: `#FDFCFA` (Off-white)
- **Cards**: white (default Card component)
- **Search Input**: `#EFEBE3` (Light Stone)
- **Badge**: `#E8E6DD` (Stone)
- **Active Nav**: `rgba(122, 146, 120, 0.1)` (Sage 10%)
- **Hover Nav**: `#E8E6DD` (Stone)
- **Theme Grid Items**: white with borders
- **Connected Accounts**: `bg-muted/30`

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary/Help**: `#6B6760` (Gray)
- **Active Nav**: `#7A9278` (Sage)
- **Destructive**: `text-destructive` (red)

### Accent Colors
- **Organization Icon**: `#C76B4A` (Terracotta)
- **Individual Icon**: `#7A9278` (Sage)
- **Primary Button**: `#1C4D3A` (Forest)
- **Light Theme Icon**: `#D4A574` (Gold)
- **Dark Theme Icon**: `#5C8B89` (Teal)

### Borders
- **Header Bottom**: `#E8E6DD` (Stone)
- **Cards**: default (from Card component)
- **Active Nav**: `#7A9278` (Sage)
- **Theme Active**: `#7A9278` (Sage)
- **Danger Zone**: `border-destructive/50` (red 50%)

---

## Spacing System

### Layout Spacing
- **Header Padding**: `px-6 py-6` (24px)
- **Main Content Padding**: `px-6 py-8` (24px horizontal, 32px vertical)
- **Grid Gap**: `gap-8` (32px)

### Card Spacing
- **Card Padding**: `p-4` (16px) for nav, `p-6` (24px) for content cards
- **Section Spacing**: `space-y-6` (24px)
- **Form Field Spacing**: `space-y-4` (16px)
- **Toggle Item Spacing**: `space-y-4` (16px)
- **Button Spacing**: `space-y-3` (12px) in Danger Zone
- **Account List Spacing**: `space-y-2` (8px)

### Element Margins
- **Section Title**: `mb-2` (8px to description)
- **Card Titles**: `mb-4` (16px)
- **Avatar Section**: `mb-6` (24px)
- **Header Top Row**: `mb-6` (24px to search)

### Component Padding
- **Nav Items**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Badge**: `px-3 py-1.5` (12px horizontal, 6px vertical)
- **Theme Buttons**: `p-6` (24px)
- **Account Items**: `p-3` (12px)
- **Coming Soon Card**: `p-12` (48px)

---

## Responsive Behavior

### Desktop (≥1024px)
- **Grid**: 4 columns (1 sidebar + 3 content)
- **Sidebar**: Sticky positioned (`top-32`)
- **Search Bar**: `max-w-md` (448px)
- **Form Grids**: 2 columns for name/email, location/website
- **Theme Grid**: 3 columns

### Tablet (768px - 1023px)
- **Grid**: Transitions from 4-column to stacked
- **Form Grids**: 2 columns (md:grid-cols-2)
- **Theme Grid**: 3 columns (md:grid-cols-3)
- **Sidebar**: Not sticky (default flow)

### Mobile (<768px)
- **Grid**: 1 column stack (`grid-cols-1`)
- **Sidebar**: Full width, above content
- **Form Grids**: 1 column
- **Theme Grid**: 1 column
- **All sections**: Stack vertically

---

## Interactive States

### Navigation Items
- **Default**: transparent, color #6B6760
- **Hover**: `bg-[#E8E6DD]` (Stone)
- **Active**: `bg-[#7A9278]/10`, color #7A9278
- **Transition**: `transition-all duration-200`

### Buttons
- **Primary**: 
  - Default: bg #1C4D3A, color white
  - Hover: `hover:bg-[#1C4D3A]/90`
- **Outline**: Border with transparent background
- **Destructive**: Red background
- **Disabled**: Reduced opacity, no pointer events

### Theme Selection
- **Active**: `border-[#7A9278]` (2px Sage border)
- **Inactive**: `border-border` (default border)
- **Transition**: `transition-all`

### Switches
- **Controlled**: Via React state
- **States**: Checked/unchecked
- **Colors**: Based on UI library defaults

---

## Animations

### Section Transitions
- **Type**: Framer Motion animations
- **Initial State**: `opacity: 0, y: 20` (faded, slightly down)
- **Animate To**: `opacity: 1, y: 0` (visible, in position)
- **Duration**: Default (typically 200-300ms)

### Sidebar Navigation
- **Initial State**: `opacity: 0, x: -20` (faded, slightly left)
- **Animate To**: `opacity: 1, x: 0` (visible, in position)
- **Duration**: 300ms
- **Key**: Changes when viewMode changes (re-animates)

### Interactive Elements
- **Navigation Items**: `transition-all duration-200`
- **Theme Buttons**: `transition-all`
- **All Buttons**: Standard transition timing

---

## Accessibility

### Focus Management
- **Keyboard Navigation**: All interactive elements focusable
- **Focus Indicators**: Default browser focus rings (should be enhanced with custom styling)

### Form Accessibility
- **Labels**: Properly associated with inputs via htmlFor/id
- **Disabled States**: Clearly indicated (email field, auto theme)
- **Help Text**: Assistive text for context

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **Navigation**: Wrapped in `<nav>` element
- **Buttons**: Using `<button>` elements (not divs)
- **Form Controls**: Standard Input, Textarea, Switch components

### Screen Readers
- **Icon-only buttons**: Should have ARIA labels (implement)
- **Toggle states**: Switch components should announce state
- **Error states**: Should be announced

---

## Z-Index Layering

- **Page Content**: Base (z-0)
- **Sticky Sidebar**: `sticky top-32` (natural stacking)
- **Header**: Higher than content (implicit)
- **Modals/Dialogs**: Would be z-50+ (not shown on settings page)

---

## State Management

### Form State
- **Controlled Components**: All inputs controlled via React state
- **State Variables**:
  - Profile: fullName, email, tagline, bio, location, website
  - Privacy: showEmail, showLocation
  - Notifications: emailNotifications, matchNotifications, messageNotifications
  - Appearance: darkMode
- **Loading State**: isLoading (for save operations)

### Navigation State
- **Organization**: activeOrgSection (OrgSection type)
- **Individual**: activeIndSection (IndividualSection type)
- **Search**: searchQuery (string)

### View Mode
- **Determined By**: `profile?.account_type`
- **Values**: 'organization' | 'individual'
- **Effect**: Changes sidebar sections and content

---

## API Integration

### Save Profile
- **Endpoint**: Supabase profiles table
- **Method**: Update via `.update()`
- **Fields**: full_name, tagline, bio, location, website, field_visibility
- **Success**: Router refresh to show updated data
- **Error Handling**: Console error (should show toast)

### Sign Out
- **Method**: `supabase.auth.signOut()`
- **Redirect**: `/login`

### Delete Account
- **Confirmation**: Browser confirm dialog
- **Implementation**: TODO (not yet implemented)

---

## Notes for Implementation

1. **Account Type Detection**: View mode is determined by `profile.account_type` prop

2. **Dynamic Sections**: Sidebar and content change based on account type

3. **Coming Soon Sections**: Members, Billing, Integrations show placeholder

4. **Search Functionality**: Search input present but not implemented (no filtering)

5. **Sticky Sidebar**: Uses `sticky top-32` for persistent nav while scrolling

6. **Form Validation**: Not currently implemented (should add Zod schemas)

7. **Success/Error Feedback**: Should add toast notifications for save operations

8. **Avatar Upload**: Button present but functionality TODO

9. **Password Change**: UI present but backend logic TODO

10. **2FA**: UI present but implementation TODO

11. **Data Export**: UI present but implementation TODO

12. **Connected Accounts**: Shows Google but logic TODO

13. **Dark Mode**: Toggle present but not fully implemented

14. **Animation Library**: Uses Framer Motion for smooth transitions

15. **Responsive Design**: Mobile-first with progressive enhancement

---

**Implementation Priority**: HIGH - Essential account management page

**Related Components**:
- Card, Input, Textarea, Button, Label, Switch from UI library
- Avatar from UI library
- Separator from UI library
- All Lucide icons used

**Key Features**:
- Persona-aware layout (individual vs organization)
- Sticky sidebar navigation
- Animated section transitions
- Comprehensive form controls
- Privacy and security settings
- Coming soon placeholders for future features

