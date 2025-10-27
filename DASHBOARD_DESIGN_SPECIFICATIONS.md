# Dashboard Design Specifications

**Version**: 1.0  
**Last Updated**: October 27, 2025  
**Status**: Complete Design Blueprint for MVP Pilot

---

## 📐 Design System Foundation

### Typography
- **Display Text (Headings)**: `font-['Crimson_Pro']` - h1, h2, h3, section titles
- **UI Text (Body, Labels)**: `font-family: 'Inter'` via style prop - all body text, labels, buttons
- **No Font Size Classes**: Rely on `/styles/globals.css` typography defaults

### Color Palette
- **Primary**: `#1C4D3A` (Forest Green) - CTAs, headers, active states
- **Accent**: `#C76B4A` (Terracotta) - highlights, secondary actions
- **Background**: `#F7F6F1` (Parchment) - page background
- **Text**: `#2D3330` (Charcoal) - primary text
- **Borders**: `#E8E6DD` (Stone) - dividers, card borders
- **Sage**: `#7A9278` - success states
- **Teal**: `#5C8B89` - interactive elements
- **Ochre**: `#D4A574` - warnings

### Spacing System
- **Section Gap**: `gap-6` (24px) or `gap-8` (32px)
- **Card Padding**: `p-4` (16px) or `p-6` (24px)
- **Component Gap**: `gap-4` (16px)
- **Tight Gap**: `gap-2` (8px) for inline elements

### Layout Constraints
- **Max Width**: `max-w-[1600px]` for content areas
- **Min Width**: `min-w-[1200px]` for optimal experience
- **Responsive**: Mobile-first approach with breakpoints at 768px, 1024px, 1280px

---

## 🧑 Individual Dashboard

### Purpose
Home base for individuals to manage their career, skills, matches, and professional growth.

---

### 1. Top Navigation Bar

**Structure**: Full-width fixed header with shadow

**Left Section (40%)**:
```tsx
<div className="flex items-center gap-4">
  {/* Logo */}
  <img src="/logo.svg" alt="Proofound" className="h-8" />
  
  {/* Search Bar */}
  <div className="flex-1 max-w-md">
    <Input
      placeholder="Search matches, assignments, skills..."
      icon={<Search className="w-4 h-4" />}
      className="bg-white dark:bg-[#3A3530]"
    />
  </div>
</div>
```

**Center Section (20%)**:
```tsx
<nav className="flex items-center gap-1">
  <Button variant="ghost" className={activeTab === 'dashboard' ? 'bg-[#1C4D3A]/10' : ''}>
    <Home className="w-4 h-4 mr-2" />
    Dashboard
  </Button>
  <Button variant="ghost">
    <Users className="w-4 h-4 mr-2" />
    Matching
  </Button>
  <Button variant="ghost">
    <Briefcase className="w-4 h-4 mr-2" />
    Assignments
  </Button>
</nav>
```

**Right Section (40%)**:
```tsx
<div className="flex items-center gap-3">
  {/* Notifications */}
  <Button variant="ghost" size="icon" className="relative">
    <Bell className="w-5 h-5" />
    {hasUnread && (
      <span className="absolute top-1 right-1 w-2 h-2 bg-[#C76B4A] rounded-full" />
    )}
  </Button>
  
  {/* Messages */}
  <Button variant="ghost" size="icon" className="relative">
    <MessageSquare className="w-5 h-5" />
    {unreadMessages > 0 && (
      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#C76B4A]">
        {unreadMessages}
      </Badge>
    )}
  </Button>
  
  {/* Theme Toggle */}
  <Button variant="ghost" size="icon">
    <Sun className="w-5 h-5 dark:hidden" />
    <Moon className="w-5 h-5 hidden dark:block" />
  </Button>
  
  {/* Profile Dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Avatar>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>View Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem>Expertise Atlas</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Sign Out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**Styling**:
```tsx
className="h-16 bg-white dark:bg-[#252936] border-b border-[#E8E6DD] dark:border-[#D4C4A8]/10 px-6 flex items-center justify-between sticky top-0 z-50"
```

---

### 2. Main Content Area

**Layout**: Two-column with 70/30 split

#### Left Column (Main Feed - 70%)

**A. Welcome Hero Section**
```tsx
<div className="p-6 rounded-2xl bg-gradient-to-br from-[#1C4D3A] to-[#2D5F4A] text-white mb-6">
  {/* Greeting */}
  <h1 className="font-['Crimson_Pro'] text-3xl mb-2">
    Welcome back, {firstName}
  </h1>
  
  {/* Status Message */}
  <p className="text-white/90 mb-4" style={{ fontFamily: 'Inter' }}>
    You have 3 new matches and 2 pending verifications
  </p>
  
  {/* Quick Stats Row */}
  <div className="flex gap-4">
    <div className="flex items-center gap-2">
      <TrendingUp className="w-5 h-5" />
      <span style={{ fontFamily: 'Inter' }}>Profile Score: 87/100</span>
    </div>
    <div className="flex items-center gap-2">
      <Target className="w-5 h-5" />
      <span style={{ fontFamily: 'Inter' }}>5 Active Goals</span>
    </div>
    <div className="flex items-center gap-2">
      <Award className="w-5 h-5" />
      <span style={{ fontFamily: 'Inter' }}>12 Verified Skills</span>
    </div>
  </div>
  
  {/* CTA */}
  <Button 
    className="mt-4 bg-white text-[#1C4D3A] hover:bg-[#F7F6F1]"
    onClick={() => navigate('profile')}
  >
    Complete Your Profile
    <ArrowRight className="w-4 h-4 ml-2" />
  </Button>
