import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMenuOpen(false); // Close menu when switching to desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && isMobile) {
        const target = event.target as Element;
        if (!target.closest('header')) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, isMobile]);

  return (
    <header style={{ 
      backgroundColor: '#002e3c', 
      color: 'white',
      position: 'relative',
      zIndex: 1000
    }}>
      <div style={{ 
        maxWidth: '1440px', 
        margin: '0 auto', 
        padding: isMobile ? '0.5rem 1rem' : '1rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Left side - Logo and Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              {/* Logo - Bigger */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <a href="#" style={{ display: 'block' }}>
                  <img
                    src="/templates/commerzbank/images/commerzbank.svg"
                    alt="Commerzbank Logo"
                    style={{ height: '3rem' }}
                  />
                </a>
              </div>

              {/* Navigation - Next to logo with more font-weight */}
              <nav style={{ 
                display: 'flex', 
                gap: '2.5rem', 
                alignItems: 'center'
              }}>
                <a href="#" style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  fontFamily: 'Gotham, Arial, sans-serif',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >Privatkunden</a>
                <a href="#" style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  fontFamily: 'Gotham, Arial, sans-serif',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >Unternehmerkunden</a>
                <a href="#" style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  fontFamily: 'Gotham, Arial, sans-serif',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >Wealth Management</a>
                <a href="#" style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  fontFamily: 'Gotham, Arial, sans-serif',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >Firmenkunden</a>
              </nav>
            </div>

            {/* Right side - EN and Search at the complete end */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <a href="#" style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontSize: '0.9rem', 
                fontWeight: '600',
                fontFamily: 'Gotham, Arial, sans-serif',
                transition: 'all 0.3s ease',
                transform: 'translateY(0px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >EN</a>
              <button style={{ 
                color: 'white', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem',
                transform: 'translateY(0px)',
                fontSize: '0.9rem',
                fontWeight: '600',
                fontFamily: 'Gotham, Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <span style={{ 
                  position: 'absolute', 
                  width: '1px', 
                  height: '1px', 
                  padding: '0', 
                  margin: '-1px', 
                  overflow: 'hidden', 
                  clip: 'rect(0, 0, 0, 0)', 
                  whiteSpace: 'nowrap', 
                  border: '0' 
                }}>Suche</span>
                <svg fill="currentColor" width="24px" height="24px" focusable="false" role="" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M17.41 14h-2.17A8 8 0 1 0 14 15.24v2.17l6 6L23.41 20ZM9 15a6 6 0 1 1 6-6 6 6 0 0 1-6 6Zm7 1.59V16h.59l4 4-.59.59Z"></path>
                </svg>
                <span>Suche</span>
              </button>
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <a href="#" style={{ display: 'block' }}>
                <img
                  src="/images/commerzbank.svg"
                  alt="Commerzbank Logo"
                  style={{ height: '1.5rem' }}
                />
              </a>
            </div>

            {/* Mobile Right Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Search Button */}
              <button style={{ 
                color: 'white', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ 
                  position: 'absolute', 
                  width: '1px', 
                  height: '1px', 
                  padding: '0', 
                  margin: '-1px', 
                  overflow: 'hidden', 
                  clip: 'rect(0, 0, 0, 0)', 
                  whiteSpace: 'nowrap', 
                  border: '0' 
                }}>Suche</span>
                <svg fill="currentColor" width="20px" height="20px" focusable="false" role="" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M17.41 14h-2.17A8 8 0 1 0 14 15.24v2.17l6 6L23.41 20ZM9 15a6 6 0 1 1 6-6 6 6 0 0 1-6 6Zm7 1.59V16h.59l4 4-.59.59Z"></path>
                </svg>
              </button>

              {/* Hamburger Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ 
                  color: 'white', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}
              >
                <span style={{ 
                  position: 'absolute', 
                  width: '1px', 
                  height: '1px', 
                  padding: '0', 
                  margin: '-1px', 
                  overflow: 'hidden', 
                  clip: 'rect(0, 0, 0, 0)', 
                  whiteSpace: 'nowrap', 
                  border: '0' 
                }}>Menu</span>
                <div style={{
                  width: '20px',
                  height: '2px',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
                }}></div>
                <div style={{
                  width: '20px',
                  height: '2px',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  opacity: isMenuOpen ? '0' : '1'
                }}></div>
                <div style={{
                  width: '20px',
                  height: '2px',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
                }}></div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu Backdrop and Dropdown */}
      {isMobile && isMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="mobile-menu-backdrop"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Mobile menu */}
          <div className="mobile-menu">
            <nav>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); }}>
                Privatkunden
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); }}>
                Unternehmerkunden
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); }}>
                Wealth Management
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); }}>
                Firmenkunden
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); }}>
                EN
              </a>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;