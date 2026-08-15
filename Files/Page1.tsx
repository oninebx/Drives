import * as React from 'react';
import { Form, actions as formActions } from 'react-redux-form';
import { Spinner } from '~/common/components/base';
import { selectors as commonSelectors, ProductApiModels, routes } from '~/common/state';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import {
  actions,
  getAvailableAddresses,
  getQuoteState,
  getTotalBundledItems,
  newQuickUnderwriteActiveQuote,
  newUpdateQuoteState,
  updateLandlordWithHouseState
} from '~/feature/quote/state';
// shared
import { FloatingToolbar, FormFooter, PolicyStartDate, UnderwritingDialog } from '~/feature/quote/shared/components';
import { selectors as sharedSelectors } from '~/feature/quote/shared/state';
import { updateStepperAndQuestions } from '~/feature/quote/shared/utilities';
import { HazardData } from '../../shared/components/dumb/HazardData/HazardData';

// house
import {
  ConstructionDetails,
  ExternalSelfContainedUnit,
  HolidayHomeRented,
  HouseClaims,
  HouseOccupancy,
  HouseQuoteAddressLookup,
  HouseRentedTenants,
  HouseUsedForBusiness,
  NaturalHazard,
  OwnerDetails,
  PreviousHouseClaims,
  ReroofedRelinedRewired,
  SumInsuredAmount,
  TypeOfBusiness
} from '~/feature/quote/house/components';
import type { BundleAddresses, CustomClaimLossDamage } from '~/feature/quote/house/state';
import { predicates, selectors } from '~/feature/quote/house/state';
import { selectors as landlordSelectors } from '~/feature/quote/landlord/state';

// store
import { spacing, Typography } from '@tower/tui';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import type { HazardLevels } from '~/common/state/autorest/PolicyAuth/src';
import { KnownProductType } from '~/common/state/autorest/PolicyAuth/src';
import type { ApplicationState } from '~/root/rootReducer';
import type { AppDispatch } from '~/root/store';
import { AwardLogos } from '../../shared/components/dumb/AwardLogos/AwardLogos';
import ReferenceNumber from '../../shared/components/smart/ReferenceNumber/ReferenceNumber';
import { PropertyConnected } from '../components/question/PropertyType/PropertyConnected';
import { PropertySelfSufficient } from '../components/question/PropertyType/PropertySelfSufficient';
import { PropertyStacked } from '../components/question/PropertyType/PropertyStacked';
import { PropertyType } from '../components/question/PropertyType/PropertyType';
import { useHousePage1ViewModel } from './useHousePage1ViewModel';

const StyledHeaderText = styled(Typography)`
  margin-bottom: ${spacing.lg};
`;
// map properties to component
const mapStateToProps = (state: ApplicationState) => ({
  flags: commonSelectors.getFlags(state),
  authenticated: commonSelectors.isAuthenticated(state),
  houseState: selectors.getQuoteHouseState(state),
  sharedState: sharedSelectors.getQuoteSharedState(state),
  landlordState: landlordSelectors.getQuoteLandlordState(state),
  sharedQuotePromoCode: sharedSelectors.getQuoteSharedState(state).promoCode
    ? sharedSelectors.getQuoteSharedState(state).promoCode
    : '',
  authenticatedCustomerDob: commonSelectors.getCustomerDateofBirth(state),
  isSspEnabled: commonSelectors.isSspQuoteEnabled(),
  bundleAddresses: getAvailableAddresses(state),
  excesses: getQuoteState(state).excesses,
  totalBundledItems: getTotalBundledItems(state),
  quoteState: getQuoteState(state)
});