</div>
```

**B. Key Metrics Dashboard**
```tsx
<div className="grid grid-cols-3 gap-4 mb-6">
  {/* Match Quality */}
  <Card className="p-4 bg-white dark:bg-[#3A3530] border-[#E8E6DD] dark:border-[#4A4540]">
    <div className="flex items-center justify-between mb-2">
      <Users className="w-5 h-5 text-[#1C4D3A] dark:text-[#B8D4C6]" />
      <TrendingUp className="w-4 h-4 text-[#7A9278]" />
    </div>
    <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
      12
    </p>
    <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
      Quality Matches
    </p>
    <p className="text-xs text-[#7A9278] mt-1" style={{ fontFamily: 'Inter' }}>
      +3 this week
    </p>
  </Card>
  
  {/* Verification Status */}
  <Card className="p-4 bg-white dark:bg-[#3A3530]">
    <div className="flex items-center justify-between mb-2">
      <ShieldCheck className="w-5 h-5 text-[#1C4D3A]" />
      <Clock className="w-4 h-4 text-[#D4A574]" />
    </div>
    <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
      2
    </p>
    <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
      Pending Verifications
    </p>
    <Button variant="link" className="p-0 h-auto text-xs text-[#1C4D3A] mt-1">
      Review →
    </Button>
  </Card>
  
  {/* Active Assignments */}
  <Card className="p-4 bg-white dark:bg-[#3A3530]">
    <div className="flex items-center justify-between mb-2">
      <Briefcase className="w-5 h-5 text-[#1C4D3A]" />
      <AlertCircle className="w-4 h-4 text-[#C76B4A]" />
    </div>
    <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
      7
    </p>
    <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
      Applications In Progress
    </p>
    <p className="text-xs text-[#C76B4A] mt-1" style={{ fontFamily: 'Inter' }}>
      3 responses needed
    </p>
  </Card>
</div>
```

**C. Recent Activity Feed**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Recent Activity
    </h3>
    <Button variant="ghost" size="sm">
      View All
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
  
  <div className="space-y-4">
    {/* Activity Item */}
    <div className="flex gap-4 p-3 rounded-lg hover:bg-[#F7F6F1] dark:hover:bg-[#343430] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#1C4D3A]/10 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-5 h-5 text-[#1C4D3A]" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          <strong>Sarah Chen</strong> verified your Strategic Thinking skill
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mt-1" style={{ fontFamily: 'Inter' }}>
          2 hours ago
        </p>
      </div>
      <Button variant="ghost" size="sm">
        View
      </Button>
    </div>
    
    {/* New Match */}
    <div className="flex gap-4 p-3 rounded-lg hover:bg-[#F7F6F1] dark:hover:bg-[#343430] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#C76B4A]/10 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5 text-[#C76B4A]" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          New match: <strong>Product Designer</strong> at TechCorp (92% fit)
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mt-1" style={{ fontFamily: 'Inter' }}>
          5 hours ago
        </p>
      </div>
      <Button size="sm" className="bg-[#1C4D3A] text-white">
        Review
      </Button>
    </div>
    
    {/* Assignment Update */}
    <div className="flex gap-4 p-3 rounded-lg hover:bg-[#F7F6F1] dark:hover:bg-[#343430] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#5C8B89]/10 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-[#5C8B89]" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Your application to <strong>Climate Tech Accelerator</strong> was viewed
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mt-1" style={{ fontFamily: 'Inter' }}>
          1 day ago
        </p>
      </div>
    </div>
  </div>
</Card>
```

