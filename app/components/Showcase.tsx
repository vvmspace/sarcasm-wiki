import Button from './Button'
import Card from './Card'
import Stats from './Stats'
import Loading from './Loading'

export default function Showcase() {
  const sampleStats = [
    {
      label: 'Total Articles',
      value: '1,234',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      ),
      trend: 'up' as const,
      trendValue: '+12%'
    },
    {
      label: 'Active Users',
      value: '5,678',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
        </svg>
      ),
      trend: 'up' as const,
      trendValue: '+8%'
    },
    {
      label: 'Page Views',
      value: '89,012',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
        </svg>
      ),
      trend: 'down' as const,
      trendValue: '-3%'
    }
  ]

  return (
    <div className="showcase">
      <div className="container">
        <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>
          Design Showcase
        </h1>

        {/* Buttons Section */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Buttons</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" size="lg">
              Primary Button
            </Button>
            <Button variant="secondary" size="lg">
              Secondary Button
            </Button>
            <Button variant="outline" size="lg">
              Outline Button
            </Button>
            <Button variant="ghost" size="lg">
              Ghost Button
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="secondary" size="sm">
              Small
            </Button>
            <Button 
              variant="primary" 
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              }
            >
              With Icon
            </Button>
          </div>
        </section>

        {/* Cards Section */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Cards</h2>
          <div className="grid grid-3">
            <Card
              title="Default Card"
              description="This is a default card with hover effects. Notice the red outline on hover."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
                </svg>
              }
            />
            
            <Card
              title="Featured Card"
              description="This is a featured card with special styling and accent."
              variant="featured"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z" />
                </svg>
              }
            />
            
            <Card
              title="Minimal Card"
              description="This is a minimal card with transparent background and subtle styling."
              variant="minimal"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Statistics</h2>
          <Stats stats={sampleStats} />
        </section>

        {/* Loading Section */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Loading States</h2>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Loading size="sm" text="Small Loading" />
            <Loading size="md" text="Medium Loading" />
            <Loading size="lg" text="Large Loading" />
          </div>
        </section>

        {/* Color Palette */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Color Palette</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="color-swatch" style={{ background: 'var(--white)', border: '1px solid var(--silver)' }}>
              <div style={{ padding: '1rem', color: 'var(--black)' }}>
                <strong>White</strong><br />
                Primary Background
              </div>
            </div>
            <div className="color-swatch" style={{ background: 'var(--primary-blue)' }}>
              <div style={{ padding: '1rem', color: 'white' }}>
                <strong>Primary Blue</strong><br />
                Primary Actions
              </div>
            </div>
            <div className="color-swatch" style={{ background: 'var(--accent-red)' }}>
              <div style={{ padding: '1rem', color: 'white' }}>
                <strong>Accent Red</strong><br />
                Hover States
              </div>
            </div>
            <div className="color-swatch" style={{ background: 'var(--charcoal)' }}>
              <div style={{ padding: '1rem', color: 'white' }}>
                <strong>Charcoal</strong><br />
                Text Color
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}