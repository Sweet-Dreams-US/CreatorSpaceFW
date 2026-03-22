"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/app/actions/tracking";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Auto-report the error
    const page =
      typeof window !== "undefined" ? window.location.pathname : "unknown";
    reportError(page, error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReport = () => {
    if (!this.state.error) return;
    const page =
      typeof window !== "undefined" ? window.location.pathname : "unknown";
    reportError(page, this.state.error.message, {
      stack: this.state.error.stack,
      userTriggered: true,
    });
    this.setState({ reported: true });
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, reported: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
          <div className="w-full max-w-md text-center">
            {/* Error icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#fa9277]/20 bg-[#fa9277]/5">
              <span className="text-3xl text-[#fa9277]">!</span>
            </div>

            <h1
              className="mt-8 text-3xl text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Something went wrong
            </h1>

            <p
              className="mt-3 text-sm leading-relaxed text-[#c4c4c4]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              An unexpected error occurred. The error has been automatically
              reported.
            </p>

            {this.state.error && (
              <div className="mt-6 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a]/50 px-4 py-3 text-left">
                <p
                  className="text-xs text-[#fa9277]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-3">
              <a
                href="/"
                className="rounded-lg border border-[#2a2a2a] bg-transparent px-5 py-2.5 text-sm text-[#c4c4c4] transition-all hover:border-[#c4c4c4]/30 hover:text-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Go back home
              </a>

              <button
                onClick={this.handleRetry}
                className="rounded-lg border border-[#fa9277]/30 bg-[#fa9277]/10 px-5 py-2.5 text-sm text-[#fa9277] transition-all hover:bg-[#fa9277]/20"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Try again
              </button>
            </div>

            {!this.state.reported ? (
              <button
                onClick={this.handleReport}
                className="mt-4 text-xs text-[#c4c4c4]/60 underline decoration-dotted underline-offset-4 transition-colors hover:text-[#c4c4c4]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Report this error
              </button>
            ) : (
              <p
                className="mt-4 text-xs text-[#9dfa77]/60"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Error reported — thank you
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
