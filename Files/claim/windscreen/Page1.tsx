import * as React from 'react';
import { connect } from 'react-redux';
import { Form, actions as formActions } from 'react-redux-form';
import { useNavigate } from 'react-router';
import { ErrorText, FormMessage, Html, LicencePlateControl, LicencePlateField } from '~/common/components/base';
import { MDCheckboxField } from '~/common/components/smart';
import { selectors as commonSelectors, routes } from '~/common/state';
import type { CarRiskPolicy } from '~/common/state/autorest/Policy/src';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { FloatingToolbar, FormFooter, Question } from '~/feature/claim/shared/components';
import { selectors as sharedSelectors } from '~/feature/claim/shared/state';
import { actions as claimActions } from '~/feature/claim/state';
import { formatPhoneNumberApiToUi, raiseClaimGAEvent } from '~/feature/claim/utils';
import {
  CarLocationAddress,
  ContactPhoneNumber,
  DamageGlass,
  DamageSize,
  DamageWindowSide,
  DamageWindscreenSide
} from '~/feature/claim/windscreen/components';
import { modelPath, selectors } from '~/feature/claim/windscreen/state';
import type { ApplicationState, Dispatch } from '~/root/rootReducer';
import './Page1.scss';

export interface Page1Props
  extends Partial<ReturnType<typeof mapStateToProps>>,
    Partial<ReturnType<typeof mapDispatchToProps>>,
    InjectedTranslateProps {}

export interface Page1State {
  nextLoading: boolean;
  submitAttempted: boolean;
}

const mapStateToProps = (state: ApplicationState) => ({
  windscreenState: selectors.getBaseState(state),
  showDamageWindscreenSide: selectors.showDamageWindscreenSide(state),
  showDamageWindowSide: selectors.showDamageWindowSide(state),
  areWindscreenFieldsIncomplete: selectors.areWindscreenFieldsIncomplete(state),
  customer: commonSelectors.getCustomer(state),
  claimSharedState: sharedSelectors.getClaimSharedState(state),
  hasCarRegistration: selectors.hasCarRegistration(state),
  hasConfirmedTheRegistration: selectors.hasConfirmedTheRegistration(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setDefaultContactPhoneNumber: (phoneNumber: string) =>
    dispatch(formActions.change(`${modelPath}.contactPhoneNumber`, phoneNumber)),
  setDefaultCarRegistration: (registrationNumber: string) =>
    dispatch(formActions.change(`${modelPath}.carRegistration.registrationNumber`, registrationNumber)),
  deselctConfirmation: () => dispatch(formActions.change(`${modelPath}.carRegistration.confirmation`, false))
});
export const Page1Loader: React.FC<Page1Props> = (props) => {
  const {
    customer,
    windscreenState,
    setDefaultContactPhoneNumber,
    setDefaultCarRegistration,
    hasCarRegistration,
    claimSharedState,
    deselctConfirmation
  } = props;
  React.useEffect(() => {
    if (!windscreenState.contactPhoneNumber && customer?.phones?.length > 0) {
      setDefaultContactPhoneNumber(formatPhoneNumberApiToUi(customer.phones[0].phoneNumber));
    }
    if (!hasCarRegistration) {
      const vehicle = claimSharedState?.policyDetails?.risk as CarRiskPolicy;
      setDefaultCarRegistration(vehicle?.registrationNo);
    }
    deselctConfirmation();
  }, []);
  return <Page1Component {...props} />;
};
export const Page1Component: React.FC<Page1Props> = ({
  t,
  areWindscreenFieldsIncomplete,
  claimSharedState,
  showDamageWindowSide,
  showDamageWindscreenSide,
  hasCarRegistration,
  hasConfirmedTheRegistration,
  windscreenState
}) => {
  const navigate = useNavigate();

  const [nextLoading, setNextLoading] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const shouldDisableConfirmation = () => {
    if (hasCarRegistration) {
      return false;
    } else {
      if (hasConfirmedTheRegistration) {
        return false;
      }

      return true;
    }
  };

  return (
    <div className="container md-grid">
      <div id="WindscreenPage1" className="md-cell md-cell--12">
        <Form
          model={modelPath}
          hideNativeErrors
          className="claim-form claim-form--page1"
          validateOn="change"
          onSubmit={() => {}}>
          <h2 className="page-heading2">{t('claim/windscreen:headings.page1')}</h2>
          <DamageGlass />
          {showDamageWindscreenSide ? <DamageWindscreenSide /> : null}
          {showDamageWindowSide ? <DamageWindowSide /> : null}
          {(showDamageWindscreenSide || showDamageWindowSide) && (
            <>
              <DamageSize />
              <CarLocationAddress addressState={windscreenState.carLocationAddress} />
              <Question
                id="licencePlate"
                model={modelPath + '.carRegistration'}
                translation="claim/windscreen:carRegistration">
                <LicencePlateControl
                  modelPath={modelPath + '.carRegistration.registrationNumber'}
                  ariaLabel={t('registrationNumber.title')}
                  component={LicencePlateField}
                />
                <MDCheckboxField
                  id="licencePlateConfirmation"
                  label={t('claim/windscreen:carRegistration.confirmationText')}
                  model={modelPath + '.carRegistration.confirmation'}
                  disabled={shouldDisableConfirmation()}
                />
                {!hasCarRegistration && submitAttempted && (
                  <ErrorText text={t('claim/windscreen:carRegistration.registrationErrorText')} />
                )}
                {!hasConfirmedTheRegistration && submitAttempted && (
                  <ErrorText text={t('claim/windscreen:carRegistration.confirmationErrorText')} />
                )}
              </Question>
              <ContactPhoneNumber />
              {submitAttempted && areWindscreenFieldsIncomplete && (
                <FormMessage
                  id="windscreen-claim-mandatory-fields"
                  title={t('claim/windscreen:mandatoryFields.title')}
                  description={<Html inline rawHtml={t('claim/windscreen:mandatoryFields.description')} />}
                  isError={true}
                />
              )}
              <FormFooter
                disabled={nextLoading}
                validating={nextLoading}
                submitButtonLabel={t('base:button.next')}
                handleSubmit={async () => {
                  if (areWindscreenFieldsIncomplete) {
                    setSubmitAttempted(true);
                  } else {
                    setNextLoading(true);
                    await claimActions.submitWindscreenClaim();

                    raiseClaimGAEvent(claimSharedState.claimNumber, 'windscreen');
                    navigate(routes.CLAIM.SHARED.CONFIRMATION);
                  }
                }}
              />
              <FloatingToolbar saveClaimEnabled={false} />
            </>
          )}
        </Form>
      </div>
    </div>
  );
};

export const Page1 = connect(
  mapStateToProps,
  mapDispatchToProps
)(translate(['base', 'claim', 'claim/windscreen'])(Page1Loader));
