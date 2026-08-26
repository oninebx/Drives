import * as React from 'react';
import { AddressManual, MDTextField } from '~/common/components/smart';
import type { AddressState } from '~/common/state';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { Question } from '~/feature/claim/shared/components';

export interface DPOPersonalDetailsProps extends InjectedTranslateProps {
  index: number;
  modelPath: string;
  formModelPath: string;
  addressState: AddressState;
  isBusiness: boolean;
}
export const DPOPersonalDetailsComponent = ({
  t,
  index,
  modelPath,
  formModelPath,
  addressState,
  isBusiness
}: DPOPersonalDetailsProps) => {
  return (
    <>
      <Question
        id={`questionDamagePropertyOwnerName${index}`}
        model={modelPath}
        translation={`claim:otherPropertyDamage.${isBusiness ? 'businessName' : 'privateOwnerName'}`}>
        <MDTextField
          id={`damagePropertyOwnerFirstNameField${index}`}
          model={`${modelPath}.firstName`}
          label={t('claim:otherPropertyDamage.ownerName.firstNameLabel')}
          ariaLabel={t('claim:otherPropertyDamage.ownerName.firstNameLabel')}
          maxLength={255}
          validateOn="change"
        />
        <MDTextField
          id={`damagePropertyOwnerLastNameField${index}`}
          model={`${modelPath}.lastName`}
          label={t('claim:otherPropertyDamage.ownerName.lastNameLabel')}
          ariaLabel={t('claim:otherPropertyDamage.ownerName.lastNameLabel')}
          maxLength={255}
          validateOn="change"
        />
      </Question>
      <Question
        id={`questionDamagePropertyOwnerContactDetails${index}`}
        model={modelPath}
        translation="claim:otherPropertyDamage.contactDetails">
        <MDTextField
          id={`damagePropertyOwnerPhoneField${index}`}
          model={`${modelPath}.phone`}
          label={t('claim:otherPropertyDamage.contactDetails.phoneLabel')}
          ariaLabel={t('claim:otherPropertyDamage.contactDetails.phoneLabel')}
          maxLength={255}
          validateOn="change"
          placeholder="Phone (optional)"
          isPhone
          defaultCountry={t('claim:phone.defaultCountry')}
        />
        <MDTextField
          id={`damagePropertyOwnerEmailField${index}`}
          model={`${modelPath}.email`}
          type="email"
          label={t('claim:otherPropertyDamage.contactDetails.emailLabel')}
          ariaLabel={t('claim:otherPropertyDamage.contactDetails.emailLabel')}
          maxLength={255}
          validateOn="change"
          persist
        />
        {t('claim:config.hidePartyAddress') !== true && (
          <AddressManual
            id={`damagePropertyOwnerAddressField${index}`}
            fullPathModel={`${modelPath}.address`}
            fullPathFormModel={`${formModelPath}.address`}
            addressState={addressState}
            label={t('claim:otherPropertyDamage.contactDetails.addressLabel')}
            ariaLabel={t('claim:otherPropertyDamage.contactDetails.addressLabel')}
            isOptional={true}
          />
        )}
      </Question>
    </>
  );
};

export const DPOPersonalDetails = translate('claim')(DPOPersonalDetailsComponent);

export default DPOPersonalDetails;
