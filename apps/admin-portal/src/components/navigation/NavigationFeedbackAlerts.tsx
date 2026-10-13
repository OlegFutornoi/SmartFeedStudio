import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface NavigationFeedbackAlertsProps {
  successMessage: string | null;
  error: string | null;
}

export const NavigationFeedbackAlerts: React.FC<NavigationFeedbackAlertsProps> = ({
  successMessage,
  error,
}) => {
  return (
    <>
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-medium animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div
          data-testid="error-alert"
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-medium animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
};
