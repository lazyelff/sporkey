import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const animationStyles = {
  subtle: {
    name: 'Subtle',
    description: 'Gentle fade + slide with ease-out timing',
    hero: { animation: 'subtleHero 0.5s ease-out forwards', delay: '0s' },
    card: { animation: 'subtleCard 0.6s ease-out forwards', stagger: '0.15s' },
    stat: { animation: 'subtleStat 0.5s ease-out forwards', stagger: '0.1s' },
    button: { hover: 'scale(1.02)', tap: 'scale(0.98)' },
    css: `
      @keyframes subtleHero { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes subtleCard { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes subtleStat { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    `
  },
  energetic: {
    name: 'Energetic',
    description: 'Spring animations with bounce and rotate effects',
    hero: { animation: 'energeticHero 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards', delay: '0s' },
    card: { animation: 'energeticCard 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards', stagger: '0.15s' },
    stat: { animation: 'energeticStat 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards', stagger: '0.1s' },
    button: { hover: 'scale(1.05) rotate(1deg)', tap: 'scale(0.95)' },
    css: `
      @keyframes energeticHero { from { opacity: 0; transform: scale(0.8) rotate(-5deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
      @keyframes energeticCard { from { opacity: 0; transform: translateX(-20px) rotate(-2deg); } to { opacity: 1; transform: translateX(0) rotate(0deg); } }
      @keyframes energeticStat { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
    `
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple fades only, slower duration',
    hero: { animation: 'minimalHero 0.8s ease-in-out forwards', delay: '0s' },
    card: { animation: 'minimalCard 0.8s ease-in-out forwards', stagger: '0.2s' },
    stat: { animation: 'minimalStat 0.8s ease-in-out forwards', stagger: '0.15s' },
    button: { hover: 'opacity(0.9)', tap: 'opacity(0.8)' },
    css: `
      @keyframes minimalHero { from { opacity: 0; } to { opacity: 1; } }
      @keyframes minimalCard { from { opacity: 0; } to { opacity: 1; } }
      @keyframes minimalStat { from { opacity: 0; } to { opacity: 1; } }
    `
  },
  bold: {
    name: 'Bold',
    description: 'Strong slides with custom easing curves',
    hero: { animation: 'boldHero 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards', delay: '0s' },
    card: { animation: 'boldCard 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards', stagger: '0.12s' },
    stat: { animation: 'boldStat 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards', stagger: '0.1s' },
    button: { hover: 'scale(1.03) translateY(-2px)', tap: 'scale(0.97)' },
    css: `
      @keyframes boldHero { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes boldCard { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes boldStat { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `
  }
};

const features = [
  { icon: '⚡', title: 'Live Scores', desc: 'Real-time match updates' },
  { icon: '📺', title: 'HD Streaming', desc: 'Watch in high definition' },
  { icon: '🎯', title: 'Multi-Sports', desc: 'Football, basketball, tennis & more' }
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '500+', label: 'Live Matches' },
  { value: '50+', label: 'Sports' },
  { value: '24/7', label: 'Support' }
];