**D. Top Matches Preview**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Top Matches for You
    </h3>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => navigate('matching')}
    >
      View All Matches
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
  
  <div className="space-y-3">
    {/* Match Card */}
    <div className="p-4 rounded-xl border border-[#E8E6DD] dark:border-[#4A4540] hover:border-[#1C4D3A] dark:hover:border-[#4A5F52] transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-[#2D3330] dark:text-[#E8E6DD] mb-1" style={{ fontFamily: 'Inter' }}>
            Senior Product Designer
          </h4>
          <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] opacity-70" style={{ fontFamily: 'Inter' }}>
            GreenTech Solutions · Remote
          </p>
        </div>
        <Badge className="bg-[#1C4D3A]/10 text-[#1C4D3A] border-0">
          92% Match
        </Badge>
      </div>
      
      {/* Why It Matches */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Figma Expert
        </Badge>
        <Badge variant="outline" className="text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          5+ years Design
        </Badge>
        <Badge variant="outline" className="text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Climate Tech
        </Badge>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-[#1C4D3A] text-white">
          Apply Now
        </Button>
        <Button size="sm" variant="outline">
          Save
        </Button>
      </div>
    </div>
    
    {/* Show 2-3 more matches */}
  </div>
</Card>
```

**E. Skill Development Progress**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530]">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Skill Development
    </h3>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => navigate('expertise-atlas')}
    >
      View Atlas
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
  
  <div className="space-y-4">
    {/* Skill Progress Bar */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Strategic Thinking
        </p>
        <Badge variant="outline" className="text-xs">
          Proficient
        </Badge>
      </div>
      <div className="h-2 rounded-full bg-[#E8E6DD] dark:bg-[#4A4540]">
        <div 
          className="h-full rounded-full bg-[#1C4D3A]"
          style={{ width: '75%' }}
        />
      </div>
      <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mt-1" style={{ fontFamily: 'Inter' }}>
        2 proofs verified · Add 1 more to reach Expert
      </p>
    </div>
    
    {/* Additional skills */}
  </div>
</Card>
```

---

#### Right Column (Quick Access - 30%)

**A. Profile Completion Widget**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6 sticky top-20">
  <h4 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
    Profile Strength
  </h4>
  
  {/* Circular Progress */}
  <div className="flex items-center justify-center mb-4">
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="#E8E6DD"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="#1C4D3A"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${87 * 3.52} ${100 * 3.52}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-['Crimson_Pro'] text-3xl text-[#1C4D3A]">87%</p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
          Strong
        </p>
      </div>
    </div>
  </div>
  
  {/* Action Items */}
  <div className="space-y-3">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-[#7A9278] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Bio and experience added
        </p>
      </div>
    </div>
    
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-[#7A9278] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          5 skills with proofs
        </p>
      </div>
    </div>
    
    <div className="flex items-start gap-3">
      <Circle className="w-5 h-5 text-[#2D3330] opacity-30 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Add 1 verified reference
        </p>
        <Button variant="link" className="p-0 h-auto text-xs text-[#1C4D3A]">
          Add now →
        </Button>
      </div>
    </div>
    
    <div className="flex items-start gap-3">
      <Circle className="w-5 h-5 text-[#2D3330] opacity-30 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Link 1 portfolio artifact
        </p>
        <Button variant="link" className="p-0 h-auto text-xs text-[#1C4D3A]">
          Add now →
        </Button>
      </div>
    </div>
  </div>
</Card>
```

**B. Quick Actions Panel**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6">
  <h4 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
    Quick Actions
  </h4>
  
  <div className="space-y-2">
    <Button 
      variant="outline" 
      className="w-full justify-start gap-2"
      onClick={() => navigate('expertise-atlas')}
    >
      <Map className="w-4 h-4" />
      Add Skill to Atlas
    </Button>
    
    <Button 
      variant="outline" 
      className="w-full justify-start gap-2"
      onClick={() => openDialog('add-proof')}
    >
      <FileCheck className="w-4 h-4" />
      Upload Proof
    </Button>
    
    <Button 
      variant="outline" 
      className="w-full justify-start gap-2"
      onClick={() => navigate('verifications')}
    >
      <ShieldCheck className="w-4 h-4" />
      Request Verification
    </Button>
    
    <Button 
      variant="outline" 
      className="w-full justify-start gap-2"
      onClick={() => navigate('matching')}
    >
      <Search className="w-4 h-4" />
      Browse Assignments
    </Button>
  </div>
</Card>
```

**C. Goal Tracker**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Active Goals
    </h4>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => openDialog('add-goal')}
    >
      <Plus className="w-4 h-4" />
    </Button>
  </div>
  
  <div className="space-y-3">
    {/* Goal Item */}
    <div className="p-3 rounded-lg bg-[#F7F6F1] dark:bg-[#343430]">
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] mb-2" style={{ fontFamily: 'Inter' }}>
        Land Product Design role
      </p>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 rounded-full bg-[#E8E6DD] dark:bg-[#4A4540]">
          <div 
            className="h-full rounded-full bg-[#1C4D3A]"
            style={{ width: '60%' }}
          />
        </div>
        <span className="text-xs text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          60%
        </span>
      </div>
      <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
        3 of 5 milestones complete
      </p>
    </div>
    
    {/* More goals */}
  </div>
</Card>
```

**D. Upcoming Events**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530]">
  <h4 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
    Upcoming
  </h4>
  
  <div className="space-y-3">
    {/* Event */}
    <div className="flex gap-3">
      <div className="w-12 h-12 rounded-lg bg-[#1C4D3A]/10 flex flex-col items-center justify-center flex-shrink-0">
        <p className="text-xs text-[#1C4D3A]" style={{ fontFamily: 'Inter' }}>NOV</p>
        <p className="font-['Crimson_Pro'] text-lg text-[#1C4D3A]">28</p>
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Interview with TechCorp
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
          2:00 PM · Video call
        </p>
      </div>
    </div>
    
    {/* More events */}
  </div>
</Card>
```

---

### 3. Sidebar

**Not Used** - Individual dashboard uses top navigation only for cleaner, more spacious layout

---

### 4. Key Metrics (Summary)

**Primary Metrics** (Always Visible):
1. **Profile Score**: 0-100, based on completeness and verification
2. **Quality Matches**: Count of 80%+ matches
3. **Pending Verifications**: Action required count
4. **Active Applications**: In-progress assignments
5. **Verified Skills**: Count with proofs
6. **Active Goals**: Career objectives being tracked

**Secondary Metrics** (In widgets):
- Match rate increase
- Profile views this week
- Response rate on applications
- Skill development progress
- Upcoming interviews/deadlines

---

### 5. Call-to-Actions

**Primary CTAs** (Hero Section):
- "Complete Your Profile" → Profile edit view
- "View New Matches" → Matching Space

**Quick Actions** (Right Panel):
- "Add Skill to Atlas" → Expertise Atlas with add dialog
- "Upload Proof" → File upload dialog
- "Request Verification" → Verifications view
- "Browse Assignments" → Matching Space assignments tab

**Contextual CTAs** (Activity Feed):
- "Review" on new matches → Match detail view
- "View" on verifications → Verification detail
- "Apply Now" on top matches → Assignment application

---

## 🏢 Organization Dashboard

### Purpose
Command center for organizations to manage capabilities, assignments, matches, and team.

---

### 1. Top Navigation Bar

**Structure**: Full-width fixed header

**Left Section (35%)**:
```tsx
<div className="flex items-center gap-4">
  {/* Org Logo & Name */}
  <div className="flex items-center gap-3">
    <Avatar className="w-10 h-10">
      <AvatarImage src={org.logo} />
      <AvatarFallback>{org.initials}</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
        {org.name}
      </p>
      <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
        Organization
      </p>
    </div>
  </div>
  
  {/* Global Search */}
  <div className="flex-1 max-w-md">
    <Input
      placeholder="Search candidates, assignments, capabilities..."
      icon={<Search className="w-4 h-4" />}
    />
  </div>
</div>
```

**Center Section (30%)**:
```tsx
<nav className="flex items-center gap-1">
  <Button variant="ghost" className={activeTab === 'dashboard' ? 'bg-[#1C4D3A]/10' : ''}>
    <LayoutDashboard className="w-4 h-4 mr-2" />
    Dashboard
  </Button>
  <Button variant="ghost">
    <Users className="w-4 h-4 mr-2" />
    Talent Pool
  </Button>
  <Button variant="ghost">
    <Briefcase className="w-4 h-4 mr-2" />
    Assignments
  </Button>
  <Button variant="ghost">
    <Map className="w-4 h-4 mr-2" />
    Capabilities
  </Button>
</nav>
```

**Right Section (35%)**:
```tsx
<div className="flex items-center gap-3">
  {/* Team Members Avatars */}
  <div className="flex -space-x-2">
    {teamMembers.slice(0, 3).map(member => (
      <Avatar key={member.id} className="w-8 h-8 border-2 border-white dark:border-[#252936]">
        <AvatarImage src={member.avatar} />
        <AvatarFallback>{member.initials}</AvatarFallback>
      </Avatar>
    ))}
    {teamMembers.length > 3 && (
      <div className="w-8 h-8 rounded-full bg-[#F7F6F1] dark:bg-[#343430] border-2 border-white dark:border-[#252936] flex items-center justify-center">
        <span className="text-xs text-[#2D3330] dark:text-[#E8E6DD]">
          +{teamMembers.length - 3}
        </span>
      </div>
    )}
  </div>
  
  {/* Notifications */}
  <Button variant="ghost" size="icon" className="relative">
    <Bell className="w-5 h-5" />
    {hasUnread && (
      <span className="absolute top-1 right-1 w-2 h-2 bg-[#C76B4A] rounded-full" />
    )}
  </Button>
  
  {/* Settings */}
  <Button variant="ghost" size="icon">
    <Settings className="w-5 h-5" />
  </Button>
  
  {/* User Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Avatar>
        <AvatarImage src={currentUser.avatar} />
        <AvatarFallback>{currentUser.initials}</AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Organization Settings</DropdownMenuItem>
      <DropdownMenuItem>Team Members</DropdownMenuItem>
      <DropdownMenuItem>Billing & Subscription</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Sign Out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

### 2. Main Content Area

**Layout**: Full-width with grid sections

#### A. Organization Health Hero
```tsx
<div className="p-8 rounded-2xl bg-gradient-to-br from-[#1C4D3A] via-[#2D5F4A] to-[#1C4D3A] text-white mb-6">
  <div className="flex items-start justify-between">
    {/* Left: Overview */}
    <div className="flex-1">
      <h1 className="font-['Crimson_Pro'] text-4xl mb-2">
        Organization Dashboard
      </h1>
      <p className="text-white/90 text-lg mb-6" style={{ fontFamily: 'Inter' }}>
        Manage capabilities, assignments, and talent pipeline
      </p>
      
      {/* Quick Stats */}
      <div className="flex gap-8">
        <div>
          <p className="font-['Crimson_Pro'] text-3xl">23</p>
          <p className="text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
            Active Assignments
          </p>
        </div>
        <div>
          <p className="font-['Crimson_Pro'] text-3xl">142</p>
          <p className="text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
            Quality Matches
          </p>
        </div>
        <div>
          <p className="font-['Crimson_Pro'] text-3xl">9</p>
          <p className="text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
            Capabilities Mapped
          </p>
        </div>
        <div>
          <p className="font-['Crimson_Pro'] text-3xl">3.8</p>
          <p className="text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
            Avg Maturity
          </p>
        </div>
      </div>
    </div>
    
    {/* Right: Quick Actions */}
    <div className="flex flex-col gap-2">
      <Button 
        className="bg-white text-[#1C4D3A] hover:bg-[#F7F6F1]"
        onClick={() => navigate('assignment-builder')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Post New Assignment
      </Button>
      <Button 
        variant="outline" 
        className="border-white text-white hover:bg-white/10"
        onClick={() => navigate('expertise-atlas')}
      >
        <Map className="w-4 h-4 mr-2" />
        View Capability Map
      </Button>
    </div>
  </div>
</div>
```

#### B. Key Metrics Grid
```tsx
<div className="grid grid-cols-4 gap-6 mb-6">
  {/* Talent Pipeline Health */}
  <Card className="p-6 bg-white dark:bg-[#3A3530]">
    <div className="flex items-center justify-between mb-4">
      <Users className="w-8 h-8 text-[#1C4D3A] dark:text-[#B8D4C6]" />
      <TrendingUp className="w-5 h-5 text-[#7A9278]" />
    </div>
    <p className="font-['Crimson_Pro'] text-4xl text-[#2D3330] dark:text-[#E8E6DD] mb-2">
      142
    </p>
    <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] mb-1" style={{ fontFamily: 'Inter' }}>
      Quality Matches
    </p>
    <p className="text-xs text-[#7A9278]" style={{ fontFamily: 'Inter' }}>
      +18 this week
    </p>
    <Progress value={85} className="mt-3" />
  </Card>
  
  {/* Active Assignments */}
  <Card className="p-6 bg-white dark:bg-[#3A3530]">
    <div className="flex items-center justify-between mb-4">
      <Briefcase className="w-8 h-8 text-[#1C4D3A]" />
      <AlertCircle className="w-5 h-5 text-[#D4A574]" />
    </div>
    <p className="font-['Crimson_Pro'] text-4xl text-[#2D3330] dark:text-[#E8E6DD] mb-2">
      23
    </p>
    <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] mb-1" style={{ fontFamily: 'Inter' }}>
      Active Assignments
    </p>
    <p className="text-xs text-[#D4A574]" style={{ fontFamily: 'Inter' }}>
      5 closing this week
    </p>
    <div className="flex gap-2 mt-3">
      <Badge variant="outline" className="text-xs">12 Open</Badge>
      <Badge variant="outline" className="text-xs">11 In Review</Badge>
    </div>
  </Card>
  
  {/* Capability Maturity */}
  <Card className="p-6 bg-white dark:bg-[#3A3530]">
    <div className="flex items-center justify-between mb-4">
      <Map className="w-8 h-8 text-[#1C4D3A]" />
      <TrendingUp className="w-5 h-5 text-[#7A9278]" />
    </div>
    <p className="font-['Crimson_Pro'] text-4xl text-[#2D3330] dark:text-[#E8E6DD] mb-2">
      3.8
    </p>
    <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] mb-1" style={{ fontFamily: 'Inter' }}>
      Avg Capability Maturity
    </p>
    <p className="text-xs text-[#7A9278]" style={{ fontFamily: 'Inter' }}>
      +0.3 from Q3
    </p>
    <div className="flex gap-1 mt-3">
      {[1,2,3,4,5].map(level => (
        <div 
          key={level}
          className={`flex-1 h-2 rounded-full ${
            level <= 4 ? 'bg-[#1C4D3A]' : 'bg-[#E8E6DD] dark:bg-[#4A4540]'
          }`}
        />
      ))}
    </div>
  </Card>
  
  {/* Team Activity */}
  <Card className="p-6 bg-white dark:bg-[#3A3530]">
    <div className="flex items-center justify-between mb-4">
      <Activity className="w-8 h-8 text-[#1C4D3A]" />
      <CheckCircle2 className="w-5 h-5 text-[#7A9278]" />
    </div>
    <p className="font-['Crimson_Pro'] text-4xl text-[#2D3330] dark:text-[#E8E6DD] mb-2">
      87%
    </p>
    <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] mb-1" style={{ fontFamily: 'Inter' }}>
      Team Engagement
    </p>
    <p className="text-xs text-[#7A9278]" style={{ fontFamily: 'Inter' }}>
      12 members active today
    </p>
    <Button variant="link" className="p-0 h-auto text-xs text-[#1C4D3A] mt-2">
      View team activity →
    </Button>
  </Card>
</div>
```

#### C. Two-Column Layout

**Left Column (60%)**:

**Top Candidates**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Top Candidate Matches
    </h3>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => navigate('matching')}
    >
      View All
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
  
  <Tabs defaultValue="for-review">
    <TabsList className="mb-4">
      <TabsTrigger value="for-review">
        For Review (8)
      </TabsTrigger>
      <TabsTrigger value="shortlisted">
        Shortlisted (23)
      </TabsTrigger>
      <TabsTrigger value="interviews">
        Interviews (5)
      </TabsTrigger>
    </TabsList>
    
    <TabsContent value="for-review" className="space-y-3">
      {/* Candidate Card */}
      <div className="p-4 rounded-xl border border-[#E8E6DD] dark:border-[#4A4540] hover:border-[#1C4D3A] transition-colors">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
                  Jordan Davis
                </h4>
                <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] opacity-70" style={{ fontFamily: 'Inter' }}>
                  Applied 2 hours ago
                </p>
              </div>
              <Badge className="bg-[#1C4D3A]/10 text-[#1C4D3A] border-0">
                94% Match
              </Badge>
            </div>
            
            {/* Applied For */}
            <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] mb-3" style={{ fontFamily: 'Inter' }}>
              <strong>Senior Product Designer</strong> · Climate Tech Initiative
            </p>
            
            {/* Match Reasons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1 text-[#7A9278]" />
                Figma Expert
              </Badge>
              <Badge variant="outline" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1 text-[#7A9278]" />
                8 verified skills
              </Badge>
              <Badge variant="outline" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1 text-[#7A9278]" />
                Climate Tech exp
              </Badge>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-[#1C4D3A] text-white"
                onClick={() => openCandidateProfile('jordan-davis')}
              >
                Review Profile
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => shortlistCandidate('jordan-davis')}
              >
                Shortlist
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => passCandidate('jordan-davis')}
              >
                Pass
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* More candidate cards */}
    </TabsContent>
  </Tabs>
</Card>
```

**Recent Activity Feed**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530]">
  <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
    Recent Activity
  </h3>
  
  <div className="space-y-4">
    {/* Activity Item */}
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-[#1C4D3A]/10 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-5 h-5 text-[#1C4D3A]" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          <strong>Sarah Chen</strong> shortlisted 3 candidates for Senior Designer
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mt-1" style={{ fontFamily: 'Inter' }}>
          1 hour ago
        </p>
      </div>
    </div>
    
    {/* Assignment Posted */}
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-[#C76B4A]/10 flex items-center justify-center flex-shrink-0">
        <Plus className="w-5 h-5 text-[#C76B4A]" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          New assignment posted: <strong>Data Analyst - Impact Team</strong>
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mt-1" style={{ fontFamily: 'Inter' }}>
          3 hours ago
        </p>
      </div>
    </div>
    
    {/* More activity items */}
  </div>
</Card>
```

**Right Column (40%)**:

**Active Assignments Overview**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6 sticky top-20">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Active Assignments
    </h3>
    <Button 
      size="sm" 
      variant="ghost"
      onClick={() => navigate('assignments')}
    >
      View All
    </Button>
  </div>
  
  <div className="space-y-3">
    {/* Assignment Card */}
    <div className="p-4 rounded-xl bg-[#F7F6F1] dark:bg-[#343430] border border-[#E8E6DD] dark:border-[#4A4540]">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Senior Product Designer
        </h4>
        <Badge variant="outline" className="text-xs">
          Open
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60 mb-3">
        <span style={{ fontFamily: 'Inter' }}>
          <Users className="w-3 h-3 inline mr-1" />
          23 applicants
        </span>
        <span style={{ fontFamily: 'Inter' }}>
          <Clock className="w-3 h-3 inline mr-1" />
          5 days left
        </span>
      </div>
      
      <Button 
        size="sm" 
        variant="outline" 
        className="w-full"
        onClick={() => navigate('assignment-detail', { id: '123' })}
      >
        Review Applicants
      </Button>
    </div>
    
    {/* More assignment cards */}
  </div>
  
  <Button 
    className="w-full mt-4 bg-[#1C4D3A] text-white"
    onClick={() => navigate('assignment-builder')}
  >
    <Plus className="w-4 h-4 mr-2" />
    Post New Assignment
  </Button>
</Card>
```

**Capability Health Snapshot**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530] mb-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD]">
      Capability Health
    </h3>
    <Button 
      size="sm" 
      variant="ghost"
      onClick={() => navigate('expertise-atlas')}
    >
      View Map
    </Button>
  </div>
  
  {/* Maturity Distribution */}
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
        Average Maturity
      </p>
      <p className="font-['Crimson_Pro'] text-2xl text-[#1C4D3A]">3.8</p>
    </div>
    <div className="flex gap-1">
      {[1,2,3,4,5].map(level => (
        <div 
          key={level}
          className={`flex-1 h-3 rounded-full ${
            level <= 4 ? 'bg-[#1C4D3A]' : 'bg-[#E8E6DD] dark:bg-[#4A4540]'
          }`}
        />
      ))}
    </div>
  </div>
  
  {/* Lane Breakdown */}
  <div className="space-y-3">
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1C4D3A]" />
          <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
            Core
          </p>
        </div>
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          4.2 avg
        </p>
      </div>
      <Progress value={84} className="h-2" />
    </div>
    
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C76B4A]" />
          <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
            Enabling
          </p>
        </div>
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          3.7 avg
        </p>
      </div>
      <Progress value={74} className="h-2" />
    </div>
    
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#5F8C6F]" />
          <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
            Management
          </p>
        </div>
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          3.3 avg
        </p>
      </div>
      <Progress value={66} className="h-2" />
    </div>
  </div>
  
  {/* Risk Areas */}
  <div className="mt-4 p-3 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/20">
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-[#D4A574] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          2 capabilities at medium risk
        </p>
        <Button variant="link" className="p-0 h-auto text-xs text-[#D4A574]">
          Review risk areas →
        </Button>
      </div>
    </div>
  </div>
</Card>
```

**Team Activity**
```tsx
<Card className="p-6 bg-white dark:bg-[#3A3530]">
  <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
    Team Activity
  </h3>
  
  <div className="space-y-3">
    {/* Team Member */}
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src="/avatars/sarah.jpg" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]" style={{ fontFamily: 'Inter' }}>
          Sarah Chen
        </p>
        <p className="text-xs text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
          Reviewed 12 profiles today
        </p>
      </div>
      <Badge variant="outline" className="text-xs">
        Active
      </Badge>
    </div>
    
    {/* More team members */}
  </div>
