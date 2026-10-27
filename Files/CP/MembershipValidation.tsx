import React, { useState } from "react";
import type { MembershipId } from "~/common/state/autorest/Partner/src";
import useValidateMembership from "./useValidateMembership";
import { VerticalFlexbox } from "./MembershipValidation.styled";
import { Typography } from "@tower/tui";
import ValidateInputField from "./ValidateInputField";
import Notice from "~/feature/quote/shared/components/dumb/NoticePanel/NoticePanel";
import { VerifiedUserIcon } from "@tower/tui/icons"
import { useAppSelector } from "~/root/store";
import { getQuoteSharedFormState } from "../../state/selectors";
import type { FieldState } from "react-redux-form";
import { useTranslation } from "react-i18next";

interface MembershipValidationProps {
  copy: MembershipId;
  agencyCode: string;
  onValidate: (success: boolean) => void;
}

const MembershipValidation = ({ copy: { title, helperText, label }, agencyCode, onValidate}: MembershipValidationProps) => {
  const {t} = useTranslation();
  const sharedFormState = useAppSelector(getQuoteSharedFormState);
  const membershipId = sharedFormState.membershipId as FieldState;
  const currentValue: string = membershipId?.value || '';

  const [membershipNumber, setMembershipNumber] = useState(currentValue);
  const handleMembershipNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMembershipNumber(event.target.value);
  };

  const { data, loading, error, refetch } = useValidateMembership(onValidate);
  const [lastVerifiedValue, setLastVerifiedValue] = useState<string | null>(null);
  const errorText = error ? error.message : data?.valid === false ? data?.message : undefined;
  
  const hasChangedSinceLastVerify = lastVerifiedValue === null || membershipNumber.trim() !== lastVerifiedValue;
  const isVerified = lastVerifiedValue !== null && !hasChangedSinceLastVerify;
  const supportingText = hasChangedSinceLastVerify ? helperText : '';
  const buttonText = (membershipId?.value || (data?.valid && isVerified)) ? 'Verified' : 'Verify';
  const buttonEnabled = !(membershipId?.value) && (membershipNumber.trim().length > 0 && !loading && hasChangedSinceLastVerify);
  const inputEnabled = !(membershipId?.value) && !(data?.valid);
  const iconVisible = membershipId?.value || data?.valid;

  const handleValidate = async () => {
    const valueToVerify = membershipNumber.trim();
    if (!valueToVerify) return;
    await refetch(agencyCode, valueToVerify);

    setLastVerifiedValue(valueToVerify);
  };

  return (
    <VerticalFlexbox>
      <Typography variant="title" color="primary" bold >
        {title}
      </Typography>
      <ValidateInputField
        label={label}
        supportingText={supportingText}
        value={membershipNumber}
        onChange={handleMembershipNumberChange}
        onValidate={handleValidate}
        buttonText={buttonText}
        buttonEnabled={buttonEnabled}
        inputEnabled={inputEnabled}
        icon={iconVisible ? <VerifiedUserIcon width={18} height={18} aria-hidden="true" /> : undefined}
        errorText={errorText}
      />
      {data?.valid && <Notice title={t('quote:membershipValidation.welcomeBackTitle')} description={t('quote:membershipValidation.welcomeBackDescription')} />}
    </VerticalFlexbox>
  );
};

export default MembershipValidation;