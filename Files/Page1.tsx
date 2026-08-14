import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Form } from 'react-redux-form';
import { useNavigate } from 'react-router';
import { routes } from '~/common/state';
import type { HomeClaimGet } from '~/common/state/autorest/Claims/src';
import {
  AlarmSet,
  AuthorityReportFire,
  AuthorityReportPolice,
  HouseEventLocation,
  HouseLivable,
  HouseLocked,
  KeysStolen,
  LastPropertyInspection,
  Occupancy,
  OtherPeopleDetail,
  VacantDate
} from '~/feature/claim/house/components';
import type { ClaimHouseState } from '~/feature/claim/house/state';
import { formPath, modelPath, selectors } from '~/feature/claim/house/state';
import {
  EventDescription,
  EventLocation,
  FloatingToolbar,
  FormFooter,
  PreStepsSummary,
  WitnessSection
} from '~/feature/claim/shared/components';
import { ClaimNumber } from '~/feature/claim/shared/components/dumb';
import type { ClaimSharedState, ClaimType } from '~/feature/claim/shared/state';
import {
  modelPath as sharedModelPath,
  selectors as sharedSelectors,
  thunks as sharedThunks
} from '~/feature/claim/shared/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import history from '~/root/history';
import type { ApplicationState } from '~/root/rootReducer';
import type { AppDispatch } from '~/root/store';
interface StateProps {
  claim: HomeClaimGet;
  claimType: ClaimType;
  description: string;
  state: ClaimHouseState;
  sharedState: ClaimSharedState;
  backToPreStepsPrevented: boolean;
  showEventLocation: boolean;
  showEventLocationSomewhereElse: boolean;
  showLastPropertyInspection: boolean;
  getHouseRiskAddress: string;
  showOtherPeopleDetails: boolean;
  showOccupancy: boolean;
  showVacancyDate: boolean;
  showTheftQuestions: boolean;
  showHouseLivable: boolean;
  showFireAuthorityReport: boolean;
  showPoliceAuthorityReport: boolean;
  showWitnesses: boolean;
  claimSharedState: ClaimSharedState;
}

interface DispatchProps {
  setClaimTypeToHouse: (model: string, claimNumber: string, claimType: string) => void;
  setBackToPreStepsPrevented: (model: string, value: boolean) => void;
}

export type Page1Props = StateProps & DispatchProps;

