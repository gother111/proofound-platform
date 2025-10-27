# Messages View Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/MessagesView.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Messages View is a real-time chat interface that allows users to communicate with their matches. It features a two-column layout with a conversations list on the left and the active conversation on the right, similar to popular messaging applications. The interface includes real-time message updates via Supabase Realtime subscriptions.

---

## Page Container

### Container
- **Height**: `h-screen` (full viewport height)
- **Display**: `flex flex-col`
- **Background**: `#F7F6F1` (Parchment)

---

## Top Header

### Container
- **Border Bottom**: `border-b`, color `#E8E6DD`
- **Padding**: `px-6 py-4` (24px horizontal, 16px vertical)
- **Flex Shrink**: `flex-shrink-0` (fixed height)
- **Background**: `#FDFCFA` (Off-white)

### Inner Layout
- **Display**: `flex items-center gap-4`

#### Logo & Title Group
- **Display**: `flex items-center gap-3`

**Icon:**
- **Component**: MessageCircle (Lucide)
- **Size**: `w-6 h-6` (24px)
- **Color**: `#1C4D3A` (Forest)

**Title (h1):**
- **Font Size**: text-2xl (24px)
- **Font Family**: font-display (Crimson Pro)
- **Font Weight**: font-semibold (600)
- **Color**: `#2D3330` (Charcoal)
- **Content**: "Messages"

---

## Main Layout

### Container
- **Flex**: `flex-1` (takes remaining height)
- **Display**: `flex`
- **Overflow**: `overflow-hidden`

---

## Conversations Sidebar (Left Column)

### Container
- **Width**: `w-80` (320px)
- **Border Right**: `border-r`, color `#E8E6DD`
- **Display**: `flex flex-col`
- **Flex Shrink**: `flex-shrink-0` (fixed width)
- **Background**: `#FDFCFA` (Off-white)

---

### Search Bar

#### Container
- **Padding**: `p-4` (16px)
- **Border Bottom**: `border-b`, color `#E8E6DD`

#### Search Input Wrapper
- **Position**: `relative`

**Search Icon:**
- **Component**: Search (Lucide)
- **Size**: `w-4 h-4` (16px)
- **Position**: `absolute left-3 top-1/2 -translate-y-1/2`
- **Color**: `#6B6760`

**Input:**
- **Component**: Input from UI library
- **Placeholder**: "Search conversations..."
- **Padding Left**: `pl-9` (36px - accommodates icon)
- **Background**: `#EFEBE3` (light Stone variant)

---

### Conversations List

#### Container
- **Component**: ScrollArea from UI library
- **Flex**: `flex-1` (takes remaining height)

#### Inner Container
- **Padding**: `p-2` (8px)

---

### Conversation Item

#### Button Container
- **Width**: `w-full`
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Margin Bottom**: `mb-1` (4px)
- **Text Align**: `text-left`
- **Transition**: `transition-colors`

#### Background (State-based)
**Selected:**
- **Background**: `#1C4D3A/10` (Forest 10% opacity)

**Not Selected (Hover):**
- **Hover Background**: `#E8E6DD` (Stone)

#### Layout
- **Display**: `flex items-start gap-3`

**Avatar:**
- **Component**: Avatar from UI library
- **Size**: `w-10 h-10` (40px)
- **Fallback Background**: `#7A9278` (Sage)
- **Fallback Text Color**: white
- **Fallback Font Size**: text-sm (14px)
- **Content**: Initials (first 2 letters, up to 2 words)

**Content Section (Flex-1, Min-Width-0):**

