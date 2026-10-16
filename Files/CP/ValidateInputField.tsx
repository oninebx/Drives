import styled from "@emotion/styled";
import { Input } from "@tower/tui";
import React, { forwardRef } from "react";
import type { ChangeEventHandler, InputHTMLAttributes } from "react";
import { FieldFlexbox, InputContainer, ValidateButton } from "./ValidateInputPanel.styled";

interface ValidateInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  supportingText: string;
  value: string | number | readonly string[] | undefined;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

const Label = styled(Input.Label)`
  color: ${({ theme }) => theme.color.neutral900Default};
`;

const ValidateInputField = forwardRef<HTMLInputElement, ValidateInputFieldProps>(({
  label,
  supportingText,
  value,
  onChange,
  ...rest }, ref) => {

  return (
    <Input.Root
      onChange={onChange}
      value={value}
    >
      <Label variant='small'>{label}
        <FieldFlexbox>
          <Input.Field ref={ref}  {...rest} disabled={!enabled} />
          <ValidateButton variant="secondary" disabled={!enabled}>Validate</ValidateButton>
        </FieldFlexbox>
      </Label>
      <InputContainer>
        <Input.SupportingText>{supportingText}</Input.SupportingText>
      </InputContainer>

    </Input.Root>
  );
});
ValidateInputField.displayName = "ValidateInputField";

export default ValidateInputField;
