import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Check if this is a React hooks/module error that might be caused by stale cache
function isHookOrModuleError(error: Error | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('invalid hook call') ||
    message.includes('hooks can only be called') ||
    message.includes('cannot read properties of null') ||
    message.includes('useeffect') ||
    message.includes('usestate') ||
    message.includes('usecontext') ||
    message.includes('multiple copies of react') ||
    message.includes('module') && message.includes('undefined')
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardRefresh = () => {
    // Clear service worker caches and reload
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
    }
    
    // Also clear any browser caches we can
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    
    // Force reload bypassing cache
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  private handleFullReset = () => {
    // Unregister service worker completely
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    
    // Clear localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    
    // Hard reload
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isHookError = isHookOrModuleError(this.state.error);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="glass-card p-8 rounded-2xl max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neon-red/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-neon-red" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">
              {isHookError ? "React Module Error" : "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            
            {isHookError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                <p className="font-medium mb-1">This may be caused by cached files.</p>
                <p>Try clearing the cache using the buttons below.</p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button
                variant="neon"
                onClick={this.handleRetry}
                className="gap-2 w-full"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              {isHookError && (
                <>
                  <Button
                    variant="outline"
                    onClick={this.handleHardRefresh}
                    className="gap-2 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Cache & Reload
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.handleFullReset}
                    className="gap-2 text-xs text-muted-foreground"
                  >
                    Full Reset (clears all data)
                  </Button>
                </>
              )}
            </div>
            
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="text-left text-xs text-muted-foreground mt-4">
                <summary className="cursor-pointer hover:text-foreground">
                  Stack trace (dev only)
                </summary>
                <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto max-h-48 text-[10px]">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
