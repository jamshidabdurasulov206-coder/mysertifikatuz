import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
          background: '#f8f9fa',
          padding: '20px'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>😵</h1>
          <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Xatolik yuz berdi</h2>
          <p style={{ color: '#6c757d', marginBottom: '20px', textAlign: 'center' }}>
            Sahifada kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta yuklang.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Sahifani qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
