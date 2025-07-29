import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MapErrorBoundaryProps {
  children: React.ReactNode;
  onTokenError?: () => void;
}

const ErrorFallback = ({
  error,
  onTokenError,
}: {
  error: Error;
  onTokenError?: () => void;
}) => {
  const isTokenError =
    error?.message?.toLowerCase().includes("unauthorized") ||
    error?.message?.toLowerCase().includes("401") ||
    error?.message?.toLowerCase().includes("access token");

  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Map Loading Error</AlertTitle>
        <AlertDescription className="mt-2">
          {isTokenError ? (
            <>
              <p>
                Failed to load the map. This might be due to an invalid access
                token.
              </p>
              <Button
                onClick={onTokenError}
                className="hover:cursor-pointer mt-4"
                variant="outline"
              >
                Update Access Token
              </Button>
            </>
          ) : (
            <p>
              An error occurred while loading the map. Please refresh the page.
            </p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

const MapErrorBoundary: React.FC<MapErrorBoundaryProps> = ({
  children,
  onTokenError,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} onTokenError={onTokenError} />
      )}
      onError={(error, errorInfo) => {
        console.error("Map error caught by boundary:", error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default MapErrorBoundary;
