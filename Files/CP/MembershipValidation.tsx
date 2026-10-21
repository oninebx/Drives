import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { MembershipId } from "~/common/state/autorest/Partner/src";
import useValidateMembership from "./useValidateMembership";
import { VerticalFlexbox } from "./MembershipValidation.styled";
import { Typography } from "@tower/tui";
import ValidateInputField from "./ValidateInputField";
import WelcomeBack from "../../components/dumb/WelcomeBack/WelcomeBack";

interface MembershipValidationForm {
  membershipNumber: string;
}

interface MembershipValidationProps {
  copy: MembershipId;
  agencyCode: string;
  onValidate: (success: boolean) => void;
}

const MembershipValidation = ({ copy: { title, helperText, label }, agencyCode, onValidate }: MembershipValidationProps) => {
  const { control, watch } = useForm<MembershipValidationForm>({
    defaultValues: {
      membershipNumber: ''
    },
  });

  const { data, error, loading, refetch } = useValidateMembership(onValidate);

  const [lastVerifiedValue, setLastVerifiedValue] = useState<string | null>(null);
  const currentValue = watch('membershipNumber');

  const hasChangedSinceLastVerify = lastVerifiedValue === null || currentValue.trim() !== lastVerifiedValue;
  const isVerified = lastVerifiedValue !== null && !hasChangedSinceLastVerify;

  const supportingText = hasChangedSinceLastVerify ? helperText : '';
  const errorText = isVerified && (data && data.valid === false ? data.message : error?.message);
  console.log(errorText);

  const buttonText = data?.valid && isVerified ? 'Verified' : 'Verify';
  const buttonEnabled = currentValue.trim().length > 0 && !loading && hasChangedSinceLastVerify;

  const handleValidate = async () => {
    const valueToVerify = currentValue.trim();
    if (!valueToVerify) return;
    await refetch(agencyCode, currentValue);

    setLastVerifiedValue(valueToVerify);
  };

  return (
    <VerticalFlexbox>
      <Typography variant="title" color="primary" bold >
        {title}
      </Typography>
      <Controller
        name='membershipNumber'
        control={control}
        render={({ field: { onBlur, onChange, value } }) => (
          <ValidateInputField
            label={label}
            supportingText={supportingText}
            value={value}
            onBlur={onBlur}
            onChange={onChange}
            onValidate={handleValidate}
            buttonText={buttonText}
            buttonEnabled={buttonEnabled}
            inputEnabled={!(data?.valid)}
          />
        )}
      />
      {data?.valid && <WelcomeBack title={title} description={helperText} />}
    </VerticalFlexbox>
  );
};

export default MembershipValidation;