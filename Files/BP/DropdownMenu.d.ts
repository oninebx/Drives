import * as PrimitiveMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { ButtonProps } from '../Button/Button';
export declare const Container: React.FC<PrimitiveMenu.DropdownMenuProps>;
export declare const Trigger: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export declare const Item: import("@emotion/styled").StyledComponent<PrimitiveMenu.DropdownMenuItemProps & React.RefAttributes<HTMLDivElement> & {
    theme?: import("@emotion/react").Theme;
}, {}, {}>;
export declare const Content: import("@emotion/styled").StyledComponent<PrimitiveMenu.DropdownMenuContentProps & {
    theme?: import("@emotion/react").Theme;
}, {}, {}>;
export declare const Divider: import("@emotion/styled").StyledComponent<PrimitiveMenu.DropdownMenuSeparatorProps & React.RefAttributes<HTMLDivElement> & {
    theme?: import("@emotion/react").Theme;
}, {}, {}>;
