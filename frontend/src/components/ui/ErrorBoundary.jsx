import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./Button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Rendering Exception caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
          <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            System Interface Error
          </h1>
          <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
            A critical UI rendering exception occurred. Your data is safe, but
            the interface needs to be reloaded.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="gap-2 shadow-lg"
          >
            <RefreshCcw className="h-4 w-4" /> Reload Workspace
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
