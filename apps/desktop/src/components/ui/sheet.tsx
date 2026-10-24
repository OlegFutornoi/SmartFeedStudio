import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptionalSidebar } from '@/contexts/SidebarContext';

function SheetSidebarAutoCollapse({ active }: { active: boolean }) {
  const sidebar = useOptionalSidebar();
  React.useEffect(() => {
    if (active) {
      sidebar?.collapseSidebar();
    }
  }, [active, sidebar]);
  return null;
}

const Sheet = DialogPrimitive.Root;

const SheetTrigger = DialogPrimitive.Trigger;

const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  hideOverlay?: boolean;
  hideCloseButton?: boolean;
  overlayClassName?: string;
}

// Global tracker for active dropdown interactions (captured before any unmounts)
let lastDropdownInteractionTime = 0;

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    () => {
      const isAnyDropdownOpen = Boolean(
        document.querySelector(
          '[role="listbox"], [role="menu"], [data-radix-select-viewport], [data-radix-popper-content-wrapper], [data-radix-popover-content]',
        ),
      );
      if (isAnyDropdownOpen) {
        lastDropdownInteractionTime = Date.now();
      }
    },
    { capture: true },
  );
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      side = 'right',
      hideOverlay,
      hideCloseButton,
      overlayClassName,
      className,
      children,
      onPointerDownOutside,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    const isShieldedEvent = (event: unknown): boolean => {
      // 1. If any dropdown/select was open when this interaction started (< 800ms ago)
      if (Date.now() - lastDropdownInteractionTime < 800) {
        return true;
      }

      const customEvent = event as
        { detail?: { originalEvent?: PointerEvent | MouseEvent } } | undefined;
      const origEvent = customEvent?.detail?.originalEvent;

      // 2. Geometric check: if click coordinates fall inside this sheet window
      if (
        origEvent &&
        typeof origEvent.clientX === 'number' &&
        typeof origEvent.clientY === 'number' &&
        contentRef.current
      ) {
        const rect = contentRef.current.getBoundingClientRect();
        if (
          origEvent.clientX >= rect.left &&
          origEvent.clientX <= rect.right &&
          origEvent.clientY >= rect.top &&
          origEvent.clientY <= rect.bottom
        ) {
          return true;
        }
      }

      // 3. Target / portal check
      const eventTarget = (event as { target?: EventTarget } | undefined)?.target;
      const origTarget = (origEvent?.target || eventTarget) as HTMLElement | null;

      if (
        origTarget?.closest?.(
          '[data-radix-popper-content-wrapper], [role="listbox"], [role="menu"], [role="dialog"], [data-radix-select-viewport], [data-radix-popover-content]',
        ) ||
        (contentRef.current && origTarget && contentRef.current.contains(origTarget))
      ) {
        return true;
      }

      // 4. Live DOM check for any active listbox/menu
      const hasOpenDropdown = Boolean(
        document.querySelector(
          '[role="listbox"]:not([data-state="closed"]), [role="menu"]:not([data-state="closed"]), [data-radix-popover-content]:not([data-state="closed"])',
        ),
      );
      return hasOpenDropdown;
    };

    const handlePointerDownOutside: typeof onPointerDownOutside = (event) => {
      if (isShieldedEvent(event)) {
        event.preventDefault();
        return;
      }
      onPointerDownOutside?.(event);
    };

    const handleInteractOutside: typeof onInteractOutside = (event) => {
      if (isShieldedEvent(event)) {
        event.preventDefault();
        return;
      }
      onInteractOutside?.(event);
    };

    const sideClasses = {
      top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
      bottom:
        'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
      right:
        'inset-y-0 right-0 h-full w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
    };

    React.useEffect(() => {
      return () => {
        // Failsafe cleanup for Radix pointer-events leak
        requestAnimationFrame(() => {
          const openDialogs = document.querySelectorAll('[role="dialog"]');
          if (openDialogs.length === 0) {
            document.body.style.pointerEvents = '';
            document.body.removeAttribute('data-scroll-locked');
          }
        });
      };
    }, []);

    return (
      <SheetPortal>
        {!hideOverlay && <SheetOverlay className={overlayClassName} />}
        <DialogPrimitive.Content
          ref={(node) => {
            contentRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={cn(
            'fixed z-50 gap-4 bg-background p-0 shadow-2xl transition ease-in-out duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out flex flex-col outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0',
            sideClasses[side],
            className,
          )}
          onPointerDownOutside={handlePointerDownOutside}
          onInteractOutside={handleInteractOutside}
          {...props}
        >
          <SheetSidebarAutoCollapse active={side !== 'left'} />
          {children}
          {!hideCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-left p-6 pb-2', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-row items-center justify-between p-4 border-t border-border/80 bg-muted/20 mt-auto',
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground tracking-tight', className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-xs text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
