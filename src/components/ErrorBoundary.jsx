import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // TODO: send to Sentry when wired up
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-inner">
            <p className="error-boundary-emoji">🫙</p>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-text">
              Larder ran into an unexpected error. Reload to try again.
            </p>
            {this.state.error?.message && (
              <p className="error-boundary-detail">{this.state.error.message}</p>
            )}
            <button onClick={this.handleReload} className="btn btn-primary btn-lg">
              Reload Larder
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
