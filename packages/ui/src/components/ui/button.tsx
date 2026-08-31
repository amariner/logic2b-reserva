import * as React from 'react';
import { Root as Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'logic-button',
  {
    variants: {
      variant: {
        default: 'logic-button--default',
        destructive: 'logic-button--destructive',
        outline: 'logic-button--outline',
        secondary: 'logic-button--secondary',
        ghost: 'logic-button--ghost',
        link: 'logic-button--link',
      },
      size: {
        default: 'logic-button--size-default',
        sm: 'logic-button--size-sm',
        lg: 'logic-button--size-lg',
        icon: 'logic-button--size-icon',
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
