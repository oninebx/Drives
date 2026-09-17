import React from 'react';

const EMOTION_STATIC_PROPERTIES = [
  '__emotion_base',
  '__emotion_styles',
  '__emotion_forwardProp',
  'withComponent'
] as const;

export const withTuiClass = <ComponentType extends React.ElementType>(
  Component: ComponentType
): ComponentType => {
  const TuiComponent = React.forwardRef<
    React.ElementRef<ComponentType>,
    React.ComponentPropsWithRef<ComponentType>
  >(({ className, ...props }, ref) =>
    React.createElement(Component, {
      ...props,
      ref,
      className: `tui ${className ? ` ${className}` : ''}`
    })
  );

  TuiComponent.displayName =
    typeof Component === 'string' ? Component : Component.displayName;
  TuiComponent.toString = Component.toString.bind(Component);

  const ComponentObject = Object(Component);

  EMOTION_STATIC_PROPERTIES.forEach((property) => {
    if (property in ComponentObject) {
      Object.defineProperty(
        TuiComponent,
        property,
        Object.getOwnPropertyDescriptor(ComponentObject, property)!
      );
    }
  });

  return TuiComponent as unknown as ComponentType;
};