const Page1Component = (props: Page1Props) => {
  const [nextLoading, setNextLoading] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation(['base', 'claim', 'claim/house']);

  const {
    state,
    claim,
    claimType,
    description,
    showEventLocation,
    showEventLocationSomewhereElse,
    showLastPropertyInspection,
    showOtherPeopleDetails,
    showOccupancy,
    showVacancyDate,
    showTheftQuestions,
    showHouseLivable,
    showFireAuthorityReport,
    showPoliceAuthorityReport,
    showWitnesses,
    claimSharedState,
    sharedState,
    setBackToPreStepsPrevented,
    setClaimTypeToHouse,
    backToPreStepsPrevented,
    getHouseRiskAddress
  } = props;

  const riskAddress = description ? '' : getHouseRiskAddress;

  React.useEffect(() => {
    const policyDetails = sharedState.homePolicyDetails;

    // store claim number and claim type (house) in shared state for use in shared pages like claim contact page
    setClaimTypeToHouse(sharedModelPath, claim.claimNumber, policyDetails.typeOfPolicy);

    if (!backToPreStepsPrevented) {
      // hack to prevent back
      for (let i = 0; i < 10; i++) {
        history.push({}, '');
      }
      setBackToPreStepsPrevented(sharedModelPath, true);
    }

    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    // some how the model 'myForms.houseClaim' is being set as pending, there by setting
    // all children as pending, which is showing spinners on all dropdown control, setting
    // is false on mount for now to cover that, till we find the reason why it is et as pending
    // store.dispatch(formActions.setPending(modelPath, false));
  }, []);

  return (
    <div className="container md-grid">
      <div id="HousePage1" className="md-cell md-cell--12">
        <Form
          model={modelPath}
          hideNativeErrors
          className="claim-form claim-form--page1"
          validateOn="change"
          onSubmit={() => {}}>
          <ClaimNumber claimNumber={claim.claimNumber} />
          <h2 className="page-heading2">{t('claim/house:headings.page1')}</h2>
          <PreStepsSummary
            causeOfLoss={claim.causeOfLoss}
            secondaryCauseOfLoss={claim.secondaryCauseOfLoss}
            claimType={claimSharedState.claimType}
            description={description ? description : riskAddress}
            lossDateTime={claim.lossDate}
          />

          <h2 className="section-heading">{t('claim/house:headings.incidentInformation')}</h2>

          {showEventLocation && <HouseEventLocation translation={`claim/house:eventLocationType.general`} />}
          {showEventLocation && showEventLocationSomewhereElse && (
            <EventLocation
              modelPath={modelPath}
              formPath={formPath}
              translation="claim/house:eventLocation"
              addressState={state.eventLocationAddress}
            />
          )}

          <EventDescription causeOfLoss={claim.causeOfLoss} typeOfClaim={claimSharedState.claimType} />

          {showOccupancy && <Occupancy modelPath={modelPath} />}

          {showLastPropertyInspection && <LastPropertyInspection modelPath={modelPath} />}

          {showVacancyDate && <VacantDate />}

          {showHouseLivable && <HouseLivable />}

          {showTheftQuestions && (
            <>
              <HouseLocked />
              <AlarmSet />
              <KeysStolen />
            </>
          )}

          {showPoliceAuthorityReport && <AuthorityReportPolice modelPath={modelPath} />}

          {showFireAuthorityReport && (
            <>
              <h2 className="section-heading">{t('claim/house:headings.fire')}</h2>
              <AuthorityReportFire modelPath={modelPath} />
            </>
          )}

          {showWitnesses && (
            <>
              <h2 className="section-heading">{t('claim/house:headings.witnesses')}</h2>
              <WitnessSection claimType={claimType} />
            </>
          )}

          {showOtherPeopleDetails && (
            <>
              <h2 className="section-heading">{t('claim/house:headings.otherPeople')}</h2>
              <OtherPeopleDetail />
            </>
          )}

          <FormFooter
            disabled={nextLoading}
            validating={nextLoading}
            submitButtonLabel={t('claim:footer.nextButton.house.page1')}
            handleSubmit={() => {
              setNextLoading(true);
              raiseClaimGAEvent(claimSharedState.claimNumber, 'house');
              navigate(routes.CLAIM.HOUSE.PAGE2);
            }}
          />

          <FloatingToolbar saveClaimEnabled={true} />
        </Form>
      </div>
    </div>
  );
};

const mapStateToProps = (state: ApplicationState): StateProps => ({
  claim: selectors.getClaim(state),
  claimType: sharedSelectors.getClaimType(state),
  description: sharedSelectors.getPolicyDescription(state),
  state: selectors.getBaseState(state),
  sharedState: sharedSelectors.getClaimSharedState(state),
  backToPreStepsPrevented: sharedSelectors.getBackToPreStepsPrevented(state),
  showEventLocation: selectors.showEventLocation(state),
  showEventLocationSomewhereElse: selectors.showEventLocationSomewhereElse(state),
  showLastPropertyInspection: selectors.showLastPropertyInspection(state),
  getHouseRiskAddress: sharedSelectors.getHouseRiskAddress(state),
  showOtherPeopleDetails: selectors.showOtherPeopleDetails(state),
  showOccupancy: selectors.showOccupancy(state),
  showVacancyDate: selectors.showVacancyDate(state),
  showTheftQuestions: selectors.showTheftQuestions(state),
  showHouseLivable: selectors.showHouseLivable(state),
  showFireAuthorityReport: selectors.showFireAuthorityReport(state),
  showPoliceAuthorityReport: selectors.showPoliceAuthorityReport(state),
  showWitnesses: selectors.showWitnesses(state),
  claimSharedState: sharedSelectors.getClaimSharedState(state)
});

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  setClaimTypeToHouse: (model: string, claimNumber: string, claimType: string) =>
    dispatch(sharedThunks.setClaimTypeForPage1(model, claimNumber, claimType)),
  setBackToPreStepsPrevented: (model: string, value: boolean) =>
    dispatch(sharedThunks.setBackToPreStepsPrevented(model, value))
});

export const Page1 = connect(mapStateToProps, mapDispatchToProps)(Page1Component);

export default Page1;
