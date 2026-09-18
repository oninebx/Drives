import styled from '@emotion/styled';
import * as PrimitiveMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { Button, ButtonProps } from '../Button/Button';
import * as styles from './styles';

const ContentComponent = (props: PrimitiveMenu.DropdownMenuContentProps) => (
  <PrimitiveMenu.Portal>
    <PrimitiveMenu.Content {...props} />
  </PrimitiveMenu.Portal>
);

export const Container = PrimitiveMenu.Root;

export const Trigger = React.forwardRef(
  (props: ButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) => (
    <PrimitiveMenu.Trigger asChild>
      <Button {...props} ref={ref} />
    </PrimitiveMenu.Trigger>
  )
);

export const Item = styled(PrimitiveMenu.Item)`
  ${({ theme }) => styles.item(theme)};
`;

export const Content = styled(ContentComponent)`
  ${({ theme }) => styles.content(theme)};

  &[data-state='closed'] {
    ${Item} {
      pointer-events: none;
    }
  }
`;

export const Divider = styled(PrimitiveMenu.Separator)`
  ${({ theme }) => styles.divider(theme)};
`;