function AnimationDemo() {
  const navigate = useNavigate();
  const [selectedStyle, setSelectedStyle] = useState('subtle');
  const [showDetails, setShowDetails] = useState({});

  const currentStyle = animationStyles[selectedStyle];

  const toggleDetails = (section) => {
    setShowDetails(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      <style>{currentStyle.css}</style>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f1a 100%)',
        color: '#fff',
        fontFamily: "'League Spartan', sans-serif",
        paddingBottom: '60px'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            <span style={{ color: '#6B21A8' }}>Sporkey</span> Animation Demo
          </h1>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.9rem'
            }}
          >
            ← Back to Home
          </button>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          
          {/* Style Selector */}
          <div style={{ marginBottom: '50px', animation: 'fadeIn 0.5s ease-out 0.1s backwards' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.3rem', color: 'rgba(255,255,255,0.8)' }}>
              Choose Animation Style
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              {Object.entries(animationStyles).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => setSelectedStyle(key)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  style={{
                    background: selectedStyle === key 
                      ? 'linear-gradient(135deg, #6B21A8, #9333EA)' 
                      : 'rgba(255,255,255,0.05)',
                    border: selectedStyle === key 
                      ? '2px solid #9333EA' 
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    color: '#fff',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>
                    {style.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hero Section */}
          <section style={{ marginBottom: '60px', position: 'relative' }}>
            <div 
              onClick={() => toggleDetails('hero')}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Hero Section</h2>
              <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                {showDetails.hero ? '▼' : '▶'} Click to {showDetails.hero ? 'hide' : 'show'} details
              </span>
            </div>
            
            {showDetails.hero && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ animation: currentStyle.hero.animation, delay: currentStyle.hero.delay }, null, 2)}
                </pre>
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, rgba(26,26,46,0.9), rgba(22,33,62,0.9))',
              borderRadius: '20px',
              padding: '60px 40px',
              textAlign: 'center',
              border: '1px solid rgba(107,33,168,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              animation: currentStyle.hero.animation,
              animationDelay: currentStyle.hero.delay
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', display: 'inline-block' }}>
                ⚽
              </div>
              <h1 style={{ 
                fontSize: '3rem', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #fff, #9333EA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700
              }}>
                Watch Live Sports
              </h1>
              <p style={{ 
                fontSize: '1.2rem', 
                opacity: 0.7, 
                marginBottom: '30px',
                maxWidth: '500px',
                margin: '0 auto 30px'
              }}>
                Experience the thrill of live sports streaming in HD quality
              </p>
              <button
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none',
                  color: '#fff',
                  padding: '16px 40px',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 10px 30px rgba(249,115,22,0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = currentStyle.button.hover}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onMouseDown={(e) => e.target.style.transform = currentStyle.button.tap}
                onMouseUp={(e) => e.target.style.transform = currentStyle.button.hover}
              >
                Start Watching Now
              </button>
            </div>
          </section>

          {/* Feature Cards */}
          <section style={{ marginBottom: '60px' }}>
            <div 
              onClick={() => toggleDetails('cards')}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Feature Cards</h2>
              <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                {showDetails.cards ? '▼' : '▶'} Click to {showDetails.cards ? 'hide' : 'show'} details
              </span>
            </div>

            {showDetails.cards && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ animation: currentStyle.card.animation, stagger: currentStyle.card.stagger }, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '24px' 
            }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(26,26,46,0.8), rgba(22,33,62,0.8))',
                    borderRadius: '16px',
                    padding: '30px',
                    border: '1px solid rgba(107,33,168,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    animation: currentStyle.card.animation,
                    animationDelay: `${index * parseFloat(currentStyle.card.stagger)}s`,
                    opacity: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(107,33,168,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                    {feature.icon}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', fontWeight: 600 }}>
                    {feature.title}
                  </h3>
                  <p style={{ opacity: 0.7, fontSize: '0.95rem', margin: 0 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Stats Section */}
          <section style={{ marginBottom: '60px' }}>
            <div 
              onClick={() => toggleDetails('stats')}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Stats Section</h2>
              <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                {showDetails.stats ? '▼' : '▶'} Click to {showDetails.stats ? 'hide' : 'show'} details
              </span>
            </div>

            {showDetails.stats && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ animation: currentStyle.stat.animation, stagger: currentStyle.stat.stagger }, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '20px' 
            }}>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(107,33,168,0.15)',
                    borderRadius: '16px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    border: '1px solid rgba(107,33,168,0.3)',
                    transition: 'all 0.3s ease',
                    animation: currentStyle.stat.animation,
                    animationDelay: `${index * parseFloat(currentStyle.stat.stagger)}s`,
                    opacity: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    color: '#9333EA',
                    marginBottom: '8px'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: '0.95rem' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Button */}
          <section style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div 
              onClick={() => toggleDetails('cta')}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                cursor: 'pointer',
                maxWidth: '600px',
                margin: '0 auto 20px'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>CTA Button</h2>
              <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                {showDetails.cta ? '▼' : '▶'}
              </span>
            </div>

            {showDetails.cta && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                maxWidth: '600px',
                margin: '0 auto 20px'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{JSON.stringify(currentStyle.button, null, 2)}
                </pre>
              </div>
            )}

            <button
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none',
                color: '#fff',
                padding: '18px 50px',
                borderRadius: '14px',
                fontSize: '1.2rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 15px 40px rgba(249,115,22,0.4)',
                marginRight: '12px',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = currentStyle.button.hover}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.target.style.transform = currentStyle.button.tap}
              onMouseUp={(e) => e.target.style.transform = currentStyle.button.hover}
            >
              Get Started Free
            </button>

            <button
              style={{
                background: 'transparent',
                border: '2px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '16px 40px',
                borderRadius: '14px',
                fontSize: '1.1rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginRight: '12px',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Learn More
            </button>
          </section>

          {/* Summary */}
          <div
            style={{
              background: 'rgba(107,33,168,0.1)',
              borderRadius: '16px',
              padding: '30px',
              border: '1px solid rgba(107,33,168,0.3)',
              animation: 'fadeIn 0.5s ease-out 0.5s backwards'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              Current Style: <span style={{ color: '#9333EA' }}>{currentStyle.name}</span>
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '16px' }}>
              {currentStyle.description}
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px',
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}>
              <div><strong>Hero:</strong> {currentStyle.hero.animation.split(' ')[0]}</div>
              <div><strong>Cards:</strong> {currentStyle.card.animation.split(' ')[0]}</div>
              <div><strong>Stats:</strong> {currentStyle.stat.animation.split(' ')[0]}</div>
              <div><strong>Button:</strong> {currentStyle.button.hover}</div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default AnimationDemo;
