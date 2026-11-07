import { Component } from 'react';
import ErrorFallback from './ErrorFallback';
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="m-auto max-w-xl p-8">
          <ErrorFallback error={this.state.error} onRetry={() => window.location.reload()} />
        </div>
      );
    return this.props.children;
  }
}
export default ErrorBoundary;