</Card>
```

---

### 3. Sidebar

**Not Used** - Organization dashboard uses full-width layout with top navigation

---

### 4. Key Metrics (Summary)

**Primary Metrics**:
1. **Quality Matches**: Count of 80%+ candidate matches
2. **Active Assignments**: Total open and in-review assignments
3. **Avg Capability Maturity**: 1-5 scale across all capabilities
4. **Team Engagement**: Percentage of team members active

**Secondary Metrics**:
- Applications per assignment
- Time to fill positions
- Match quality trend
- Capability risk areas
- Team member activity

---

### 5. Call-to-Actions

**Primary CTAs** (Hero Section):
- "Post New Assignment" → Assignment Builder
- "View Capability Map" → Expertise Atlas (Org View)

**Quick Actions**:
- "Review Profile" on candidate cards → Candidate profile detail
- "Shortlist" / "Pass" on candidates → Update candidate status
- "Review Applicants" on assignments → Assignment detail with applicants
- "Review Risk Areas" on capability health → Expertise Atlas filtered by risk

---

## 🏛️ Government Dashboard

### Purpose
Similar to Organization dashboard but with additional regulatory and compliance features.

### Key Differences from Organization Dashboard:

1. **Additional Metrics**:
   - Compliance status
   - Regulatory reporting deadlines
   - Public sector transparency score
   - Inter-agency collaboration metrics

2. **Public/Private Toggle**:
   - Control which assignments are public vs internal
   - Privacy controls for sensitive roles

3. **Specialized Sections**:
   - **Civic Goals Tracker**: Public service objectives
   - **Inter-Agency Matches**: Cross-government collaboration
   - **Compliance Dashboard**: Regulatory requirements tracking

**Layout follows Organization Dashboard structure** with these additional components in right sidebar.

---

## 📊 Admin Dashboard

### Purpose
Platform administration, user management, analytics, and system health monitoring.

---

### 1. Top Navigation

**Simpler Layout** - Admin-focused:

```tsx
<div className="h-16 bg-[#2D3330] dark:bg-[#1A1D2E] text-white px-6 flex items-center justify-between sticky top-0 z-50">
  <div className="flex items-center gap-4">
    <Shield className="w-6 h-6" />
    <h1 className="font-['Crimson_Pro'] text-xl">Admin Dashboard</h1>
  </div>
  
  <div className="flex items-center gap-3">
    <Badge variant="outline" className="text-white border-white/30">
      Production
    </Badge>
    <Button variant="ghost" size="icon" className="text-white">
      <Bell className="w-5 h-5" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Admin Settings</DropdownMenuItem>
        <DropdownMenuItem>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
