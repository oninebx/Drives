import React from 'react';

import {
  DropDownContainer,
  DropDownContent,
  DropDownIcon,
  DropDownList,
  DropDowntrigger,
  ReasonLabel,
  SelectedValue
} from './EditPolicy.styles';
import { useTranslation } from 'react-i18next';
import { DropdownMenu } from '@tower/tui';

export interface EditPolicyDropDownProps {
  value?: string;
  onChange: (v: string) => void;
}

export const EditPolicyDropDown = (props: EditPolicyDropDownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const hasValue = Boolean(props.value && props.value?.trim());
  const selectLabel = hasValue ? props.value : t('portal:editCurrentPolicyHolder.dropDownComponent.pleaseSelect');
  const Reasons = t('portal:editCurrentPolicyHolder.dropDownComponent.reasons', {
    returnObjects: true
  }) as string[];
  return (
    <div>
      <DropdownMenu.Container>
        <DropdownMenu.Trigger variant="secondary">Open Menu</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {Reasons.map((reason) => (
            <DropdownMenu.Item key={reason}>{reason}</DropdownMenu.Item>
          ))}
          <DropdownMenu.Item key={Reasons[0]}>{Reasons[0]}</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Container>
      <ReasonLabel>{t('portal:editCurrentPolicyHolder.dropDownComponent.reasonTitle')}</ReasonLabel>
      <div>{props.value}</div>
      <DropDownContainer modal={false} open={isOpen} onOpenChange={setIsOpen}>
        <DropDowntrigger variant="secondary" $isOpen={isOpen}>
          <SelectedValue hasValue={hasValue}>{selectLabel}</SelectedValue>
          <DropDownIcon aria-hidden $isFlipped={isOpen} />
        </DropDowntrigger>
        <DropDownContent align="start" side="bottom">
          {Reasons.map((reason) => (
            <DropDownList
              key={reason}
              asChild
              onSelect={(e) => {
                e.preventDefault();
                props.onChange(reason);
                setIsOpen(false);
              }}>
              <div>{reason}</div>
            </DropDownList>
          ))}
        </DropDownContent>
      </DropDownContainer>
    </div>
  );
};
