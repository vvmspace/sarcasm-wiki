# Sarcasm Wiki - Modern Design

A Wikipedia content reimagining platform with a premium modern design system.

## 🎨 Design Philosophy

This project features a complete design system emphasizing:
- **Premium Quality**: High-end materials and finishes
- **Performance**: Fast animations and responsiveness  
- **Minimalism**: Clean lines and whitespace
- **Precision**: Attention to detail
- **Innovation**: Modern technologies and approaches

## 🎨 Design System

### Color Palette
- **White**: `#ffffff` - Primary white
- **Pearl White**: `#f8f9fa` - Background tones
- **Primary Blue**: `#1976d2` - Primary actions
- **Accent Red**: `#ff4444` - Hover states and accents
- **Charcoal**: `#202124` - Primary text

### Components
- **Navigation** - Premium navigation with blur effects
- **Hero** - Animated hero sections with gradients
- **Card** - Elegant cards with hover effects
- **Button** - Multiple variants and sizes
- **Stats** - Statistics with trend indicators
- **Loading** - Animated loading states
- **Notification** - Toast notifications
- **ErrorPage** - Styled error pages

## 🚀 Features

- **AI-Enhanced Content**: Wikipedia articles rewritten with AI
- **Premium Design**: BMW M3-inspired interface
- **Responsive**: Optimized for all devices
- **Performance**: Fast loading and smooth animations
- **Accessibility**: WCAG compliant components
- **SEO Optimized**: Automatic sitemap generation

## 🛠 Tech Stack

- **Framework**: Next.js 14
- **Styling**: CSS with BMW M3 design tokens
- **Typography**: Inter font family
- **Icons**: Material Design Icons
- **Deployment**: Vercel/PM2 ready

## 📱 Pages

- **Home** (`/`) - Main landing page with latest articles
- **Showcase** (`/showcase`) - Design system demonstration
- **Admin** (`/admin`) - Content management
- **Articles** (`/[slug]`) - Individual article pages

## 🎯 Usage

### View the Design System
Visit `/showcase` to see all components in action.

### Component Import
```tsx
import {
  BMWNavigation,
  BMWHero,
  BMWCard,
  BMWButton
} from './app/components'
```

### Example Usage
```tsx
<BMWHero 
  title="Premium Content"
  description="Experience knowledge with BMW M3 elegance"
  primaryAction={{ text: "Explore", href: "/articles" }}
/>
```

## 🏁 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   # Create .env file with AI provider keys (at least one required)
   GEMINI_API_KEY=your_gemini_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   OPENAI_API_KEY=your_openai_key_here
   
   # Multiple keys supported (comma-separated for load balancing)
   GEMINI_API_KEY=key1,key2,key3
   OPENROUTER_API_KEY=key1,key2
   
   PORT=3000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Visit the application**
   - Main site: `http://localhost:3000`
   - Design showcase: `http://localhost:3000/showcase`

## 📖 Documentation

- **Design System**: See `BMW_M3_DESIGN.md` for complete documentation
- **Components**: All components are documented with TypeScript interfaces
- **Styles**: Global styles in `app/globals.css`

## 🎨 Design Highlights

- **Premium Typography**: Inter font with optimized weights
- **Smooth Animations**: 0.2s-0.3s transitions with easing
- **Hover Effects**: Subtle transforms and shadow changes  
- **Color Harmony**: BMW M-series inspired palette
- **Responsive Grid**: Auto-fit layouts for all screen sizes

## 🔧 Customization

The design system uses CSS custom properties for easy theming:

```css
:root {
  --bmw-white: #ffffff;
  --bmw-m-blue: #1976d2;
  --bmw-accent-red: #ff4444;
  /* ... more variables */
}
```

## 📄 License

This project showcases a BMW M3-inspired design system for educational and demonstration purposes.

---

**Experience premium web design inspired by automotive excellence.** 🏎️
