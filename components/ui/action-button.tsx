import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button"; // your shadcn button
import { cn } from "@/lib/utils";
import {
  Loader2,
  TriangleAlert,
  Check,
  Plus,
  type LucideIcon,
} from "lucide-react";

type ActionState = "ready" | "loading" | "failed" | "succeeded";

type ActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick"
> & {
  state?: ActionState;
  defaultState?: ActionState;
  onAction?: () => Promise<unknown> | unknown;

  // Labels
  label?: React.ReactNode; // shown in "ready"
  loadingLabel?: React.ReactNode;
  failedLabel?: React.ReactNode;
  succeededLabel?: React.ReactNode;

  // Icons (override defaults if desired)
  readyIcon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  failedIcon?: React.ReactNode;
  succeededIcon?: React.ReactNode;

  // Disable while not ready
  disableWhileBusy?: boolean;

  // After success/failure, return to ready state after N ms (if controlled via defaultState/onAction)
  autoResetAfter?: number;

  // If you still want to receive click events
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

/**
 * ActionButton wraps shadcn Button and renders a unified UI across states:
 * ready | loading | failed | succeeded.
 *
 * You can control `state` externally (controlled) OR
 * provide `onAction` and let the component manage transient states (semi-controlled).
 */
export function ActionButton(props: ActionButtonProps) {
  const {
  // default to gradient variant for strong visual CTA unless caller overrides
  variant = "gradient",
    state: controlledState,
    defaultState = "ready",
    onAction,
    label = (
      <>
        <Plus />
        <span>Action</span>
      </>
    ),
    loadingLabel = (
      <>
        <Loader2 className="animate-spin" />
        <span>Working...</span>
      </>
    ),
    failedLabel = (
      <>
        <TriangleAlert />
        <span>Failed</span>
      </>
    ),
    succeededLabel = (
      <>
        <Check />
        <span>Done</span>
      </>
    ),
    readyIcon,
    loadingIcon,
    failedIcon,
    succeededIcon,

    disableWhileBusy = true,
    autoResetAfter = 0,

    onClick,
    className,
  ...buttonProps
  } = props;

  const isControlled = controlledState !== undefined;

  const [internalState, setInternalState] = React.useState<ActionState>(
    defaultState
  );

  const currentState = isControlled ? controlledState! : internalState;

  // Handle auto-reset from success/failure back to ready
  React.useEffect(() => {
    if (!isControlled && autoResetAfter > 0) {
      if (currentState === "succeeded" || currentState === "failed") {
        const t = setTimeout(() => setInternalState("ready"), autoResetAfter);
        return () => clearTimeout(t);
      }
    }
    return;
  }, [currentState, autoResetAfter, isControlled]);

  const busy = currentState === "loading";
  const disableButton = disableWhileBusy && busy;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> =
    async (e) => {
      onClick?.(e);
      if (e.defaultPrevented) return;

      if (onAction) {
        if (!isControlled) setInternalState("loading");
        try {
          await onAction();
          if (!isControlled) setInternalState("succeeded");
        } catch {
          if (!isControlled) setInternalState("failed");
        }
      }
    };

  let content: React.ReactNode;

  switch (currentState) {
    case "loading":
      content = loadingIcon ? (
        <>
          {loadingIcon}
          {loadingLabel}
        </>
      ) : (
        loadingLabel
      );
      break;
    case "failed":
      content = failedIcon ? (
        <>
          {failedIcon}
          {failedLabel}
        </>
      ) : (
        failedLabel
      );
      break;
    case "succeeded":
      content = succeededIcon ? (
        <>
          {succeededIcon}
          {succeededLabel}
        </>
      ) : (
        succeededLabel
      );
      break;
    case "ready":
    default:
      content = readyIcon ? (
        <>
          {readyIcon}
          {label}
        </>
      ) : (
        label
      );
      break;
  }

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
  variant={variant as any}
      className={cn("gap-2", className)}
      disabled={disableButton || buttonProps.disabled}
      aria-busy={busy || undefined}
      aria-invalid={currentState === "failed" ? true : undefined}
      data-state={currentState}
    >
      {content}
    </Button>
  );
}