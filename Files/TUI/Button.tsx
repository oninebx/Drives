import styled from '@emotion/styled';
import { Slot, Slottable } from '@radix-ui/react-slot';
import React from 'react';
import { useRipple } from '../../decorators/Ripple/hooks';
import * as Ripple from '../../decorators/Ripple/Ripple';
import type { ColorVariant } from '../../foundations';
import * as styles from './styles';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'floating';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  tint?: ColorVariant;
  rippleDuration?: number;
  asChild?: boolean;
}

const ButtonComponent = React.forwardRef(
  (
    {
      rippleDuration = 1000,
      onKeyDown,
      onPointerDown,
      asChild,
      children,
      variant,
      tint,
      disabled,
      ...props
    }: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    const Component = asChild ? Slot : 'button';
    const { container, animate } = useRipple({ duration: rippleDuration });

    if (rippleDuration < 1) {
      return (
        <Component
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          disabled={disabled}
          aria-disabled={disabled}
          {...props}
          ref={ref}
        >
          {children}
        </Component>
      );
    }

    if (!asChild) {
      return (
        <Ripple.Wrapper
          duration={rippleDuration}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          ref={ref}
        >
          <Component {...props} disabled={disabled} aria-disabled={disabled}>
            <Slottable>{children}</Slottable>
          </Component>
        </Ripple.Wrapper>
      );
    }

    return (
      <Component
        {...props}
        onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
          if (onKeyDown) onKeyDown(e);

          const onSpace = e.code === 'Space' || e.key === ' ';

          if (!e.repeat && onSpace) {
            animate();
          }
        }}
        onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => {
          if (onPointerDown) onPointerDown(e);

          animate(e.clientY, e.clientX);
        }}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
      >
        <Slottable>{children}</Slottable>
        <Ripple.Container {...container} />
      </Component>
    );
  }
);

export const Button = styled(ButtonComponent)`
  ${({ theme }) => styles.button(theme)};

  ${({ variant, theme, tint }) =>
    variant === 'primary' && styles.primary(theme, tint)};
  ${({ variant, theme, tint }) =>
    variant === 'secondary' && styles.secondary(theme, tint)};
  ${({ variant, theme, tint }) =>
    variant === 'tertiary' && styles.tertiary(theme, tint)};
  ${({ variant, theme }) => variant === 'floating' && styles.floating(theme)};
`;
