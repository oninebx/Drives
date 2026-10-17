import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { MembershipId } from "~/common/state/autorest/Partner/src";
import useValidateMembership from "./useValidateMembership";
import { VerticalFlexbox } from "./MembershipValidation.styled";
import { Typography } from "@tower/tui";
import ValidateInputField from "./ValidateInputField";

interface MembershipValidationForm {
  membershipNumber: string;
}

interface MembershipValidationProps {
  id: MembershipId;
  agencyCode: string;
  onValidate: (success: boolean) => void;
}

const MembershipValidation = ({ id: { title, helperText, label }, agencyCode, onValidate }: MembershipValidationProps) => {
  const { control } = useForm<MembershipValidationForm>({
    defaultValues: {
      membershipNumber: ''
    },
  });

  const { data, error, loading, refetch } = useValidateMembership(onValidate);

  const [isVerifyCalled, setIsVerifyCalled] = useState(false);

  const buttonText = data?.valid ? 'Verified' : 'Verify';
  console.log(data, error, loading);
  const supportingText = !isVerifyCalled ? helperText : '';
  return (
    <VerticalFlexbox>
      <Typography variant="title" color="primary" bold element="h3">
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
            onValidate={async () => { setIsVerifyCalled(true); await refetch(agencyCode, value); }}
            buttonText={buttonText}
          />
        )}
      />
    </VerticalFlexbox>
  );
  // return (
  //   <Controller
  //     name='membershipNumber'
  //     control={control}
  //     render={({ field: { onBlur, onChange, value } }) => (
  //       <ValidateInputPanel
  //         buttonText={buttonText}
  //         title={title}
  //         label={label}
  //         supportingText={helperText}
  //         value={value}
  //         onBlur={onBlur}
  //         onChange={onChange}
  //         onValidate={async () => await refetch(agencyCode, value)}
  //       />
  //     )}
  //   />
  // );
};

export default MembershipValidation;