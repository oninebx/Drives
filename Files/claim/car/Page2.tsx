import * as React from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-redux-form';
import { useNavigate } from 'react-router';
import { FormMessage, Html } from '~/common/components/base';
import { Question, SystemIconVariant } from '~/common/components/dumb';
import { MDRadioButton, MDTextField } from '~/common/components/smart';
import { routes } from '~/common/state';
import type { KnownServiceArea } from '~/common/state/autorest/Claims/src';
import { KnownCauseOfLoss, KnownSecondaryCauseOfLoss } from '~/common/state/autorest/Claims/src';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import {
  OtherDriverDamages,
  OtherPropertyDamages,
  RegionRepairers,
  VehicleUse,
  YourVehicleDetails
} from '~/feature/claim/car/components';
import { thunks as carThunks, modelPath, NO, selectors, UNSURE, YES } from '~/feature/claim/car/state';
import { ClaimAttachments, FloatingToolbar, FormFooter } from '~/feature/claim/shared/components';
import { ClaimNumber } from '~/feature/claim/shared/components/dumb';
import { selectors as claimsSharedSelector } from '~/feature/claim/shared/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import type { ApplicationState, Dispatch } from '~/root/rootReducer';
import HailRepairer from '../components/dumb/HailRepairer/HailRepairer';
import { StyledFormMessage } from './Page2.styles';

export interface Page2Props
  extends Partial<ReturnType<typeof mapStateToProps>>,
    Partial<ReturnType<typeof mapDispatchToProps>>,
    InjectedTranslateProps {}

