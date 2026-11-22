import Link from 'next/link';
import type { ComponentProps } from 'react';
import { buttonVariants, type ButtonVariant, type ButtonSize } from './button';
import { cn } from '@/lib/utils';

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
