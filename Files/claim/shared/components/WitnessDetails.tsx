import * as React from 'react';
import { AddressManual, MDTextField } from '~/common/components/smart';
import type { AddressState } from '~/common/state';
import { useTranslation } from 'react-i18next';
import { Question } from '~/feature/claim/shared/components';
import { ClaimType } from '~/feature/claim/shared/state';

export interface WitnessDetailsProps {
  witnessIndex: number;
  witnessModelPath: string;
  witnessFormModelPath: string;
  witnessAddress: AddressState;
  claimType: ClaimType;
}
export const WitnessDetailsComponent = ({
  witnessIndex,
  witnessModelPath,
  witnessFormModelPath,
  witnessAddress,
  claimType
}: WitnessDetailsProps) => {
  const { t } = useTranslation('claim');
  const hidePartyAddress = t('claim:config.hidePartyAddress') === true;

  return (
    <>
      <Question
        id={`questionWitnessName${witnessIndex}`}
        model={witnessModelPath}
        translation="claim:witness.witnessName">
        <MDTextField
          id={`witnessFirstNameField${witnessIndex}`}
          model={`${witnessModelPath}.firstName`}
          label={t('claim:witness.witnessName.firstNameLabel')}
          ariaLabel={t('claim:witness.witnessName.firstNameLabel')}
          maxLength={255}
          validateOn="change"
        />
        <MDTextField
          id={`witnessLastNameField${witnessIndex}`}
          model={`${witnessModelPath}.lastName`}
          label={t('claim:witness.witnessName.lastNameLabel')}
          ariaLabel={t('claim:witness.witnessName.lastNameLabel')}
          maxLength={255}
          validateOn="change"
        />
      </Question>
      <Question
        id={`questionContactDetails${witnessIndex}`}
        model={witnessModelPath}
        translation="claim:witness.contactDetails">
        <MDTextField
          id={`witnessPhoneField${witnessIndex}`}
          model={`${witnessModelPath}.phone`}
          label={t('claim:witness.contactDetails.phoneLabel')}
          ariaLabel={t('claim:witness.contactDetails.phoneLabel')}
          placeholder={t('claim:witness.contactDetails.phoneLabel')}
          maxLength={255}
          validateOn="change"
          isPhone
          defaultCountry={t('claim:phone.defaultCountry')}
        />
        <MDTextField
          id={`witnessEmailField${witnessIndex}`}
          model={`${witnessModelPath}.email`}
          type="email"
          label={t('claim:witness.contactDetails.emailLabel')}
          ariaLabel={t('claim:witness.contactDetails.emailLabel')}
          maxLength={255}
          validateOn="change"
          persist={true}
        />
        {(claimType !== ClaimType.Car || !hidePartyAddress) && (
          <AddressManual
            id={`witnessAddressField${witnessIndex}`}
            fullPathModel={`${witnessModelPath}.address`}
            fullPathFormModel={`${witnessFormModelPath}.address`}
            addressState={witnessAddress}
            label={t('claim:witness.contactDetails.addressLabel')}
            ariaLabel={t('claim:witness.contactDetails.addressLabel')}
          />
        )}
      </Question>
    </>
  );
};

export const WitnessDetails = WitnessDetailsComponent;
