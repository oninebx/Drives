import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Form } from 'react-redux-form';
import { useNavigate } from 'react-router';
import { routes } from '~/common/state';
import type { MotorClaimGet } from '~/common/state/autorest/Claims/src';
import { AuthorityReportFire, AuthorityReportPolice, OtherDrivers } from '~/feature/claim/car/components';
import {
  DriverDetails,
  OtherPeopleDetail,
  PoliceAttend,
  TheftSection1,
  TheftSection2
} from '~/feature/claim/car/components/dumb';
import { thunks as carThunks, formPath, modelPath, selectors } from '~/feature/claim/car/state';
import {
  EventDescription,
  EventLocation,
  FloatingToolbar,
  FormFooter,
  PreStepsSummary,
  WitnessSection
} from '~/feature/claim/shared/components';
import { ClaimNumber } from '~/feature/claim/shared/components/dumb';
import { selectors as sharedSelectors } from '~/feature/claim/shared/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import type { ApplicationState } from '~/root/rootReducer';
import type { AppDispatch } from '~/root/store';
interface Page1Props
  extends Partial<ReturnType<typeof mapStateToProps>>,
    Partial<ReturnType<typeof mapDispatchToProps>> {}

// map properties to component
const mapStateToProps = (state: ApplicationState) => ({
  claim: selectors.getClaim(state),
  claimType: sharedSelectors.getClaimType(state),
  policy: sharedSelectors.getPolicyDetails(state),
  description: sharedSelectors.getPolicyDescription(state),
  state: selectors.getBaseState(state),
  showTheftQuestions: selectors.isCauseOfLossTheft(state),
  showYourDriver: selectors.showYourDriverQuestions(state),
  showOtherPersonDetails: selectors.showOtherPersonDetailsQuestions(state),
  showPoliceAttend: selectors.showPoliceAttendQuestions(state),
  showFireAuthorityReport: selectors.showFireAuthorityReport(state),
  showAuthorityReport: selectors.showAuthorityReportQuestions(state),
  showOtherDrivers: selectors.showOtherDriversQuestions(state),
  isOtherDriverInvolved: selectors.isOtherDriverInvolved(state),
  showWitness: selectors.showWitnessQuestions(state),
  missingDate: selectors.getCarDiscoveredMissingDate(state),
  lossDate: selectors.getLossDate(state),
  vehicleMakes: selectors.getVehicleMakes(state),
  backToPreStepsPrevented: sharedSelectors.getBackToPreStepsPrevented(state),
  getEventLocationHeaderLabel: selectors.getEventLocationHeaderLabel(state),
  getEventLocationLabel: selectors.getEventLocationLabel(state)
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  initialisePage1: (
    lossDate: Date,
    missingDate: string,
    vehicleMakes: string[],
    claim: MotorClaimGet,
    backToPreStepsPrevented: boolean
  ) => dispatch(carThunks.initCarPage1(lossDate, missingDate, vehicleMakes, claim, backToPreStepsPrevented))
});

const Page1Loader: React.FC<Page1Props> = (props) => {
  React.useEffect(() => {
    const { lossDate, missingDate, initialisePage1, claim, vehicleMakes, backToPreStepsPrevented } = props;
    initialisePage1(lossDate, missingDate, vehicleMakes, claim, backToPreStepsPrevented);
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, []);
  return <Page1Component {...props} />;
};
const Page1Component: React.FC<Page1Props> = (props) => {
  const {
    state,
    showTheftQuestions,
    claim,
    description,
    showYourDriver,
    showPoliceAttend,
    showAuthorityReport,
    showOtherDrivers,
    showWitness,
    showOtherPersonDetails,
    showFireAuthorityReport,
    isOtherDriverInvolved,
    claimType,
    getEventLocationHeaderLabel,
    getEventLocationLabel
  } = props;
  const [nextLoading, setNextLoading] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="container md-grid">
      <div id="CarPage1" className="md-cell md-cell--12">
        <Form
          model={modelPath}
          hideNativeErrors
          className="claim-form claim-form--page1"
          validateOn="change"
          onSubmit={() => {}}>
          <ClaimNumber claimNumber={claim.claimNumber} />
          <h2 className="page-heading2">{t(`claim/${claimType}:headings.page1`)}</h2>
          <PreStepsSummary
            causeOfLoss={claim.causeOfLoss}
            secondaryCauseOfLoss={claim.secondaryCauseOfLoss}
            claimType={claimType}
            description={description}
            lossDateTime={claim.lossDate}
          />
          {showTheftQuestions ? <TheftSection1 /> : null}
          {showTheftQuestions ? <TheftSection2 claimType={claimType} /> : null}
          {showYourDriver ? (
            <>
              <h2 className="section-heading">{t(`claim/${claimType}:headings.yourDriver`)}</h2>
              <DriverDetails />
            </>
          ) : null}

          {showOtherDrivers ? (
            <>
              <h2 className="section-heading">
                {t(`claim/${claimType}:headings.${isOtherDriverInvolved ? 'otherDriverDetails' : 'driverDetails'}`)}
              </h2>
              <OtherDrivers />
            </>
          ) : null}

          {showOtherPersonDetails ? (
            <>
              <h2 className="section-heading">{t(`claim/${claimType}:headings.otherPeopleDetails`)}</h2>
              <OtherPeopleDetail />
            </>
          ) : null}

          {showFireAuthorityReport ? (
            <>
              <h2 className="section-heading">{t(`claim/${claimType}:headings.fire`)}</h2>
              <AuthorityReportFire modelPath={modelPath} />
            </>
          ) : null}

          {showPoliceAttend || showAuthorityReport ? (
            <h2 className="section-heading">{t(`claim/${claimType}:headings.police`)}</h2>
          ) : null}
          {showPoliceAttend ? <PoliceAttend /> : null}
          {showAuthorityReport ? <AuthorityReportPolice modelPath={modelPath} state={state} /> : null}

          {showWitness ? (
            <>
              <h2 className="section-heading">{t(`claim/${claimType}:headings.witnesses`)}</h2>
              <WitnessSection claimType={claimType} />
            </>
          ) : null}
          <h2 className="section-heading">{t(`claim/${claimType}:headings.${getEventLocationHeaderLabel}`)}</h2>
          <EventLocation
            modelPath={modelPath}
            formPath={formPath}
            translation={`claim/${claimType}:eventLocation.${getEventLocationLabel}`}
            addressState={state.eventLocationAddress}
          />
          <EventDescription />
          <FormFooter
            disabled={nextLoading}
            validating={nextLoading}
            submitButtonLabel={t('claim:footer.nextButton.car.page1')}
            handleSubmit={async () => {
              setNextLoading(true);
              raiseClaimGAEvent(claim.claimNumber, 'car');
              setTimeout(() => {
                navigate(routes.CLAIM.CAR.PAGE2);
              }, 0);
            }}
          />
          <FloatingToolbar saveClaimEnabled={true} />
        </Form>
      </div>
    </div>
  );
};

export const Page1 = connect(mapStateToProps, mapDispatchToProps)(Page1Loader);

export default Page1;