// map actions to component
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  loadExcesses: (
    policyType: ProductApiModels.KnownTypeOfPolicy.House | ProductApiModels.KnownTypeOfPolicy.Landlord,
    setDefault: boolean
  ) => dispatch(actions.loadExcesses(ProductApiModels.KnownProductType.Home, policyType, setDefault)),
  addPolicies: (houseOrLandlord: string) => dispatch(actions.addPolicies([houseOrLandlord], false)),
  changeOwnerDetails: (modelPath: string, customerDob: string) =>
    dispatch(formActions.change(`${modelPath}.houseDetails.ownerDetails`, customerDob)),
  resetRedirectedFromHouse: (modelPath: string) => dispatch(formActions.reset(`${modelPath}.redirectedFromHouse`)),
  syncCurrentQuotesForStore: () => dispatch(actions.syncCurrentQuotesForStore()),
  addLandlordPolicy: () => dispatch(actions.addPolicies(['landlord'], false, true)),
  updateLandlordWithHouseState: (activeHouseIndex: number) => dispatch(updateLandlordWithHouseState(activeHouseIndex)),
  setInBundle: (sharedModelPath: string) => dispatch(formActions.reset(`${sharedModelPath}.inBundle`)),
  editByPolicyTypeAndIndex: (activeLandlordIndex: number) =>
    dispatch(actions.editPolicyByTypeAndIndex('landlord', activeLandlordIndex, true, false)),
  updateQuoteState: () => dispatch(newUpdateQuoteState()),
  updateProductConfiguration: () => dispatch(actions.updateProductConfiguration()),
  quickUnderwriteActiveQuote: () => dispatch(newQuickUnderwriteActiveQuote),
  saveQuotePartial: () => dispatch(actions.saveQuotesPartial()),
  loadContentsEstimateForQuote: (policyNumber: string) =>
    dispatch(actions.loadContentsEstimateForQuote(policyNumber, KnownProductType.Home)),
  changeHazardLevels: (model: string, result: HazardLevels) => dispatch(formActions.change(`${model}`, result)),
  changeClaimState: (modelPath: string, claimLossDamage: CustomClaimLossDamage[]) =>
    dispatch(formActions.change(`${modelPath}.claims`, claimLossDamage))
});

export interface Page1ComponentProps
  extends Partial<ReturnType<typeof mapStateToProps>>,
  Partial<ReturnType<typeof mapDispatchToProps>>,
  InjectedTranslateProps { }

