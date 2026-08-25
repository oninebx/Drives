import * as React from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-redux-form';
import { routes } from '~/common/state';
import type { BaseHomeRiskPolicyUnion } from '~/common/state/autorest/PolicyAuth/src';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { thunks as contentsThunks, formPath, modelPath, selectors } from '~/feature/claim/contents/state';
import { ClaimNumber } from '~/feature/claim/shared/components/dumb';
import {
  ClaimType,
  modelPath as sharedModelPath,
  selectors as sharedSelectors,
  thunks as sharedThunks
} from '~/feature/claim/shared/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import history from '~/root/history';
import type { ApplicationState, Dispatch } from '~/root/rootReducer';
import type { NavigateFunction } from 'react-router';
import { useNavigate } from 'react-router';
import {
  AlarmSet,
  AuthorityReportFire,
  AuthorityReportPolice,
  ContentsEventLocation,
  HouseLivable,
  HouseLocked,
  ItemsDiscoveredMissingDateTime,
  ItemsLastSeenDateTime,
  KeysStolen,
  Occupancy,
  OtherPeopleDetail,
  VacantDate,
  VehicleLocked,
  VehicleParked,
  WhereWereItems
} from '~/feature/claim/contents/components';
import {
  EventDescription,
  EventLocation,
  EventLocationDescription,
  FloatingToolbar,
  FormFooter,
  PreStepsSummary,
  WitnessSection
} from '~/feature/claim/shared/components';

export interface Page1Props
  extends Partial<ReturnType<typeof mapStateToProps>>,
    Partial<ReturnType<typeof mapDispatchToProps>>,
    InjectedTranslateProps {}

interface Page1UnhookedProps extends Page1Props {
  navigate: NavigateFunction;
}

export interface Page1State {
  nextLoading: boolean;
}