1. **Top Row**:
   - Display: `flex items-center justify-between`
   - Margin Bottom: `mb-1` (4px)
   
   **Name (h4):**
   - Font Weight: font-semibold (600)
   - Font Size: text-sm (14px)
   - Truncate: `truncate` (ellipsis if too long)
   - Color: `#2D3330`
   - Content: Other person's name
   
   **Timestamp** (Conditional, if lastMessage exists):
   - Font Size: text-xs (12px)
   - Flex Shrink: `flex-shrink-0` (doesn't shrink)
   - Color: `#6B6760`
   - Content: Date of last message (localized)

2. **Bottom Row**:
   - Display: `flex items-center gap-2`
   
   **Last Message Preview (p):**
   - Font Size: text-xs (12px)
   - Truncate: `truncate`
   - Flex: `flex-1`
   - Font Weight: Conditional
     - Unread: font-medium (500)
     - Read: Regular (400)
   - Color: Conditional
     - Unread: `#2D3330` (Charcoal - darker)
     - Read: `#6B6760` (Gray - lighter)
   - Content: Last message text or "Start a conversation"
   
   **Unread Badge** (Conditional, if unreadCount > 0):
   - Flex Shrink: `flex-shrink-0`
   - Size: `w-5 h-5` (20px)
   - Shape: `rounded-full`
   - Display: `flex items-center justify-center`
   - Font Size: text-xs (12px)
   - Font Weight: font-semibold (600)
   - Background: `#C76B4A` (Terracotta)
   - Text Color: white
   - Content: Unread count number

---

### Empty State (Conversations List)

#### Container
- **Padding**: `p-8` (32px)
- **Text Align**: `text-center`

#### Icon
- **Component**: MessageCircle
- **Size**: `w-12 h-12` (48px)
- **Margin**: `mx-auto mb-3` (centered, 12px bottom)
- **Color**: `#E8E6DD` (Stone)

#### Text
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`
- **Content**: Conditional
  - With search: "No conversations found"
  - Without search: "No messages yet"

---

## Conversation View (Right Column)

**Display**: Conditional - only when activeConversation exists

### Container
- **Flex**: `flex-1` (takes remaining width)
- **Display**: `flex flex-col`

---

### Conversation Header

#### Container
- **Border Bottom**: `border-b`, color `#E8E6DD`
- **Padding**: `px-6 py-4` (24px horizontal, 16px vertical)
- **Display**: `flex items-center justify-between`
- **Background**: `#FDFCFA` (Off-white)

#### Left Section
- **Display**: `flex items-center gap-3`

**Avatar:**
- **Component**: Avatar from UI library
- **Size**: `w-10 h-10` (40px)
- **Fallback Background**: `#C76B4A` (Terracotta)
- **Fallback Text Color**: white
- **Content**: Initials

**Info:**
1. **Name (h2)**:
   - Font Weight: font-semibold (600)
   - Color: `#2D3330`
   - Content: Other person's name

2. **Subtitle (p)**:
   - Font Size: text-xs (12px)
   - Color: `#6B6760`
   - Content: Assignment title or "Match"

#### Right Section
**More Options Button:**
- **Variant**: ghost
- **Size**: sm
- **Icon**: MoreVertical, w-4 h-4

---

### Messages Area

#### Container
- **Component**: ScrollArea from UI library
- **Flex**: `flex-1` (takes remaining height)
- **Padding**: `p-6` (24px)

#### Inner Container
- **Space Y**: `space-y-4` (16px between messages)
- **Max Width**: `max-w-3xl mx-auto` (768px, centered)

---

### Individual Message

#### Container
- **Display**: `flex gap-3`
- **Flex Direction**: Conditional
  - My message: `flex-row-reverse` (right-aligned)
  - Their message: `flex-row` (left-aligned)

#### Avatar (Other Person Only)
**Display**: Only for messages from other person (`!isMe`)

- **Component**: Avatar
- **Size**: `w-8 h-8` (32px)
- **Flex Shrink**: `flex-shrink-0` (doesn't shrink)
- **Fallback Background**: `#7A9278` (Sage)
- **Fallback Text Color**: white
- **Fallback Font Size**: text-xs (12px)
- **Content**: First letter of other person's name

#### Message Content
- **Display**: `flex flex-col`
- **Align Items**: Conditional
  - My message: `items-end` (right-aligned)
  - Their message: `items-start` (left-aligned)
- **Max Width**: `max-w-md` (448px)

**Message Bubble:**
- **Padding**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Border Radius**: `rounded-2xl` (16px)
- **Background**: Conditional
  - My message: `#1C4D3A` (Forest - green)
  - Their message: `#FDFCFA` (Off-white)
- **Text Color**: Conditional
  - My message: white
  - Their message: `#2D3330` (Charcoal)

**Message Text (p):**
- Font Size: text-sm (14px)
- White Space: `whitespace-pre-wrap` (preserves line breaks)
- Break Words: `break-words` (wraps long words)
- Content: Message content

**Metadata Row:**
- Display: `flex items-center gap-1`
- Margin Top: `mt-1` (4px)
- Padding: `px-2` (8px horizontal)

**Timestamp:**
- Font Size: text-xs (12px)
- Color: `#6B6760`
- Content: Time only (HH:MM format)

**Read Receipt** (Conditional, for my messages if read_at exists):
- Icon: CheckCircle2
- Size: `w-3 h-3` (12px)
- Color: `#7A9278` (Sage)

#### Scroll Anchor
- **Ref**: messagesEndRef
- **Purpose**: Auto-scroll to latest message

---

### Empty State (No Messages)

#### Container
- **Text Align**: `text-center`
- **Padding Y**: `py-12` (48px vertical)

#### Icon
- **Component**: MessageCircle
- **Size**: `w-16 h-16` (64px)
- **Margin**: `mx-auto mb-4` (centered, 16px bottom)
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-lg (18px)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: "Start the conversation"

#### Description (p)
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`
- **Content**: "Send your first message to get started"

---

### Message Input Area

#### Container
- **Border Top**: `border-t`, color `#E8E6DD`
- **Padding**: `p-4` (16px)
- **Background**: `#FDFCFA` (Off-white)

#### Form
- **Max Width**: `max-w-3xl mx-auto` (768px, centered)
- **On Submit**: handleSendMessage

#### Input Layout
- **Display**: `flex gap-3`

**Textarea:**
- **Component**: Textarea from UI library
- **Flex**: `flex-1` (takes remaining width)
- **Min Height**: `min-h-[60px]` (60px minimum)
- **Max Height**: `max-h-[120px]` (120px maximum)
- **Resize**: `resize-none` (vertical resize disabled)
- **Placeholder**: "Type your message..."
- **Keyboard Shortcut**:
  - Enter: Submit message
  - Shift+Enter: New line

**Button Column:**
- **Display**: `flex flex-col gap-2`

1. **Attach Button** (Top):
   - Type: button
   - Variant: outline
   - Size: sm
   - Flex Shrink: `flex-shrink-0`
   - Icon: Paperclip, w-4 h-4
   - **Note**: Functionality not implemented

2. **Send Button** (Bottom):
   - Type: submit
   - Flex Shrink: `flex-shrink-0`
   - Background: `#1C4D3A` (Forest)
   - Text Color: white
   - Icon: Send, w-4 h-4
   - Disabled: When `!messageText.trim() || isSending`

#### Help Text
- **Font Size**: text-xs (12px)
- **Margin Top**: `mt-2` (8px)
- **Color**: `#6B6760`
- **Content**: "Press Enter to send, Shift+Enter for new line"

---

## Empty State (No Conversation Selected)

**Display**: When !activeConversation

### Container
- **Flex**: `flex-1` (takes full space)
- **Display**: `flex items-center justify-center`

### Content
- **Text Align**: `text-center`

#### Icon
- **Component**: MessageCircle
- **Size**: `w-16 h-16` (64px)
- **Margin**: `mx-auto mb-4` (centered, 16px bottom)
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-xl (20px)
- **Font Family**: font-display (Crimson Pro)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: "No conversation selected"

#### Description (p)
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`
- **Content**: "Select a conversation from the list to start messaging"

---

## Typography Scale

### Page Elements
- **Page Title (h1)**: Crimson Pro, text-2xl (24px), font-semibold (600), #2D3330
- **Conversation Header Name (h2)**: Inter, font-semibold (600), #2D3330
- **Empty State Title (h3)**: Crimson Pro/Inter, text-lg-xl, font-semibold, #2D3330
- **Conversation Name (h4)**: Inter, text-sm (14px), font-semibold (600), #2D3330
- **Message Text**: Inter, text-sm (14px)
- **Preview Text**: Inter, text-xs (12px)
- **Metadata**: Inter, text-xs (12px), #6B6760

### Font Weights
- **Regular**: 400 (message text, preview text read)
- **Medium**: 500 (preview text unread)
- **Semibold**: 600 (names, titles, unread badge)

---

## Color Palette

### Backgrounds
- **Page**: `#F7F6F1` (Parchment)
- **Header**: `#FDFCFA` (Off-white)
- **Sidebar**: `#FDFCFA` (Off-white)
- **Search Input**: `#EFEBE3` (light Stone)
- **Selected Conversation**: `#1C4D3A/10` (Forest 10%)
- **Hover Conversation**: `#E8E6DD` (Stone)
- **My Message Bubble**: `#1C4D3A` (Forest)
- **Their Message Bubble**: `#FDFCFA` (Off-white)
- **Message Input Area**: `#FDFCFA` (Off-white)

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary/Meta**: `#6B6760` (Gray)
- **On My Message**: white
- **On Their Message**: `#2D3330`

### Accent Colors
- **Message Icon**: `#1C4D3A` (Forest)
- **Unread Badge**: `#C76B4A` (Terracotta)
- **Read Receipt**: `#7A9278` (Sage)
- **Avatar Fallback 1**: `#7A9278` (Sage - other person in list)
- **Avatar Fallback 2**: `#C76B4A` (Terracotta - active conversation)
- **Send Button**: `#1C4D3A` (Forest)

### Borders
- **Default**: `#E8E6DD` (Stone)

### Empty State
- **Icon**: `#E8E6DD` (Stone)

---

## Spacing System

### Layout Spacing
- **Top Header Padding**: `px-6 py-4` (24px horizontal, 16px vertical)
- **Sidebar Width**: 320px (w-80)
- **Search Padding**: `p-4` (16px)
- **Conversation List Padding**: `p-2` (8px)
- **Messages Area Padding**: `p-6` (24px)
- **Conversation Header Padding**: `px-6 py-4` (24px, 16px)
- **Message Input Padding**: `p-4` (16px)

### Item Spacing
- **Between Conversations**: `mb-1` (4px)
- **Between Messages**: `space-y-4` (16px)
- **Between Input Buttons**: `gap-2` (8px)

### Card/Item Internal
- **Conversation Item Padding**: `p-3` (12px)
- **Message Bubble Padding**: `px-4 py-3` (16px, 12px)
- **Empty State Padding**: `p-8` or `py-12` (32px or 48px)

### Gaps
- **Avatar to Content**: `gap-3` (12px)
- **Icon to Text**: `gap-3` or `gap-4` (12px-16px)
- **Message to Avatar**: `gap-3` (12px)
- **Metadata Items**: `gap-1` (4px)

---

## Responsive Behavior

### Desktop (≥1024px)
- **Sidebar**: Visible, fixed 320px
- **Conversation View**: Flex-1, expands to fill
- **Messages**: Max-width 768px, centered
- **Input**: Max-width 768px, centered

### Tablet (768px - 1023px)
- **Sidebar**: Likely visible, same width
- **Conversation View**: Adjusted width
- **Messages**: Same max-width
- **Input**: Same max-width

### Mobile (<768px)
- **Sidebar**: Would need to become full-width or drawer
- **Conversation View**: Full-width when active
- **Toggle**: Switch between list and conversation
- **Messages**: Full-width minus padding
- **Input**: Full-width

**Note**: Explicit mobile responsive behavior not defined in code, would need implementation

---

## Interactive States

### Conversation Items
- **Default**: Transparent background
- **Hover**: `#E8E6DD` background
- **Selected**: `#1C4D3A/10` background
- **Transition**: `transition-colors`

### Buttons
- **Primary (Send)**: bg #1C4D3A, hover darker
- **Outline (Attach)**: Border with transparent background
- **Ghost (More Options)**: Minimal styling
- **Disabled**: Reduced opacity (Send button when no text)

### Textarea
- **Default**: Standard border
- **Focus**: Focus ring from UI library
- **Disabled**: Not applicable (always enabled when conversation selected)

---

## Real-Time Features

### Message Subscription
- **Technology**: Supabase Realtime
- **Channel**: `messages:{conversationId}`
- **Event**: INSERT on messages table
- **Filter**: `match_id=eq.{conversationId}`
- **Action**: Append new message to state

### Auto-Scroll
- **Trigger**: conversationMessages changes
- **Behavior**: Smooth scroll to bottom
- **Element**: messagesEndRef

### Read Receipts
- **Display**: CheckCircle2 icon when message.read_at exists
- **Position**: Next to timestamp on my messages
- **Color**: Sage (#7A9278)

---

## State Management

### Component State
- **selectedConversation**: string | null (active conversation ID)
- **messageText**: string (current message being typed)
- **searchQuery**: string (filter conversations)
- **messages**: array (all messages, updated in real-time)
- **isSending**: boolean (prevents duplicate sends)

### Computed Values
- **activeConversation**: Derived from conversations + selectedConversation
- **conversationMessages**: Filtered messages for selected conversation
- **filteredConversations**: Filtered conversations based on search query
- **unreadCount**: Calculated per conversation

---

## API Integration

### Data Requirements

**Conversation Object:**
- id: string
- profile_id: string
- profile: { full_name: string }
- assignment: { title: string, organization: { name: string }, created_by: string }

**Message Object:**
- id: string
- match_id: string (conversation ID)
- sender_id: string
- receiver_id: string
- content: string
- created_at: timestamp
- read_at: timestamp | null
- sent_at_stage: string

### Actions

**Send Message:**
- **Method**: Supabase insert on messages table
- **Fields**: match_id, sender_id, receiver_id, content, sent_at_stage
- **Success**: Message appears in UI immediately (optimistic update)
- **Error**: Console log (should show toast)

**Subscribe to Messages:**
- **Method**: Supabase Realtime channel
- **Cleanup**: Remove channel on unmount or conversation change

**Search Conversations:**
- **Method**: Client-side filtering
- **Field**: Other person's name (profile.full_name or organization.name)

---

## Keyboard Shortcuts

### Message Input
- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Behavior**: Prevented via onKeyDown handler

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h2 → h3 → h4)
- **Buttons**: Proper button elements for actions
- **Form**: Proper form element for message input
- **Lists**: Conversations could use list semantics

### Keyboard Navigation
- **Search Input**: Keyboard accessible
- **Conversation Items**: Keyboard navigable buttons
- **Message Input**: Keyboard accessible textarea
- **All Buttons**: Focusable and keyboard-activatable

### Screen Readers
- **Message History**: Should have ARIA live region for new messages
- **Unread Badges**: Announced with count
- **Read Receipts**: Could have ARIA label
- **Empty States**: Descriptive text

### Focus Management
- **Auto-scroll**: Doesn't affect focus
- **Message Sent**: Could focus back on textarea

---

## Notes for Implementation

1. **Real-Time Updates**: Uses Supabase Realtime for instant message delivery

2. **Optimistic Updates**: Messages appear immediately on send, before confirmation

3. **Auto-Scroll**: Automatically scrolls to latest message on new messages

4. **Read Receipts**: Shown for sent messages that have been read

5. **Unread Counts**: Calculated per conversation from messages

6. **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line

7. **Search**: Client-side only, filters by name

8. **Empty States**: Context-aware messages for different scenarios

9. **Avatar Fallbacks**: Uses initials from names

10. **Message Timestamp**: Shows full date in list, time only in conversation

11. **More Options Button**: Present but functionality not implemented

12. **Attach Button**: Present but functionality not implemented (file uploads)

13. **Mobile Responsiveness**: Needs explicit mobile layout (drawer/toggle)

14. **Loading States**: Not shown, should add for initial load and sending

15. **Error Handling**: Minimal, should add toasts for errors

16. **Pagination**: Not implemented, would be needed for long message histories

17. **Typing Indicators**: Not implemented, could enhance UX

18. **Message Editing/Deletion**: Not implemented

19. **Rich Text**: Plain text only, no formatting

20. **Channel Cleanup**: Properly removes Supabase channel on unmount

---

**Implementation Priority**: HIGH - Core communication feature

**Related Components**:
- Card, Input, Textarea, Button, Avatar, ScrollArea, Separator from UI library
- All Lucide icons (MessageCircle, Search, Send, etc.)
- Supabase client for real-time

**Key Features**:
- Real-time messaging via Supabase
- Conversation list with search
- Unread message indicators
- Read receipts
- Auto-scroll to latest
- Keyboard shortcuts
- Empty states
- Optimistic UI updates

**Dependencies**:
- Supabase Realtime subscription
- Messages table with proper schema
- Matches/conversations system
- Profile data access

