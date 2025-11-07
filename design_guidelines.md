# Phone Validator - Design Guidelines

## Design Approach
**Selected System**: Material Design 3 with healthcare-themed customization
**Rationale**: This utility-focused application requires clear information hierarchy, accessible form interactions, and data-dense displays. Material Design 3 provides robust patterns for file uploads, data tables, and statistics dashboards while maintaining the modern aesthetic.

## Typography System

**Font Stack**: 
- Primary: Inter (via Google Fonts CDN)
- Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

**Type Scale**:
- Display (Hero): 3.5rem / 700 weight
- H1 (Page Title): 2.5rem / 700 weight
- H2 (Section): 1.875rem / 600 weight
- H3 (Card Titles): 1.5rem / 600 weight
- Body Large: 1.125rem / 400 weight
- Body: 1rem / 400 weight
- Caption: 0.875rem / 400 weight

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (within components): 2, 4
- Component internal padding: 6, 8
- Card padding: 12 (mobile), 16 (desktop)
- Section spacing: 20, 24

**Container Strategy**:
- Max width: 1200px (max-w-6xl)
- Responsive padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)

## Core Components

### Header
Full-width centered header with:
- Application title with medical icon (🏥)
- Subtitle explaining functionality
- Contained within white card with rounded corners (rounded-xl)
- Subtle shadow (shadow-lg)
- Padding: py-12 px-8

### File Upload Zone
Prominent drag-and-drop area:
- Dashed border (4px) for drop target
- Large upload icon (96x96px) using Heroicons (document-arrow-up)
- Clear call-to-action text
- File type indicators below
- Hover state with slightly elevated appearance
- Min height: 280px
- Rounded corners: rounded-2xl

### Action Buttons
Material Design 3 elevated buttons:
- Primary CTA: Full rounded (rounded-full), shadow-md
- Height: h-12, px-8
- Icon + text combination
- Disabled state with reduced opacity

### Statistics Dashboard
Grid layout for summary cards:
- Desktop: 3 columns (grid-cols-3)
- Tablet: 2 columns (grid-cols-2)
- Mobile: 1 column (grid-cols-1)
- Gap: gap-6

**Summary Cards**:
- Large metric display (text-5xl, font-bold)
- Icon above number (48x48px from Heroicons)
- Descriptive label below
- Border-l-4 accent stripe
- Padding: p-8
- Rounded: rounded-xl
- Shadow: shadow-md

### Results Table
Professional data table implementation:
- Sticky header row
- Zebra striping for rows
- Cell padding: px-6 py-4
- Rounded container: rounded-lg
- Overflow scroll for mobile
- Column widths: Phone (25%), Status (15%), Type (20%), SMS (15%), Carrier (25%)
- Status indicators using emoji + text
- Border between header and body

### Loading State
Centered loading indicator:
- Spinner icon (Heroicons: arrow-path with animate-spin)
- Progress text below
- Padding: py-16
- Semi-transparent overlay when active

## Page Structure

**Single Page Application Layout**:

1. **Header Section** (fixed positioning)
   - Padding: py-8
   - Contains branding and tagline

2. **Upload Section**
   - Upload zone card
   - Action button below
   - Spacing: mt-8

3. **Results Section** (conditionally displayed)
   - Summary statistics grid: mt-12
   - Results table: mt-8
   - Download/export actions: mt-6

4. **Footer** (optional utility footer)
   - API attribution
   - Rate limit information
   - Centered, text-sm

## Responsive Behavior

**Breakpoints**:
- Mobile: < 640px (single column, stacked cards)
- Tablet: 640px - 1024px (2-column grids, compressed table)
- Desktop: > 1024px (full 3-column layout)

**Mobile Optimizations**:
- Upload zone height: reduced to 200px
- Statistics cards: full width stack
- Table: horizontal scroll with fixed first column
- Button: full width (w-full)

## Icons
**Library**: Heroicons (via CDN)
**Usage**:
- Upload: document-arrow-up
- Loading: arrow-path (animated)
- Valid status: check-circle
- Invalid status: x-circle
- SMS capability: device-phone-mobile
- Statistics icons: chart-bar, check-badge, signal

## Accessibility
- Minimum touch target: 48x48px for all interactive elements
- Form labels with proper associations
- ARIA live regions for validation progress
- Focus visible states with 2px outline
- Semantic HTML structure (main, section, article)
- Alt text for all status indicators

## Animation Guidelines
**Minimal, purposeful animations only**:
- File upload: Scale transform on drag-over (scale-105)
- Button hover: Subtle lift (translate-y-1)
- Results reveal: Fade in with slide-up (transition-all duration-300)
- Loading spinner: Continuous rotation (animate-spin)
- NO scroll-triggered animations
- NO parallax effects

## Images
**No hero images needed** - This is a utility application focused on functionality. The upload icon and statistics visualizations provide sufficient visual interest.