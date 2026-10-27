import styled from "@emotion/styled";
import { Input } from "@tower/tui";
import React, { forwardRef } from "react";
import type { ChangeEventHandler, InputHTMLAttributes } from "react";
import { FieldFlexbox, InputContainer, ValidateButton } from "./MembershipValidation.styled";

interface ValidateInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  supportingText: string;
  value: string | number | readonly string[] | undefined;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onValidate?: () => void;
  buttonText: string;
  buttonEnabled: boolean;
  inputEnabled: boolean;
  icon?: React.ReactNode;
  errorText?: string;
}

const Label = styled(Input.Label)`
  &&&& {
    color: ${({ theme }) => theme.color.neutral900Default};
  }
`;

const hasValidValue = (value: string | number | readonly string[] | undefined): boolean => {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0 && value.some(v => hasValidValue(v));
  return false;
};

const ValidateInputField = forwardRef<HTMLInputElement, ValidateInputFieldProps>(({
  label,
  supportingText,
  value,
  onChange,
  onValidate,
  buttonText,
  buttonEnabled,
  inputEnabled,
  icon,
  errorText,
  ...rest }, ref) => {
  const enabled = hasValidValue(value) && buttonEnabled;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && enabled) {
      e.preventDefault();
      onValidate?.();
    }
  };
  return (
    <Input.Root
      onChange={onChange}
      value={value}
      tint={errorText ? 'error500Default': undefined}
    >
      <Label variant='small'>{label}
        <FieldFlexbox>
          <Input.Field ref={ref}  {...rest} readOnly={!inputEnabled} onKeyDown={handleKeyDown} />
          <ValidateButton variant="secondary" disabled={!enabled} onClick={onValidate} >{icon}{buttonText}</ValidateButton>
        </FieldFlexbox>
      </Label>
      <InputContainer>
        {supportingText && <Input.SupportingText>{supportingText}</Input.SupportingText>}
      </InputContainer>

    </Input.Root>
  );
});
ValidateInputField.displayName = "ValidateInputField";

export default ValidateInputField;
