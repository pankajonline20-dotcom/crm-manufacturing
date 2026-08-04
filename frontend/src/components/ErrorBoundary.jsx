import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Arial' }}>
          <h1 style={{ color: '#EF4444', fontSize: 24 }}>❌ Error</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 10 }}>
            {this.state.error?.message || 'Something went wrong'}
          </p>
          <p style={{ color: '#999', fontSize: 12, marginTop: 20, maxWidth: 600, margin: '20px auto' }}>
            <strong>Details:</strong> {this.state.error?.toString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
