"use client";

import { Button, type ButtonVariant } from "@/components/admin/ui/button";

/** Submit button that asks for confirmation before letting the form submit through. */
export function ConfirmSubmit({
  confirmMessage,
  variant = "danger",
  className,
  children,
}: {
  confirmMessage: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
