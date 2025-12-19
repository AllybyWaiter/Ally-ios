interface Props {
  missingRequired: { key: string; description: string }[];
  missingRecommended: { key: string; description: string }[];
}

// Uses inline styles only to ensure rendering even if CSS fails to load
export function EnvErrorScreen({ missingRequired, missingRecommended }: Props) {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '1rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '32rem',
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  };

  const iconStyle: React.CSSProperties = {
    width: '2.5rem',
    height: '2.5rem',
    backgroundColor: '#dc2626',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  };

  const titleStyle: React.CSSProperties = {
    color: '#f8fafc',
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  };

  const labelStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  };

  const listStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const listItemStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    marginBottom: '0.5rem',
  };

  const keyStyle: React.CSSProperties = {
    color: '#f8fafc',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  const descStyle: React.CSSProperties = {
    color: '#64748b',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  };

  const warningLabelStyle: React.CSSProperties = {
    ...labelStyle,
    color: '#f59e0b',
  };

  const instructionsStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginTop: '1.5rem',
  };

  const instructionsTitleStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  };

  const instructionsTextStyle: React.CSSProperties = {
    color: '#64748b',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    margin: 0,
  };

  const codeStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#94a3b8',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>!</div>
          <h1 style={titleStyle}>Configuration Error</h1>
        </div>

        <p style={subtitleStyle}>
          The application cannot start because required environment variables are missing.
        </p>

        {missingRequired.length > 0 && (
          <div style={sectionStyle}>
            <div style={labelStyle}>Missing Required Variables</div>
            <ul style={listStyle}>
              {missingRequired.map(({ key, description }) => (
                <li key={key} style={listItemStyle}>
                  <div style={keyStyle}>{key}</div>
                  <div style={descStyle}>{description}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingRecommended.length > 0 && (
          <div style={sectionStyle}>
            <div style={warningLabelStyle}>Missing Recommended Variables</div>
            <ul style={listStyle}>
              {missingRecommended.map(({ key, description }) => (
                <li key={key} style={listItemStyle}>
                  <div style={keyStyle}>{key}</div>
                  <div style={descStyle}>{description}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {import.meta.env.DEV && (
          <div style={instructionsStyle}>
            <div style={instructionsTitleStyle}>How to fix</div>
            <p style={instructionsTextStyle}>
              Add the missing variables to your <code style={codeStyle}>.env</code> file in the
              project root. Required variables must be set for the app to function.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