```

---

### 2. Sidebar Navigation

**Yes - Left sidebar with sections**:

```tsx
<aside className="w-64 bg-white dark:bg-[#252936] border-r border-[#E8E6DD] dark:border-[#D4C4A8]/10 h-screen sticky top-16">
  <nav className="p-4 space-y-2">
    <Button 
      variant={activeSection === 'overview' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <LayoutDashboard className="w-4 h-4" />
      Overview
    </Button>
    
    <Button 
      variant={activeSection === 'users' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <Users className="w-4 h-4" />
      Users
    </Button>
    
    <Button 
      variant={activeSection === 'organizations' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <Building className="w-4 h-4" />
      Organizations
    </Button>
    
    <Button 
      variant={activeSection === 'memberships' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <CreditCard className="w-4 h-4" />
      Memberships
    </Button>
    
    <Button 
      variant={activeSection === 'promo-codes' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <Ticket className="w-4 h-4" />
      Promo Codes
    </Button>
    
    <Button 
      variant={activeSection === 'analytics' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <BarChart className="w-4 h-4" />
      Analytics
    </Button>
    
    <Button 
      variant={activeSection === 'system' ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
    >
      <Settings className="w-4 h-4" />
      System Health
    </Button>
  </nav>
</aside>
```

---

### 3. Main Content - Overview Section

**System Health at a Glance**:

```tsx
<div className="p-6">
  <h2 className="font-['Crimson_Pro'] text-2xl text-[#2D3330] dark:text-[#E8E6DD] mb-6">
    System Overview
  </h2>
  
  {/* Key Metrics Grid */}
  <div className="grid grid-cols-4 gap-6 mb-6">
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <Users className="w-6 h-6 text-[#1C4D3A]" />
        <TrendingUp className="w-4 h-4 text-[#7A9278]" />
      </div>
      <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
        1,247
      </p>
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
        Total Users
      </p>
      <p className="text-xs text-[#7A9278] mt-1" style={{ fontFamily: 'Inter' }}>
        +52 this week
      </p>
    </Card>
    
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <Building className="w-6 h-6 text-[#1C4D3A]" />
        <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />
      </div>
      <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
        87
      </p>
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
        Organizations
      </p>
      <p className="text-xs text-[#7A9278] mt-1" style={{ fontFamily: 'Inter' }}>
        23 with paid memberships
      </p>
    </Card>
    
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <Activity className="w-6 h-6 text-[#1C4D3A]" />
        <TrendingUp className="w-4 h-4 text-[#7A9278]" />
      </div>
      <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
        98.7%
      </p>
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
        System Uptime
      </p>
      <p className="text-xs text-[#7A9278] mt-1" style={{ fontFamily: 'Inter' }}>
        Last 30 days
      </p>
    </Card>
    
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <Zap className="w-6 h-6 text-[#1C4D3A]" />
        <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />
      </div>
      <p className="font-['Crimson_Pro'] text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
        342
      </p>
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD] opacity-60" style={{ fontFamily: 'Inter' }}>
        Matches Made
      </p>
      <p className="text-xs text-[#7A9278] mt-1" style={{ fontFamily: 'Inter' }}>
        This week
      </p>
    </Card>
  </div>
  
  {/* Charts Row */}
  <div className="grid grid-cols-2 gap-6 mb-6">
    <Card className="p-6">
      <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
        User Growth
      </h3>
      {/* Recharts Line Chart */}
    </Card>
    
    <Card className="p-6">
      <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
        Match Quality Distribution
      </h3>
      {/* Recharts Bar Chart */}
    </Card>
  </div>
  
  {/* Recent Activity Table */}
  <Card className="p-6">
    <h3 className="font-['Crimson_Pro'] text-[#2D3330] dark:text-[#E8E6DD] mb-4">
      Recent Platform Activity
    </h3>
    <Table>
      {/* Activity log entries */}
    </Table>
  </Card>
</div>
```

---

## 🎨 Common Design Patterns

### Empty States
```tsx
<EmptyState
  icon={<Icon className="w-12 h-12" />}
  title="No [items] yet"
  description="[Helpful guidance text from PRD]"
  action={<Button>Primary Action</Button>}
/>
```

### Loading States
```tsx
{isLoading ? (
  <SkeletonCard count={3} />
) : (
  <Content />
)}
```

### Error States
```tsx
<ErrorState
  title="Unable to load data"
  description="We're having trouble connecting. Please try again."
  action={<Button onClick={retry}>Retry</Button>}
/>
```

### Toast Notifications
```tsx
// Success
toast.success('Assignment posted successfully');

// Error
toast.error('Failed to save changes. Please try again.');

// Info
toast.info('New matches available');

// Warning
toast.warning('Assignment closing in 2 days');
```

---

## 📐 Layout Specifications

### Container Widths
- **Max width**: `max-w-[1600px] mx-auto`
- **Padding**: `px-6` on all containers
- **Gap between sections**: `gap-6` (24px)

### Card Styling
```tsx
className="p-6 rounded-2xl bg-white dark:bg-[#3A3530] border border-[#E8E6DD] dark:border-[#4A4540] hover:border-[#1C4D3A] dark:hover:border-[#4A5F52] transition-colors"
```

### Button Hierarchy
1. **Primary**: Solid forest green
2. **Secondary**: Solid terracotta
3. **Outline**: Border with forest green
4. **Ghost**: No background, hover shows light background
5. **Link**: Text only, underline on hover

---

## ♿ Accessibility Requirements

### All Dashboards Must:
1. **Keyboard Navigation**: All interactive elements reachable via Tab
2. **Screen Reader Labels**: ARIA labels on icon-only buttons
3. **Color Contrast**: WCAG AA minimum (4.5:1 for text)
4. **Focus Indicators**: Visible focus rings on all interactive elements
5. **Semantic HTML**: Proper heading hierarchy, landmarks
6. **Reduced Motion**: Respect `prefers-reduced-motion`

---

## 🚀 Performance Guidelines

### All Dashboards Must:
1. Use `SkeletonCard` for loading states
2. Lazy load heavy components
3. Paginate large lists (20-50 items per page)
4. Debounce search inputs
5. Cache API responses appropriately
6. Show optimistic UI updates

---

## 📱 Responsive Behavior

### Breakpoints:
- **Mobile**: < 768px (not priority for MVP)
- **Tablet**: 768px - 1024px (simplified layout)
- **Desktop**: > 1024px (full experience)

### Mobile Adaptations (Future):
- Collapse sidebar into hamburger menu
- Stack two-column layouts vertically
- Show fewer items in lists with "Load More"
- Simplify metric cards to single column

---

**This document serves as the complete design specification for all dashboard types in Proofound MVP.**

**Reference Documents**:
- `/PRD_MVP.md` - Complete product requirements
- `/guidelines/Guidelines.md` - Design system rules
- `/lib/design-tokens.ts` - Color and spacing tokens
- `/components/` - Reusable component library

---

**Last Updated**: October 27, 2025  
**Status**: Production Ready for MVP Pilot
