# Design System

Minimalist design system with focus on premium quality and modernity.

## Color Palette

### Primary Colors
- **White**: `#ffffff` - Main white color
- **Pearl White**: `#f8f9fa` - Pearl white for backgrounds
- **Silver**: `#e8eaed` - Silver for borders
- **Dark Silver**: `#dadce0` - Dark silver
- **Charcoal**: `#202124` - Main text color
- **Black**: `#000000` - Headers and accents

### Accent Colors
- **Primary Blue**: `#1976d2` - Main blue
- **Blue**: `#0066cc` - Secondary blue
- **Accent Red**: `#ff4444` - Red accent for hover

## Components

### Navigation
Navigation panel with:
- Responsive menu
- Blur effect
- Animated hamburger menu

### Hero
Hero section with:
- Gradient background
- Animated patterns
- Centered content
- Call-to-action buttons

### Card
Cards with:
- Rounded corners (12px)
- Shadows and hover effects
- Variants: default, featured, minimal
- Red borders on hover

### Button
Buttons with:
- Four variants: primary, secondary, outline, ghost
- Three sizes: sm, md, lg
- Smooth animations
- Icon support
- Red hover effects

### Article
Article component with:
- Clean typography
- Optimal reading width
- Styled links
- Responsive design

### Loading
Loading indicator with:
- Three rotating rings
- Different sizes

### Stats
Statistics component with:
- Card grid
- Icons and trends
- Hover effects
- Gradient accents

### Notification
Notifications with:
- Four types: success, error, warning, info
- Auto-close functionality
- Smooth animations
- Close button

## Usage

### Import components
```tsx
import {
  Navigation,
  Hero,
  Card,
  Button,
  Article,
  Loading,
  Stats,
  Notification
} from './components'
```

### Example usage
```tsx
export default function Page() {
  return (
    <>
      <Navigation />
      
      <Hero 
        title="Title"
        description="Description"
        primaryAction={{ text: "Action", href: "/link" }}
      />
      
      <div className="container">
        <div className="grid grid-3">
          <Card 
            title="Card"
            description="Card description"
            variant="featured"
            icon={<IconComponent />}
          />
        </div>
        
        <Stats 
          stats={[
            {
              label: "Users",
              value: "1,234",
              trend: "up",
              trendValue: "+12%"
            }
          ]}
        />
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="primary" size="lg">
            Primary Button
          </Button>
        </div>
      </div>
    </>
  )
}
```

## Design Philosophy

Design based on principles:
- **Premium Quality**: High-quality materials and finish
- **Performance**: Fast animations and responsiveness
- **Minimalism**: Clean lines and space
- **Precision**: Attention to detail
- **Innovation**: Modern technologies and approaches

## Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Headers**: Bold with negative letter-spacing
- **Text**: Optimal line height 1.6-1.8

## Animations

- **Hover effects**: translateY(-1px to -2px)
- **Transitions**: 0.2s ease for fast, 0.3s ease for slow
- **Shadows**: Increase on hover
- **Loading**: Rotating rings with delays

## Responsiveness

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

All components are fully responsive with mobile optimization.

## File Structure

```
app/
├── components/
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── Article.tsx
│   ├── Loading.tsx
│   ├── Stats.tsx
│   ├── Notification.tsx
│   ├── NotificationContainer.tsx
│   ├── ErrorPage.tsx
│   ├── Badge.tsx
│   └── index.ts
├── globals.css
└── page.tsx
```

All styles are in `globals.css` for optimal performance and no conflicts with Next.js server components.