const mapStateToProps = (state: ApplicationState) => ({
  claim: selectors.getClaim(state),
  claimNumber: selectors.getClaimNumber(state),
  causeOfLoss: selectors.getClaimCauseOfLoss(state),
  secondaryCauseOfLoss: selectors.getClaimSecondaryCauseOfLoss(state),
  showYourVehicle: selectors.showYourVehicleQuestions(state),
  showOtherPeopleProperty: selectors.showOtherPeoplePropertyQuestions(state),
  showOtherVehiclesDamage: selectors.showOtherVehiclesDamageQuestions(state),
  showRepairer: !selectors.hideRepairerQuestions(state),
  showHailRepairer: selectors.showHailRepairer(state),
  isDamageToClaim: selectors.isDamageToClaim(state),
  hideVehicleDrivableQuestion: selectors.hideVehicleDrivableQuestion(state),
  drivableUnsure: selectors.drivableUnsure(state),
  askVehicleLocation: selectors.askVehicleLocation(state),
  isDamageClaimableCauseOfLoss: selectors.isDamageClaimableCauseOfLoss(state),
  claimType: claimsSharedSelector.getClaimType(state),
  showClaimDamageQuestions: selectors.showClaimDamageQuestions(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadRepairers: (region: KnownServiceArea) => dispatch(carThunks.loadPreferredRepairers(region)),
  clearRepairers: () => dispatch(carThunks.clearPreferredRepairers),
  clearRepairerSelection: () => dispatch(carThunks.clearPreferredRepairerSelection),
  updateDefaultLiabilityOnly: () => dispatch(carThunks.updateDefaultLiabilityOnlyValue())
});

const Page2Component: React.FC<Page2Props> = (props) => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [nextLoading, setNextLoading] = React.useState(false);

  const {
    t,
    loadRepairers,
    clearRepairers,
    showYourVehicle,
    hideVehicleDrivableQuestion,
    showOtherPeopleProperty,
    showOtherVehiclesDamage,
    showRepairer,
    showHailRepairer,
    drivableUnsure,
    askVehicleLocation,
    claimNumber,
    isDamageToClaim,
    isDamageClaimableCauseOfLoss,
    claimType,
    causeOfLoss,
    secondaryCauseOfLoss,
    showClaimDamageQuestions,
    updateDefaultLiabilityOnly
  } = props;
  const navigate = useNavigate();

  React.useEffect(() => {
    if (showClaimDamageQuestions === false) {
      updateDefaultLiabilityOnly();
    }
  }, [showClaimDamageQuestions]);

  const carDamageDetailsModel = `${modelPath}.carDamageDetails`;
  const drivableModel = `${carDamageDetailsModel}.drivable`;
  const vehicleLocationModel = `${carDamageDetailsModel}.vehicleLocation`;

  const showVehicleDriveableQuestionForStolenRecovered =
    causeOfLoss === KnownCauseOfLoss.Stolen && secondaryCauseOfLoss === KnownSecondaryCauseOfLoss.VehicleRecovered;
  const showVehicleDriveableQuestion = !hideVehicleDrivableQuestion && isDamageClaimableCauseOfLoss && isDamageToClaim;
  return (
    <div className="container md-grid">
      <div id="CarPage2" className="md-cell md-cell--12">
        <Form model={modelPath} hideNativeErrors className="claim-form claim-form--page2" validateOn="change">
          <ClaimNumber claimNumber={claimNumber} />
          <h2 className="page-heading2">{t('claim/car:headings.page2')}</h2>
          {showYourVehicle ? (
            <>
              <h2 className="section-heading">{t(`claim/${claimType}:headings.yourVehicle`)}</h2>
              {showClaimDamageQuestions ? <YourVehicleDetails /> : null}
            </>
          ) : null}

          {showClaimDamageQuestions &&
          (showVehicleDriveableQuestionForStolenRecovered || showVehicleDriveableQuestion) ? (
            <Question
              id="questionDrivable"
              model={drivableModel}
              translation={`claim/${claimType}:vehicleDamage.drivable`}>
              <MDRadioButton
                id="drivable"
                model={drivableModel}
                triple={true}
                options={[
                  { value: YES, label: t('button.yes') },
                  { value: NO, label: t('button.no') },
                  { value: UNSURE, label: t('button.unsure') }
                ]}
              />
            </Question>
          ) : null}

          {drivableUnsure && showClaimDamageQuestions && (
            <FormMessage
              id="safetyFirstMessage"
              className="question question--subquestion"
              title={t(`claim/${claimType}:vehicleDamage.safetyFirst.title`)}
              description={<Html inline rawHtml={t(`claim/${claimType}:vehicleDamage.safetyFirst.description`)} />}
            />
          )}
          {askVehicleLocation && showClaimDamageQuestions && (
            <Question
              id="questionVehicleLocation"
              model={vehicleLocationModel}
              subQuestion
              translation={`claim/${claimType}:vehicleDamage.vehicleLocation`}>
              <MDTextField
                id="vehicleLocation"
                model={vehicleLocationModel}
                placeholder={t(`claim/${claimType}:vehicleDamage.vehicleLocation.placeholder`)}
                rows={1}
                maxLength={255}
              />
            </Question>
          )}

          {showRepairer && isDamageClaimableCauseOfLoss && isDamageToClaim && showClaimDamageQuestions ? (
            <>
              <h2 className="section-heading">{t('claim/car:headings.repairer')}</h2>
              <RegionRepairers clearRepairers={clearRepairers} loadRepairers={loadRepairers} />
            </>
          ) : null}

          {showHailRepairer && showClaimDamageQuestions && (
            <>
              <h2 className="section-heading">{t('claim/car:headings.repairer')}</h2>
              <HailRepairer />
            </>
          )}

          {!showClaimDamageQuestions && (
            <StyledFormMessage
              id="showThirdPartyMessage"
              className="question"
              icon={SystemIconVariant.ErrorOutline}
              title={t(`claim/${claimType}:vehicleDamage.thirdPartyMessage.title`)}
              description={
                <Html inline rawHtml={t(`claim/${claimType}:vehicleDamage.thirdPartyMessage.description`)} />
              }
              isRefer={true}
            />
          )}

          <h2 className="section-heading">{t(`claim/${claimType}:headings.vehicleUse`)}</h2>
          <VehicleUse />

          {showOtherVehiclesDamage ? (
            <>
              <h2 className="section-heading">{t('claim/car:headings.otherVehicles')}</h2>
              <OtherDriverDamages />
            </>
          ) : null}

          {showOtherPeopleProperty ? (
            <>
              <h2 className="section-heading">{t('claim/car:headings.otherPeopleProperty')}</h2>
              <OtherPropertyDamages />
            </>
          ) : null}

          <>
            <h2 className="section-heading">{t('claim/car:headings.addAttachments')}</h2>
            <ClaimAttachments claimType={claimType} />
          </>

          <FormFooter
            disabled={nextLoading}
            validating={nextLoading}
            submitButtonLabel={t('claim:footer.nextButton.shared.contactDetails')}
            showBackButton={true}
            backUrl={routes.CLAIM.CAR.PAGE1}
            handleSubmit={async () => {
              setNextLoading(true);
              raiseClaimGAEvent(claimNumber, 'car');
              navigate(routes.CLAIM.SHARED.CLAIM_CONTACT_DETAILS);
            }}
          />
        </Form>
        <FloatingToolbar saveClaimEnabled={true} />
      </div>
    </div>
  );
};

export const Page2 = connect(
  mapStateToProps,
  mapDispatchToProps
)(
  translate([
    'base',
    'claim',
    'claim/car',
    'claim/caravan',
    'claim/trailer',
    'claim/motorbike',
    'claim/motorhome',
    'claim/boat'
  ])(Page2Component)
);

export default Page2;
