import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn("KrishiSense render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          onClick={() => this.setState({ hasError: false })}
          style={{
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 40 }}>🌿</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#123C2C" }}>
            Something went wrong.
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#FFFFFF",
              background: "#22A05D",
              padding: "10px 24px",
              borderRadius: 99,
              fontWeight: 700,
            }}
          >
            Tap to retry
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