// map properties to component
const mapStateToProps = (state: ApplicationState) => ({
  claim: selectors.getClaim(state),
  claimType: sharedSelectors.getClaimType(state),
  description: sharedSelectors.getPolicyDescription(state),
  state: selectors.getBaseState(state),
  missingDate: selectors.getItemsDiscoveredMissingDate(state),
  lossDate: selectors.getLossDate(state),
  backToPreStepsPrevented: sharedSelectors.getBackToPreStepsPrevented(state),
  contentsRiskAddress: sharedSelectors.getContentsRiskAddress(state),
  claimSharedState: sharedSelectors.getClaimSharedState(state),
  showEventLocationDescription: selectors.showEventLocationDescription(state),
  showEventLocationSomewhereElse: selectors.showEventLocationSomewhereElse(state),
  showVehicleParked: selectors.showVehicleParked(state),
  showOccupancy: selectors.showOccupancy(state),
  showVacancyDate: selectors.showVacancyDate(state),
  showHouseLocked: selectors.showHouseLocked(state),
  showVehicleLocked: selectors.showVehicleLocked(state),
  showAlarmSet: selectors.showAlarmSet(state),
  showKeysStolen: selectors.showKeysStolen(state),
  showItemsDiscoveredMissingAndLastSeenDates: selectors.showItemsDiscoveredMissingAndLastSeenDates(state),
  showWhereWereItemsAtTimeOfTheft: selectors.showWhereWereItemsAtTimeOfTheft(state),
  showHouseLivable: selectors.showHouseLivable(state),
  showFireAuthorityReport: selectors.showFireAuthorityReport(state),
  showPoliceAuthorityReport: selectors.showPoliceAuthorityReport(state),
  showWitnesses: selectors.showWitnesses(state),
  showOtherPeopleDetails: selectors.showOtherPeopleDetails(state),
  risk: selectors.getContentsRisk(state),
  showRiskAddressOption: selectors.showRiskAddressOption(state),
  showEventLocation: selectors.showEventLocation(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  initialise: (lossDate: Date, missingDate: string, showRiskAddressOption: boolean, risk: BaseHomeRiskPolicyUnion) =>
    dispatch(contentsThunks.initContentsPage1(lossDate, missingDate, showRiskAddressOption, risk)),
  setClaimTypeToContents: (model: string, claimNumber: string, claimType: string) =>
    dispatch(sharedThunks.setClaimTypeForPage1(model, claimNumber, claimType)),
  setBackToPreStepsPrevented: (model: string, value: boolean) =>
    dispatch(sharedThunks.setBackToPreStepsPrevented(model, value))
});

export class Page1Component extends React.Component<Page1UnhookedProps, Page1State> {
  public readonly state: Page1State = {
    nextLoading: false
  };
  public async componentDidMount() {
    const {
      lossDate,
      missingDate,
      initialise,
      setClaimTypeToContents,
      setBackToPreStepsPrevented,
      claim,
      backToPreStepsPrevented,
      risk,
      showRiskAddressOption
    } = this.props;
    // Tech debt ticket- https://tower.catchsoftware.net/jira/browse/CS-2520 to create new tests and upgrade Page1 to FC + thunks

    initialise(lossDate, missingDate, showRiskAddressOption, risk);

    // store claim number and claim type (contents) in shared state for use in shared pages like claim contact page
    setClaimTypeToContents(sharedModelPath, claim.claimNumber, 'contents');

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
    // some how the model 'myForms.contentsClaim' is being set as pending, there by setting
    // all children as pending, which is showing spinners on all dropdown control, setting
    // is false on mount for now to cover that, till we find the reason why it is et as pending
    // store.dispatch(formActions.setPending(modelPath, false));
  }

  public render() {
    const {
      state,
      t,
      claim,
      description,
      claimType,
      contentsRiskAddress,
      claimSharedState,
      showEventLocationDescription,
      showEventLocationSomewhereElse,
      showVehicleParked,
      showOccupancy,
      showVacancyDate,
      showHouseLocked,
      showVehicleLocked,
      showAlarmSet,
      showKeysStolen,
      showItemsDiscoveredMissingAndLastSeenDates,
      showWhereWereItemsAtTimeOfTheft,
      showHouseLivable,
      showFireAuthorityReport,
      showPoliceAuthorityReport,
      showWitnesses,
      showOtherPeopleDetails,
      navigate,
      showEventLocation
    } = this.props;
    const { nextLoading } = this.state;
    let riskAddress = '';
    if (!description) {
      riskAddress = contentsRiskAddress;
    }

    return (
      <div className="container md-grid">
        <div id="ContentsPage1" className="md-cell md-cell--12">
          <Form
            model={modelPath}
            hideNativeErrors
            className="claim-form claim-form--page1"
            validateOn="change"
            onSubmit={() => {}}>
            <ClaimNumber claimNumber={claim.claimNumber} />
            <h2 className="page-heading2">{t('claim/contents:headings.page1')}</h2>
            <PreStepsSummary
              causeOfLoss={claim.causeOfLoss}
              secondaryCauseOfLoss={claim.secondaryCauseOfLoss}
              claimType={ClaimType.Contents}
              description={description ? description : riskAddress}
              lossDateTime={claim.lossDate}
            />

            <h2 className="section-heading">{t('claim/contents:headings.incidentInformation')}</h2>
            {showEventLocation && <ContentsEventLocation />}

            {showEventLocationDescription && <EventLocationDescription />}

            {showEventLocationSomewhereElse && (
              <EventLocation
                modelPath={modelPath}
                formPath={formPath}
                translation="claim/contents:eventLocation"
                addressState={state.eventLocationAddress}
              />
            )}

            <EventDescription causeOfLoss={claim.causeOfLoss} typeOfClaim={claimType} />

            {showVehicleParked && <VehicleParked />}

            {showOccupancy && <Occupancy />}

            {showVacancyDate && <VacantDate />}

            {showHouseLocked && <HouseLocked />}
            {showVehicleLocked && <VehicleLocked />}
            {showAlarmSet && <AlarmSet />}
            {showKeysStolen && <KeysStolen />}

            {showItemsDiscoveredMissingAndLastSeenDates && (
              <>
                <ItemsDiscoveredMissingDateTime />
                <ItemsLastSeenDateTime />

                {showWhereWereItemsAtTimeOfTheft && (
                  <WhereWereItems translation="claim/contents:whereWereItemsAtTimeOfTheft" />
                )}
              </>
            )}

            {showHouseLivable && <HouseLivable />}

            {showPoliceAuthorityReport && <AuthorityReportPolice modelPath={modelPath} />}

            {showFireAuthorityReport && (
              <>
                <h2 className="section-heading">{t('claim/contents:headings.fire')}</h2>
                <AuthorityReportFire modelPath={modelPath} />
              </>
            )}

            {showWitnesses && (
              <>
                <h2 className="section-heading">{t('claim/contents:headings.witnesses')}</h2>
                <WitnessSection claimType={claimType} />
              </>
            )}

            {showOtherPeopleDetails && (
              <>
                <h2 className="section-heading">{t('claim/contents:headings.otherPeople')}</h2>
                <OtherPeopleDetail />
              </>
            )}

            <FormFooter
              disabled={nextLoading}
              validating={nextLoading}
              submitButtonLabel={t('claim:footer.nextButton.contents.page1')}
              handleSubmit={() => {
                this.setState({ nextLoading: true });
                raiseClaimGAEvent(claimSharedState.claimNumber, 'contents');
                navigate(routes.CLAIM.CONTENTS.PAGE2);
              }}
            />

            <FloatingToolbar saveClaimEnabled={true} />
          </Form>
        </div>
      </div>
    );
  }
}

// Temporarily created this hook wrapper so the component can use react-router hooks
// @TODO Move the hooks into the actual component once it is class => function component
const Page1HookWrapper = (props: Page1Props) => {
  const navigate = useNavigate();
  return <Page1Component {...props} navigate={navigate} />;
};

export const Page1 = connect(
  mapStateToProps,
  mapDispatchToProps
)(translate(['base', 'claim', 'claim/contents'])(Page1HookWrapper));

export default Page1;