export const Page1Component = (props: Page1ComponentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, bundleAddresses, sharedQuotePromoCode, sharedState } = props;

  const {
    setPolicies,
    setOwnerDetails,
    loadHouseOrLandlordExcesses,
    changeModelPath,
    handleLandlordTransition,
    loading,
    houseOrLandlord,
    modelPath,
    heading,
    awardsEnabled,
    awards,
    actualState,
    formModelPath,
    hazardDataEnabled,
    formSubmitted,
    holidayHomeRentedValidationValue,
    handleFormFooterSubmit,
    loadHazardDataValues,
    triggerGAEvents
  } = useHousePage1ViewModel({
    ...props,
    navigate,
    location
  });

  React.useEffect(() => {
    setPolicies();
    changeModelPath();
    updateStepperAndQuestions();
    setOwnerDetails();
    loadHouseOrLandlordExcesses();
    triggerGAEvents();
  }, [houseOrLandlord]);

  const propertyType =
    houseOrLandlord === 'house'
      ? props.houseState.houseDetails.propertyType.type
      : props.landlordState.houseDetails.propertyType.type;
  const propertyStacked =
    houseOrLandlord === 'house'
      ? props.houseState.houseDetails.propertyType.share
      : props.landlordState.houseDetails.propertyType.share;

  const referenceNumber = houseOrLandlord === 'house' ? props.houseState.trackingId : props.landlordState.trackingId;
  if (loading) {
    return <Spinner fullPage={true} />;
  }

  return (
    <div id="Page1" className="md-cell md-cell--12">
      <Form model={modelPath} hideNativeErrors className="quote-form quote-form--page1" validateOn="change">
        <StyledHeaderText variant="heading1">{heading}</StyledHeaderText>
        <ReferenceNumber referenceNumber={referenceNumber} />
        {awardsEnabled && <AwardLogos awards={awards} />}
        <HouseQuoteAddressLookup
          modelPath={modelPath}
          formPath={formModelPath}
          houseState={actualState}
          bundleAddresses={bundleAddresses as BundleAddresses[]}
        />
        {predicates.shouldShowPropertyType(actualState) && (
          <PropertyType houseState={actualState} modelPath={modelPath} />
        )}
        {predicates.shouldShowPropertyType(actualState) && propertyType === 'Tinyhouse' && (
          <PropertySelfSufficient houseState={actualState} modelPath={modelPath} />
        )}
        {predicates.shouldShowPropertyType(actualState) && propertyType === 'Townhouse' && (
          <PropertyStacked modelPath={modelPath} houseState={actualState} />
        )}
        {predicates.shouldShowPropertyType(actualState) &&
          propertyType === 'Townhouse' &&
          propertyStacked === false && <PropertyConnected modelPath={modelPath} houseState={actualState} />}
        {predicates.showConstructionDetails(actualState) && (
          <ConstructionDetails
            modelPath={modelPath}
            promoCode={sharedQuotePromoCode}
            isHouseQuote={houseOrLandlord === 'house'}
          />
        )}
        {predicates.showSumInsuredAmount(actualState, t) && (
          <SumInsuredAmount modelPath={modelPath} houseOrLandlordQuote={actualState} onClick={loadHazardDataValues} />
        )}
        {predicates.showReroofedRelinedRewired(actualState, t) && (
          <ReroofedRelinedRewired modelPath={modelPath} houseState={actualState} />
        )}
        {predicates.showNaturalHazard(actualState, t) && (
          <NaturalHazard modelPath={modelPath} houseState={actualState} />
        )}

        {hazardDataEnabled && predicates.showHazardData(actualState, t) && (
          <HazardData
            modelPath={modelPath}
            hazardLevels={actualState.houseDetails.hazardLevels}
            loadHazardData={loadHazardDataValues}
          />
        )}
        {predicates.showExternalSelfContainedUnit(actualState, t) && (
          <ExternalSelfContainedUnit modelPath={modelPath} houseState={actualState} />
        )}
        {/* HouseOccupancy doesn't show if landlord */}
        {predicates.showHouseOccupancy(actualState, t) && (
          <HouseOccupancy modelPath={modelPath} houseState={actualState} />
        )}
        {predicates.showHouseRentedTenants(actualState, t) && (
          <HouseRentedTenants modelPath={modelPath} houseState={actualState} onTransition={handleLandlordTransition} />
        )}
        {predicates.showHolidayHomeRented(actualState, t) && (
          <HolidayHomeRented
            modelPath={modelPath}
            houseState={actualState}
            validationValue={holidayHomeRentedValidationValue}
          />
        )}
        {predicates.showHouseUsedForBusiness(actualState, t) && (
          <HouseUsedForBusiness modelPath={modelPath} houseState={actualState} />
        )}
        {predicates.showTypeOfBusiness(actualState, t) && (
          <TypeOfBusiness modelPath={modelPath} houseState={actualState} />
        )}
        {predicates.showOwnerDetails(actualState, t) && (
          <OwnerDetails
            modelPath={modelPath}
            formModelPath={formModelPath}
            houseState={actualState}
            sharedState={sharedState}
          />
        )}
        {predicates.showPreviousHouseClaims(actualState, t) && (
          <PreviousHouseClaims
            modelPath={modelPath}
            houseState={actualState}
            changeClaimState={props.changeClaimState}
          />
        )}
        {predicates.showClaimLossDamage(actualState, t) && <HouseClaims modelPath={modelPath} />}
        {predicates.showPolicyStartDate(actualState, t) && <PolicyStartDate />}
      </Form>

      {/* save quote dialog */}
      <FloatingToolbar
        disabled={formSubmitted}
        hideChat={!predicates.showConstructionDetails(actualState)}
        hideSaveForLater={!predicates.showConstructionDetails(actualState)}
      />

      {/* underwriting dialog */}
      <UnderwritingDialog
        shouldRaiseGAEvent
        nextRoute={houseOrLandlord === 'house' ? routes.QUOTE.HOUSE.PAGE2 : routes.QUOTE.LANDLORD.PAGE2}
      />

      {predicates.isHousePage1Valid(t)(actualState, sharedState) && (
        <FormFooter
          disabled={formSubmitted}
          validating={formSubmitted}
          submitButtonLabel={t('quote:button.nextCustomise')}
          handleSubmit={handleFormFooterSubmit}
        />
      )}
    </div>
  );
};

export const Page1Container = connect(
  mapStateToProps,
  mapDispatchToProps
)(translate(['base', 'quote', 'quote/house', 'quote/landlord'])(Page1Component));

export default Page1Container;
