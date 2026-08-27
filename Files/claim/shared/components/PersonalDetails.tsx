import * as React from 'react';
import { AddressManual, MDTextField } from '~/common/components/smart';
import type { AddressState } from '~/common/state';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { Question } from '~/feature/claim/shared/components';

export interface PersonalDetailsProps extends InjectedTranslateProps {
  index: number;
  modelPath: string;
  formModelPath: string;
  addressState: AddressState;
  idPrefixString: string;
  translationPathString: string;
  isOptional?: boolean;
}

export const PersonalDetailsComponent = ({
  t,
  index,
  modelPath,
  idPrefixString,
  translationPathString,
  formModelPath,
  addressState,
  isOptional
}: PersonalDetailsProps) => {
  return (
    <>
      <Question
        id={`${idPrefixString}Name${index}`}
        model={modelPath}
        translation={`${translationPathString}.nameTitle`}>
        <MDTextField
          id={`${idPrefixString}FirstNameField${index}`}
          model={`${modelPath}.firstName`}
          label={t(`${translationPathString}.contactDetails.firstNameLabel`)}
          ariaLabel={t(`${translationPathString}.contactDetails.firstNameLabel`)}
          maxLength={255}
          validateOn="change"
        />
        <MDTextField
          id={`${idPrefixString}LastNameField${index}`}
          model={`${modelPath}.lastName`}
          label={t(`${translationPathString}.contactDetails.lastNameLabel`)}
          ariaLabel={t(`${translationPathString}.contactDetails.lastNameLabel`)}
          maxLength={255}
          validateOn="change"
        />
      </Question>
      <Question
        id={`${idPrefixString}ContactFieldQuestions${index}`}
        model={modelPath}
        translation={`${translationPathString}.contactDetails`}>
        <MDTextField
          id={`${idPrefixString}PhoneField${index}`}
          model={`${modelPath}.phone`}
          label={t(`${translationPathString}.contactDetails.phoneLabel`)}
          ariaLabel={t(`${translationPathString}.contactDetails.phoneLabel`)}
          maxLength={255}
          validateOn="change"
          isPhone
          defaultCountry={t('claim:phone.defaultCountry')}
        />
        <MDTextField
          id={`${idPrefixString}EmailField${index}`}
          model={`${modelPath}.email`}
          type="email"
          label={t(`${translationPathString}.contactDetails.emailLabel`)}
          ariaLabel={t(`${translationPathString}.contactDetails.emailLabel`)}
          maxLength={255}
          validateOn="change"
          persist
        />
        {t('claim:config.hidePartyAddress') !== true && (
          <AddressManual
            id={`${idPrefixString}AddressField${index}`}
            fullPathModel={`${modelPath}.address`}
            fullPathFormModel={`${formModelPath}.address`}
            addressState={addressState}
            label={t(`${translationPathString}.contactDetails.addressLabel`)}
            ariaLabel={t(`${translationPathString}.contactDetails.addressLabel`)}
            isOptional={isOptional}
          />
        )}
      </Question>
    </>
  );
};

export const PersonalDetails = translate([
  'base',
  'claim',
  'claim/car',
  'claim/contents',
  'claim/house',
  'claim/landlord'
])(PersonalDetailsComponent);

export default PersonalDetails;
