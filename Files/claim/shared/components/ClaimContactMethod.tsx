import * as React from 'react';
import { connect } from 'react-redux';
import { Errors } from 'react-redux-form';
import { MDRadioButton, MDTextField } from '~/common/components/smart';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { Question } from '~/feature/claim/shared/components';
import {
  CLAIM_CONTACT_METHOD_EMAIL,
  CLAIM_CONTACT_METHOD_PHONE,
  modelPath,
  selectors as sharedSelectors
} from '~/feature/claim/shared/state';
import type { ApplicationState } from '~/root/rootReducer';

export interface ClaimContactMethodProps extends Partial<ReturnType<typeof mapStateToProps>>, InjectedTranslateProps {}

const mapStateToProps = (state: ApplicationState) => ({
  phoneRequired: sharedSelectors.isClaimContactMethodPhone(state),
  emailRequired: sharedSelectors.isClaimContactMethodEmail(state)
});

export interface ErrorMessageProps extends InjectedTranslateProps {
  model: string;
}
export const ErrorMessage = ({ model, t }: ErrorMessageProps) => (
  <Errors
    className="error-container"
    model={model}
    messages={{
      phoneValid: t('errors.requiredField'),
      emailValid: t('errors.requiredField')
    }}
    show="touched"
  />
);

export const ClaimContactMethodComponent: React.FunctionComponent<ClaimContactMethodProps> = ({
  t,
  phoneRequired,
  emailRequired
}: ClaimContactMethodProps) => {
  const claimContactModel = `${modelPath}.claimContact`;
  const contactMethodModel = `${claimContactModel}.contactMethod`;
  const phoneModel = `${claimContactModel}.phone`;
  const emailModel = `${claimContactModel}.email`;

  return (
    <>
      <Question id="questionContactMethod" model={contactMethodModel} translation="claim:claimContact.contactMethod">
        <MDRadioButton
          id="contactMethod"
          model={contactMethodModel}
          options={[
            { value: CLAIM_CONTACT_METHOD_EMAIL, label: t('claim:claimContact.contactMethod.email') },
            { value: CLAIM_CONTACT_METHOD_PHONE, label: t('claim:claimContact.contactMethod.phone') }
          ]}
        />
      </Question>
      <Question id="questionContactDetails" model={modelPath} translation="claim:claimContact.contactDetails">
        <MDTextField
          id="contactDetailsPhoneField"
          model={phoneModel}
          placeholder={t(`claim:claimContact.contactDetails.${phoneRequired ? 'phoneLabel' : 'phoneOptionalLabel'}`)}
          label={t(`claim:claimContact.contactDetails.${phoneRequired ? 'phoneLabel' : 'phoneOptionalLabel'}`)}
          ariaLabel={t(`claim:claimContact.contactDetails.${phoneRequired ? 'phoneLabel' : 'phoneOptionalLabel'}`)}
          maxLength={255}
          validateOn="change"
          otherValidators={{
            phoneValid: (val: string) => val && val.length
          }}
          isPhone
          defaultCountry={t('claim:phone.defaultCountry')}
        />
        {phoneRequired && <ErrorMessage t={t} model={phoneModel} />}

        <MDTextField
          id="contactDetailsEmailField"
          model={emailModel}
          type="email"
          label={t(`claim:claimContact.contactDetails.${emailRequired ? 'emailLabel' : 'emailOptionalLabel'}`)}
          ariaLabel={t(`claim:claimContact.contactDetails.${emailRequired ? 'emailLabel' : 'emailOptionalLabel'}`)}
          maxLength={255}
          validateOn="change"
          otherValidators={{
            emailValid: (val: string) => val && val.length
          }}
          persist
        />
        {emailRequired && <ErrorMessage t={t} model={emailModel} />}
      </Question>
    </>
  );
};

export const ClaimContactMethodContainer = translate(['base', 'claim'])(ClaimContactMethodComponent);

export const ClaimContactMethod = connect(mapStateToProps)(ClaimContactMethodContainer);

export default ClaimContactMethod;
