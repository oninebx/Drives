import * as lodash from 'lodash';
import type { FieldState } from 'react-redux-form';
import { actions as formActions } from 'react-redux-form';
import type { Location } from 'react-router';
import type { Dispatch } from 'redux';
import type {
  AddressDetailsResponse,
  Customer,
  CustomMotorParty,
  InstallmentResults,
  PolicyBundleApiModels
} from '~/common/state';
import {
  commonActions,
  selectors as commonSelectors,
  thunks as commonThunks,
  getDefaultExcess,
  GLOBAL_ERROR,
  OTHER_INTERESTED_PARTY,
  PaymentApiModels,
  PolicyApiModels,
  ProductApiModels,
  routes,
  services,
  XBrandId
} from '~/common/state';
import type { UpdatePaymentDetailsRequest } from '~/common/state/autorest/Policy/src';
import { KnownHomeTypeOfPolicy, KnownTypeOfPolicy } from '~/common/state/autorest/Policy/src';
import type { PrepareHomeOptionalParams, UpdateHomeOptionalParams } from '~/common/state/autorest/PolicyAuth/src';
import type {
  CreateBundleOptionalParams,
  CreateUpdateBundleResponse,
  PhoneNumber,
  SendResumeUrlOptionalParams,
  UpdateBundleOptionalParams
} from '~/common/state/autorest/PolicyBundle/src/models';
import type { ProductType, ReplacedPolicy } from '~/common/state/autorest/PolicyBundleAuth/src';
import type {
  CrossSellEstimate,
  GetContentsEstimateForQuoteResponse,
  GetHouseEstimateForQuoteResponse
} from '~/common/state/autorest/PolicyCrossSell/src';
import { KnownProductType } from '~/common/state/autorest/PolicyCrossSell/src';
import type { PolicySummary } from '~/common/state/autorest/PolicySummary/src';
import type { GetHomeCoveragesOptionalParams, GetMotorExcessesResponse } from '~/common/state/autorest/Product/src';
import type { FeatureFlags } from '~/common/state/flags';
import {
  billingService,
  getDefaultRequestOptions,
  paymentService,
  policyCrossSellService,
  policyCrossSellWithAccessToken,
  productService
} from '~/common/state/services';
import { moment, momentNZ } from '~/common/twr-moment/twr-moment';
import {
  capitalize,
  formatPrice,
  getAnnualFirstPaymentDate,
  getCurrencySymbol,
  getFunctionName,
  isEmpty,
  isTypeWithKeys,
  logApiError,
  logError
} from '~/common/utilities';
import * as localeUtils from '~/common/utilities/localeUtils';
import { getActiveCampaignFromDxp } from '~/feature/quote/shared/campaigns/getActiveCampaign';
import { validatePromoCodeforPolicyTypeAndCoverType } from '~/feature/quote/shared/campaigns/validatePromoCodeforPolicyTypeAndCoverType';
import { getQuoteSharedState, isAuthenticatedAndSavedPaymentIsAllowed } from '~/feature/quote/shared/state/selectors';
import { getPolicyWordingUrls } from '~/feature/quote/state/actions/getPolicyWordingUrls';
import {
  quickRateBoatQuote,
  quickRateCarQuote,
  quickRateCtpQuote,
  quickRateHouseQuote
} from '~/feature/quote/state/actions/quickRate';
import { resumeQuotes } from '~/feature/quote/state/actions/resume';
import { updateActiveQuoteByActiveIndex } from '~/feature/quote/state/actions/updateActiveQuoteByActiveIndex';
import { updateUiFromSavedQuotes } from '~/feature/quote/state/actions/updateUiFromSavedQuotes';
import { getCurrentQuoteByActiveIndex as getCurrentQuoteByActiveIndexOriginal } from '~/feature/quote/state/getCurrentQuoteByActiveIndex';
import type {
  QuoteBundleTypes as QuoteBundleTypesOriginal,
  QuotePolicyTypes as QuotePolicyTypesOriginal,
  QuoteTypes as QuoteTypesOriginal
} from '~/feature/quote/state/types';
import { actionTypes } from '~/feature/quote/state/types';
import towerHistory from '~/root/history';
import { t } from '~/root/i18n';
import type { ApplicationState, AppThunk } from '~/root/rootReducer';
import type { AppDispatch } from '~/root/store';
import type { QuoteBoatsState } from './boat/state';
import { selectors as boatSelectors, getDefaultQuoteBoatsState } from './boat/state';
import { modelPath as boatModelPath } from './boat/state/paths';
import type { QuoteCarState } from './car/state';
import { selectors as carSelectors, getDefaultQuoteCarState } from './car/state';
import { modelPath as carModelPath } from './car/state/paths';
import type { QuoteContentsState } from './contents/state';
import { selectors as contentsSelectors, getDefaultQuoteContentsState } from './contents/state';
import { modelPath as contentsModelPath } from './contents/state/paths';
import { getQuoteContentsState, livesInBarracks } from './contents/state/selectors';
import type { QuoteCtpState } from './ctp/state';
import { selectors as ctpSelectors, getDefaultQuoteCtpState } from './ctp/state';
import { modelPath as ctpModelPath } from './ctp/state/paths';
import type { BundleAddresses, QuoteHouseState } from './house/state';
import { getDefaultQuoteHouseState, selectors as houseSelectors } from './house/state';
import { modelPath as houseModelPath } from './house/state/paths';
import { getCityText } from './house/state/selectors';
import type { QuoteLandlordsState } from './landlord/state';
import { getDefaultQuoteLandlordsState, selectors as landlordSelectors } from './landlord/state';
import { modelPath as landlordModelPath } from './landlord/state/paths';
import { productToHomeExcessApiType, productToMotorExcessApiType, QuoteTransformer } from './mapper';
import type { QuoteMotorbikeState } from './motorbike/state';
import { getDefaultQuoteMotorbikeState, modelPath as motorbikeModelPath } from './motorbike/state';
import type { AnonymousUserInfo, QuoteSharedState } from './shared/state';
import { modelPath, selectors as sharedSelectors } from './shared/state';
import { validatePromoCode } from './shared/state/thunks';
import { getInterestedPartyDetails } from './state/actions/getInterestedPartyDetails';
import { getSaveQuotePromises } from './state/actions/getSaveQuotePromise';
import { quickRateBoatQuotes } from './state/actions/quickRate/quickRateBoatQuotes';
import { quickRateCarQuotes } from './state/actions/quickRate/quickRateCarQuotes';
import { quickRateCtpQuotes } from './state/actions/quickRate/quickRateCtpQuotes';
import { quickRateHouseQuotes } from './state/actions/quickRate/quickRateHouseQuotes';
import { quickRateMotorbikeQuotes } from './state/actions/quickRate/quickRateMotorbikeQuote';
import { quickUnderwriteAllQuotes } from './state/actions/quickUnderwrite/quickUnderwriteAllQuotes';
import { updatePolicyCounts } from './state/actions/updatePolicyCounts';
import type { QuoteViewModel } from './state/QuoteViewModel';
import { activeAgency } from '~/common/extensions/extensions';
import { KnownBrandType } from '~/common/state/autorest/Policy/src';
import { isBrand } from '~/common/state/selectors';

export const DEFAULT_EXCESS = 500;

export enum ProductUIType {
  Car = 'car',
  House = 'house',
  Contents = 'contents',
  Landlord = 'landlord',
  Boat = 'boat',
  Motorbike = 'motorbike',
  Ctp = 'compulsoryThirdParty'
}

type Excesses = Record<ProductUIType, number[]>;

interface PolicyAddress {
  text: string;
  addressReference: number;
}

export const productUITypes = Object.values(ProductUIType);

const isCreateBundleResult = isTypeWithKeys<CreateUpdateBundleResponse>('bundleId');

const isMotorQuote = isTypeWithKeys<PolicyApiModels.MotorQuote>('risk');

const isHomeQuote = isTypeWithKeys<PolicyApiModels.HomeQuote>('risk');

const createProductUITypeKey = (productType: ProductApiModels.ProductType, policyType: ProductApiModels.TypeOfPolicy) =>
  `${productType}_${policyType}`;

const productUITypeMap = {
  [createProductUITypeKey(ProductApiModels.KnownProductType.Motor, ProductApiModels.KnownTypeOfPolicy.Commercial)]:
    ProductUIType.Car,
  [createProductUITypeKey(ProductApiModels.KnownProductType.Motor, ProductApiModels.KnownTypeOfPolicy.Personal)]:
    ProductUIType.Car,
  [createProductUITypeKey(ProductApiModels.KnownProductType.Motor, ProductApiModels.KnownTypeOfPolicy.Boat)]:
    ProductUIType.Boat,
  [createProductUITypeKey(
    ProductApiModels.KnownProductType.Motor,
    ProductApiModels.KnownTypeOfPolicy.CompulsoryThirdParty
  )]: ProductUIType.Ctp,
  [createProductUITypeKey(ProductApiModels.KnownProductType.Home, ProductApiModels.KnownTypeOfPolicy.Contents)]:
    ProductUIType.Contents,
  [createProductUITypeKey(ProductApiModels.KnownProductType.Home, ProductApiModels.KnownTypeOfPolicy.House)]:
    ProductUIType.House,
  [createProductUITypeKey(ProductApiModels.KnownProductType.Home, ProductApiModels.KnownTypeOfPolicy.Landlord)]:
    ProductUIType.Landlord
};

export const modelPathMap = {
  [ProductUIType.Car]: carModelPath,
  [ProductUIType.Boat]: boatModelPath,
  [ProductUIType.Motorbike]: motorbikeModelPath,
  [ProductUIType.Contents]: contentsModelPath,
  [ProductUIType.House]: houseModelPath,
  [ProductUIType.Landlord]: landlordModelPath,
  [ProductUIType.Ctp]: ctpModelPath
};

const policyToProductMap = {
  [ProductApiModels.KnownTypeOfPolicy.Commercial]: ProductUIType.Car,
  [ProductApiModels.KnownTypeOfPolicy.Personal]: ProductUIType.Car,
  [ProductApiModels.KnownTypeOfPolicy.Boat]: ProductUIType.Boat,
  [ProductApiModels.KnownTypeOfPolicy.CompulsoryThirdParty]: ProductUIType.Ctp,
  [ProductApiModels.KnownTypeOfPolicy.Contents]: ProductUIType.Contents,
  [ProductApiModels.KnownTypeOfPolicy.House]: ProductUIType.House,
  [ProductApiModels.KnownTypeOfPolicy.Landlord]: ProductUIType.Landlord
};

/** used to stop if things fail */
let runningAsyncReq = false;

/**
 * SELECTORS
 */
export const getQuoteState = (state: ApplicationState) => {
  return state.quote;
};

export const getCrossSellEstimate = (state: ApplicationState): CrossSellEstimate => {
  return state.quote.crossSellEstimate;
};

export const getProductUIType = (
  productType: ProductApiModels.ProductType,
  policyType: ProductApiModels.TypeOfPolicy
) => {
  const key = createProductUITypeKey(productType, policyType);

  return productUITypeMap[key];
};

export const getValuableItemsThreshold = (contentsState: QuoteContentsState, newCoverageType?: string) => {
  const coverageType = newCoverageType || contentsState.coverageType;

  return contentsState.packageTypes.find((x) => x.package === coverageType).options.valuableItems as {
    art: { minimum: number; maximum: number };
    collections: { minimum: number; maximum: number };
    jewelry: { minimum: number; maximum: number };
    mobile: { minimum: number; maximum: number };
    other: { minimum: number; maximum: number };
    spectacles?: { minimum: number; maximum: number };
  };
};

export const getExcessByType = (
  state: ApplicationState,
  productType: ProductApiModels.ProductType,
  policyType: ProductApiModels.TypeOfPolicy
) => {
  return state.quote.excesses[getProductUIType(productType, policyType)];
};

export const getProductTypes = (state: ApplicationState) => {
  return state.quote.productTypes.filter(
    ({ typeOfPolicy }) => typeOfPolicy !== ProductApiModels.KnownTypeOfPolicy.Boat || t('quote:config.q2bBoat')
  );
};

export const defaultExcesses = productUITypes.reduce((prev, curr) => ({ ...prev, [curr]: [] }), {}) as Excesses;

/**
 * get total amount of bundled items
 * @param state
 */
export const getTotalBundledItems = (state: ApplicationState) => {
  const { cars = [], houses = [], contents = [], landlords = [], boats = [], motorbikes = [], ctps = [] } = state.quote;
  return (
    cars.length + houses.length + contents.length + landlords.length + boats.length + motorbikes.length + ctps.length
  );
};

export const getPolicyDescriptionInterestedPartiesList = (state: ApplicationState) => {
  const { cars = [], houses = [], contents = [], landlords = [], boats = [], ctps = [] } = state.quote;
  const allQuotes = [...cars, ...houses, ...landlords, ...contents, ...boats, ...ctps];
  const list: PolicyDescriptionInterestedPartiesItem[] = [];
  allQuotes.forEach((quote) => {
    let description = capitalize(quote.policyType) + ': ';
    if (quote.policyType === 'landlord') {
      description = "Landlord's House: ";
    }
    if (quote.policyType === 'car') {
      const carDetails = (quote as QuoteCarState).carDetails;
      description += carDetails.make + ' ' + carDetails.model + ' ' + carDetails.year;
    } else if (quote.policyType === 'boat') {
      description += boatSelectors.formattedBoatDetails(quote as QuoteBoatsState);
    } else if (quote.policyType === 'compulsoryThirdParty') {
      description += ctpSelectors.getCtpPolicyDescription(quote as QuoteCtpState);
    } else {
      description += houseSelectors.houseAddressFormatted(quote as QuoteHouseState);
    }
    list.push({
      policyNumber: quote.policyNumber,
      description: description,
      interestedParties: quote.interestedParties
    });
  });
  return list;
};

export const hasCarBusinessTradespersonPolicy = (state: ApplicationState) => {
  const { cars } = state.quote;
  let result = false;

  cars.forEach((car) => {
    if (
      (car.vehicleUsedForBusiness === 'business' || car.vehicleUsedForBusiness === 'sometimes') &&
      car.businessUse === PolicyApiModels.KnownVehicleUsage.TradesPerson
    ) {
      result = true;
      return;
    }
  });

  return result;
};

export const isFinancialInterstedPartyLinkedToPolicy = (
  state: ApplicationState,
  financialInterestedPartyId: string,
  name: string,
  description: string
) => {
  const { cars = [], boats = [], houses = [], contents = [], landlords = [], ctps = [] } = state.quote;
  const allQuotes = [...cars, ...boats, ...houses, ...landlords, ...contents, ...ctps];
  let linked = false;
  allQuotes.forEach((quote) => {
    let interestedPartyIndex: number;
    if (financialInterestedPartyId === OTHER_INTERESTED_PARTY) {
      interestedPartyIndex = quote.interestedParties.findIndex((x) => {
        if (x.otherInterestedParty) {
          return x.otherInterestedParty.name === name || x.otherInterestedParty.name === description;
        } else {
          return false;
        }
      });
    } else {
      interestedPartyIndex = quote.interestedParties.findIndex(
        (x) => x.interestedPartyId === financialInterestedPartyId
      );
    }
    if (interestedPartyIndex > -1) {
      linked = true;
    }
  });
  return linked;
};

/**
 * as above but ensure policy numbers exist
 */
export const getTotalBundledItemsWithPolicyNumbers = (state: ApplicationState) => {
  const { cars, houses, contents, landlords, boats, ctps = [] } = state.quote;
  const allItems = []
    .concat(cars)
    .concat(boats)
    .concat(houses)
    .concat(contents)
    .concat(landlords)
    .concat(ctps) as QuoteTypes[];
  const totalBundleItemsSelected = allItems.filter((x) => x.policyNumber !== null);
  return totalBundleItemsSelected.length;
};

/**
 * get total amount of bundled items plus number of policies customer specifies they have
 * @param state
 */
export const getTotalPoliciesBundleBuilder = (state: ApplicationState) => {
  const { policyCount } = state.myForms.sharedQuote;
  const totalBundleItemsSelected = getTotalBundledItems(state);
  return policyCount + totalBundleItemsSelected;
};

/**
 * function to determine discount...
 * @param state
 */
export const getTotalDiscount = (state: ApplicationState) => {
  const { policyCount } = state.myForms.sharedQuote;
  if (policyCount === 2) {
    return 10;
  } else if (policyCount > 2) {
    return 20;
  } else {
    return 0;
  }
};

/**
 * get the first quote from all possible quotes
 * will do in order from car, house, contents than landlord
 * @param quoteState
 */
export const getFirstQuote = (quoteState: QuoteState) => {
  const { cars, houses, contents, landlords, boats, motorbikes, ctps } = quoteState;

  if (cars.length > 0) {
    return { type: 'car', item: cars[0], index: 0 };
  } else if (houses.length > 0) {
    return { type: 'house', item: houses[0], index: 0 };
  } else if (contents.length > 0) {
    return { type: 'contents', item: contents[0], index: 0 };
  } else if (landlords.length > 0) {
    return { type: 'landlord', item: landlords[0], index: 0 };
  } else if (boats?.length > 0) {
    return { type: 'boat', item: boats[0], index: 0 };
  } else if (motorbikes?.length > 0) {
    return { type: 'motorbike', item: motorbikes[0], index: 0 };
  } else if (ctps?.length > 0) {
    return { type: 'compulsoryThirdParty', item: ctps[0], index: 0 };
  } else {
    return null;
  }
};

/**
 * Get the current quote being edited by the user based on the actual route
 * @param quoteState
 * @deprecated This is now a backward reference. Please prefer getCurrentQuoteByActiveIndex
 */
export const getCurrentQuoteByActiveIndex = getCurrentQuoteByActiveIndexOriginal;
/**
 * Get the current quote being edited by the user based on the actual route
 * @param quoteState
 */
export const getCurrentQuoteByRoute = (quoteState: QuoteState) => {
  const {
    cars,
    boats,
    motorbikes,
    houses,
    contents,
    landlords,
    ctps,
    activeCarQuoteIndex,
    activeBoatsQuoteIndex,
    activeMotorbikeQuoteIndex,
    activeHouseQuoteIndex,
    activeContentsQuoteIndex,
    activeLandlordsQuoteIndex,
    activeCtpsQuoteIndex
  } = quoteState;
  if (location.pathname.indexOf(routes.QUOTE.CAR.BASE) > -1) {
    return { type: 'car', item: cars[activeCarQuoteIndex], index: activeCarQuoteIndex };
  } else if (location.pathname.indexOf(routes.QUOTE.BOAT.BASE) > -1) {
    return { type: 'boat', item: boats[activeBoatsQuoteIndex], index: activeBoatsQuoteIndex };
  } else if (location.pathname.indexOf(routes.QUOTE.MOTORBIKE.BASE) > -1) {
    return { type: 'motorbike', item: motorbikes[activeMotorbikeQuoteIndex], index: activeMotorbikeQuoteIndex };
  } else if (location.pathname.indexOf(routes.QUOTE.HOUSE.BASE) > -1) {
    return { type: 'house', item: houses[activeHouseQuoteIndex], index: activeHouseQuoteIndex };
  } else if (location.pathname.indexOf(routes.QUOTE.CONTENTS.BASE) > -1) {
    return { type: 'contents', item: contents[activeContentsQuoteIndex], index: activeContentsQuoteIndex };
  } else if (location.pathname.indexOf(routes.QUOTE.LANDLORD.BASE) > -1) {
    return { type: 'landlord', item: landlords[activeLandlordsQuoteIndex], index: activeLandlordsQuoteIndex };
  } else if (ctps && location.pathname.indexOf(routes.QUOTE.COMPULSORYTHIRDPARTY.BASE) > -1) {
    return { type: 'ctp', item: ctps[activeCtpsQuoteIndex], index: activeCtpsQuoteIndex };
  } else {
    return null;
  }
};

/**
 * Gets the active quote based on active index
 * @param quoteState
 */
export const getCurrentActiveQuote = (quoteState: QuoteState) => {
  const {
    cars,
    houses,
    contents,
    landlords,
    boats,
    motorbikes,
    ctps,
    activeCarQuoteIndex,
    activeHouseQuoteIndex,
    activeContentsQuoteIndex,
    activeLandlordsQuoteIndex,
    activeBoatsQuoteIndex,
    activeMotorbikeQuoteIndex,
    activeCtpsQuoteIndex
  } = quoteState;
  if (activeCarQuoteIndex > -1) {
    return { type: 'car', item: cars[activeCarQuoteIndex], index: activeCarQuoteIndex };
  } else if (activeHouseQuoteIndex > -1) {
    return { type: 'house', item: houses[activeHouseQuoteIndex], index: activeHouseQuoteIndex };
  } else if (activeContentsQuoteIndex > -1) {
    return { type: 'contents', item: contents[activeContentsQuoteIndex], index: activeContentsQuoteIndex };
  } else if (activeLandlordsQuoteIndex > -1) {
    return { type: 'landlord', item: landlords[activeLandlordsQuoteIndex], index: activeLandlordsQuoteIndex };
  } else if (activeBoatsQuoteIndex > -1) {
    return { type: 'boat', item: boats[activeBoatsQuoteIndex], index: activeBoatsQuoteIndex };
  } else if (activeMotorbikeQuoteIndex > -1) {
    return { type: 'motorbike', item: motorbikes[activeMotorbikeQuoteIndex], index: activeMotorbikeQuoteIndex };
  } else if (activeCtpsQuoteIndex > -1) {
    return { type: 'ctp', item: ctps[activeCtpsQuoteIndex], index: activeCtpsQuoteIndex };
  } else {
    return null;
  }
};

/**
 * Gets the quote by type and index
 */
export const getQuoteByTypeAndIndex = (quoteState: QuoteState, name: string, index: number) => {
  const { cars = [], houses = [], contents = [], landlords = [], boats = [], motorbikes = [], ctps = [] } = quoteState;
  if (name === 'car') {
    return cars[index];
  } else if (name === 'house') {
    return houses[index];
  } else if (name === 'contents') {
    return contents[index];
  } else if (name === 'landlord') {
    return landlords[index];
  } else if (name === 'boat') {
    return boats[index];
  } else if (name === 'motorbike') {
    return motorbikes[index];
  } else if (name === 'ctp') {
    return ctps[index];
  } else {
    return null;
  }
};

/**
 * Utility method to get the ADD action type by name
 * @param name
 */
export const getAddActionTypeByName = (name: string) => {
  if (name === 'car') {
    return actionTypes.ADD_CAR;
  } else if (name === 'house') {
    return actionTypes.ADD_HOUSE;
  } else if (name === 'contents') {
    return actionTypes.ADD_CONTENTS;
  } else if (name === 'landlord') {
    return actionTypes.ADD_LANDLORD;
  } else if (name === 'boat') {
    return actionTypes.ADD_BOAT;
  } else if (name === 'motorbike') {
    return actionTypes.ADD_MOTORBIKE;
  } else if (name === 'ctp') {
    return actionTypes.ADD_CTP;
  } else {
    return null;
  }
};

/**
 * Utility method to get the EDIT action type by name
 * @param name
 */
export const getEditActionTypeByName = (name: string) => {
  if (name === 'car') {
    return actionTypes.EDIT_CAR;
  } else if (name === 'house') {
    return actionTypes.EDIT_HOUSE;
  } else if (name === 'contents') {
    return actionTypes.EDIT_CONTENTS;
  } else if (name === 'landlord') {
    return actionTypes.EDIT_LANDLORD;
  } else if (name === 'boat') {
    return actionTypes.EDIT_BOAT;
  } else if (name === 'motorbike') {
    return actionTypes.EDIT_MOTORBIKE;
  } else if (name === 'compulsoryThirdParty') {
    return actionTypes.EDIT_CTP;
  } else {
    return null;
  }
};

export const getSetActiveIndexActionTypeByType = (name: string) => {
  if (name === 'car') {
    return actionTypes.SET_ACTIVE_CAR;
  } else if (name === 'house') {
    return actionTypes.SET_ACTIVE_HOUSE;
  } else if (name === 'contents') {
    return actionTypes.SET_ACTIVE_CONTENTS;
  } else if (name === 'landlord') {
    return actionTypes.SET_ACTIVE_LANDLORD;
  } else if (name === 'boat') {
    return actionTypes.SET_ACTIVE_BOAT;
  } else if (name === 'motorbike') {
    return actionTypes.SET_ACTIVE_MOTORBIKE;
  } else if (name === 'compulsoryThirdParty') {
    return actionTypes.SET_ACTIVE_CTP;
  } else {
    return null;
  }
};

/**
 * Utility method to get the REMOVE action type by name
 * @param name
 */
export const getRemoveActionTypeByName = (name: string) => {
  if (name === 'car') {
    return actionTypes.REMOVE_CAR;
  } else if (name === 'house') {
    return actionTypes.REMOVE_HOUSE;
  } else if (name === 'contents') {
    return actionTypes.REMOVE_CONTENTS;
  } else if (name === 'landlord') {
    return actionTypes.REMOVE_LANDLORD;
  } else if (name === 'boat') {
    return actionTypes.REMOVE_BOAT;
  } else if (name === 'motorbike') {
    return actionTypes.REMOVE_MOTORBIKE;
  } else if (name === 'ctp') {
    return actionTypes.REMOVE_CTP;
  } else {
    return null;
  }
};

/**
 * Utility method to get the amount of quotes by name
 * @param name
 * @param state
 */
export const getAmountOfQuotesByName = (name: string, state: ApplicationState) => {
  const quoteState = getQuoteState(state);
  if (name === 'car') {
    return quoteState.cars.length;
  } else if (name === 'house') {
    return quoteState.houses.length;
  } else if (name === 'contents') {
    return quoteState.contents.length;
  } else if (name === 'landlord') {
    return quoteState.landlords.length;
  } else if (name === 'boat') {
    return quoteState.boats.length;
  } else if (name === 'motorbike') {
    return quoteState.motorbikes.length;
  } else if (name === 'compulsoryThirdParty') {
    return quoteState.ctps.length;
  } else {
    return 0;
  }
};

export const getFirstNewlyAddedQuoteIdx = (name: string, state: ApplicationState) => {
  const quoteState = getQuoteState(state);
  if (name === 'car') {
    return quoteState.cars.findIndex((x) => !x.policyNumber);
  } else if (name === 'house') {
    return quoteState.houses.findIndex((x) => !x.policyNumber);
  } else if (name === 'contents') {
    return quoteState.contents.findIndex((x) => !x.policyNumber);
  } else if (name === 'landlord') {
    return quoteState.landlords.findIndex((x) => !x.policyNumber);
  } else if (name === 'boat') {
    return quoteState.boats.findIndex((x) => !x.policyNumber);
  } else if (name === 'motorbike') {
    return quoteState.motorbikes.findIndex((x) => !x.policyNumber);
  } else if (name === 'ctp') {
    return quoteState.ctps.findIndex((x) => !x.policyNumber);
  } else {
    return 0;
  }
};

/**
 * Method to get the actual coverages a car has based on form data
 */
export const getQuoteCarCoverages = (coverages: PolicyApiModels.CarCoveragesQuote) => {
  const vehicleRoadWiseBenefitCoverage = coverages.vehicleRoadWiseBenefitCoverage === true;
  let vehicleSignwritingCoverage = false;
  if (coverages.vehicleSignwritingCoverage && coverages.vehicleSignwritingCoverage.limitAmount) {
    vehicleSignwritingCoverage = true;
  }
  let vehicleTrailersCoverage = false;
  if (
    coverages.vehicleTrailersCoverage &&
    coverages.vehicleTrailersCoverage.limitAmount &&
    coverages.vehicleTrailersCoverage.trailerRegistrationNo
  ) {
    vehicleTrailersCoverage = true;
  }
  const vehicleWindscreenAndWindowGlassExcessBuyOutCoverage =
    coverages.vehicleWindscreenAndWindowGlassExcessBuyOutCoverage === true;

  let vehicleRentalCarSubstituteTransportCoverage = false;
  if (
    coverages.vehicleRentalCarSubstituteTransportCoverage &&
    coverages.vehicleRentalCarSubstituteTransportCoverage.selectedInd
  ) {
    vehicleRentalCarSubstituteTransportCoverage = true;
  }
  const actualCoverages = {
    vehicleRentalCarSubstituteTransportCoverage,
    vehicleRoadWiseBenefitCoverage,
    vehicleWindscreenAndWindowGlassExcessBuyOutCoverage,
    vehicleTrailersCoverage,
    vehicleSignwritingCoverage
  } as AddonChecked;

  return actualCoverages;
};

/**
 * Method to get the actual coverages a car has based on form data
 */
export const getQuoteBoatCoverages = (coverages: PolicyApiModels.BoatCoveragesQuote) => {
  let boatRecreationalEquipmentCoverage = false;
  if (coverages.recreationalEquipmentCoverage && coverages.recreationalEquipmentCoverage.selectedInd) {
    boatRecreationalEquipmentCoverage = true;
  }

  let boatTrailerCoverage = false;
  if (coverages.boatTrailerCoverage && coverages.boatTrailerCoverage.selectedInd) {
    boatTrailerCoverage = true;
  }

  return {
    boatTrailerCoverage: boatTrailerCoverage,
    recreationalEquipmentCoverage: boatRecreationalEquipmentCoverage,
    boatLaidupCoverage: false
  } as AddonChecked;
};

/**
 * Method to get the actual coverages a motorbike has based on form data
 */
export const getQuoteMotorbikeCoverages = (coverages: PolicyApiModels.MotorbikeCoveragesQuote) => {
  let vehicleRentalCarSubstituteTransportCoverage = false;
  if (
    coverages.vehicleRentalCarSubstituteTransportCoverage &&
    coverages.vehicleRentalCarSubstituteTransportCoverage.selectedInd
  ) {
    vehicleRentalCarSubstituteTransportCoverage = true;
  }

  const actualCoverages = {
    vehicleRentalCarSubstituteTransportCoverage
  } as AddonChecked;

  return actualCoverages;
};

/**
 * Method to get the actual coverages for a house/landlord quote has based on form data
 */
export const getQuoteHouseCoverages = (coverages: PolicyApiModels.HouseCoveragesQuote) => {
  const result = {
    specialFeatures: false,
    gardenRetainingWalls: false
  } as AddonChecked;
  if (coverages && coverages.scheduledPropertyCoverage && coverages.scheduledPropertyCoverage.house) {
    const { specialFeatures } = coverages.scheduledPropertyCoverage.house;
    if (specialFeatures && specialFeatures.items.length > 0) {
      const wall = specialFeatures.items.filter(
        (x) => x.description === PolicyApiModels.KnownSpecialFeature.GardenRetainingWall
      );
      const nonWall = specialFeatures.items.filter(
        (x) => x.description !== PolicyApiModels.KnownSpecialFeature.GardenRetainingWall
      );
      result['specialFeatures'] = nonWall.length > 0;
      result['gardenRetainingWalls'] = wall.length > 0;
    }
  }
  if (commonSelectors.isPacific()) {
    result['cycloneCoverage'] = false;
    if (
      coverages &&
      coverages.cycloneCoverage &&
      coverages.cycloneCoverage.selectedInd &&
      (coverages.cycloneCoverage.cycloneAutoApprovedInd || coverages.cycloneCoverage.cycloneCertificateInd)
    ) {
      result['cycloneCoverage'] = true;
    }

    result['pacificEarthquakeCoverage'] = false;
    if (coverages && coverages.pacificEarthquakeCoverage && coverages.pacificEarthquakeCoverage.selectedInd) {
      result['pacificEarthquakeCoverage'] = true;
    }

    result['landlordsWhitewareAndWindowCoveringsCoverage'] = false;
    if (
      coverages &&
      coverages.landlordsWhitewareAndWindowCoveringsCoverage &&
      coverages.landlordsWhitewareAndWindowCoveringsCoverage.selectedInd
    ) {
      result['landlordsWhitewareAndWindowCoveringsCoverage'] = true;
    }

    result['lossOfRentForDamageToYourHouseOptionalCoverage'] = false;
    if (
      coverages &&
      coverages.lossOfRentForDamageToYourHouseOptionalCoverage &&
      coverages.lossOfRentForDamageToYourHouseOptionalCoverage.selectedInd
    ) {
      result['lossOfRentForDamageToYourHouseOptionalCoverage'] = true;
    }

    result['domesticWorkmensCompensationCoverage'] = false;
    if (
      coverages &&
      coverages.domesticWorkmensCompensationOptionalCoverage &&
      coverages.domesticWorkmensCompensationOptionalCoverage.selectedInd
    ) {
      result['domesticWorkmensCompensationCoverage'] = true;
    }
  }

  return result;
};

/**
 * Method to get the actual coverages for a house/landlord qoute has based on form data
 */
export const getQuoteContentsCoverages = (coverages: PolicyApiModels.ContentsCoveragesQuote) => {
  let hasJewlery = false;
  let hasFineArts = false;
  let hasCollections = false;
  let hasOtherSpecifiedItems = false;
  let hasMobilePhone = false;
  let hasPacificEarthquakeCoverage = false;
  let hasCycloneCoverage = false;
  let hasDomesticWorkmensCompensationCoverage = false;

  if (coverages && coverages.scheduledPropertyCoverage && coverages.scheduledPropertyCoverage.contents) {
    const { collections, fineArts, specifiedMobilePhones, jewelry, otherSpecifiedItems } =
      coverages.scheduledPropertyCoverage.contents;
    hasJewlery = jewelry && jewelry.items && jewelry.items.length > 0;
    hasFineArts = fineArts && fineArts.items && fineArts.items.length > 0;
    hasCollections = collections && collections.items && collections.items.length > 0;
    if (specifiedMobilePhones) {
      hasMobilePhone = specifiedMobilePhones && specifiedMobilePhones.items && specifiedMobilePhones.items.length > 0;
    }
    hasOtherSpecifiedItems = otherSpecifiedItems && otherSpecifiedItems.items && otherSpecifiedItems.items.length > 0;
  }

  if (commonSelectors.isPacific()) {
    if (coverages && coverages.pacificEarthquakeCoverage && coverages.pacificEarthquakeCoverage.selectedInd) {
      hasPacificEarthquakeCoverage = true;
    }
    if (coverages && coverages.cycloneCoverage && coverages.cycloneCoverage.selectedInd) {
      hasCycloneCoverage = true;
    }
    if (
      coverages &&
      coverages.domesticWorkmensCompensationOptionalCoverage &&
      coverages.domesticWorkmensCompensationOptionalCoverage.selectedInd
    ) {
      hasDomesticWorkmensCompensationCoverage = !!coverages?.domesticWorkmensCompensationOptionalCoverage?.selectedInd;
    }
  }

  let addonChecked = {
    jewelry: hasJewlery,
    fineArts: hasFineArts,
    collections: hasCollections,
    specifiedMobilePhones: hasMobilePhone,
    specifiedSpectaclesHearingAids: false, // TODO: Temporary, until spectacles story is merged
    otherSpecifiedItems: hasOtherSpecifiedItems,
    cycloneCoverage: hasCycloneCoverage,
    pacificEarthquakeCoverage: hasPacificEarthquakeCoverage,
    domesticWorkmensCompensationCoverage: hasDomesticWorkmensCompensationCoverage
  } as AddonChecked;

  if (localeUtils.getShowSpectalesItem()) {
    const hasSpectacles =
      coverages?.scheduledPropertyCoverage?.contents?.specifiedSpectaclesHearingAids?.items?.length > 0;
    addonChecked = { ...addonChecked, specifiedSpectaclesHearingAids: hasSpectacles };
  }
  return addonChecked;
};

/**
 * Method that will filter the rates by the coverage variation by the "inverse" of the coverage property passed in
 * E.g. if the user has trailer selected, we need to filter the rates by trailer as false
 * Than simply gets the absolute difference between the current fortnightly premium and the addon fortnightly premium
 * @param rates
 * @param baseCoverages
 * @param coverageVariation
 * @param estimatedFortnightlyBillablePremium
 */
export const getAddonFortnightlyCostFromRates = (
  rates: PolicyApiModels.MotorRateQuoteResponse[] | PolicyApiModels.HomeRateQuoteResponse[],
  baseCoverages: AddonChecked,
  coverageVariation: string,
  estimatedFortnightlyBillablePremium: number
) => {
  const newFilter = { ...baseCoverages };
  newFilter[coverageVariation] = !baseCoverages[coverageVariation];
  const result = rates.find((x) => {
    let isValid = true;
    for (const k in x.optionalCoverages) {
      if (x.optionalCoverages[k] !== newFilter[k]) {
        isValid = false;
        break;
      }
    }
    return isValid;
  });
  if (!result) {
    return 0;
  } else {
    return Math.abs(estimatedFortnightlyBillablePremium - result.estimatedFortnightly.billablePremium);
  }
};

/**
 * Method that will filter the rates by the coverage variation by the "inverse" of the coverage property passed in
 * E.g. if the user has trailer selected, we need to filter the rates by trailer as false
 * Than simply gets the absolute difference between the current fortnightly premium and the addon fortnightly premium
 * @param rates
 * @param baseCoverages
 * @param coverageVariation
 * @param estimatedMonthlyBillablePremium
 */
export const getAddonMonthlyCostFromRates = (
  rates: PolicyApiModels.MotorRateQuoteResponse[] | PolicyApiModels.HomeRateQuoteResponse[],
  baseCoverages: AddonChecked,
  coverageVariation: string,
  estimatedMonthlyBillablePremium: number
) => {
  const newFilter = { ...baseCoverages };
  newFilter[coverageVariation] = !baseCoverages[coverageVariation];
  const result = rates.find((x) => {
    let isValid = true;
    for (const k in x.optionalCoverages) {
      if (x.optionalCoverages[k] !== newFilter[k]) {
        isValid = false;
        break;
      }
    }
    return isValid;
  });
  if (!result) {
    return 0;
  } else {
    return Math.abs(estimatedMonthlyBillablePremium - result.estimatedMonthly.billablePremium);
  }
};

/**
 * Filters rates by package and coverage types
 * @param rates
 * @param thePackage
 * @param coverageTypes
 */
export const getRateByPackageAndCoverages = (
  rates: PolicyApiModels.MotorRateQuoteResponse[] | PolicyApiModels.HomeRateQuoteResponse[],
  thePackage: PolicyApiModels.MotorPackage | PolicyApiModels.HomePackage,
  coverageTypes: AddonChecked
) => {
  // get rates based on chosen package
  const ratesByPackage = rates.filter((x) => x.package === thePackage);
  // get rates based on chosen coverages
  const baseRates = ratesByPackage.find((x) => {
    let isValid = true;
    for (const k in x.optionalCoverages) {
      if (x.optionalCoverages[k] !== coverageTypes[k]) {
        isValid = false;
        break;
      }
    }
    return isValid;
  });
  // billable = total, company = - levies and taxes
  const result = {
    annual: baseRates.annual.billablePremium,
    companyAnnual: baseRates.annual.companyPremium,
    monthly: baseRates.estimatedMonthly.billablePremium,
    fortnightly: baseRates.estimatedFortnightly.billablePremium,
    quarterly: baseRates.estimatedQuarterly.billablePremium,
    sixMonthly: baseRates.estimatedSixMonthly.billablePremium,
    addons: {} as AddonValue,
    discounts: baseRates.discountsApplied as DiscountsApplied
  } as QuoteRate;
  // effectively generates a key value object for addons
  const defaultFrequency = t('base:defaultFrequency');

  for (const k in coverageTypes) {
    if (coverageTypes[k] !== null) {
      result.addons[k] =
        defaultFrequency === PaymentApiModels.KnownPlan.Monthly
          ? getAddonMonthlyCostFromRates(ratesByPackage, coverageTypes, k, baseRates.estimatedMonthly.billablePremium)
          : getAddonFortnightlyCostFromRates(
              ratesByPackage,
              coverageTypes,
              k,
              baseRates.estimatedFortnightly.billablePremium
            );
    }
  }
  return result;
};

export const getTotalQuoteRates = (state: ApplicationState) => {
  const quoteState = getQuoteState(state);
  const { cars, boats, houses, landlords, contents, ctps = [] } = quoteState;
  const allQuotes = [...cars, ...boats, ...houses, ...landlords, ...contents, ...ctps];

  const totalRates = getDefaultQuoteRate();
  allQuotes.forEach((item) => {
    totalRates.ratedAnnual += item.quoteRate.ratedAnnual || item.quoteRate.annual;
    totalRates.annual += item.quoteRate.annual;
    totalRates.companyAnnual += item.quoteRate.companyAnnual;
    totalRates.monthly += item.quoteRate.monthly;
    totalRates.fortnightly += item.quoteRate.fortnightly;
    totalRates.quarterly += item.quoteRate.quarterly;
    totalRates.sixMonthly += item.quoteRate.sixMonthly;
  });
  return totalRates;
};

export const getTotalRateByFrequency = (state: ApplicationState) => {
  const rates = getTotalQuoteRates(state);
  const sharedState = sharedSelectors.getQuoteSharedState(state);
  let paymentAmount = 1;
  switch (sharedState.payment.paymentFrequency) {
    case PaymentApiModels.KnownPlan.Fortnightly:
    case PaymentApiModels.KnownPlan.Monthly:
      paymentAmount = sharedState.payment.installments.firstPaymentAmount;
      break;
    default:
      paymentAmount = rates.ratedAnnual;
      break;
  }
  return paymentAmount;
};

export const getCurrentQuoteShortLabel = (state: ApplicationState) => {
  const quoteState = getQuoteState(state);
  if (quoteState.activeCarQuoteIndex > -1) {
    return 'Car quote ' + (quoteState.activeCarQuoteIndex + 1);
  }
  if (quoteState.activeBoatsQuoteIndex > -1) {
    return 'Boat quote ' + (quoteState.activeBoatsQuoteIndex + 1);
  }
  if (quoteState.activeHouseQuoteIndex > -1) {
    return 'House quote ' + (quoteState.activeHouseQuoteIndex + 1);
  }
  if (quoteState.activeLandlordsQuoteIndex > -1) {
    return 'Landlord quote ' + (quoteState.activeLandlordsQuoteIndex + 1);
  }
  if (quoteState.activeContentsQuoteIndex > -1) {
    return 'Contents quote ' + (quoteState.activeContentsQuoteIndex + 1);
  }
  if (quoteState.activeCtpsQuoteIndex > -1) {
    return 'Compulsory Third Party quote ' + (quoteState.activeCtpsQuoteIndex + 1);
  }
  return '';
};

/**
 * Gets the appropriate underwriting message from underwriting
 * Priority: DECLINE, REFER, EXCESS, ACCEPT
 * Possible: APIERROR
 * @param underwritingMessages
 */
export const getUnderwritingMessageFromResponse = (underwritingMessages: PolicyApiModels.UnderwriteResponse[]) => {
  let result = {
    status: CustomUnderwriteType.DEFAULT,
    message: '',
    code: '',
    excessAmount: ''
  } as CustomUnderwriteResponse;
  if (underwritingMessages && underwritingMessages.length > 0) {
    // Fix for DG-7727 (caused by DG-7451)
    let declineMessages = underwritingMessages.filter((x) => x.referable === false && x.message.indexOf('$') === -1);

    // ignore windscreenInd error code as this is dealt with manually
    declineMessages = declineMessages.filter((x) => x.field.indexOf('hotListFlags.windscreenInd') === -1);
    const referMessages = underwritingMessages.filter((x) => x.referable === true);
    if (declineMessages.length > 0) {
      result = {
        status: CustomUnderwriteType.DECLINE,
        message: underwritingMessages[0].message,
        code: underwritingMessages[0].errorCode,
        excessAmount: ''
      };
    } else if (referMessages.length > 0) {
      result = {
        status: CustomUnderwriteType.REFER,
        message: referMessages[0].message,
        code: referMessages[0].errorCode,
        excessAmount: ''
      };
    } else {
      let highestAmount = null as number;
      let message = '';
      let code = null;
      let excessMessages = underwritingMessages.filter((x) => x.message.indexOf('$') > -1);
      if (location.pathname === routes.QUOTE.CAR.PAGE1) {
        excessMessages = excessMessages.filter((x) => x.field.indexOf('lossDamage') > -1);
      } else if (location.pathname === routes.QUOTE.SHARED.PEOPLE) {
        excessMessages = [];
      }
      excessMessages.forEach((x) => {
        if (x.message.indexOf('$') > -1) {
          const amount = Number(x.message.replace(/[^0-9.-]+/g, ''));
          if (amount && amount > highestAmount) {
            highestAmount = amount;
            message = x.message.replace('for this driver', 'for applicable drivers');
            code = x.errorCode;
          }
        }
      });
      if (code) {
        result = {
          status: CustomUnderwriteType.EXCESS,
          message: message.replace('$', getCurrencySymbol()),
          code: code,
          excessAmount: highestAmount.toString()
        };
      } else {
        result = { status: CustomUnderwriteType.ACCEPT, message: '', code: '', excessAmount: '' };
      }
    }
  } else {
    result = { status: CustomUnderwriteType.ACCEPT, message: '', code: '', excessAmount: '' };
  }
  return result;
};

/**
 * Manual underwrite home quote
 */
export const manualUnderwriteHomeQuote = (activeQuote: QuoteHouseState) => {
  const excessCounters = {};
  const highExcessAmt = t('quote/house:addtionalExcess.highExcessAmount');
  const mediumExcessAmt = t('quote/house:addtionalExcess.mediumExcessAmount');
  const uwCode = 'MANUAL-HOME-';
  const uwMessage = 'Your answers mean that an additional excess of $ will be applied for claims against this policy.';
  const additionalExcessRules = t('quote/house:additionalExcessRules', { returnObjects: true });
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.AccidentalDamage] = { high: 4, medium: 3 };
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.BreakageOfGlass] = { high: 4, medium: 3 };
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.Fusion] = { high: 3, medium: 2 };
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.GradualDamage] = { high: 3, medium: 2 };
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.MaliciousDamage] = { high: 3, medium: 2 };
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.OtherCauses] = { high: 3, medium: 2 };
  excessCounters[PolicyApiModels.KnownHomeLossDamageType.WaterDamage] = { high: 2, medium: 999 };
  let result = { status: CustomUnderwriteType.ACCEPT, message: '', code: '', excessAmount: '' };
  if (activeQuote.previousHouseClaims) {
    let excessAmt = 0;
    activeQuote.claims.forEach((x) => {
      if (
        additionalExcessRules[x.claimLostDamageReason] &&
        excessCounters[x.claimLostDamageReason] &&
        excessAmt !== highExcessAmt
      ) {
        const reason = x.claimLostDamageReason.toUpperCase();
        excessCounters[x.claimLostDamageReason].high--;
        excessCounters[x.claimLostDamageReason].medium--;
        if (excessCounters[x.claimLostDamageReason].medium <= 0) {
          excessAmt = mediumExcessAmt;
        }
        if (excessCounters[x.claimLostDamageReason].high <= 0) {
          excessAmt = highExcessAmt;
        }
        if (excessAmt) {
          result = {
            status: CustomUnderwriteType.EXCESS,
            message: uwMessage.replace('$', `${formatPrice(excessAmt)}`),
            code: `${uwCode}${reason}`,
            excessAmount: `${excessAmt}`
          };
        }
      }
    });
  }
  return result;
};
/**
 * Function to calculate initial route for Resume quote
 */
export const initialNewRoute = (sharedQuoteState: QuoteSharedState, type: string, quoteState?: string) => {
  let newRoute = '';

  if (isEmpty(quoteState)) {
    newRoute = getTypePageRoute(type, newRoute, `${process.env.brand}_1`);
  } else {
    newRoute = getTypePageRoute(type, newRoute, quoteState);
  }

  if (sharedQuoteState.inBundle && isPage1orPage2(newRoute)) {
    return routes.QUOTE.SHARED.QUOTE_SUMMARY;
  }

  const dateToday = new Date();
  const momentToday = moment(moment(dateToday).startOf('day').format());
  const momentPolicyStartDate = moment(moment(sharedQuoteState.policyStartDate).format('YYYY-MM-DD'));

  if (momentPolicyStartDate.isBefore(momentToday.toDate())) {
    if (sharedQuoteState.inBundle) {
      return routes.QUOTE.SHARED.QUOTE_SUMMARY;
    }
    if (!sharedQuoteState.inBundle && !isPage1orPage2(newRoute)) {
      return routes.QUOTE.SHARED.QUOTE_SUMMARY;
    } else {
      return getTypePageRoute(type, newRoute, `${process.env.brand}_1`);
    }
  }
  return newRoute;
};

export const isPage1orPage2 = (route: string) => {
  const pages = [
    routes.QUOTE.CAR.PAGE1,
    routes.QUOTE.BOAT.PAGE1,
    routes.QUOTE.MOTORBIKE.PAGE1,
    routes.QUOTE.HOUSE.PAGE1,
    routes.QUOTE.LANDLORD.PAGE1,
    routes.QUOTE.CONTENTS.PAGE1,
    routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE1,
    routes.QUOTE.CAR.PAGE2,
    routes.QUOTE.BOAT.PAGE2,
    routes.QUOTE.MOTORBIKE.PAGE2,
    routes.QUOTE.HOUSE.PAGE2,
    routes.QUOTE.LANDLORD.PAGE2,
    routes.QUOTE.CONTENTS.PAGE2,
    routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2
  ];
  return pages.includes(route);
};

export const isSharedQuoteJourneyPage = (route: string) => {
  const pages = [
    routes.QUOTE.SHARED.QUOTE_SUMMARY,
    routes.QUOTE.SHARED.PEOPLE,
    routes.QUOTE.SHARED.LEGAL,
    routes.QUOTE.SHARED.FINAL_SUMMARY,
    routes.QUOTE.SHARED.PAYMENT
  ];
  return pages.includes(route);
};

/**
 * Function to calculate the appropraite route to take user
 */
export const calcRoute = (
  sharedQuoteState: QuoteSharedState,
  fromResume: boolean,
  type: string,
  quoteState?: string
) => {
  let newRoute = '';

  if (fromResume) {
    newRoute = initialNewRoute(sharedQuoteState, type, quoteState);
  }
  if (type === 'car') {
    if (!newRoute) {
      newRoute = routes.QUOTE.CAR.PAGE1;
      if (location.href === routes.QUOTE.SHARED.PEOPLE) {
        newRoute = routes.QUOTE.CAR.PAGE2;
      }
    } else if (newRoute === routes.QUOTE.SHARED.LEGAL) {
      if (!commonSelectors.areAllDriverDetailsComplete(sharedQuoteState.motorParties)) {
        newRoute = routes.QUOTE.CAR.PAGE1;
      }
    }
  } else if (type === 'house') {
    if (!newRoute) {
      newRoute = routes.QUOTE.HOUSE.PAGE1;
      if (location.href === routes.QUOTE.SHARED.PEOPLE) {
        newRoute = routes.QUOTE.HOUSE.PAGE2;
      }
    }
  } else if (type === 'contents') {
    if (!newRoute) {
      newRoute = routes.QUOTE.CONTENTS.PAGE1;
      if (location.href === routes.QUOTE.SHARED.PEOPLE) {
        newRoute = routes.QUOTE.CONTENTS.PAGE2;
      }
    }
  } else if (type === 'landlord') {
    if (!newRoute) {
      newRoute = routes.QUOTE.LANDLORD.PAGE1;
      if (location.href === routes.QUOTE.SHARED.PEOPLE) {
        newRoute = routes.QUOTE.LANDLORD.PAGE2;
      }
    }
  } else if (type === 'boat' && !newRoute) {
    newRoute = location.href === routes.QUOTE.SHARED.PEOPLE ? routes.QUOTE.BOAT.PAGE2 : routes.QUOTE.BOAT.PAGE1;
  } else if (type === 'motorbike' && !newRoute) {
    newRoute =
      location.href === routes.QUOTE.SHARED.PEOPLE ? routes.QUOTE.MOTORBIKE.PAGE2 : routes.QUOTE.MOTORBIKE.PAGE1;
  } else if (type === 'compulsoryThirdParty' && !newRoute) {
    newRoute =
      location.href === routes.QUOTE.SHARED.PEOPLE
        ? routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2
        : routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE1;
  }
  return newRoute;
};

// Decide the redirection link for page based on insurance type and quoteState
export const getTypePageRoute = (insuranceType: string, defaultRoute: string, quoteState?: string) => {
  let result = defaultRoute;
  const pageNumber = quoteState.length > 0 ? quoteState.split('_').pop() : '1';
  switch (pageNumber.toLowerCase()) {
    case '1':
      switch (insuranceType) {
        case 'car':
          result = routes.QUOTE.CAR.PAGE1;
          break;
        case 'boat':
          result = routes.QUOTE.BOAT.PAGE1;
          break;
        case 'house':
          result = routes.QUOTE.HOUSE.PAGE1;
          break;
        case 'contents':
          result = routes.QUOTE.CONTENTS.PAGE1;
          break;
        case 'landlord':
          result = routes.QUOTE.LANDLORD.PAGE1;
          break;
        case 'compulsoryThirdParty':
          result = routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE1;
          break;
      }
      break;
    case '2':
      switch (insuranceType) {
        case 'car':
          result = routes.QUOTE.CAR.PAGE2;
          break;
        case 'boat':
          result = routes.QUOTE.BOAT.PAGE2;
          break;
        case 'house':
          result = routes.QUOTE.HOUSE.PAGE2;
          break;
        case 'contents':
          result = routes.QUOTE.CONTENTS.PAGE2;
          break;
        case 'landlord':
          result = routes.QUOTE.LANDLORD.PAGE2;
          break;
        case 'compulsoryThirdParty':
          result = routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2;
          break;
      }
      break;
    case '3a':
      result = routes.QUOTE.SHARED.QUOTE_SUMMARY;
      break;
    case '3':
      result = routes.QUOTE.SHARED.PEOPLE;
      break;
    case '4':
      result = routes.QUOTE.SHARED.LEGAL;
      break;
    case '5':
      result = routes.QUOTE.SHARED.FINAL_SUMMARY;
      break;
    case '6':
      result = routes.QUOTE.SHARED.PAYMENT;
      break;
    case '7':
      result = routes.QUOTE.SHARED.THANK_YOU;
      break;
  }
  return result;
};

export const getFormattedAddress = (addressDetails: AddressDetailsResponse) => {
  const unitAndFloor = addressDetails.unitAndFloor ? addressDetails.unitAndFloor + '/' : '';

  const streetNo = addressDetails.streetNumber ? addressDetails.streetNumber + ' ' : '';

  const streetName = addressDetails.streetName ? addressDetails.streetName + ', ' : '';

  const suburb = addressDetails.suburb ? addressDetails.suburb + ', ' : '';

  const city = addressDetails.city ? getCityText(addressDetails.city) + ', ' : '';

  const province = addressDetails.province ? addressDetails.province + ' ' : '';

  const formattedAddress = `${unitAndFloor}${streetNo}${streetName}${suburb}${city}${province}`;

  return formattedAddress;
};

export const getAvailableAddresses = (state: ApplicationState) => {
  const showAddressLookupService = t('quote:config.showAddressLookupService');
  const sharedQuote = sharedSelectors.getQuoteSharedState(state);
  const addresses: BundleAddresses[] = [];

  // bundle addresses
  if (sharedQuote.inBundle) {
    const quoteState = getQuoteState(state);
    const currentQuote = getCurrentActiveQuote(quoteState);

    if (currentQuote === null) {
      return false;
    }

    const { cars, boats, motorbikes, houses, contents, landlords } = quoteState;
    const allQuotes = [...cars, ...boats, ...motorbikes, ...houses, ...contents, ...landlords];

    const quotesWeCareAbout = allQuotes.filter((x) => {
      // ignore if no address
      if (
        !x.address ||
        !x.address.addressDetails ||
        !(x.address.addressDetails as AddressDetailsResponse).addressReference
      ) {
        return false;
      }

      // get quotes depending on current quote type
      if (currentQuote.type === 'house') {
        return (
          x.policyType === 'car' ||
          x.policyType === 'contents' ||
          x.policyType === 'house' ||
          x.policyType === 'boat' ||
          x.policyType === 'motorbike'
        );
      } else if (currentQuote.type === 'contents') {
        return true;
      } else if (currentQuote.type === 'car') {
        return true;
      } else if (currentQuote.type === 'motorbike') {
        return true;
      } else {
        return currentQuote.type === 'boat';
      }
    });

    quotesWeCareAbout.forEach((qt) => {
      const addressDetails = qt.address.addressDetails as AddressDetailsResponse;
      let data: { label: string; value: string };
      if (showAddressLookupService) {
        data = {
          label: qt.address.addressSearch as string,
          value: addressDetails.addressReference.toString()
        };
      } else {
        const formattedAddress = getFormattedAddress(addressDetails);
        data = {
          label: formattedAddress,
          value: formattedAddress
        };
      }
      const addressIdx = addresses.findIndex((x) => x.label === data.label);
      if (addressIdx === -1) {
        addresses.push(data);
      }
    });
  }

  // addresses on customer's existing policies
  if (sharedQuote.policyAddresses) {
    sharedQuote.policyAddresses.forEach((a: PolicyAddress) => {
      let data: { label: string; value: string };
      if (showAddressLookupService) {
        data = {
          label: a.text as string,
          value: a.addressReference.toString()
        };
      } else {
        const formattedAddress = getFormattedAddress(a);
        data = {
          label: formattedAddress,
          value: JSON.stringify(a)
        };
      }
      const addressIdx = addresses.findIndex((x) => x.label === data.label);
      if (addressIdx === -1) {
        addresses.push(data);
      }
    });
  }

  addresses.push({ label: 'Use a different address', value: 'skip' });
  return addresses;
};

/**
 * Gets the quote back based on the address reference
 * Prioritises house -> landlord -> contents and then car
 * @param state
 * @param addressReference
 */
export const getAppropriateQuoteFromBundleAddress = (state: ApplicationState, addressReference: string) => {
  const innerFunc = (x: QuoteTypes, policyType: string) => {
    const addressDetails = x.address?.addressDetails as AddressDetailsResponse;
    if (!addressDetails || x.policyType !== policyType) {
      return false;
    }
    const n = Number(addressReference);
    const isNumeric = !Number.isNaN(n);
    return isNumeric ? addressDetails.addressReference === n : getFormattedAddress(addressDetails) === addressReference;
  };
  const quoteState = getQuoteState(state);
  const { cars, houses, contents, landlords } = quoteState;
  const allQuotes = [...cars, ...houses, ...contents, ...landlords];
  const houseQuoteWithAddress = allQuotes.find((x) => innerFunc(x, 'house'));
  const landlordQuoteWithAddress = allQuotes.find((x) => innerFunc(x, 'landlord'));
  const contentsQuoteWithAddress = allQuotes.find((x) => innerFunc(x, 'contents'));
  const carQuoteWithAddress = allQuotes.find((x) => innerFunc(x, 'car'));
  if (houseQuoteWithAddress) {
    return houseQuoteWithAddress;
  } else if (landlordQuoteWithAddress) {
    return landlordQuoteWithAddress;
  } else if (contentsQuoteWithAddress) {
    return contentsQuoteWithAddress;
  } else {
    return carQuoteWithAddress;
  }
};

// default state
export const getDefaultQuoteState = () => {
  const modal: QuoteState = {
    activeCarQuoteIndex: -1,
    activeHouseQuoteIndex: -1,
    activeContentsQuoteIndex: -1,
    activeLandlordsQuoteIndex: -1,
    activeBoatsQuoteIndex: -1,
    activeMotorbikeQuoteIndex: -1,
    activeCtpsQuoteIndex: -1,
    cars: [],
    houses: [],
    contents: [],
    landlords: [],
    boats: [],
    motorbikes: [],
    ctps: [],
    bundleBuilderLogin: null,
    excesses: defaultExcesses,
    productTypes: [] as ProductApiModels.TypesResponse[],
    crossSellEstimate: {} as CrossSellEstimate
  };
  return modal;
};

// default quote rate state
export const getDefaultQuoteRate = () => {
  const modal: QuoteRate = {
    annual: 0,
    companyAnnual: 0,
    ratedAnnual: 0,
    fortnightly: 0,
    monthly: 0,
    quarterly: 0,
    sixMonthly: 0,
    addons: {},
    discounts: {}
  };
  return modal;
};

/**
 * ACTION TYPES
 * @deprecated This has been moved away from state.tsx. Prefer state/types file.
 */
export const actionTypesOld = actionTypes;

/**
 * @deprecated This has been moved away from state.tsx. Prefer state/types file.
 */
export type QuoteTypes = QuoteTypesOriginal;
/**
 * @deprecated This has been moved away from state.tsx. Prefer state/types file.
 */
export type QuotePolicyTypes = QuotePolicyTypesOriginal;
/**
 * @deprecated This has been moved away from state.tsx. Prefer state/types file.
 */
export type QuoteBundleTypes = QuoteBundleTypesOriginal;

/**
 * CONSTANTS
 */

export enum CustomUnderwriteType {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
  REFER = 'REFER',
  EXCESS = 'EXCESS',
  DEFAULT = 'DEFAULT',
  ERROR = 'ERROR'
}

export enum BundleBuilderLoginType {
  SKIP = 'SKIP',
  LOGIN = 'LOGIN'
}

export interface CustomUnderwriteResponse {
  status: CustomUnderwriteType;
  message: string;
  code: string;
  excessAmount: string;
}

export interface QuoteState {
  activeCarQuoteIndex: number;
  activeHouseQuoteIndex: number;
  activeContentsQuoteIndex: number;
  activeLandlordsQuoteIndex: number;
  activeBoatsQuoteIndex: number;
  activeMotorbikeQuoteIndex: number;
  activeCtpsQuoteIndex: number;
  cars: Array<QuoteViewModel<QuoteCarState>>;
  houses: Array<QuoteViewModel<QuoteHouseState>>;
  contents: Array<QuoteViewModel<QuoteContentsState>>;
  landlords: Array<QuoteViewModel<QuoteLandlordsState>>;
  boats: Array<QuoteViewModel<QuoteBoatsState>>;
  motorbikes: Array<QuoteViewModel<QuoteMotorbikeState>>;
  ctps: Array<QuoteViewModel<QuoteCtpState>>;
  excesses: Excesses;
  productTypes: ProductApiModels.TypesResponse[];
  bundleBuilderLogin: string;
  crossSellEstimate: CrossSellEstimate;
}

export interface PolicyDescriptionInterestedPartiesItem {
  policyNumber: string;
  description: string;
  interestedParties: PolicyApiModels.InterestedParty[];
}

export interface SyncQuote {
  carQuote: QuoteCarState;
  houseQuote: QuoteHouseState;
  contentsQuote: QuoteContentsState;
  landlordQuote: QuoteLandlordsState;
  boatsQuote: QuoteBoatsState;
  motorbikeQuote: QuoteMotorbikeState;
  ctpQuote: QuoteCtpState;
}

// Rate result and addon interfaces
export interface AddonChecked {
  [propertyName: string]: boolean;
}

export interface AddonValue {
  [propertyName: string]: number;
}

export interface Discount {
  discountDescription: string;
  isAppliedInd: boolean;
  amount?: number;
  nonAnnualAmount?: number;
}

export interface DiscountsApplied {
  [propertyName: string]: Discount;
}

export interface QuoteRate {
  annual: number;
  companyAnnual: number;
  ratedAnnual: number;
  monthly: number;
  fortnightly: number;
  quarterly: number;
  sixMonthly: number;
  addons: AddonValue;
  discounts: DiscountsApplied;
  totalDiscounts?: number;
  totalNonAnnualDiscounts?: number;
  $form?: FieldState;
}

export interface SaveQuotePromisesResults {
  result: QuotePolicyTypes;
  inBundle: boolean;
}

export interface AddQuotePromiseResults extends PolicyApiModels.PolicyResponse {
  policyNumber: string;
}

export interface ChangeQuotePlanResult {
  hasError: boolean;
  invalidVersionHandled: boolean;
}
/**
 * ACTIONS
 */
export const actions = {
  toggleQuoteFinancialInterestedPartyById:
    (policyNumber: string, financialInterestedPartyId: string, description?: string) =>
    async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const state = getState();
      const quoteState = getQuoteState(state);
      const { cars = [], boats = [], motorbikes = [], houses = [], contents = [], landlords = [] } = quoteState;
      const allQuotes = [...cars, ...boats, ...motorbikes, ...houses, ...contents, ...landlords];
      const quoteIndex = allQuotes.findIndex((x) => x.policyNumber === policyNumber);
      const quote = allQuotes[quoteIndex];
      if (quote) {
        let interestedParties = [].concat(quote.interestedParties) as PolicyApiModels.InterestedParty[];
        let interestedPartyIndex = -1;
        if (financialInterestedPartyId === OTHER_INTERESTED_PARTY) {
          interestedPartyIndex = interestedParties.findIndex((x) => {
            if (x.otherInterestedParty) {
              return x.otherInterestedParty.name === description;
            } else {
              return false;
            }
          });
        } else {
          interestedPartyIndex = interestedParties.findIndex((x) => x.interestedPartyId === financialInterestedPartyId);
        }
        if (interestedPartyIndex === -1) {
          const ip = {
            interestedPartyId: financialInterestedPartyId,
            oid: null
          } as PolicyApiModels.InterestedParty;
          // other
          if (financialInterestedPartyId === OTHER_INTERESTED_PARTY) {
            ip.otherInterestedParty = {
              name: description,
              email: ''
            };
          }
          interestedParties.push(ip);
        } else {
          interestedParties.splice(interestedPartyIndex, 1);
          if (!interestedParties) {
            interestedParties = [];
          }
        }

        const updatedQuote = {
          ...allQuotes[quoteIndex],
          interestedParties: [...interestedParties]
        };

        const newAllQuotes = allQuotes.map((quote, index) => (index === quoteIndex ? updatedQuote : quote));

        const getQuoteModelPath = () => {
          switch (quote.policyType) {
            case 'car':
              return 'myForms.carQuote';
            case 'house':
              return 'myForms.houseQuote';
            case 'landlord':
              return 'myForms.landlordQuote';
            case 'contents':
              return 'myForms.contentsQuote';
            case 'compulsoryThirdParty':
              return 'myForms.ctpQuote';
            default:
              return 'myForms.boatsQuote';
          }
        };

        // Updates the specific quote interestedParty without mutating the original object
        dispatch(formActions.change(`${getQuoteModelPath()}.interestedParties`, interestedParties));

        dispatch({
          type: actionTypes.UPDATE_QUOTES_FINANCIAL_INTERESTED_PARTY,
          payload: {
            cars: newAllQuotes.filter((x) => x.policyType === 'car'),
            boats: newAllQuotes.filter((x) => x.policyType === 'boat'),
            motorbike: newAllQuotes.filter((x) => x.policyType === 'boat'),
            ctps: newAllQuotes.filter((x) => x.policyType === 'compulsoryThirdParty'),
            houses: newAllQuotes.filter((x) => x.policyType === 'house'),
            contents: newAllQuotes.filter((x) => x.policyType === 'contents'),
            landlords: newAllQuotes.filter((x) => x.policyType === 'landlord')
          }
        });
      } else {
        // holy shit something went wrong
      }
    },
  /**
   * Update the quote state attribute
   */
  updateQuoteState: (onSaveAction?: boolean) => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;
    const allQuotes = [...cars, ...houses, ...contents, ...landlords, ...boats, ...motorbikes, ...ctps];

    const value = getBrandPageNumber(onSaveAction, location.pathname);
    allQuotes.forEach((quote) => {
      switch (quote.policyType) {
        case 'car':
          dispatch(formActions.change('myForms.carQuote.quoteState', value));
          break;
        case 'house':
          dispatch(formActions.change('myForms.houseQuote.quoteState', value));
          break;
        case 'contents':
          dispatch(formActions.change('myForms.contentsQuote.quoteState', value));
          break;
        case 'landlord':
          dispatch(formActions.change('myForms.landlordQuote.quoteState', value));
          break;
        case 'boat':
          dispatch(formActions.change('myForms.boatsQuote.quoteState', value));
          break;
        case 'motorbike':
          dispatch(formActions.change('myForms.motorbikesQuote.quoteState', value));
          break;
        case 'compulsoryThirdParty':
          dispatch(formActions.change('myForms.ctpQuote.quoteState', value));
          break;
      }
    });
    dispatch({
      type: actionTypes.UPDATE_QUOTES,
      payload: {
        cars: allQuotes
          .filter((x) => x.policyType === 'car')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value })),
        boats: allQuotes
          .filter((x) => x.policyType === 'boat')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value })),
        motorbikes: allQuotes
          .filter((x) => x.policyType === 'motorbike')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value })),
        ctps: allQuotes
          .filter((x) => x.policyType === 'compulsoryThirdParty')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value })),
        houses: allQuotes
          .filter((x) => x.policyType === 'house')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value })),
        contents: allQuotes
          .filter((x) => x.policyType === 'contents')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value })),
        landlords: allQuotes
          .filter((x) => x.policyType === 'landlord')
          .map((x) => ({ ...x, quoteState: value === '' ? null : value }))
      }
    });
  },
  resetExcessValues: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;
    const allQuotes = [...cars, ...houses, ...contents, ...landlords, ...boats, ...motorbikes, ...ctps];
    allQuotes.forEach((quote) => {
      switch (quote.policyType) {
        case 'car': {
          const policyType =
            (quote as QuoteCarState).vehicleUsedForBusiness === ProductApiModels.KnownTypeOfPolicy.Commercial
              ? ProductApiModels.KnownTypeOfPolicy.Commercial
              : ProductApiModels.KnownTypeOfPolicy.Personal;
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: { [getProductUIType(ProductApiModels.KnownProductType.Motor, policyType)]: [] }
          });
          break;
        }
        case 'house':
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: {
              [getProductUIType(ProductApiModels.KnownProductType.Home, ProductApiModels.KnownTypeOfPolicy.House)]: []
            }
          });
          break;
        case 'contents':
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: {
              [getProductUIType(ProductApiModels.KnownProductType.Home, ProductApiModels.KnownTypeOfPolicy.Contents)]:
                []
            }
          });
          break;
        case 'landlord':
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: {
              [getProductUIType(ProductApiModels.KnownProductType.Home, ProductApiModels.KnownTypeOfPolicy.Landlord)]:
                []
            }
          });
          break;
        case 'boat':
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: {
              [getProductUIType(ProductApiModels.KnownProductType.Motor, ProductApiModels.KnownTypeOfPolicy.Boat)]: []
            }
          });
          break;
        case 'motorbike':
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: {
              [getProductUIType(ProductApiModels.KnownProductType.Motor, ProductApiModels.KnownTypeOfPolicy.Motorbike)]:
                []
            }
          });
          break;
        case 'compulsoryThirdParty':
          dispatch({
            type: actionTypes.UPDATE_EXCESSES,
            payload: {
              [getProductUIType(
                ProductApiModels.KnownProductType.Motor,
                ProductApiModels.KnownTypeOfPolicy.CompulsoryThirdParty
              )]: []
            }
          });
          break;
      }
    });
  },
  /**
   * Update the quote product configuration
   */
  updateProductConfiguration: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;
    const allQuotes = [...cars, ...houses, ...contents, ...landlords, ...boats, ...motorbikes, ...ctps];
    let productType = null;
    allQuotes.forEach((quote) => {
      switch (quote.policyType) {
        case 'car': {
          const carState = state.myForms.carQuote as QuoteCarState;
          if (!isEmpty(carState.vehicleUsedForBusiness) || carState.vehicleUsedForBusiness !== 'sometimes') {
            const typeOfPolicy = carState.vehicleUsedForBusiness === 'business' ? 'commercial' : 'personal';
            productType = commonSelectors.getProductType(state, KnownProductType.Motor, typeOfPolicy);
            if (productType && productType.options) {
              dispatch(formActions.change('myForms.carQuote.productConfiguration', productType.options));
            }
          }
          break;
        }
        case 'house': {
          const houseState = state.myForms.houseQuote as QuoteHouseState;
          productType = commonSelectors.getProductType(state, KnownProductType.Home, houseState.policyType);
          if (productType && productType.options) {
            dispatch(formActions.change('myForms.houseQuote.productConfiguration', productType.options));
          }
          break;
        }
        case 'contents': {
          const contentsState = state.myForms.contentsQuote as QuoteContentsState;
          productType = commonSelectors.getProductType(state, KnownProductType.Home, contentsState.policyType);
          if (productType && productType.options) {
            dispatch(formActions.change('myForms.contentsQuote.productConfiguration', productType.options));
          }
          break;
        }
        case 'landlord': {
          const landlordsState = state.myForms.landlordQuote as QuoteLandlordsState;
          productType = commonSelectors.getProductType(state, KnownProductType.Home, landlordsState.policyType);
          if (productType && productType.options) {
            dispatch(formActions.change('myForms.landlordQuote.productConfiguration', productType.options));
          }
          break;
        }
        case 'boat': {
          const boatsState = state.myForms.boatsQuote as QuoteBoatsState;
          productType = commonSelectors.getProductType(state, KnownProductType.Motor, boatsState.policyType);
          if (productType && productType.options) {
            dispatch(formActions.change('myForms.boatsQuote.productConfiguration', productType.options));
          }
          break;
        }
        case 'motorbike': {
          const motorbikeState = state.myForms.motorbikeQuote as QuoteMotorbikeState;
          productType = commonSelectors.getProductType(state, KnownProductType.Motor, motorbikeState.policyType);
          if (productType && productType.options) {
            dispatch(formActions.change('myForms.motorbikeQuote.productConfiguration', productType.options));
          }
          break;
        }
        case 'compulsoryThirdParty':
          productType = commonSelectors.getProductType(
            state,
            KnownProductType.Motor,
            KnownTypeOfPolicy.CompulsoryThirdParty
          );
          if (productType && productType.options) {
            dispatch(formActions.change('myForms.ctpState.productConfiguration', productType.options));
          }
          break;
      }
    });
  },

  /**
   * update eligible quotes with promocode.
   * sharedQuote state holds current active promocode or promocode passed as url parameter.
   */
  updateQuotesWithPromoCode: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const sharedQuoteState = getQuoteSharedState(state);

    if (!sharedQuoteState.promoCodeValid) {
      return;
    }
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;
    const allQuotes = [...cars, ...houses, ...contents, ...landlords, ...boats, ...motorbikes, ...ctps];

    for (const quote of allQuotes) {
      const quoteRated = quote.quoteRate && quote.quoteRate.annual !== 0;

      // exclude updating quotes already rated.
      if (!quoteRated && isEmpty(quote.promoCode)) {
        let policyType = quote.policyType;
        const coverageType = quote.coverageType;

        if (policyType === 'car' && (quote as QuoteCarState).vehicleUsedForBusiness === 'personal') {
          policyType = ProductApiModels.KnownTypeOfPolicy.Personal;
        } else if (policyType === 'car') {
          policyType = ProductApiModels.KnownTypeOfPolicy.Commercial;
        }

        const promoCodeValid = await validatePromoCodeforPolicyTypeAndCoverType(
          sharedQuoteState.promoCode,
          policyType,
          coverageType
        );
        if (promoCodeValid) {
          quote.promoCode = sharedQuoteState.promoCode;
          quote.promoCodeValid = true;
          quote.promoCodeApplicable = true;
        }
      }
    }
    dispatch({
      type: actionTypes.UPDATE_QUOTES,
      payload: {
        cars: allQuotes.filter((x) => x.policyType === 'car'),
        houses: allQuotes.filter((x) => x.policyType === 'house'),
        contents: allQuotes.filter((x) => x.policyType === 'contents'),
        landlords: allQuotes.filter((x) => x.policyType === 'landlord'),
        boats: allQuotes.filter((x) => x.policyType === 'boat'),
        motorbikes: allQuotes.filter((x) => x.policyType === 'motorbike')
      }
    });
  },

  /**
   * Other name is an indicator of "other 1", "other 2" etc
   * Other desc is the typed in name
   */
  clearFinancialInterestedParty:
    (financialInterestedPartyId: string, otherName?: string, otherDesc?: string) =>
    async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const state = getState();
      const quoteState = getQuoteState(state);
      const { cars = [], boats = [], motorbikes = [], houses = [], contents = [], landlords = [] } = quoteState;
      const allQuotes = [...cars, ...boats, ...motorbikes, ...houses, ...contents, ...landlords];
      allQuotes.forEach((quote) => {
        let interestedPartyIndex = -1;
        if (financialInterestedPartyId === OTHER_INTERESTED_PARTY) {
          interestedPartyIndex = quote.interestedParties.findIndex((x) => {
            if (x.otherInterestedParty) {
              return x.otherInterestedParty.name === otherName || x.otherInterestedParty.name === otherDesc;
            } else {
              return false;
            }
          });
        } else {
          interestedPartyIndex = quote.interestedParties.findIndex(
            (x) => x.interestedPartyId === financialInterestedPartyId
          );
        }

        if (interestedPartyIndex !== -1) {
          quote.interestedParties.splice(interestedPartyIndex, 1);
        }
      });

      dispatch({
        type: actionTypes.CLEAR_FINANCIAL_INTERESTED_PARTY,
        payload: {
          cars: allQuotes.filter((x) => x.policyType === 'car'),
          houses: allQuotes.filter((x) => x.policyType === 'house'),
          contents: allQuotes.filter((x) => x.policyType === 'contents'),
          landlords: allQuotes.filter((x) => x.policyType === 'landlord'),
          boats: allQuotes.filter((x) => x.policyType === 'boat'),
          motorbikes: allQuotes.filter((x) => x.policyType === 'motorbike')
        }
      });
    },
  clearAllFinancialInterestedParties: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const {
      cars = [],
      boats = [],
      motorbikes = [],
      houses = [],
      contents = [],
      landlords = [],
      ctps = []
    } = quoteState;
    const allQuotes = [...cars, ...boats, ...motorbikes, ...houses, ...contents, ...landlords, ...ctps];
    try {
      allQuotes.forEach((quote) => {
        quote.interestedParties = [] as PolicyApiModels.InterestedParty[];
      });
    } catch (ex) {
      logError(ex, getFunctionName());
    }
    dispatch({
      type: actionTypes.CLEAR_ALL_FINANCIAL_INTERESTED_PARTIES,
      payload: {
        cars: allQuotes.filter((x) => x.policyType === 'car'),
        boats: allQuotes.filter((x) => x.policyType === 'boat'),
        motorbikes: allQuotes.filter((x) => x.policyType === 'motorbike'),
        houses: allQuotes.filter((x) => x.policyType === 'house'),
        contents: allQuotes.filter((x) => x.policyType === 'contents'),
        landlords: allQuotes.filter((x) => x.policyType === 'landlord'),
        ctps: allQuotes.filter((x) => x.policyType === 'compulsoryThirdParty')
      }
    });
  },
  /**
   * Saves quotes then takes to first quote page
   */
  submitBundleBuilder: () => async (dispatch: AppDispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
    const totalPolicies = getTotalPoliciesBundleBuilder(state);
    const membershipId = sharedQuoteState.membershipId;
    actions.updateQuoteState()(dispatch, getState);
    actions.updateProductConfiguration()(dispatch, getState);
    actions.resetExcessValues()(dispatch, getState);
    const result = await actions.saveQuotes(totalPolicies, membershipId, false, true)(dispatch, getState);
    if (result) {
      const currentState = getState();
      const sharedQuoteState = getQuoteSharedState(currentState);
      const commonState = commonSelectors.getBaseState(currentState);

      // If agency hasn't been loaded already (via partnerCode on url) and we have agency code from bundle quotes created
      // Then load that agencies information so we can determine whether to show campains/promo
      if (!commonState.agency && sharedQuoteState.agencyCode) {
        await commonThunks.loadPartnerInformation(sharedQuoteState.agencyCode)(dispatch, getState, null);
      }

      // If agent hasn't been loaded already (via agentCode on url) and we have agent code from bundle quotes created
      // Then load that agents and agency information.
      if (!commonState.agent && sharedQuoteState.agentCode) {
        await commonThunks.loadAgentInformation(sharedQuoteState.agentCode)(dispatch, getState, null);
      }

      await actions.getPolicyDefaults()(dispatch, getState);
      await dispatch(actions.updateQuotesWithPromoCode());

      const firstQuote = getFirstQuote(quoteState);
      if (firstQuote) {
        actions.editPolicyByTypeAndIndex(firstQuote.type, 0, true)(dispatch, getState);
      } else {
        dispatch(commonActions.globalError(true, '', null, null));
      }
    }
  },
  /**
   * Method to create bundle and (optionally) quotes
   * throws if fails
   */
  createBundle: async (
    isAuthenticated: boolean,
    optionalQuoteTypes?: PolicyBundleApiModels.CreateUpdateBundleRequestQuotes,
    totalPolicies: number = 1,
    memberDiscount: boolean = null,
    partnerCode: string = '',
    anonymousUserInfo: AnonymousUserInfo = null,
    customer?: Customer,
    replacedPolicy?: ReplacedPolicy,
    agentCode: string = null,
    membershipId: string = null
  ) => {
    const requestOptions = getDefaultRequestOptions();
    const staffPartnerCode = await getStaffPartnerCode(customer);
    const isWSPBrand = isBrand(KnownBrandType.WSP);

    partnerCode = staffPartnerCode || partnerCode;

    const options: CreateBundleOptionalParams = {
      requestOptions,
      body: {
        policyCount: totalPolicies,
        memberDiscountInd: memberDiscount,
        quotesToAdd: optionalQuoteTypes,
        partnerCode: partnerCode,
        replacedPolicy: replacedPolicy,
        agencyDetails: activeAgency.onCreateBundleRequest(),
        agentCode: agentCode,
        membershipId: membershipId
      }
    };

    let result = null;
    const accessToken = localStorage.getItem('access_token');
    if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
      const customerBundle = lodash.merge(options, {
        body: {
          primaryInsured: {
            individual: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              dateOfBirth: customer.dateOfBirth,
              ...(isWSPBrand && {
                gender: customer.gender
              })
            },
            emailAddress: { email: customer.emails[0].emailAddress },
            phoneNumbers: customer.phones.reduce(
              (pn, p) => [...pn, { phoneCountry: p.phoneCountryCd, phone: p.phoneNumber } as PhoneNumber],
              []
            ),
            privacyPolicyAccepted: isEmpty(anonymousUserInfo) ? null : anonymousUserInfo.privacyPolicyAccepted
          }
        }
      });
      result = await services
        .policyBundleServiceWithAccessToken(accessToken)
        .createCustomerBundle(XBrandId, customerBundle);
    } else {
      if (!lodash.every(lodash.values(anonymousUserInfo), lodash.isEmpty)) {
        options.body.primaryInsured = {
          individual: {
            firstName: anonymousUserInfo.firstName,
            lastName: anonymousUserInfo.lastName,
            gender: anonymousUserInfo.gender,
            dateOfBirth: anonymousUserInfo.dateOfBirth
          },
          emailAddress: { email: anonymousUserInfo.email },
          phoneNumbers:
            isEmpty(anonymousUserInfo.phoneCountry) || isEmpty(anonymousUserInfo.phone)
              ? null
              : [{ phoneCountry: anonymousUserInfo.phoneCountry, phone: anonymousUserInfo.phone } as PhoneNumber],
          privacyPolicyAccepted: anonymousUserInfo.privacyPolicyAccepted
        };
      }
      result = await services.policyBundleService.createBundle(XBrandId, options);
    }
    if (result) {
      return result;
    } else {
      throw Error();
    }
  },
  /**
   * Method to create bundle from a single policy that is not already in a bundle
   * throws if fails
   */
  createBundleFromPolicyNumber: async (isAuthenticated: boolean, product: string, policyNumber: string) => {
    let result = null;
    const accessToken = localStorage.getItem('access_token');
    const requestOptions = getDefaultRequestOptions();
    if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
      result = await services
        .policyBundleServiceWithAccessToken(accessToken)
        .createCustomerBundleWithQuote(policyNumber, product as ProductType, XBrandId, {
          requestOptions
        });
    } else {
      result = await services.policyBundleService.createBundleWithQuote(
        policyNumber,
        product as ProductType,
        XBrandId,
        {
          requestOptions
        }
      );
    }

    if (result) {
      return result;
    } else {
      logApiError(new Error('No result'), 'ui-api-create-bundle-with-quote', requestOptions);
      throw Error();
    }
  },
  /**
   * Method to patch bundle with new quote types
   * throws if fails
   */
  createAndAddQuotesToExistingBundle: async (
    bundleId: string,
    isAuthenticated: boolean,
    quoteTypes: PolicyBundleApiModels.CreateUpdateBundleRequestQuotes,
    totalPolicies: number,
    memberDiscount: boolean
  ) => {
    const requestOptions = getDefaultRequestOptions();
    const options: UpdateBundleOptionalParams = {
      requestOptions,
      body: {
        policyCount: totalPolicies,
        memberDiscountInd: memberDiscount,
        quotesToAdd: quoteTypes
      }
    };

    let result = null;
    const accessToken = localStorage.getItem('access_token');
    if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
      result = await services
        .policyBundleServiceWithAccessToken(accessToken)
        .updateCustomerBundle(bundleId, XBrandId, options);
    } else {
      result = await services.policyBundleService.updateBundle(bundleId, XBrandId, options);
    }

    if (result) {
      return result;
    } else {
      logApiError(new Error('No result'), 'ui-api-get-address-details', requestOptions);
      throw Error();
    }
  },
  createAndAddQuoteToExistingBundle: async (
    isAuthenticated: boolean,
    bundleId: string,
    types: string[],
    totalPolicies: number,
    memberDiscount: boolean
  ) => {
    const createResult = await actions.createAndAddQuotesToExistingBundle(
      bundleId,
      isAuthenticated,
      actions.getCreateBundleQuoteTypesFromTypes(types),
      totalPolicies,
      memberDiscount
    );
    return QuoteTransformer.mapBundleApiModelToPolicyApiModel([
      ...createResult.quotes.motor,
      ...createResult.quotes.home
    ]);
  },
  /**
   * Create bunde for replacement journey
   * throws if fails
   */
  submitReplacement:
    (replacedPolicy: ReplacedPolicy) => async (dispatch: AppDispatch, getState: () => ApplicationState) => {
      const state = getState();

      const matchingPolicySummary = state.portal.policySummaries.find((policySummary: PolicySummary) => {
        if (policySummary.policyNumber === replacedPolicy.policyNumber) {
          return policySummary.policyNumber;
        }
      });
      const typeOfPolicy = matchingPolicySummary.typeOfPolicy;

      switch (typeOfPolicy) {
        case KnownTypeOfPolicy.Personal:
          dispatch({ type: actionTypes.ADD_CAR });
          break;
        case KnownTypeOfPolicy.Commercial:
          dispatch({ type: actionTypes.ADD_CAR });
          break;
        case KnownTypeOfPolicy.House:
          dispatch({ type: actionTypes.ADD_HOUSE });

          // load product types - needed for getting min/max sum insured values for House policies
          await dispatch(actions.loadProductTypes());
          break;
        default:
          break;
      }

      const prepopulatedTotalPolicies = commonSelectors.getPrePopulated(state).existingPolicyCount;

      await dispatch(actions.updateQuoteState());
      await dispatch(actions.updateProductConfiguration());
      await dispatch(actions.resetExcessValues());

      const result = await actions.saveQuotes(
        prepopulatedTotalPolicies,
        false,
        true,
        false,
        replacedPolicy
      )(dispatch, getState);

      if (result) {
        await dispatch(actions.getPolicyDefaults());
        await dispatch(actions.updateQuotesWithPromoCode());

        const firstQuote = getFirstQuote(getQuoteState(getState()));
        if (firstQuote) {
          await dispatch(actions.editPolicyByTypeAndIndex(firstQuote.type, 0, true));
        } else {
          dispatch(commonActions.globalError(true, '', null, null));
        }
      }
    },
  /**
   * Get the types of quotes to create in the bundle call
   */
  getCreateBundleQuoteTypes: (quoteState: QuoteState) => {
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;
    const result: PolicyBundleApiModels.CreateUpdateBundleRequestQuotes = {
      motor: [],
      home: []
    };
    cars.forEach(() => result.motor.push(PolicyApiModels.KnownTypeOfPolicy.Personal));
    boats.forEach(() => result.motor.push(PolicyApiModels.KnownTypeOfPolicy.Boat));
    motorbikes.forEach(() => result.motor.push(PolicyApiModels.KnownTypeOfPolicy.Motorbike));
    houses.forEach(() => result.home.push(PolicyApiModels.KnownTypeOfPolicy.House));
    contents.forEach(() => result.home.push(PolicyApiModels.KnownTypeOfPolicy.Contents));
    landlords.forEach(() => result.home.push(PolicyApiModels.KnownTypeOfPolicy.Landlord));
    ctps.forEach(() => result.motor.push(PolicyApiModels.KnownTypeOfPolicy.CompulsoryThirdParty));
    return result;
  },
  /**
   * Get the types of quotes to create in the bundle call
   * Param type: car, house, contents, landlord
   */
  getCreateBundleQuoteTypesFromTypes: (types: string[]) => {
    const result: PolicyBundleApiModels.CreateUpdateBundleRequestQuotes = {
      motor: [],
      home: []
    };
    types.forEach((type) => {
      if (type === 'car') {
        result.motor.push(PolicyApiModels.KnownTypeOfPolicy.Personal);
      } else if (type === 'boat') {
        result.motor.push(PolicyApiModels.KnownTypeOfPolicy.Boat);
      } else if (type === 'motorbike') {
        result.motor.push(PolicyApiModels.KnownTypeOfPolicy.Motorbike);
      } else if (type === 'compulsoryThirdParty') {
        result.motor.push(PolicyApiModels.KnownTypeOfPolicy.CompulsoryThirdParty);
      } else {
        result.home.push(type);
      }
    });
    return result;
  },
  /**
   * Updates UI state based on save quotes results
   */
  updateUiFromSavedQuotes: updateUiFromSavedQuotes,

  /**
   * Updates UI shared state based on save quotes results (first item)
   */
  updateUiSharedFromSavedQuotes:
    (quotes: QuotePolicyTypes[], sharedQuoteState: QuoteSharedState) =>
    async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const trans = new QuoteTransformer();
      // retain in bundle state
      const {
        inBundle,
        bundleId,
        hasResumed,
        getQuoteCompShown,
        existingCustomer,
        policyAddresses,
        policyDrivers,
        policyInsureds,
        policyPrimaryInsured,
        policyBusinesses,
        policyBusinessManagers,
        selectedBusiness,
        numberOfPolicies,
        promoCode,
        promoCodeValid
      } = sharedQuoteState;
      sharedQuoteState = trans.mapApiModelToSharedUiModel(quotes, sharedQuoteState);
      sharedQuoteState.bundleId = bundleId;
      sharedQuoteState.hasResumed = hasResumed;
      sharedQuoteState.getQuoteCompShown = getQuoteCompShown;
      sharedQuoteState.existingCustomer = existingCustomer;
      sharedQuoteState.policyPrimaryInsured = policyPrimaryInsured;
      sharedQuoteState.policyAddresses = policyAddresses;
      sharedQuoteState.policyInsureds = policyInsureds;
      sharedQuoteState.policyBusinesses = policyBusinesses;
      sharedQuoteState.policyBusinessManagers = policyBusinessManagers;
      sharedQuoteState.selectedBusiness = selectedBusiness;
      sharedQuoteState.policyDrivers = policyDrivers;
      sharedQuoteState.numberOfPolicies = numberOfPolicies;
      sharedQuoteState.promoCode = promoCode;
      sharedQuoteState.promoCodeValid = promoCodeValid;
      const totalBundledItems = getTotalBundledItems(getState());
      if (totalBundledItems > 1 || inBundle) {
        sharedQuoteState.inBundle = true;
      }
      const interestedParties = await getInterestedPartyDetails(getState());
      if (interestedParties === null) {
        throw Error();
      } else {
        sharedQuoteState.financialInterestedParties = interestedParties;
      }
      dispatch(formActions.change(modelPath, sharedQuoteState));
      return sharedQuoteState;
    },

  /**
   * Resumes by policy number.
   * Get quote (motor/house).
   * If no bundle id, create bundle
   */
  resumeBundleByPolicyNumber:
    (policyNumber: string, product: string) => async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const state = getState();
      const isAuthenticated = commonSelectors.isAuthenticated(state);
      const accessToken = localStorage.getItem('access_token');
      let actualQuote = null as PolicyApiModels.MotorQuote | PolicyApiModels.HomeQuote;

      try {
        if (product === 'home') {
          if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
            actualQuote = await services.policyServiceWithAccessToken(accessToken).getHome(policyNumber, XBrandId);
          } else {
            actualQuote = await services.policyService.getHome(policyNumber, XBrandId);
          }
        } else {
          if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
            actualQuote = await services.policyServiceWithAccessToken(accessToken).getMotor(policyNumber, XBrandId);
          } else {
            actualQuote = await services.policyService.getMotor(policyNumber, XBrandId);
          }
        }
        if (!actualQuote.policyNumber) {
          throw new Error('Policy number not exist');
        }
        // If a valid quote is found, handle resume logic
        if (actualQuote) {
          try {
            // get possible default values from existing policies & load product types available for brand for bundle builder
            await Promise.all([actions.getPolicyDefaults()(dispatch, getState), actions.loadProductTypes()(dispatch)]);

            if (actualQuote.bundleId) {
              await resumeQuotes(actualQuote.bundleId)(dispatch, getState);
            } else {
              const createBundleResult = await actions.createBundleFromPolicyNumber(
                isAuthenticated,
                product,
                policyNumber
              );

              if (isCreateBundleResult(createBundleResult)) {
                await resumeQuotes(createBundleResult.bundleId)(dispatch, getState);
              }
            }
          } catch (ex) {
            logError(ex, getFunctionName());
            towerHistory.replace(routes.QUOTE.SHARED.BUNDLE_BUILDER + '?expired=true');
            dispatch({
              type: GLOBAL_ERROR,
              payload: {
                visible: true,
                message: `Sorry, we cannot retrieve your quote online. Please call us on ${process.env.brandPhoneQ2BError} and we'll help you out.`,
                title: 'Please give us a call',
                noRefresh: true
              }
            });
          }
        } else {
          towerHistory.replace(routes.QUOTE.SHARED.BUNDLE_BUILDER + '?expired=true');
          dispatch({
            type: GLOBAL_ERROR,
            payload: {
              visible: true,
              message: `Sorry, we cannot retrieve your quote online. Please call us on ${process.env.brandPhoneQ2BError} and we'll help you out.`,
              title: 'Please give us a call',
              noRefresh: true
            }
          });
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        towerHistory.replace(routes.QUOTE.SHARED.BUNDLE_BUILDER + '?expired=true');
        dispatch({
          type: GLOBAL_ERROR,
          payload: {
            visible: true,
            message: `Sorry, we cannot retrieve your quote online. Please call us on ${process.env.brandPhoneQ2BError} and we'll help you out.`,
            title: 'Please give us a call',
            noRefresh: true
          }
        });
      }
    },
  updateActiveQuoteByActiveIndexr: updateActiveQuoteByActiveIndex,
  /**
   * Save quote on page 1, only version and dates
   */
  saveQuotesPartial: () => async (dispatch: AppDispatch, getState: () => ApplicationState) => {
    try {
      const state = getState() as ApplicationState;
      const quoteState = getQuoteState(state);
      const { cars, boats, houses, contents, landlords, ctps, motorbikes } = quoteState;
      const sharedQuoteState = { ...sharedSelectors.getQuoteSharedState(state) };
      const promises = await getSaveQuotePromises(quoteState, sharedQuoteState, state.flags, getState);

      // throws error if fails
      const saveResults = await Promise.all(promises);
      const counters = { car: 0, boats: 0, house: 0, contents: 0, landlord: 0, ctp: 0, motorbike: 0 };
      const trans = new QuoteTransformer();
      saveResults.forEach((data) => {
        const policyType = data.result.typeOfPolicy;
        if (
          policyType === PolicyApiModels.KnownMotorTypeOfPolicy.Personal ||
          policyType === PolicyApiModels.KnownMotorTypeOfPolicy.Commercial
        ) {
          const dto = data.result as PolicyApiModels.MotorQuote;
          const carQuoteState = trans.mapCarApiModelToCarUiModel(dto, data.result.policyNumber);
          const { transactionEffectiveDate, version, riskCharacteristicsUpdateDate, motorParties } = carQuoteState;

          // Updating motorParty properties which are different than carQuoteState. So we only update addressResidential oid
          motorParties.forEach((party: CustomMotorParty, index) => {
            party.addressResidential = cars[counters.car].motorParties[index].addressResidential;
            party.markedAsContactOrOwner = cars[counters.car].motorParties[index].markedAsContactOrOwner;
            party.markedAsSharedDriver = cars[counters.car].motorParties[index].markedAsSharedDriver;
            party.emails = cars[counters.car].motorParties[index].emails;
            delete party.enabled;
          });

          cars[counters.car] = {
            ...cars[counters.car],
            transactionEffectiveDate,
            version,
            riskCharacteristicsUpdateDate,
            motorParties
          };
          counters.car++;
        } else if (policyType === PolicyApiModels.KnownMotorTypeOfPolicy.Boat) {
          const dto = data.result as PolicyApiModels.MotorQuote;
          const boatQuoteState = trans.mapBoatApiModelToBoatUiModel(dto, data.result.policyNumber);
          const { transactionEffectiveDate, version, riskCharacteristicsUpdateDate } = boatQuoteState;
          boats[counters.boats] = {
            ...boats[counters.boats],
            transactionEffectiveDate,
            version,
            riskCharacteristicsUpdateDate
          };
          counters.boats++;
        } else if (policyType === PolicyApiModels.KnownMotorTypeOfPolicy.CompulsoryThirdParty) {
          const dto = data.result as PolicyApiModels.MotorQuote;
          const ctpQuoteState = trans.mapCtpApiModelToCtpUiModel(dto, data.result.policyNumber);
          const { transactionEffectiveDate, version, riskCharacteristicsUpdateDate, contactOrOwner } = ctpQuoteState;
          ctps[counters.ctp] = {
            ...ctps[counters.ctp],
            transactionEffectiveDate,
            version,
            riskCharacteristicsUpdateDate,
            contactOrOwner
          };
          counters.ctp++;
        } else if (policyType === PolicyApiModels.KnownMotorTypeOfPolicy.Motorbike) {
          const dto = data.result as PolicyApiModels.MotorQuote;
          const motorbikeQuoteState = trans.mapMotorbikeApiModelToMotorbikeUiModel(dto, data.result.policyNumber);
          const { transactionEffectiveDate, version, riskCharacteristicsUpdateDate } = motorbikeQuoteState;
          motorbikes[counters.motorbike] = {
            ...motorbikes[counters.motorbike],
            transactionEffectiveDate,
            version,
            riskCharacteristicsUpdateDate
          };
          counters.motorbike++;
        } else if (policyType === 'house' || policyType === 'landlord' || policyType === 'contents') {
          const dto = data.result as PolicyApiModels.HomeQuote;
          const houseQuoteState = trans.mapHouseApiModelToHouseUiModel(dto, data.result.policyNumber);
          const {
            transactionEffectiveDate,
            version,
            riskCharacteristicsUpdateDate,
            isFSLApplied,
            coverages,
            promoCode,
            promoCodeValid
          } = houseQuoteState;
          if (policyType === 'house') {
            houses[counters.house] = {
              ...houses[counters.house],
              transactionEffectiveDate,
              version,
              riskCharacteristicsUpdateDate,
              isFSLApplied,
              coverages,
              promoCode,
              promoCodeValid
            };
            counters.house++;
          } else if (policyType === 'landlord') {
            landlords[counters.landlord] = {
              ...landlords[counters.landlord],
              transactionEffectiveDate,
              version,
              riskCharacteristicsUpdateDate
            };
            counters.landlord++;
          } else {
            contents[counters.contents] = {
              ...contents[counters.contents],
              transactionEffectiveDate,
              version,
              riskCharacteristicsUpdateDate,
              isFSLApplied
            };
            counters.contents++;
          }
        }
      });
      dispatch({
        type: actionTypes.UPDATE_QUOTES,
        payload: {
          cars: cars,
          boats: boats,
          motorbikes: motorbikes,
          ctps: ctps,
          houses: houses,
          landlords: landlords,
          contents: contents
        }
      });

      dispatch(updateActiveQuoteByActiveIndex());

      return true;
    } catch (ex) {
      logError(ex, getFunctionName());

      if (ex instanceof Error && ex.message === 'VERSION_CONFLICT') {
        dispatch(formActions.change(`${modelPath}.invalidVersionModalVisible`, true));
        throw ex;
      }
      dispatch(commonActions.globalError(true, '', null, null));

      return false;
    }
  },
  /**
   * Saves all quotes and add to bundle if not already in one
   * Optionally will dispatch "toasts" for error states
   * Flags fromBuilder/fromSummary are used to set the first questions value to null so the question is not prefilled.
   * Total policies will override the policyCount on each quote
   */
  saveQuotes:
    (
      totalPolicies?: number,
      membershipId?: string,
      keepRates?: boolean,
      creatingBundle?: boolean,
      dontRedirect?: boolean,
      replacedPolicy?: ReplacedPolicy
    ) =>
    async (dispatch: AppDispatch, getState: () => ApplicationState) => {
      try {
        const state = getState() as ApplicationState;
        const quoteState = getQuoteState(state);
        const isAuthenticated = commonSelectors.isAuthenticated(state);
        let sharedQuoteState = { ...sharedSelectors.getQuoteSharedState(state) };

        // create bundle and/or quotes if they doesn't exist
        let createBundleResult: PolicyBundleApiModels.CreateUpdateBundleResponse;
        if (!sharedQuoteState.bundleId) {
          // create bundle will create the quotes and add them to the bundle
          // if we provide the quote types
          const quoteTypes = creatingBundle ? actions.getCreateBundleQuoteTypes(quoteState) : null;
          const customer = commonSelectors.getCustomer(state);
          createBundleResult = await actions.createBundle(
            isAuthenticated,
            quoteTypes,
            totalPolicies,
            sharedQuoteState.memberDiscount,
            commonSelectors.getAgency(state)?.partnerCode,
            sharedQuoteState.anonymousUserInfo,
            customer,
            replacedPolicy,
            commonSelectors.getAgent(state)?.agentCode,
            membershipId
          );
          sharedQuoteState.bundleId = createBundleResult.bundleId;
        }

        if (isEmpty(totalPolicies) === false) {
          sharedQuoteState.policyCount = totalPolicies;
        }

        // if this is a new bundle then the quotes are already created and added
        // otherwise save the quotes and add to the bundle
        let saveResults: SaveQuotePromisesResults[];
        if (!creatingBundle) {
          const promises = await getSaveQuotePromises(quoteState, sharedQuoteState, state.flags, getState);
          // throws error if fails
          saveResults = await Promise.all(promises);
          // We never get here with anything but [l] now for quotes not in bundle?
          // Resume should handle them all pretty much.
        }

        // quotes are all in a bundle at this point, now map the two paths above
        // to common policy models
        let quotes: QuotePolicyTypes[];
        if (creatingBundle) {
          quotes = QuoteTransformer.mapBundleApiModelToPolicyApiModel([
            ...createBundleResult.quotes.motor,
            ...createBundleResult.quotes.home
          ]);
        } else {
          quotes = saveResults.map((r) => r.result);
        }

        // update state
        dispatch(actions.updateUiFromSavedQuotes(sharedQuoteState.bundleId, quotes, keepRates));
        sharedQuoteState = {
          ...(await actions.updateUiSharedFromSavedQuotes(quotes, sharedQuoteState)(dispatch, getState))
        };

        // if car quote and privacy policy true, mark submitted pg 1 as true to hide the question
        const carQuote = quotes.find((x) => x.typeOfPolicy === 'commercial' || x.typeOfPolicy === 'personal');
        if (carQuote && sharedQuoteState.privacyPolicy) {
          sharedQuoteState.hasSubmittedCarPage1 = true;
        }
        // custom legal questions for landlord or house
        const landlordQuote = quotes.find((x) => x.typeOfPolicy === 'landlord');
        const houseQuote = quotes.find((x) => x.typeOfPolicy === 'house');
        if (landlordQuote) {
          const landlordRisk = landlordQuote?.risk as HouseRiskQuote;
          sharedQuoteState.propertySecureMaintainedNoDamageInd = landlordRisk?.propertySecureMaintainedNoDamageInd;
          if (isEmpty(sharedQuoteState.propertySecureMaintainedNoDamageInd) === false) {
            // todo: map this to appropriate field? Pending EIS bug? see mapper
            // sharedState.landlordsDeclarationInd = landlordSharedState.landlordsDeclarationInd;
            sharedQuoteState.landlordsDeclarationInd = true;
          }
        } else if (houseQuote) {
          const houseRisk = (houseQuote as PolicyApiModels.HomeQuote)?.houseRisk;
          sharedQuoteState.propertySecureMaintainedNoDamageInd = houseRisk?.propertySecureMaintainedNoDamageInd;
        }

        // update active quote based on route
        const activeQuote = getCurrentQuoteByRoute(quoteState);
        if (dontRedirect) {
          actions.updateSharedState(sharedQuoteState)(dispatch);
        } else if (activeQuote) {
          actions.editPolicyByTypeAndIndex(activeQuote.type, activeQuote.index, false, false)(dispatch, getState);
        } else {
          actions.updateSharedState(sharedQuoteState)(dispatch);
        }
        // sync all car quotes with shared state
        actions.syncCarDriversToSharedState()(dispatch, getState);

        return true;
      } catch (ex) {
        logError(ex, getFunctionName());

        if (ex instanceof Error && ex.message === 'VERSION_CONFLICT') {
          dispatch(formActions.change(`${modelPath}.invalidVersionModalVisible`, true));
          throw ex;
        }
        dispatch(commonActions.globalError(true, '', null, null));

        return false;
      }
    },

  /**
   * Takes the car quote state and shared quote state and passes to the appropriate api
   * Can be used for new and existing quotes
   * Returns the API result of the quote
   */
  saveCarQuote: async (
    carQuoteState: QuoteCarState,
    sharedQuoteState: QuoteSharedState,
    flags: FeatureFlags,
    getState: () => ApplicationState
  ) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);
    const accessToken = localStorage.getItem('access_token');
    const newRequest = new QuoteTransformer();
    const postData = newRequest.mapUiCarModelToApiCarModel(carQuoteState, sharedQuoteState, flags);
    const policyNumber = carQuoteState.policyNumber;
    let result = {} as PolicyApiModels.MotorQuote;
    const requestOptions = getDefaultRequestOptions();
    try {
      if (policyNumber) {
        if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
          result = await services.policyServiceWithAccessToken(accessToken).updateMotor(policyNumber, XBrandId, {
            body: postData,
            requestOptions: requestOptions,
            onResponse: (response) => {
              if (response.status !== 200) {
                throw Error(response.bodyAsText);
              }
            }
          });
        } else {
          result = await services.policyService.updateMotor(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: postData,
            onResponse: (response) => {
              if (response.status !== 200) {
                logApiError(new Error(response.bodyAsText), 'ui-api-update-car', requestOptions);
                throw Error(response.bodyAsText);
              }
            }
          });
        }
      } else {
        throw Error('Deprectaed API create motor');
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-update-motor', requestOptions);

      const errorMessage = ex instanceof Error ? ex.message : String(ex);

      const isVersionConflict =
        errorMessage.includes('POLICY_VERSION_NOT_MATCHED') ||
        errorMessage.includes('VERSION_CONFLICT') ||
        (errorMessage.includes('ERROR_SERVICE_VALIDATION') && errorMessage.toLowerCase().includes('version'));

      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }

      throw new Error('save-quote-fail');
    }

    if (result && result.policyNumber) {
      return result;
    } else {
      logApiError(new Error('No result'), 'ui-api-update-motor', requestOptions);
      throw new Error('save-quote-fail');
    }
  },
  saveHouseQuote: async (
    houseQuoteState: QuoteHouseState,
    sharedQuoteState: QuoteSharedState,
    flags: FeatureFlags,
    getState: () => ApplicationState
  ) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);
    const accessToken = localStorage.getItem('access_token');
    const newRequest = new QuoteTransformer();
    const postData = newRequest.mapUiHomeModelToApiHouseModel(houseQuoteState, sharedQuoteState, flags);
    const policyNumber = houseQuoteState.policyNumber;
    let result = {} as PolicyApiModels.HomeQuote;
    const requestOptions = getDefaultRequestOptions();
    try {
      if (policyNumber) {
        if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
          result = await services.policyServiceWithAccessToken(accessToken).updateHome(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: postData,
            onResponse: (response) => {
              if (response.status !== 200) {
                throw Error(response.bodyAsText);
              }
            }
          } as UpdateHomeOptionalParams);
        } else {
          result = await services.policyService.updateHome(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: postData,
            onResponse: (response) => {
              if (response.status !== 200) {
                logApiError(new Error(response.bodyAsText), 'ui-api-update-home', requestOptions);
                throw Error(response.bodyAsText);
              }
            }
          } as UpdateHomeOptionalParams);
        }
      } else {
        throw Error('Deprecated API create home');
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-update-home', requestOptions);

      const errorMessage = ex instanceof Error ? ex.message : String(ex);

      const isVersionConflict =
        errorMessage.includes('POLICY_VERSION_NOT_MATCHED') ||
        errorMessage.includes('VERSION_CONFLICT') ||
        (errorMessage.includes('ERROR_SERVICE_VALIDATION') && errorMessage.toLowerCase().includes('version'));

      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }

      throw new Error('save-quote-fail');
    }

    if (result && result.policyNumber) {
      return result;
    } else {
      logApiError(new Error('No result'), 'ui-api-update-home', requestOptions);
      throw new Error('save-quote-fail');
    }
  },
  /**
   * Takes the boat quote state and shared quote state and passes to the appropriate api
   * Can be used for new and existing quotes
   * Returns the API result of the quote
   */
  saveBoatQuote: async (
    boatQuoteState: QuoteBoatsState,
    sharedQuoteState: QuoteSharedState,
    flags: FeatureFlags,
    getState: () => ApplicationState
  ) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);
    const accessToken = localStorage.getItem('access_token');
    const newRequest = new QuoteTransformer();
    const postData = newRequest.mapUiBoatModelToApiBoatModel(boatQuoteState, sharedQuoteState, flags);
    const policyNumber = boatQuoteState.policyNumber;
    let result = {} as PolicyApiModels.MotorQuote;
    const requestOptions = getDefaultRequestOptions();

    try {
      if (policyNumber) {
        if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
          result = await services
            .policyServiceWithAccessToken(accessToken)
            .updateMotor(policyNumber, XBrandId, { body: postData, requestOptions: requestOptions });
        } else {
          result = await services.policyService.updateMotor(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: postData,
            onResponse: (response) => {
              if (response.status !== 200) {
                logApiError(new Error(response.bodyAsText), 'ui-api-update-boat', requestOptions);
                throw Error(response.bodyAsText);
              }
            }
          });
        }
      } else {
        throw Error('Deprectaed API create motor');
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-update-boat', requestOptions);

      const errorMessage = ex instanceof Error ? ex.message : String(ex);

      const isVersionConflict =
        errorMessage.includes('POLICY_VERSION_NOT_MATCHED') ||
        errorMessage.includes('VERSION_CONFLICT') ||
        (errorMessage.includes('ERROR_SERVICE_VALIDATION') && errorMessage.toLowerCase().includes('version'));

      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }

      throw new Error('save-quote-fail');
    }

    if (result && result.policyNumber) {
      return result;
    } else {
      logApiError(new Error('No result'), 'ui-api-update-boat', requestOptions);
      throw new Error('save-quote-fail');
    }
  },
  /**
   * Takes the boat quote state and shared quote state and passes to the appropriate api
   * Can be used for new and existing quotes
   * Returns the API result of the quote
   */
  saveCtpQuote: async (
    ctpQuoteState: QuoteCtpState,
    sharedQuoteState: QuoteSharedState,
    flags: FeatureFlags,
    getState: () => ApplicationState
  ) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);
    const accessToken = localStorage.getItem('access_token');
    const newRequest = new QuoteTransformer();
    const postData = newRequest.mapUiCtpModelToApiCtpModel(ctpQuoteState, sharedQuoteState, flags);
    const policyNumber = ctpQuoteState.policyNumber;
    let result = {} as PolicyApiModels.MotorQuote;
    const requestOptions = getDefaultRequestOptions();

    try {
      if (policyNumber) {
        if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
          result = await services.policyServiceWithAccessToken(accessToken).updateMotor(policyNumber, XBrandId, {
            body: postData,
            requestOptions: requestOptions,
            onResponse: (response) => {
              if (response.status !== 200) {
                logApiError(new Error(response.bodyAsText), 'ui-api-update-ctp', requestOptions);
                throw Error(response.bodyAsText);
              }
            }
          });
        } else {
          result = await services.policyService.updateMotor(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: postData,
            onResponse: (response) => {
              if (response.status !== 200) {
                logApiError(new Error(response.bodyAsText), 'ui-api-update-ctp', requestOptions);
                throw Error(response.bodyAsText);
              }
            }
          });
        }
      } else {
        throw Error('Deprecated API create ctp');
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-update-ctp', requestOptions);

      const errorMessage = ex instanceof Error ? ex.message : String(ex);

      const isVersionConflict =
        errorMessage.includes('POLICY_VERSION_NOT_MATCHED') ||
        errorMessage.includes('VERSION_CONFLICT') ||
        (errorMessage.includes('ERROR_SERVICE_VALIDATION') && errorMessage.toLowerCase().includes('version'));

      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }

      throw new Error('save-quote-fail');
    }

    if (result && result.policyNumber) {
      return result;
    } else {
      logApiError(new Error('No result'), 'ui-api-update-ctp', requestOptions);
      throw new Error('save-quote-fail');
    }
  },

  getPolicyDefaults: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);
    const requestOptions = getDefaultRequestOptions();

    if (isAuthenticated) {
      const accessToken = localStorage.getItem('access_token');
      await Promise.all([
        (async () => {
          try {
            const policyPrimaryInsured = await services
              .policyDefaultServiceWithAccessToken(accessToken)
              .getDefaultPrimaryInsured(XBrandId, { requestOptions: requestOptions });
            dispatch(formActions.change('myForms.sharedQuote.policyPrimaryInsured', policyPrimaryInsured));
          } catch (ex) {
            logApiError(ex, 'ui-api-get-default-primary-insured', requestOptions);
          }
        })(),
        (async () => {
          try {
            const defaultAddresses = await services
              .policyDefaultServiceWithAccessToken(accessToken)
              .getDefaultAddresses(XBrandId, { requestOptions: requestOptions });
            dispatch(formActions.change('myForms.sharedQuote.policyAddresses', defaultAddresses));
          } catch (ex) {
            logApiError(ex, 'ui-api-get-default-addresses', requestOptions);
          }
        })(),
        (async () => {
          try {
            const defaultDrivers = await services
              .policyDefaultServiceWithAccessToken(accessToken)
              .getDefaultDrivers(XBrandId, { requestOptions: requestOptions });
            dispatch(formActions.change('myForms.sharedQuote.policyDrivers', defaultDrivers));
          } catch (ex) {
            logApiError(ex, 'ui-api-get-default-drivers', requestOptions);
          }
        })(),
        (async () => {
          try {
            const defaultInsureds = await services
              .policyDefaultServiceWithAccessToken(accessToken)
              .getDefaultInsureds(XBrandId, { requestOptions: requestOptions });
            const sortedInsureds = commonSelectors.getSortedInsuredParties(defaultInsureds, state);
            dispatch(formActions.change('myForms.sharedQuote.policyInsureds', sortedInsureds));
          } catch (ex) {
            logApiError(ex, 'ui-api-get-default-insureds', requestOptions);
          }
        })(),
        (async () => {
          try {
            const defaultBusinesses = await services
              .customerService(accessToken)
              .getRelationships(XBrandId, { requestOptions: requestOptions });
            dispatch(formActions.change('myForms.sharedQuote.policyBusinesses', defaultBusinesses));
          } catch (ex) {
            logApiError(ex, 'ui-api-get-default-businesses', requestOptions);
          }
        })(),
        (async () => {
          try {
            const defaultVehicleUsage = await services
              .policyDefaultServiceWithAccessToken(accessToken)
              .getDefaultVehicleUsage(XBrandId, { requestOptions: requestOptions });
            dispatch(formActions.change('myForms.sharedQuote.policyVehicleUsage', defaultVehicleUsage));
          } catch (ex) {
            logApiError(ex, 'ui-api-get-default-vehicle-usage', requestOptions);
          }
        })()
      ]);
    }
    await actions.getActiveCampaign()(dispatch);
    await actions.getActivePromocode()(dispatch, getState);
  },
  getActivePromocode: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);

    const agencyCampaignsFlag = commonSelectors.getAgencyCampaignsFlag(state);
    const customerCampaignsFlag = commonSelectors.getCustomerCampaignsFlag(state);
    const sharedState = sharedSelectors.getQuoteSharedState(state);
    let promoCode = sharedState.promoCode;
    const ppqPromoCode = promoCode ? promoCode.toUpperCase().startsWith('PPQ') : false;

    if (
      ppqPromoCode ||
      (commonSelectors.promoCodesEnabled() && agencyCampaignsFlag !== false && customerCampaignsFlag !== false)
    ) {
      if (!promoCode) {
        // If no promo code set on bundle then get active campaign promo code and apply it to bundle
        promoCode = commonSelectors.getActiveCampaign(state);
      }

      if (promoCode) {
        const promoCodeIsValid = await validatePromoCode(isAuthenticated, promoCode);

        if (promoCodeIsValid) {
          dispatch(formActions.change('myForms.sharedQuote.promoCode', promoCode));
          dispatch(formActions.change('myForms.sharedQuote.promoCodeValid', true));
        }
      }
    } else {
      // Reset promo code as it is not supported by either the brand, agency or customer
      // Reset needed as promo code may have been set by value being passed on the url
      dispatch(formActions.reset('myForms.sharedQuote.promoCode'));
    }
  },
  getActiveCampaign: () => async (dispatch: Dispatch) => {
    if (t('base:config.CampaignsAllowed') === true) {
      const promoCode = await getActiveCampaignFromDxp();

      if (promoCode && actions.isCampaignDefinedInWhiteLabel(promoCode)) {
        dispatch(formActions.change('myForms.sharedQuote.promoCode', promoCode));
        dispatch(formActions.change('myForms.sharedQuote.promoCodeValid', true));
      } else {
        // Reset promo code as it is not supported by either the brand, agency or customer
        // Reset needed as promo code may have been set by value being passed on the url
        dispatch(formActions.reset('myForms.sharedQuote.promoCode'));
      }
    }
  },
  isCampaignDefinedInWhiteLabel: (promocode: string) => {
    const configName = `promoCodeCampaign_${promocode.toLowerCase()}`;
    return t(`promo:${configName}`) === promocode;
  },
  isProductAndCoverTypeEligibleForPromoCode:
    (productType: string, coverType: string, promoCode: string, modelPath: string) => async (dispatch: Dispatch) => {
      const result: boolean = await validatePromoCodeforPolicyTypeAndCoverType(promoCode, productType, coverType);

      if (!isEmpty(promoCode) && result) {
        dispatch(formActions.change(`${modelPath}.promoCode`, promoCode));
        dispatch(formActions.change(`${modelPath}.promoCodeValid`, true));
        dispatch(formActions.change(`${modelPath}.promoCodeApplicable`, true));
        return true;
      } else {
        dispatch(formActions.change(`${modelPath}.promoCodeValid`, false));
        dispatch(formActions.change(`${modelPath}.promoCodeApplicable`, false));
        return false;
      }
    },

  getBusinessPolicyManagers: (customerNumber: string) => async (dispatch: Dispatch) => {
    const accessToken = localStorage.getItem('access_token');
    const requestOptions = getDefaultRequestOptions();
    try {
      const policyManagers = await services
        .customerService(accessToken)
        .getCorporationRelationships(customerNumber, XBrandId, { requestOptions: requestOptions });
      dispatch(formActions.change('myForms.sharedQuote.policyBusinessManagers', policyManagers));
    } catch (ex) {
      logApiError(ex, 'ui-api-get-default-corporation-relationships', requestOptions);
    }
  },
  /**
   * Quick underwrite a quote
   */
  quickUnderwriteQuote: async (chosenQuote: QuoteTypes, sharedQuoteState: QuoteSharedState, flags: FeatureFlags) => {
    const requestOptions = getDefaultRequestOptions();
    try {
      const today = momentNZ().startOf('day');
      const newRequest = new QuoteTransformer();

      let postData = null as PolicyApiModels.MotorQuote | PolicyApiModels.HomeQuote;
      let results = [] as PolicyApiModels.UnderwriteResponse[];
      if (chosenQuote.policyType === 'car') {
        postData = newRequest.mapUiCarModelToApiCarModel(chosenQuote as QuoteCarState, sharedQuoteState, flags);
        // if effective date is yesterday, policy start date hasn't been chosen
        // for underwriting, set to today
        const mDt = momentNZ(postData.effectiveDate);
        if (mDt && mDt.isValid() && mDt.isSameOrAfter(today) === false) {
          postData.effectiveDate = today.toDate();
        }
        // don't send vehicle information unless redbook reference found
        if (isMotorQuote(postData) && isEmpty((postData as PolicyApiModels.MotorQuote)?.carRisk?.redbookReference)) {
          delete (postData as PolicyApiModels.MotorQuote).carRisk;
        }

        results = await services.policyService.underwriteMotor(XBrandId, {
          requestOptions: requestOptions,
          body: postData,
          onResponse: (response) => {
            if (response.status !== 200 && response.status !== 204) {
              logApiError(new Error(response.bodyAsText), 'ui-api-underwrite-motor', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
      } else if (chosenQuote.policyType === 'boat') {
        postData = newRequest.mapUiBoatModelToApiBoatModel(chosenQuote as QuoteBoatsState, sharedQuoteState, flags);
        // if effective date is yesterday, policy start date hasn't been chosen
        // for underwriting, set to today
        const mDt = momentNZ(postData.effectiveDate);
        if (mDt && mDt.isValid() && mDt.isSameOrAfter(today) === false) {
          postData.effectiveDate = today.toDate();
        }
        results = await services.policyService.underwriteMotor(XBrandId, {
          requestOptions: requestOptions,
          body: postData,
          onResponse: (response) => {
            if (response.status !== 200 && response.status !== 204) {
              logApiError(new Error(response.bodyAsText), 'ui-api-underwrite-boat', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
      } else if (chosenQuote.policyType === 'compulsoryThirdParty') {
        postData = newRequest.mapUiCtpModelToApiCtpModel(chosenQuote as QuoteCtpState, sharedQuoteState, flags);
        // if effective date is yesterday, policy start date hasn't been chosen
        // for underwriting, set to today
        const mDt = momentNZ(postData.effectiveDate);
        if (mDt && mDt.isValid() && mDt.isSameOrAfter(today) === false) {
          postData.effectiveDate = today.toDate();
        }
        results = await services.policyService.underwriteMotor(XBrandId, {
          requestOptions: requestOptions,
          body: postData,
          onResponse: (response) => {
            if (response.status !== 200 && response.status !== 204) {
              logApiError(new Error(response.bodyAsText), 'ui-api-underwrite-ctp', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
      } else if (
        chosenQuote.policyType === 'house' ||
        chosenQuote.policyType === 'contents' ||
        chosenQuote.policyType === 'landlord'
      ) {
        postData = newRequest.mapUiHomeModelToApiHouseModel(chosenQuote as QuoteHouseState, sharedQuoteState, flags);
        // if effective date is yesterday, policy start date hasn't been chosen
        // for underwriting, set to today
        const mDt = momentNZ(postData.effectiveDate);
        if (mDt && mDt.isValid() && mDt.isSameOrAfter(today) === false) {
          postData.effectiveDate = today.toDate();
        }
        // only underwrite house quote if sum insured is present
        // only underwrite contents quote if type of dwelling is present
        if (isHomeQuote(postData) && !(postData as PolicyApiModels.HomeQuote).houseRisk?.sumInsured) {
          results = [];
        } else {
          results = await services.policyService.underwriteHome(XBrandId, {
            requestOptions: requestOptions,
            body: postData,
            onResponse: (response) => {
              if (response.status !== 200 && response.status !== 204) {
                logApiError(new Error(response.bodyAsText), 'ui-api-underwrite-home', requestOptions);
                throw Error(response.bodyAsText);
              }
            }
          });
        }
      }

      let uwData = getUnderwritingMessageFromResponse(results);
      // manual underwrite home quotes as well
      if (chosenQuote.policyType !== 'car' && uwData.status === CustomUnderwriteType.ACCEPT) {
        uwData = manualUnderwriteHomeQuote(chosenQuote as QuoteHouseState);
      }
      return uwData;
    } catch (ex) {
      logError(ex, getFunctionName());
      const response = {
        status: CustomUnderwriteType.ERROR,
        message: '',
        code: '',
        excessAmount: ''
      } as CustomUnderwriteResponse;
      return response;
    }
  },

  /**
   * Quick underwrite the active quote
   */
  quickUnderwriteActiveQuote: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    const {
      activeCarQuoteIndex,
      activeBoatsQuoteIndex,
      activeContentsQuoteIndex,
      activeHouseQuoteIndex,
      activeLandlordsQuoteIndex,
      activeCtpsQuoteIndex
    } = getQuoteState(state);
    let activeState = {} as QuoteTypes;
    if (activeCarQuoteIndex > -1) {
      activeState = carSelectors.getQuoteCarState(state);
    } else if (activeBoatsQuoteIndex > -1) {
      activeState = boatSelectors.getQuoteBoatState(state);
    } else if (activeCtpsQuoteIndex > -1) {
      activeState = ctpSelectors.getQuoteCtpState(state);
    } else if (activeHouseQuoteIndex > -1) {
      activeState = houseSelectors.getQuoteHouseState(state);
    } else if (activeLandlordsQuoteIndex > -1) {
      activeState = landlordSelectors.getQuoteLandlordState(state);
    } else if (activeContentsQuoteIndex > -1) {
      activeState = contentsSelectors.getQuoteContentsState(state);
    }
    const sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
    const uwData = await actions.quickUnderwriteQuote(activeState, sharedQuoteState, state.flags);
    dispatch(formActions.change(`${modelPath}.customUnderwriteResponse`, uwData));
    if (!uwData || uwData.status === CustomUnderwriteType.ERROR) {
      dispatch(commonActions.globalError(true, '', null, null));
    }
    return uwData;
  },

  /**
   * Async Quick Rates all the quotes
   * Effectively clears the quoteRate object on each quote
   * Updates each quote in the state (quote arrays)
   */
  quickRateAllQuotes: (): AppThunk<Promise<boolean>> => async (dispatch: AppDispatch, getState) => {
    const state = getState() as ApplicationState;
    const quoteState = getQuoteState(state);
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;

    const promises: Array<Promise<boolean>> = [];

    if (cars.length > 0) {
      promises.push(dispatch(quickRateCarQuotes()));
    }
    if (houses.length > 0 || landlords.length > 0 || contents.length > 0) {
      promises.push(dispatch(quickRateHouseQuotes()));
    }
    if (boats.length > 0) {
      promises.push(dispatch(quickRateBoatQuotes()));
    }
    if (motorbikes.length > 0) {
      promises.push(dispatch(quickRateMotorbikeQuotes()));
    }
    if (ctps.length > 0) {
      promises.push(dispatch(quickRateCtpQuotes()));
    }
    const results = await Promise.all(promises);

    // If any of the product promises returned false (indicating an error), throws a global error
    if (results.indexOf(false) > -1) {
      dispatch(commonActions.globalError(true, '', null, null));
      return false;
    }
    return true;
  },
  /**
   * Quick Rate the active car quote (car page 2) -- API
   * Updates it in the active car state model and not the quote arrays
   */
  quickRateActiveCarQuote:
    (onRateChange?: () => void, initialCall?: boolean): AppThunk =>
    async (dispatch: AppDispatch, getState) => {
      try {
        const state = getState() as ApplicationState;
        const previousCarState = carSelectors.getQuoteCarState(state);
        dispatch(formActions.change(`${carModelPath}.quoteRate`, getDefaultQuoteRate()));
        const carState = carSelectors.getQuoteCarState(state);
        const sharedState = sharedSelectors.getQuoteSharedState(state);
        const result = await quickRateCarQuote(carState, sharedState, state.flags);
        if (result && result.annual) {
          dispatch(formActions.change(`${carModelPath}.quoteRate`, result));
          // if it's personal and windscreen is $0.00 mark as selected
          const windscreen = result.addons['vehicleWindscreenAndWindowGlassExcessBuyOutCoverage'];
          if (!windscreen && carState.coverageType !== PolicyApiModels.KnownMotorPackage.ThirdParty) {
            dispatch(formActions.change(`${carModelPath}.coverages.windscreen`, true));
          }
          if (initialCall) {
            dispatch({ type: 'view_item' });
          }
          if (previousCarState.quoteRate.fortnightly !== result.fortnightly) {
            onRateChange && onRateChange();
          }
        } else {
          throw Error();
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(commonActions.globalError(true, '', null, null));
      }
    },
  /**
   * Quick Rate the active boat quote (boat page 2) -- API
   * Updates it in the active boat state model and not the quote arrays
   */
  quickRateActiveBoatQuote:
    (onRateChange?: () => void, initialCall?: boolean): AppThunk =>
    async (dispatch: AppDispatch, getState) => {
      try {
        const state = getState() as ApplicationState;
        const previousBoatState = boatSelectors.getQuoteBoatState(state);
        dispatch(formActions.change(`${boatModelPath}.quoteRate`, getDefaultQuoteRate()));
        const boatState = boatSelectors.getQuoteBoatState(state);
        const sharedState = sharedSelectors.getQuoteSharedState(state);
        const result = await quickRateBoatQuote(boatState, sharedState, state.flags);
        if (result && result.annual) {
          dispatch(formActions.change(`${boatModelPath}.quoteRate`, result));
          if (initialCall) {
            dispatch({ type: 'view_item' });
          }
          if (previousBoatState.quoteRate.fortnightly !== result.fortnightly) {
            onRateChange && onRateChange();
          }
        } else {
          throw Error();
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(commonActions.globalError(true, '', null, null));
      }
    },
  /**
   * Quick Rate the active ctp quote (ctp page 1 - start date) -- API
   * Updates it in the active ctp state model and not the quote arrays
   */
  quickRateActiveCtpQuote:
    () => async (dispatch: Dispatch, getState: () => ApplicationState, initialCall?: boolean) => {
      try {
        dispatch(formActions.change(`${ctpModelPath}.quoteRate`, getDefaultQuoteRate()));
        const state = getState() as ApplicationState;
        const ctpState = ctpSelectors.getQuoteCtpState(state);
        const sharedState = sharedSelectors.getQuoteSharedState(state);
        const result = await quickRateCtpQuote(ctpState, sharedState, state.flags);
        if (result && result.annual) {
          dispatch(formActions.change(`${ctpModelPath}.quoteRate`, result));
          if (initialCall) {
            dispatch({ type: 'view_item' });
          }
        } else {
          throw Error();
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(commonActions.globalError(true, '', null, null));
      }
    },

  /**
   * Quick Rate the active house quote (house/landlord/contents page 2) -- API
   * Updates it in the active state model and not the quote arrays
   */
  quickRateActiveHouseQuote:
    (onRateChange?: () => void, initialCall?: boolean): AppThunk =>
    async (dispatch: AppDispatch, getState) => {
      const state = getState() as ApplicationState;
      const { flags } = state;
      let theModelPath = houseModelPath;
      let activeState = houseSelectors.getQuoteHouseState(state);
      if (state.quote.activeLandlordsQuoteIndex > -1) {
        theModelPath = landlordModelPath;
        activeState = landlordSelectors.getQuoteLandlordState(state);
      } else if (state.quote.activeContentsQuoteIndex > -1) {
        theModelPath = contentsModelPath;
        activeState = contentsSelectors.getQuoteContentsState(state);
      }
      try {
        dispatch(formActions.change(`${theModelPath}.quoteRate`, getDefaultQuoteRate()));
        const sharedState = sharedSelectors.getQuoteSharedState(state);
        const result = await quickRateHouseQuote(activeState, sharedState, flags);
        if (result && result.annual) {
          dispatch(formActions.change(`${theModelPath}.quoteRate`, result));
          if (initialCall) {
            dispatch({ type: 'view_item' });
          }
          if (activeState.quoteRate.fortnightly !== result.fortnightly) {
            onRateChange && onRateChange();
          }
        } else {
          throw Error();
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(commonActions.globalError(true, '', null, null));
      }
    },
  preparePaymentPage: async (dispatch: Dispatch, getState: () => ApplicationState) => {
    // ensure we clear customer email so it doesn't get persisted as a party to quotes when purchasing
    // dispatch(formActions.change(`${modelPath}.customerEmail`, null));
    // const saveQuoteResult = await actions.saveQuotes(false, false, false, null, true)(dispatch, getState);
    // if (!saveQuoteResult) {
    //   return false;
    // }
    if (runningAsyncReq === true) {
      return false;
    }
    runningAsyncReq = true;
    const sharedQuoteState = sharedSelectors.getQuoteSharedState(getState());
    try {
      const result = await actions.moveQuotesToRated()(dispatch, getState);

      if (!result) {
        return false;
      }
    } catch (ex) {
      const error = String(ex);

      if (error.includes('VERSION_CONFLICT')) {
        dispatch(formActions.change(`${modelPath}.invalidVersionModalVisible`, true));

        throw ex;
      }

      dispatch(commonActions.globalError(true, '', null, null));

      return false;
    } finally {
      runningAsyncReq = false;
    }
    const hasDt =
      isEmpty(sharedQuoteState.payment.paymentDayOfMonth) === false ||
      isEmpty(sharedQuoteState.payment.paymentStartDate) === false;
    if (
      isEmpty(sharedQuoteState.payment.paymentFrequency) === false &&
      hasDt &&
      sharedQuoteState.payment.paymentFrequency !== PaymentApiModels.KnownPlan.Annual
    ) {
      const installmentsResult = await actions.getQuoteInstallments()(dispatch, getState);
      if (!installmentsResult) {
        dispatch(commonActions.globalError(true, '', null, null));
        runningAsyncReq = false;
        return false;
      }
    }

    // Load saved payments for logged in user.
    await actions.getSavedPaymentMethods()(dispatch, getState);

    runningAsyncReq = false;
    return true;
  },
  /**
   * Method to move every quote into rated status via API
   */
  moveQuotesToRated: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);

    const sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
    const { cars, boats, houses, contents, landlords, ctps } = quoteState;
    const allQuotes = [...cars, ...boats, ...houses, ...contents, ...landlords, ...ctps];
    try {
      const newRequest = new QuoteTransformer();
      const promises = allQuotes.map((quote) => {
        let postData = null as PolicyApiModels.MotorQuote | PolicyApiModels.HomeQuote;
        if (quote.policyType === 'car') {
          postData = newRequest.mapUiCarModelToApiCarModel(quote as QuoteCarState, sharedQuoteState, state.flags);
        } else if (quote.policyType === 'boat') {
          postData = newRequest.mapUiBoatModelToApiBoatModel(quote as QuoteBoatsState, sharedQuoteState, state.flags);
        } else if (quote.policyType === 'compulsoryThirdParty') {
          postData = newRequest.mapUiCtpModelToApiCtpModel(quote as QuoteCtpState, sharedQuoteState, state.flags);
        } else {
          postData = newRequest.mapUiHomeModelToApiHouseModel(quote as QuoteHouseState, sharedQuoteState, state.flags);

          // All parties passed to prepare call requires to have first name and last name specified.
          // With recent changes made to people page allows to remove, alter oldest policy holder's data of birth
          // specified at page1 of house, contents and landlord flows. If this happens mapUiHomeModelToApiHouseModel
          // can return parties with empty first name, last name.
          const allParties = postData.parties;
          const filteredParties = allParties.filter(
            (p) =>
              (!isEmpty(p.individual?.firstName) && !isEmpty(p.individual?.lastName)) ||
              !isEmpty(p.corporation?.corporationName)
          );
          postData.parties = [...filteredParties];
        }
        return actions.moveQuoteToRated(quote.policyNumber, quote.policyType, postData, getState);
      });
      const allResults = await Promise.all(promises);
      if (allResults.find((x) => isEmpty(x) || !x.policyNumber)) {
        return false;
      }
      const updatedQuotes = [] as QuoteTypes[];
      allResults.forEach((x) => {
        const quote = allQuotes.find((y) => y.policyNumber === x.policyNumber);
        const cloneQuote = { ...quote };
        const newRate = { ...quote.quoteRate };
        cloneQuote.version = x.version;
        cloneQuote.transactionEffectiveDate = x.transactionEffectiveDate;
        if (x.annual) {
          newRate.annual = x.annual.billablePremium;
          newRate.ratedAnnual = x.annual.billablePremium;
          newRate.companyAnnual = x.annual.companyPremium;
        }
        if (x.estimatedFortnightly) {
          newRate.fortnightly = x.estimatedFortnightly.billablePremium;
        }
        if (x.estimatedMonthly) {
          newRate.monthly = x.estimatedMonthly.billablePremium;
        }
        if (x.estimatedQuarterly) {
          newRate.quarterly = x.estimatedQuarterly.billablePremium;
        }
        if (x.estimatedSixMonthly) {
          newRate.sixMonthly = x.estimatedSixMonthly.billablePremium;
        }
        cloneQuote.quoteRate = newRate;
        updatedQuotes.push(cloneQuote);
      });
      dispatch({
        type: actionTypes.UPDATE_QUOTES,
        payload: {
          cars: updatedQuotes.filter((x) => x.policyType === 'car'),
          boats: updatedQuotes.filter((x) => x.policyType === 'boat'),
          ctps: updatedQuotes.filter((x) => x.policyType === 'compulsoryThirdParty'),
          houses: updatedQuotes.filter((x) => x.policyType === 'house'),
          contents: updatedQuotes.filter((x) => x.policyType === 'contents'),
          landlords: updatedQuotes.filter((x) => x.policyType === 'landlord')
        }
      });
      const newState = getState() as ApplicationState;
      const newQuoteState = getQuoteState(newState);
      const newAllQuotes = [
        ...newQuoteState.cars,
        ...newQuoteState.houses,
        ...newQuoteState.contents,
        ...newQuoteState.landlords,
        ...newQuoteState.boats,
        ...newQuoteState.ctps
      ] as QuoteTypes[];

      newAllQuotes.forEach((quote) => {
        if (quote.policyType === 'boat') {
          dispatch(formActions.change(`myForms.boatsQuote.version`, quote.version));
          dispatch(formActions.change(`myForms.boatsQuote.transactionEffectiveDate`, quote.transactionEffectiveDate));
        } else if (quote.policyType === 'compulsoryThirdParty') {
          dispatch(formActions.change(`myForms.ctpQuote.version`, quote.version));
          dispatch(formActions.change(`myForms.ctpQuote.transactionEffectiveDate`, quote.transactionEffectiveDate));
        } else {
          dispatch(formActions.change(`myForms.${quote.policyType}Quote.version`, quote.version));
          dispatch(
            formActions.change(
              `myForms.${quote.policyType}Quote.transactionEffectiveDate`,
              quote.transactionEffectiveDate
            )
          );
        }
      });
      return true;
    } catch (ex) {
      logError(ex, getFunctionName());
      throw ex;
    }
  },
  /**
   * Moves a single quote into rated status via API
   */
  moveQuoteToRated: async (
    policyNumber: string,
    quoteType: string,
    quoteData: PolicyApiModels.MotorQuote | PolicyApiModels.HomeQuote,
    getState: () => ApplicationState
  ) => {
    const isMotor = quoteType === 'car' || quoteType === 'boat' || quoteType === 'compulsoryThirdParty';
    const requestOptions = getDefaultRequestOptions();

    let prepareStatus: number | undefined;
    let prepareBody = '';
    try {
      const state = getState() as ApplicationState;
      const isAuthenticated = commonSelectors.isAuthenticated(state);
      const accessToken = localStorage.getItem('access_token');
      const loggedIn = isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled();
      let result = null as PolicyApiModels.PrepareQuoteResponse;

      if (isMotor) {
        if (loggedIn) {
          result = await services.policyServiceWithAccessToken(accessToken).prepareMotor(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: quoteData as PolicyApiModels.MotorQuote,
            onResponse: (response) => {
              prepareStatus = response.status;
              prepareBody = response.bodyAsText || '';
            }
          });
        } else {
          result = await services.policyService.prepareMotor(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: quoteData as PolicyApiModels.MotorQuote,

            onResponse: (response) => {
              prepareStatus = response.status;
              prepareBody = response.bodyAsText || '';
            }
          });
        }
      } else {
        if (loggedIn) {
          result = await services.policyServiceWithAccessToken(accessToken).prepareHome(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: quoteData as PolicyApiModels.HomeQuote,
            onResponse: (response) => {
              prepareStatus = response.status;
              prepareBody = response.bodyAsText || '';
            }
          } as PrepareHomeOptionalParams);
        } else {
          result = await services.policyService.prepareHome(policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: quoteData as PolicyApiModels.HomeQuote,

            onResponse: (response) => {
              prepareStatus = response.status;
              prepareBody = response.bodyAsText || '';
            }
          });
        }
      }
      if (result && result.transactionEffectiveDate) {
        return { policyNumber: policyNumber, ...result };
      } else {
        throw Error('No result');
      }
    } catch (ex) {
      logApiError(ex, `ui-api-prepare-${isMotor ? 'motor' : 'home'}`, requestOptions, quoteData.toString());

      const isVersionConflict =
        prepareStatus === 422 && prepareBody.includes('ERROR_SERVICE_VALIDATION') && prepareBody.includes('version');

      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }
      throw new Error('PREPARE_QUOTE_FAILED');
    }
  },

  /**
   * Method to move change payment details via API
   */
  changeQuotesPaymentDetails: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const sharedState = sharedSelectors.getQuoteSharedState(state);
    const plan = sharedState.payment.paymentFrequency as PaymentApiModels.Plan;
    const { cars, boats, houses, contents, landlords } = quoteState;
    const allQuotes = [...cars, ...boats, ...houses, ...contents, ...landlords];
    try {
      const promises = allQuotes.map((quote) => {
        const paymentDetails = {} as PolicyApiModels.PaymentDetails;
        paymentDetails.plan = plan;
        if (sharedState.payment.paymentType) {
          paymentDetails.paymentMethod =
            sharedState.payment.paymentType === 'CC'
              ? PolicyApiModels.KnownPaymentMethod.CreditCard
              : PolicyApiModels.KnownPaymentMethod.BankAccount;
        }
        if (isEmpty(sharedState.payment.paymentRecurrence) === false) {
          paymentDetails.recurring =
            plan !== PaymentApiModels.KnownPlan.Annual ? true : sharedState.payment.paymentRecurrence;
        }
        if (plan === PaymentApiModels.KnownPlan.Monthly) {
          paymentDetails.paymentDayOfMonth = sharedState.payment.paymentDayOfMonth;
        } else if (plan === PaymentApiModels.KnownPlan.Annual) {
          paymentDetails.firstPaymentDate = getAnnualFirstPaymentDate(sharedState.policyStartDate);
        } else if (sharedState.payment.paymentStartDate) {
          const dt = momentNZ(sharedState.payment.paymentStartDate, 'Do MMM YYYY');
          if (dt.isValid()) {
            paymentDetails.firstPaymentDate = momentNZ(sharedState.payment.paymentStartDate, 'Do MMM YYYY').format(
              'YYYY-MM-DD'
            );
          }
        }
        return actions.changeQuotePaymentDetails(
          quote.policyNumber,
          quote.policyType,
          quote.transactionEffectiveDate as Date,
          quote.version,
          paymentDetails,
          getState
        );
      });
      const allResults = await Promise.all(promises);
      if (allResults.find((x) => x === null)) {
        return false;
      }
      const updatedQuotes = [] as QuoteTypes[];
      allResults.forEach((x) => {
        const quote = allQuotes.find((y) => y.policyNumber === x.policyNumber);
        const cloneQuote = { ...quote };
        cloneQuote.version = x.version;
        cloneQuote.transactionEffectiveDate = x.transactionEffectiveDate;
        updatedQuotes.push(cloneQuote);
      });
      dispatch({
        type: actionTypes.UPDATE_QUOTES,
        payload: {
          cars: updatedQuotes.filter((x) => x.policyType === 'car'),
          boats: updatedQuotes.filter((x) => x.policyType === 'boat'),
          ctps: updatedQuotes.filter((x) => x.policyType === 'compulsoryThirdParty'),
          houses: updatedQuotes.filter((x) => x.policyType === 'house'),
          contents: updatedQuotes.filter((x) => x.policyType === 'contents'),
          landlords: updatedQuotes.filter((x) => x.policyType === 'landlord')
        }
      });
      updatedQuotes.forEach((quote) => {
        if (quote.policyType === 'boat') {
          dispatch(formActions.change(`myForms.boatsQuote.version`, quote.version));
          dispatch(formActions.change(`myForms.boatsQuote.transactionEffectiveDate`, quote.transactionEffectiveDate));
        } else if (quote.policyType === 'compulsoryThirdParty') {
          dispatch(formActions.change(`myForms.ctpQuote.version`, quote.version));
          dispatch(formActions.change(`myForms.ctpQuote.transactionEffectiveDate`, quote.transactionEffectiveDate));
        } else {
          dispatch(formActions.change(`myForms.${quote.policyType}Quote.version`, quote.version));
          dispatch(
            formActions.change(
              `myForms.${quote.policyType}Quote.transactionEffectiveDate`,
              quote.transactionEffectiveDate
            )
          );
        }
      });
      commonThunks.addToast('Great! Your quote(s) has been saved')(dispatch, null, null);
      return true;
    } catch (ex) {
      logError(ex, getFunctionName());

      const errorMessage = ex instanceof Error ? ex.message : String(ex);

      const isVersionConflict =
        errorMessage.includes('POLICY_VERSION_NOT_MATCHED') ||
        errorMessage.includes('VERSION_CONFLICT') ||
        (errorMessage.includes('ERROR_SERVICE_VALIDATION') && errorMessage.toLowerCase().includes('version'));

      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }

      dispatch(commonActions.globalError(true, '', null, null));
      return false;
    }
  },
  /**
   * Update payment details single quote
   */
  changeQuotePaymentDetails: async (
    policyNumber: string,
    quoteType: string,
    transactionEffectiveDate: Date,
    version: number,
    paymentDetails: PolicyApiModels.PaymentDetails,
    getState: () => ApplicationState
  ) => {
    const state = getState() as ApplicationState;
    const isAuthenticated = commonSelectors.isAuthenticated(state);
    const accessToken = localStorage.getItem('access_token');
    const requestOptions = getDefaultRequestOptions();

    try {
      let result;
      if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
        result = await services
          .policyServiceWithAccessToken(accessToken)
          .updatePaymentDetails(
            quoteType === 'car' || quoteType === 'boat'
              ? PolicyApiModels.KnownProductType.Motor
              : PolicyApiModels.KnownProductType.Home,
            policyNumber,
            XBrandId,
            {
              ...requestOptions,
              body: {
                paymentDetails,
                transactionEffectiveDate,
                version
              } as UpdatePaymentDetailsRequest
            }
          );
      } else {
        result = await services.policyService.updatePaymentDetails(
          quoteType === 'car' || quoteType === 'boat'
            ? PolicyApiModels.KnownProductType.Motor
            : PolicyApiModels.KnownProductType.Home,
          policyNumber,
          XBrandId,
          {
            ...requestOptions,
            body: {
              paymentDetails,
              transactionEffectiveDate,
              version
            } as UpdatePaymentDetailsRequest
          }
        );
      }
      if (result && result.version) {
        return { policyNumber: policyNumber, ...result };
      } else {
        throw Error();
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-update-payment-details', requestOptions);
      return null;
    }
  },
  /**
   * Method to move change quotes plan type (annual/nonAnnual) via API
   */
  changeQuotesPlanType:
    (paymentPlan: PolicyApiModels.PaymentPlan) => async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const state = getState();
      const quoteState = getQuoteState(state);
      const { cars, boats, houses, contents, landlords, ctps = [] } = quoteState;
      const allQuotes = [...cars, ...boats, ...houses, ...contents, ...landlords, ...ctps];
      try {
        const promises = allQuotes.map((quote) => {
          return actions.changeQuotePlanType(
            quote.policyNumber,
            quote.policyType,
            quote.transactionEffectiveDate,
            quote.version,
            paymentPlan,
            getState
          );
        });
        const allResults = await Promise.all(promises);
        if (allResults.some((x) => x == null)) {
          return { hasError: true, invalidVersionHandled: false };
        }
        const updatedQuotes = [] as QuoteTypes[];
        allResults.forEach((x) => {
          const quote = allQuotes.find((y) => y.policyNumber === x.policyNumber);
          const cloneQuote = { ...quote };
          const newRate = { ...quote.quoteRate };
          cloneQuote.version = x.version;
          cloneQuote.transactionEffectiveDate = x.transactionEffectiveDate;
          if (x.annual) {
            newRate.annual = x.annual.billablePremium;
            newRate.ratedAnnual = x.annual.billablePremium;
            newRate.companyAnnual = x.annual.companyPremium;
          }
          if (x.estimatedFortnightly) {
            newRate.fortnightly = x.estimatedFortnightly.billablePremium;
          }
          if (x.estimatedMonthly) {
            newRate.monthly = x.estimatedMonthly.billablePremium;
          }
          if (x.estimatedQuarterly) {
            newRate.quarterly = x.estimatedQuarterly.billablePremium;
          }
          if (x.estimatedSixMonthly) {
            newRate.sixMonthly = x.estimatedSixMonthly.billablePremium;
          }
          cloneQuote.quoteRate = newRate;
          updatedQuotes.push(cloneQuote);
        });
        dispatch({
          type: actionTypes.UPDATE_QUOTES,
          payload: {
            cars: updatedQuotes.filter((x) => x.policyType === 'car'),
            boats: updatedQuotes.filter((x) => x.policyType === 'boat'),
            ctps: updatedQuotes.filter((x) => x.policyType === 'compulsoryThirdParty'),
            houses: updatedQuotes.filter((x) => x.policyType === 'house'),
            contents: updatedQuotes.filter((x) => x.policyType === 'contents'),
            landlords: updatedQuotes.filter((x) => x.policyType === 'landlord')
          }
        });
        dispatch(formActions.change(`${modelPath}.payment.paymentPlan`, paymentPlan));
        updatedQuotes.forEach((q) => {
          const model = `myForms.${q.policyType}${q.policyType === 'boat' ? 'sQuote' : 'Quote'}.version`;
          dispatch(formActions.change(model, q.version));
        });
        return { hasError: false, invalidVersionHandled: false };
      } catch (ex) {
        logError(ex, getFunctionName());
        const error = String(ex);
        if (error.includes('VERSION_CONFLICT')) {
          dispatch(formActions.change(`${modelPath}.invalidVersionModalVisible`, true));
          return {
            hasError: true,
            invalidVersionHandled: true
          };
        }
        return { hasError: true, invalidVersionHandled: false };
      }
    },
  /**
   * Change a single quote plan type status via API
   */
  changeQuotePlanType: async (
    policyNumber: string,
    quoteType: string,
    transactionEffectiveDate: string | Date,
    version: number,
    paymentPlan: string,
    getState: () => ApplicationState
  ) => {
    const requestOptions = getDefaultRequestOptions();
    try {
      const state = getState() as ApplicationState;
      const isAuthenticated = commonSelectors.isAuthenticated(state);
      const accessToken = localStorage.getItem('access_token');
      const theType =
        quoteType === 'car' || quoteType === 'boat'
          ? PolicyApiModels.KnownProductType.Motor
          : PolicyApiModels.KnownProductType.Home;
      let result;

      if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
        result = await services
          .policyServiceWithAccessToken(accessToken)
          .updatePaymentPlan(theType, policyNumber, XBrandId, {
            requestOptions: requestOptions,
            body: {
              transactionEffectiveDate: transactionEffectiveDate as Date,
              version: version,
              paymentPlan: paymentPlan
            },
            onResponse: (response) => {
              if (response.status !== 200) {
                throw Error(response.bodyAsText);
              }
            }
          });
      } else {
        result = await services.policyService.updatePaymentPlan(theType, policyNumber, XBrandId, {
          requestOptions: requestOptions,
          body: {
            transactionEffectiveDate: transactionEffectiveDate as Date,
            version: version,
            paymentPlan: paymentPlan
          },
          onResponse: (response) => {
            if (response.status !== 200) {
              throw Error(response.bodyAsText);
            }
          }
        });
      }
      if (result && result.version) {
        return { policyNumber: policyNumber, ...result };
      } else {
        throw Error();
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-update-payment-plan', requestOptions);
      const errorMessage = ex instanceof Error ? ex.message : '';
      const isVersionConflict =
        errorMessage.includes('POLICY_VERSION_NOT_MATCHED') ||
        (errorMessage.includes('ERROR_SERVICE_VALIDATION') && errorMessage.toLowerCase().includes('version'));
      if (isVersionConflict) {
        throw new Error('VERSION_CONFLICT');
      }
      return null;
    }
  },

  /**
   * Updates each quote to have installment information from the appropriate API
   */
  getQuoteInstallments: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    let state = getState();
    let sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
    try {
      dispatch(formActions.reset(`${modelPath}.payment.installments`));
      dispatch(formActions.setPending(`${modelPath}.payment.installments`));
      if (sharedQuoteState.payment.paymentPlan === PaymentApiModels.KnownPlan.Annual) {
        const changePlanResults = await actions.changeQuotesPlanType(PolicyApiModels.KnownPaymentPlan.NonAnnual)(
          dispatch,
          getState
        );
        if (!changePlanResults) {
          throw Error();
        }
      }
      // update state again
      state = getState();
      sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
      const quoteState = getQuoteState(state);
      const { cars, boats, houses, contents, landlords, ctps = [] } = quoteState;
      const allQuotes = [...cars, ...boats, ...houses, ...contents, ...landlords, ...ctps];

      const promises = allQuotes.map((quote) => {
        return actions.getQuoteInstalment(quote.policyNumber, sharedQuoteState);
      });
      const allResults = await Promise.all(promises);
      const installmentResults = {
        firstPaymentDate: '',
        firstPaymentAmount: 0,
        nextPaymentAmount: 0
      } as InstallmentResults;

      const updatedQuotes = [] as QuoteTypes[];
      allResults.forEach((result) => {
        if (result) {
          installmentResults.firstPaymentDate = result.firstPaymentDate;
          installmentResults.firstPaymentAmount += result.firstPaymentAmount;
          installmentResults.nextPaymentAmount += result.nextPaymentAmount;
          const quote = allQuotes.find((y) => y.policyNumber === result.policyNumber);
          const cloneQuote = { ...quote };
          delete result.policyNumber;
          cloneQuote.installments = result;
          updatedQuotes.push(cloneQuote);
        } else {
          throw Error();
        }
      });
      dispatch({
        type: actionTypes.UPDATE_QUOTES,
        payload: {
          cars: updatedQuotes.filter((x) => x.policyType === 'car'),
          boats: updatedQuotes.filter((x) => x.policyType === 'boat'),
          ctps: updatedQuotes.filter((x) => x.policyType === 'compulsoryThirdParty'),
          houses: updatedQuotes.filter((x) => x.policyType === 'house'),
          contents: updatedQuotes.filter((x) => x.policyType === 'contents'),
          landlords: updatedQuotes.filter((x) => x.policyType === 'landlord')
        }
      });
      dispatch(formActions.change(`${modelPath}.payment.installments`, installmentResults));
      return true;
    } catch (ex) {
      logError(ex, getFunctionName());
      dispatch(commonActions.globalError(true, '', null, null));
      return false;
    } finally {
      dispatch(formActions.setPending(`${modelPath}.payment.installments`, false));
    }
  },
  /**
   * Updates a single quote to have it's installment information
   */
  getQuoteInstalment: async (policyNumber: string, sharedQuoteState: QuoteSharedState) => {
    const plan = sharedQuoteState.payment.paymentFrequency as PolicyApiModels.Plan;
    const requestOptions = getDefaultRequestOptions();
    try {
      let firstPaymentDate = null;
      let paymentDayOfMonth = null;
      if (plan === PolicyApiModels.KnownPlan.Fortnightly && sharedQuoteState.payment.paymentStartDate) {
        const momentStartDate = momentNZ(
          sharedQuoteState.payment.paymentStartDate.replace(/[^ -~]/g, ''),
          'DD MMM YYYY'
        ).startOf('day');
        if (momentStartDate.isValid()) {
          firstPaymentDate = momentStartDate.format('YYYY-MM-DD');
        }
      }
      if (
        (plan === PolicyApiModels.KnownPlan.Monthly ||
          plan === PolicyApiModels.KnownPlan.Quarterly ||
          plan === PolicyApiModels.KnownPlan.SixMonthly) &&
        sharedQuoteState.payment.paymentDayOfMonth
      ) {
        paymentDayOfMonth = sharedQuoteState.payment.paymentDayOfMonth;
      }

      const result = await services.policyService.getInstalmentSchedule(policyNumber, plan, XBrandId, {
        requestOptions: requestOptions,
        firstPaymentDate: firstPaymentDate,
        paymentDayOfMonth: paymentDayOfMonth,
        onResponse: (response) => {
          if (response.status !== 200) {
            logApiError(new Error(response.bodyAsText), 'ui-api-get-instalment-schedule', requestOptions);
            throw Error(response.bodyAsText);
          }
        }
      });

      if (result && result.length > 1) {
        const installmentResults = {
          policyNumber,
          firstPaymentDate: result[0].dueDate,
          firstPaymentAmount: result[0].amount.value,
          nextPaymentAmount: result[1].amount.value
        } as InstallmentResults;

        return installmentResults;
      } else {
        throw Error();
      }
    } catch (ex) {
      logError(ex, getFunctionName());
      return null;
    }
  },
  /**
   * Get policy wording urls for the quote
   */
  getPolicyWordingURLs: (
    productType: ProductApiModels.KnownProductType,
    productUIType: ProductUIType,
    policyNumber: string
  ) => getPolicyWordingUrls(productType, productUIType, policyNumber),

  /**
   * Handle CTP Manual Payment
   */
  submitManualPayment: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const sharedState = sharedSelectors.getQuoteSharedState(getState());

    const plan = sharedState.payment.paymentPlan as PaymentApiModels.Plan;
    const recurring = plan !== PaymentApiModels.KnownPlan.Annual ? true : false;

    const requestOptions = getDefaultRequestOptions();

    try {
      const request = {
        plan: plan,
        recurring: recurring,
        billingAccountNumber: null,
        bundleId: sharedState.bundleId
      } as PaymentApiModels.ManualPurchaseBundleRequest;

      if (
        plan === PaymentApiModels.KnownPlan.Monthly ||
        plan === PaymentApiModels.KnownPlan.Quarterly ||
        plan === PaymentApiModels.KnownPlan.SixMonthly
      ) {
        request.paymentDayOfMonth = sharedState.payment.paymentDayOfMonth;
      } else if (plan === PaymentApiModels.KnownPlan.Annual) {
        request.firstPaymentDate = getAnnualFirstPaymentDate(sharedState.policyStartDate);
      } else {
        throw Error(`Unsupported manual payment frequency: ${plan}`);
      }

      await paymentService.manualPurchase(XBrandId, request, {
        requestOptions: requestOptions,
        onResponse: (response) => {
          if (!(response.status === 200 || response.status === 202)) {
            logApiError(new Error(response.bodyAsText), 'ui-api-manual-purchase', requestOptions);
            throw Error(response.bodyAsText);
          }
        }
      });

      dispatch({ type: 'eec-purchase' });
      dispatch({ type: 'purchase' });

      return true;
    } catch (ex) {
      logApiError(ex, 'ui-api-manual-purchase', requestOptions);
      return false;
    }
  },
  /**
   * Get the saved payment for the logged in user.
   */
  getSavedPaymentMethods: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const shouldLoadSavedPaymentMethods = isAuthenticatedAndSavedPaymentIsAllowed(getState());

    if (shouldLoadSavedPaymentMethods) {
      const accessToken = localStorage.getItem('access_token');
      const requestOptions = getDefaultRequestOptions();
      const savedPaymentMethods = await billingService(accessToken).getSavedPaymentMethods(XBrandId, {
        requestOptions: requestOptions,
        onResponse: (response) => {
          if (response.status !== 200) {
            logApiError(new Error(response.bodyAsText), 'ui-api-get-saved-payment-methods', requestOptions);
          }
        }
      });

      dispatch(formActions.change('myForms.sharedQuote.payment.usersSavedPaymentMethods', savedPaymentMethods));
    }
  },

  /**
   * Try and generate documents for each quote
   */

  generateDocuments:
    (email: string, documentType: PolicyBundleApiModels.DocumentType, bundleId: string, mobile?: string) =>
    async (dispatch: Dispatch) => {
      const requestOptions = getDefaultRequestOptions();
      try {
        const options: SendResumeUrlOptionalParams = {
          requestOptions,
          body: {
            documentType,
            email,
            mobile
          },
          onResponse: (r) => {
            if (![200, 204].includes(r.status)) {
              logApiError(new Error(r.bodyAsText), 'ui-api-generate-documents', requestOptions);
              throw Error(r.bodyAsText);
            }
          }
        };
        await services.policyBundleService.sendResumeUrl(bundleId, XBrandId, options);
        return true;
      } catch (ex) {
        logApiError(ex, 'ui-api-generate-document', requestOptions);
        dispatch(commonActions.globalError(true, '', null, null));
        return false;
      }
    },

  /**
   * Method used to ensure the last edited quotes information is synced into the array of quotes accordingly
   * E.g. if customer go's back and edits the quote, then visits the quote summary page, it should be synced
   */
  syncCurrentQuotesForStore: () => (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    dispatch({
      type: actionTypes.SYNC_ACTIVE_QUOTES,
      payload: {
        carQuote: state.myForms.carQuote,
        boatsQuote: state.myForms.boatsQuote,
        houseQuote: state.myForms.houseQuote,
        contentsQuote: state.myForms.contentsQuote,
        landlordQuote: state.myForms.landlordQuote,
        ctpQuote: state.myForms.ctpQuote
      } as SyncQuote
    });
  },

  /**
   * Clear Active Quote Index
   */
  clearActiveQuoteIndex: (enforce?: boolean) => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const sharedState = sharedSelectors.getQuoteSharedState(getState());
    if (sharedState.inBundle || enforce) {
      dispatch({ type: actionTypes.SET_ACTIVE_CAR, payload: -1 });
      dispatch({ type: actionTypes.SET_ACTIVE_CONTENTS, payload: -1 });
      dispatch({ type: actionTypes.SET_ACTIVE_HOUSE, payload: -1 });
      dispatch({ type: actionTypes.SET_ACTIVE_LANDLORD, payload: -1 });
      dispatch({ type: actionTypes.SET_ACTIVE_BOAT, payload: -1 });
      dispatch({ type: actionTypes.SET_ACTIVE_CTP, payload: -1 });
    }
  },
  /**
   * Clear Quote State
   */
  clearQuoteState: () => async (dispatch: Dispatch) => {
    dispatch({
      type: actionTypes.UPDATE_QUOTES,
      payload: {
        cars: [],
        boats: [],
        ctps: [],
        houses: [],
        contents: [],
        landlords: []
      }
    });
  },
  /**
   * adds quote(s) to array
   * updates all quotes policy count and saves
   * redirects to new quote in edit
   */
  addPolicies:
    (types: string[], updateHistory?: boolean, stopEditing?: boolean) =>
    async (dispatch: AppDispatch, getState: () => ApplicationState) => {
      if (runningAsyncReq === true) {
        return false;
      }
      runningAsyncReq = true;
      if (types.length < 1) {
        return false;
      }
      const trans = new QuoteTransformer();
      const state = getState() as ApplicationState;
      let totalPolicies = getTotalPoliciesBundleBuilder(state);
      const isAuthenticated = commonSelectors.isAuthenticated(state);
      const yesterday = momentNZ().startOf('day').subtract(1, 'day');
      try {
        actions.syncCurrentQuotesForStore()(dispatch, getState);
        const sharedQuoteState = { ...sharedSelectors.getQuoteSharedState(state) };
        const productUITypesArray = Object.entries(ProductUIType).map(([puit]) => puit.toLowerCase());
        const editType = types.sort((t1, t2) => productUITypesArray.indexOf(t1) - productUITypesArray.indexOf(t2))[0];
        const editIndex = getAmountOfQuotesByName(editType, getState());
        const activeIndexActionType = getSetActiveIndexActionTypeByType(types[0]);
        if (!getEditActionTypeByName(types[0])) {
          throw Error();
        }
        let quotes: QuotePolicyTypes[];
        // create bundle if it doesn't exist
        if (isEmpty(sharedQuoteState.bundleId)) {
          totalPolicies = getTotalPoliciesBundleBuilder(state);
          const createBundleResult = await actions.createBundle(
            isAuthenticated,
            {
              motor: types
                .filter((type) =>
                  [ProductUIType.Car, ProductUIType.Boat, ProductUIType.Ctp].includes(type as ProductUIType)
                )
                .map((type) => (type === ProductUIType.Car ? 'personal' : type)),
              home: types.filter((type) =>
                [ProductUIType.Contents, ProductUIType.House, ProductUIType.Landlord].includes(type as ProductUIType)
              )
            },
            totalPolicies,
            sharedQuoteState.memberDiscount,
            commonSelectors.getAgency(state)?.partnerCode,
            sharedQuoteState.anonymousUserInfo,
            commonSelectors.getCustomer(state),
            undefined,
            commonSelectors.getAgent(state)?.agentCode,
            sharedQuoteState.membershipId
          );
          sharedQuoteState.bundleId = createBundleResult.bundleId;
          quotes = QuoteTransformer.mapBundleApiModelToPolicyApiModel([
            ...createBundleResult.quotes.motor,
            ...createBundleResult.quotes.home
          ]);
        }
        // update policy counts on existing quotes
        if (isEmpty(sharedQuoteState.policyCount) === false && sharedQuoteState.policyCount !== 0) {
          const updateCountResult = await dispatch(updatePolicyCounts(sharedQuoteState.policyCount + 1));
          if (!updateCountResult) {
            throw Error();
          }
        }
        // create quotes and add to an existing bundle if it wasn't added at instantiation
        if (isEmpty(quotes)) {
          quotes = await actions.createAndAddQuoteToExistingBundle(
            isAuthenticated,
            sharedQuoteState.bundleId,
            types,
            totalPolicies,
            sharedQuoteState.memberDiscount
          );
        }

        sharedQuoteState.policyCount = sharedQuoteState.policyCount + types.length;
        quotes.forEach((quote) => {
          const policyType = quote.typeOfPolicy as ProductApiModels.TypeOfPolicy;
          const type = policyToProductMap[policyType];
          const quoteIndex = getAmountOfQuotesByName(type, getState());
          const editActionType = getEditActionTypeByName(type);

          sharedQuoteState.customerNumber = quote.customerNumber;
          sharedQuoteState.agencyCode = quote.agencyCode;
          sharedQuoteState.agentCode = quote.agentCode;

          if (quote.typeOfPolicy === 'personal' || quote.typeOfPolicy === 'commercial') {
            if (!sharedQuoteState.rateEffectiveDate && quote.rateEffectiveDate) {
              sharedQuoteState.rateEffectiveDate = quote.rateEffectiveDate;
            }
            dispatch(formActions.change(`${modelPath}.addingQuotePolicyNumber`, quote.policyNumber));
            const carUiModel = trans.mapCarApiModelToCarUiModel(
              quote as PolicyApiModels.MotorQuote,
              quote.policyNumber
            );
            carUiModel.bundleId = sharedQuoteState.bundleId;
            carUiModel.vehicleUsedForBusiness = null;
            dispatch({ type: editActionType, payload: { index: quoteIndex, car: carUiModel } });
          } else if (quote.typeOfPolicy === 'boat') {
            dispatch(formActions.change(`${modelPath}.addingQuotePolicyNumber`, quote.policyNumber));
            dispatch({
              type: editActionType,
              payload: {
                index: quoteIndex,
                boat: trans.mapBoatApiModelToBoatUiModel(quote as PolicyApiModels.MotorQuote, quote.policyNumber)
              }
            });
          } else if (quote.typeOfPolicy === 'compulsoryThirdParty') {
            dispatch(formActions.change(`${modelPath}.addingQuotePolicyNumber`, quote.policyNumber));
            dispatch({
              type: editActionType,
              payload: {
                index: quoteIndex,
                ctp: trans.mapCtpApiModelToCtpUiModel(quote as PolicyApiModels.MotorQuote, quote.policyNumber)
              }
            });
          } else {
            sharedQuoteState.customerNumber = quote.customerNumber;
            if (!sharedQuoteState.rateEffectiveDate && quote.rateEffectiveDate) {
              sharedQuoteState.rateEffectiveDate = quote.rateEffectiveDate;
            }
            dispatch(formActions.change(`${modelPath}.addingQuotePolicyNumber`, quote.policyNumber));
            const houseUIModel = trans.mapHouseApiModelToHouseUiModel(
              quote as PolicyApiModels.HomeQuote,
              quote.policyNumber
            );
            houseUIModel.bundleId = sharedQuoteState.bundleId;
            if (quote.typeOfPolicy === 'house') {
              dispatch({ type: editActionType, payload: { index: quoteIndex, house: houseUIModel } });
            } else if (quote.typeOfPolicy === 'landlord') {
              dispatch({ type: editActionType, payload: { index: quoteIndex, landlord: houseUIModel } });
            } else {
              dispatch({ type: editActionType, payload: { index: quoteIndex, contents: houseUIModel } });
            }
          }
        });

        // assign active promocode to eligible quotes created
        await dispatch(actions.getActiveCampaign());
        await dispatch(actions.getActivePromocode());
        await dispatch(actions.updateQuotesWithPromoCode());

        // clear other active quote indexes
        await dispatch(actions.clearActiveQuoteIndex(true));

        // set the active state to the new quote
        dispatch({ type: activeIndexActionType, payload: editIndex });
        if (updateHistory) {
          // prevent user from going back to the wrong quote
          for (let i = 0; i < 10; i++) {
            history.pushState({}, '', routes.QUOTE.SHARED.QUOTE_SUMMARY);
          }
        }
        if (getTotalBundledItems(getState()) > 1) {
          sharedQuoteState.inBundle = true;
        }
        // we default effectiveDate to yesterday so we can
        // determine when the customer actually chooses a policyStartDate (effectiveDate)
        if (!sharedQuoteState.policyStartDate && quotes[0].effectiveDate) {
          const effDate = momentNZ(quotes[0].effectiveDate);
          if (effDate.isAfter(yesterday)) {
            sharedQuoteState.policyStartDate = momentNZ(quotes[0].effectiveDate).format('DD MMM YYYY');
          }
        }
        // update shared quote
        dispatch(formActions.change(modelPath, sharedQuoteState));
        if (!stopEditing) {
          // move to the quote and update in bundle flag as appropriate
          actions.editPolicyByTypeAndIndex(editType, editIndex, true)(dispatch, getState);
          actions.loadProductTypes()(dispatch);
        }
        setTimeout(() => {
          // clear loader
          dispatch(formActions.reset(`${modelPath}.addAnotherPolicyType`));
          dispatch(formActions.reset(`${modelPath}.crossSellPolicies`));
          dispatch(formActions.reset(`${modelPath}.addingQuotePolicyNumber`));
        }, 0);
        runningAsyncReq = false;
        return true;
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(formActions.reset(`${modelPath}.addingQuotePolicyNumber`));
        if (ex instanceof Error && ex.message === 'VERSION_CONFLICT') {
          dispatch(formActions.change(`${modelPath}.invalidVersionModalVisible`, true));
        } else {
          dispatch(commonActions.globalError(true, '', null, null));
        }
        runningAsyncReq = false;
        return false;
      }
    },
  /**
   * Persist policy count, member discount, existing customer
   * Then call add policies
   */
  addPoliciesFromThankYouPg: (types: string[]) => async (dispatch: AppDispatch, getState: () => ApplicationState) => {
    const state = getState();
    const sharedQuoteStateOld = sharedSelectors.getQuoteSharedState(state);

    towerHistory.replace(routes.COMMON.LOADING);

    // Resets the previous state so a new bundle can be created only with select data without recreating the purchased bundle
    dispatch(actions.clearQuoteState());
    dispatch(actions.clearActiveQuoteIndex(true));
    dispatch(formActions.reset(carModelPath));
    dispatch(formActions.reset(houseModelPath));
    dispatch(formActions.reset(landlordModelPath));
    dispatch(formActions.reset(contentsModelPath));
    dispatch(formActions.reset(boatModelPath));
    dispatch(formActions.reset(modelPath));

    setTimeout(() => {
      const newState = getState();
      const sharedQuoteStateNew: QuoteSharedState = {
        ...sharedSelectors.getQuoteSharedState(newState),
        policyCount: sharedQuoteStateOld.policyCount,
        memberDiscount: sharedQuoteStateOld.memberDiscount,
        customerNumber: sharedQuoteStateOld.customerNumber,
        agencyCode: sharedQuoteStateOld.agencyCode,
        agentCode: sharedQuoteStateOld.agentCode,
        promoCode: sharedQuoteStateOld.promoCode,
        promoCodeValid: sharedQuoteStateOld.promoCodeValid,
        membershipId: sharedQuoteStateOld.membershipId
      };
      dispatch(actions.updateSharedState(sharedQuoteStateNew));
      dispatch(actions.addPolicies(types));
    }, 500);
  },
  /**
   * Used on the quote summary page to start/edit/resume a quote.
   * Based on params (type, index, redirect), will set the "ACTIVE_QUOTE" in state and redirect if requested
   * Scroll bottom should set a query string to indicate we scroll to the bottom of the page
   */

  /**
   * @deprecated This will need to be rewritten to update the quote state using ID or a more robust parameter instead of index
   */
  editPolicyByTypeAndIndex:
    (type: string, index: number, redirect: boolean, fromResume?: boolean, quoteState?: string) =>
    async (dispatch: AppDispatch, getState: () => ApplicationState) => {
      const state = getState() as ApplicationState;
      const sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
      const {
        SET_ACTIVE_CAR,
        SET_ACTIVE_BOAT,
        SET_ACTIVE_MOTORBIKE,
        SET_ACTIVE_CTP,
        SET_ACTIVE_HOUSE,
        SET_ACTIVE_CONTENTS,
        SET_ACTIVE_LANDLORD
      } = actionTypes;
      const {
        cars = [],
        boats = [],
        motorbikes = [],
        houses = [],
        contents = [],
        landlords = [],
        ctps = []
      } = state.quote;
      dispatch(formActions.change(`${modelPath}.addAnotherPolicyType`, null));
      const newRoute = calcRoute(sharedQuoteState, fromResume, type, quoteState);
      if (
        newRoute === routes.QUOTE.SHARED.FINAL_SUMMARY ||
        newRoute === routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2 ||
        newRoute === routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE1
      ) {
        dispatch(actions.quickRateAllQuotes());
      }
      if (type === 'car') {
        actions.editSinglePolicy(
          SET_ACTIVE_CAR,
          index,
          carModelPath,
          cars[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
        debugger;
      } else if (type === 'house') {
        actions.editSinglePolicy(
          SET_ACTIVE_HOUSE,
          index,
          houseModelPath,
          houses[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
      } else if (type === 'contents') {
        actions.editSinglePolicy(
          SET_ACTIVE_CONTENTS,
          index,
          contentsModelPath,
          contents[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
      } else if (type === 'landlord') {
        actions.editSinglePolicy(
          SET_ACTIVE_LANDLORD,
          index,
          landlordModelPath,
          landlords[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
      } else if (type === 'boat') {
        actions.editSinglePolicy(
          SET_ACTIVE_BOAT,
          index,
          boatModelPath,
          boats[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
      } else if (type === 'motorbike') {
        actions.editSinglePolicy(
          SET_ACTIVE_MOTORBIKE,
          index,
          motorbikeModelPath,
          motorbikes[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
      } else if (type === 'compulsoryThirdParty') {
        actions.editSinglePolicy(
          SET_ACTIVE_CTP,
          index,
          ctpModelPath,
          ctps[index],
          sharedQuoteState,
          newRoute,
          redirect
        )(dispatch);
      }
      return true;
    },
  /**
   * Based on params (actionType, i) will set the "ACTIVE_QUOTE" in state and redirect if requested
   * Will loop through keyValue of quoteState and sharedQuoteState and update the state
   * Essentially, as it loops through, if the value exists, set it to be marked as touched, submited and valid.
   * Redirect flag determines whether we redirect or are just editing
   */

  /**
   * @deprecated This will need to be rewritten to update the quote state using ID or a more robust parameter instead of index
   */
  editSinglePolicy:
    (
      actionType: string,
      i: number,
      path: string,
      quoteState:
        | QuoteCarState
        | QuoteHouseState
        | QuoteContentsState
        | QuoteLandlordsState
        | QuoteBoatsState
        | QuoteMotorbikeState
        | QuoteCtpState,
      sharedQuoteState: QuoteSharedState,
      route: string,
      redirect: boolean
    ) =>
    async (dispatch: Dispatch) => {
      dispatch({ type: actionType, payload: i });
      // clear passed in model path
      dispatch(formActions.reset(path));
      dispatch(formActions.change(path, quoteState));
      actions.updateSharedState(sharedQuoteState)(dispatch);
      if (redirect) {
        towerHistory.push(route);
      }
    },
  /**
   * Updates carQuoteState motorParties with data from sharedQuoteState motorParties
   * Only does it for the first quote and only used when customer clicks "back" from people page
   * and get redirected to car quote page 2.
   */
  updateSingleCarQuoteMotorPartiesFromSharedState: () => (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    const sharedState = sharedSelectors.getQuoteSharedState(state);
    const firstCarQuote = state.quote.cars[0];
    const newMotorParties = [] as CustomMotorParty[];
    firstCarQuote.motorParties.forEach((x) => {
      const sharedMp = sharedState.motorParties.find((mp) => x.oid && mp.oid && x.oid === mp.oid);
      if (sharedMp) {
        newMotorParties.push(sharedMp);
      } else {
        newMotorParties.push(x);
      }
    });
    const path = `${carModelPath}.motorParties`;
    dispatch(formActions.reset(path));
    dispatch(formActions.change(path, newMotorParties));
  },
  /**
   * Method to update shared state
   */
  updateSharedState: (sharedQuoteState: QuoteSharedState) => async (dispatch: Dispatch) => {
    dispatch(formActions.reset(modelPath));
    dispatch(formActions.change(modelPath, sharedQuoteState));
  },
  /**
   * Removes a policy from the bundle (API pending)
   * Also removes it from the quote array state
   * Updates all other quotes policy account accordingly
   */
  removePolicy:
    (type: string, index: number, policyNumber: string, removeSilently?: boolean) =>
    async (dispatch: AppDispatch, getState: () => ApplicationState) => {
      // running async to prevent this happening more than once in a row
      if (runningAsyncReq === true) {
        return false;
      }
      runningAsyncReq = true;

      const state = getState() as ApplicationState;
      const quoteState = getQuoteState(state);
      const sharedQuoteState = { ...sharedSelectors.getQuoteSharedState(state) };
      const isAuthenticated = commonSelectors.isAuthenticated(state);
      const requestOptions = getDefaultRequestOptions();

      try {
        dispatch(formActions.change(`${modelPath}.removingQuotePolicyNumber`, policyNumber));
        // remove actual quote from bundle and redux store
        const actionType = getRemoveActionTypeByName(type);
        if (!actionType) {
          throw Error();
        }
        let newPolicyCount = sharedQuoteState.policyCount - 1;
        if (newPolicyCount === 0) {
          newPolicyCount = 0;
        }
        const updateCountResult = await dispatch(updatePolicyCounts(sharedQuoteState.policyCount - 1));
        if (!updateCountResult) {
          throw Error();
        }
        const quote = getQuoteByTypeAndIndex(quoteState, type, index);
        if (!removeSilently) {
          dispatch({ type: 'eec-removeFromCart' });
          dispatch({ type: 'remove_from_cart' });
        }
        const accessToken = localStorage.getItem('access_token');
        if (isAuthenticated && accessToken && commonSelectors.isSspQuoteEnabled()) {
          await services
            .policyBundleServiceWithAccessToken(accessToken)
            .deleteCustomerQuote(
              type === 'car' || type === 'boat' || type === 'motorbike'
                ? KnownProductType.Motor
                : KnownProductType.Home,
              quote.policyNumber,
              sharedQuoteState.bundleId,
              XBrandId,
              { requestOptions }
            );
        } else {
          await services.policyBundleService.deleteQuote(
            type === 'car' || type === 'boat' || type === 'motorbike' ? KnownProductType.Motor : KnownProductType.Home,
            quote.policyNumber,
            sharedQuoteState.bundleId,
            XBrandId,
            { requestOptions }
          );
        }
        dispatch(formActions.change(`${modelPath}.policyCount`, sharedQuoteState.policyCount - 1));
        dispatch({ type: actionType, payload: index });
        if (!removeSilently) {
          // quick rate cars again based on policy count
          dispatch(actions.quickRateAllQuotes());
        }
      } catch (ex) {
        logApiError(ex, 'ui-api-delete-quote', requestOptions);
        dispatch(commonActions.globalError(true, '', null, null));
      } finally {
        runningAsyncReq = false;
        dispatch(formActions.reset(`${modelPath}.removingQuotePolicyNumber`));
      }
      // clear history hack - prevent going back to removed quote
      for (let i = 0; i < 10; i++) {
        history.pushState({}, '');
      }
      return true;
    },

  /**
   * Take all the drivers from each car quote and add to shared state
   */
  syncCarDriversToSharedState: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    const quoteState = getQuoteState(state);
    const sharedState = sharedSelectors.getQuoteSharedState(state);
    const updatedDrivers = [] as CustomMotorParty[];

    const getKey = (motorParty: CustomMotorParty) => {
      let key = '';
      if (motorParty.firstName) {
        key += motorParty.firstName;
      }
      if (motorParty.lastName) {
        key += motorParty.lastName;
      }
      if (motorParty.gender) {
        key += motorParty.gender;
      }
      if (motorParty.dateOfBirth) {
        key += motorParty.dateOfBirth;
      }
      if (motorParty.taxId) {
        key += motorParty.taxId;
      }
      const email = motorParty.emails.find((x) => isEmpty(x.email) === false);
      if (email) {
        key += email.email;
      }
      const phone = motorParty.phoneNumbers.find((x) => isEmpty(x.phone) === false);
      if (phone) {
        key += `${phone.phoneCountry}${phone.phone}`;
      }
      return key;
    };

    quoteState.cars.forEach((car) => {
      const { make, model, year } = car.carDetails;
      const rego = car.carRegistration ? `${car.carRegistration} ` : '';
      const carDesc = `${rego}${year} ${make} ${model}`;
      car.motorParties.forEach((motorParty) => {
        const newParty = { ...motorParty };
        // remove so we can look for dupes
        const customMotorPartyKey = getKey(motorParty);
        const duplicate = updatedDrivers.find((x) => {
          return customMotorPartyKey === getKey(x);
        });

        if (duplicate) {
          duplicate.quoteDescriptor = duplicate.quoteDescriptor + '\n' + carDesc;
          newParty.quoteDescriptor = duplicate.quoteDescriptor;
          // can't have two owners marked as contact or owner
          newParty.markedAsContactOrOwner = false;
        } else {
          newParty.quoteDescriptor = carDesc;
        }
        // put this back
        newParty.oid = motorParty.oid;
        const driverIndex = sharedState.motorParties.findIndex((x) => x.oid && newParty.oid && x.oid === newParty.oid);
        if (driverIndex === -1 || !newParty.oid) {
          updatedDrivers.push(newParty);
        } else {
          // retain email and phone numbers and policy holder selection entered on people page
          const sharedStateMotorParty = sharedState.motorParties[driverIndex];
          newParty.emails = sharedStateMotorParty.emails;
          newParty.phoneNumbers = sharedStateMotorParty.phoneNumbers;
          newParty.markedAsContactOrOwner = sharedStateMotorParty.markedAsContactOrOwner;
          updatedDrivers[driverIndex] = newParty;
        }
      });
    });
    dispatch(formActions.change(`${modelPath}.motorParties`, updatedDrivers));
  },
  /**
   *  Take all the drivers from shared quote state and update cars array state
   */
  syncSharedDriversToCarDrivers: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const state = getState() as ApplicationState;
    const quoteState = getQuoteState(state);
    const sharedState = sharedSelectors.getQuoteSharedState(state);
    quoteState.cars.forEach((car, i) => {
      const newMotorParties = [] as CustomMotorParty[];
      car.motorParties.forEach((motorParty) => {
        const driver = sharedState.motorParties.find((x) => x.oid && motorParty.oid && x.oid === motorParty.oid);
        if (driver) {
          newMotorParties.push(driver);
        } else {
          newMotorParties.push(motorParty);
        }
      });
      const cloneCar = { ...car, motorParties: newMotorParties };
      dispatch({ type: actionTypes.EDIT_CAR, payload: { index: i, car: cloneCar } });
    });
  },

  /**
   * Method to go to people view and sync all drivers into shared state
   */
  handleGoToPeopleView: () => async (dispatch: AppDispatch, getState: () => ApplicationState) => {
    actions.syncCurrentQuotesForStore()(dispatch, getState);
    actions.syncCarDriversToSharedState()(dispatch, getState);
    const result = await actions.saveQuotes(null, true)(dispatch, getState);

    if (result) {
      const uwData = await dispatch(quickUnderwriteAllQuotes());

      if (!uwData || uwData.status === CustomUnderwriteType.DEFAULT || uwData.status === CustomUnderwriteType.ACCEPT) {
        setTimeout(() => {
          towerHistory.push(routes.QUOTE.SHARED.PEOPLE);
        }, 0);
      } else if (uwData.status === CustomUnderwriteType.ERROR) {
        dispatch(commonActions.globalError(true, '', null, null));
      }
    }
  },

  /* Method to go to Policies summary page when quotes not in bundle */
  handleGoToSummaryForSingleQuote:
    (location: Location) => async (dispatch: Dispatch, getState: () => ApplicationState) => {
      actions.syncCurrentQuotesForStore()(dispatch, getState);
      await actions.syncCarDriversToSharedState()(dispatch, getState);
      const result = await actions.saveQuotes(null, true)(dispatch, getState);
      if (result) {
        if (
          location &&
          (location.pathname.indexOf(routes.QUOTE.CAR.PAGE2) > -1 ||
            location.pathname.indexOf(routes.QUOTE.BOAT.PAGE2) > -1 ||
            location.pathname.indexOf(routes.QUOTE.CONTENTS.PAGE2) > -1 ||
            location.pathname.indexOf(routes.QUOTE.HOUSE.PAGE2) > -1 ||
            location.pathname.indexOf(routes.QUOTE.LANDLORD.PAGE2) > -1)
        ) {
          dispatch({ type: 'eec-addToCart' });
          dispatch({ type: 'add_to_cart' });
        }
        setTimeout(() => {
          towerHistory.push(routes.QUOTE.SHARED.QUOTE_SUMMARY);
        }, 0);
      }
    },

  /*Method to go to Shared summary page when quotes are in a bundle */
  handleGoToSharedSummaryPage: () => (dispatch: Dispatch, getState: () => ApplicationState) => {
    actions.syncCurrentQuotesForStore()(dispatch, getState);
    dispatch({ type: 'eec-addToCart' });
    dispatch({ type: 'add_to_cart' });
    towerHistory.push(routes.QUOTE.SHARED.QUOTE_SUMMARY);
  },

  /**
   * Method to determine the appropriate package based on car state and brand
   */
  getMotorOptionalBenefitsPackageProperty: (carState: QuoteCarState) => {
    let packageProperty = carState.coverageType as ProductApiModels.KnownMotorPackage;
    if (
      carState.coverageType === ProductApiModels.KnownMotorPackage.ComprehensiveMarketValue &&
      carState.coverages.agreedValue === true &&
      carState.coverages.agreedValueAmountValid === true
    ) {
      packageProperty = ProductApiModels.KnownMotorPackage.ComprehensiveAgreedValue;
    }

    // tmi needs to switch the plan type here as we default to CM for personal by default
    if (commonSelectors.isTradeMe()) {
      if (
        packageProperty !== ProductApiModels.KnownMotorPackage.ThirdParty &&
        packageProperty !== ProductApiModels.KnownMotorPackage.ThirdPartyFireTheft
      ) {
        if (carState.vehicleUsedForBusiness === 'personal') {
          packageProperty = ProductApiModels.KnownMotorPackage.ComprehensiveAgreedValue;
        } else {
          packageProperty = ProductApiModels.KnownMotorPackage.ComprehensiveMarketValue;
        }
      }
    }
    return packageProperty;
  },
  /**
   * Load boat optional benefits active boat quote
   * Store data into optional coverages on the boat quote
   * Used to display benefits in page 2 car quote
   */
  loadBoatOptionalBenefitsActiveBoatQuote: () => async (dispatch: Dispatch) => {
    const requestOptions = getDefaultRequestOptions();
    try {
      dispatch(formActions.change(`${boatModelPath}.optionalCoverages`, []));
      const result = await services.productService.getMotorCoverages(
        ProductApiModels.KnownTypeOfPolicy.Boat,
        XBrandId,
        ProductApiModels.KnownMotorPackage.ComprehensiveMarketValue,
        {
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-vehicle-types', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        }
      );
      if (result && result.length > 0) {
        dispatch(formActions.change(`${boatModelPath}.optionalCoverages`, result));
      } else {
        throw Error();
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-get-motor-coverages', requestOptions);
      dispatch(commonActions.globalError(true, '', null, null));
    }
    return true;
  },
  /**
   * Load motor optional benefits active car quote
   * Store data into optional coverages on the car quote
   * Used to display benefits in page 2 car quote
   */
  loadMotorOptionalBenefitsActiveCarQuote: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const requestOptions = getDefaultRequestOptions();
    try {
      dispatch(formActions.change(`${carModelPath}.optionalCoverages`, []));
      const state = getState() as ApplicationState;
      const carState = carSelectors.getQuoteCarState(state);
      const typeOfPolicy =
        carState.vehicleUsedForBusiness === 'personal'
          ? ProductApiModels.KnownTypeOfPolicy.Personal
          : ProductApiModels.KnownTypeOfPolicy.Commercial;
      const packageProperty = actions.getMotorOptionalBenefitsPackageProperty(carState);
      const result = await services.productService.getMotorCoverages(typeOfPolicy, XBrandId, packageProperty, {
        requestOptions: requestOptions,
        onResponse: (response) => {
          if (response.status !== 200) {
            logApiError(new Error(response.bodyAsText), 'ui-api-get-vehicle-types', requestOptions);
            throw Error(response.bodyAsText);
          }
        }
      });
      if (result && result.length > 0) {
        dispatch(formActions.change(`${carModelPath}.optionalCoverages`, result));
      } else {
        throw Error();
      }
    } catch (ex) {
      logError(ex, getFunctionName());
      dispatch(commonActions.globalError(true, '', null, null));
    }
    return true;
  },
  /**
   * Load motor optional benefits active car quote
   * Store data into optional coverages on the car quote
   * Used to display benefits in page 2 car quote
   */
  loadHomeOptionalBenefitsActiveHouseQuote:
    (houseOrLandlord: KnownHomeTypeOfPolicy) => async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const requestOptions = getDefaultRequestOptions();
      try {
        const state = getState() as ApplicationState;
        const houseOrLandlordState =
          houseOrLandlord === KnownHomeTypeOfPolicy.Landlord
            ? landlordSelectors.getQuoteLandlordState(state)
            : houseSelectors.getQuoteHouseState(state);

        const options = {
          occupancyType: houseSelectors.getOccupancyType(houseOrLandlordState),
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-home-coverages', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        } as GetHomeCoveragesOptionalParams;

        const result = await services.productService.getHomeCoverages(
          houseOrLandlordState.policyType,
          XBrandId,
          houseOrLandlordState.package,
          options
        );
        if (result && result.length > 0) {
          dispatch(formActions.change(`${houseModelPath}.optionalCoverages`, []));
          dispatch(formActions.change(`${houseModelPath}.optionalCoverages`, result));
        } else {
          dispatch(formActions.change(`${houseModelPath}.optionalCoverages`, []));
          throw Error();
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(commonActions.globalError(true, '', null, null));
      }
      return true;
    },
  /**
   * Load contents optional benefits active contents quote
   * Store data into optional coverages on the contents quote
   * Used to display benefits in page 2 contents quote
   */
  loadContentsOptionalBenefitsActiveContentsQuote:
    () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const requestOptions = getDefaultRequestOptions();
      try {
        dispatch(formActions.change(`${contentsModelPath}.optionalCoverages`, []));
        const state = getState() as ApplicationState;
        const contentsState = contentsSelectors.getQuoteContentsState(state);
        const options = {
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-home-coverages', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        } as GetHomeCoveragesOptionalParams;
        const result = await services.productService.getHomeCoverages(
          contentsState.policyType,
          XBrandId,
          contentsState.coverageType,
          options
        );
        if (result && result.length > 0) {
          dispatch(formActions.change(`${contentsModelPath}.optionalCoverages`, result));
        } else {
          throw Error();
        }
      } catch (ex) {
        logError(ex, getFunctionName());
        dispatch(commonActions.globalError(true, '', null, null));
      }
      return true;
    },
  /**
   * Load active quote package types i.e. plans and store into active quote
   */
  loadActiveQuotePackageTypes: () => async (dispatch: Dispatch, getState: () => ApplicationState) => {
    const requestOptions = getDefaultRequestOptions();
    try {
      const state = getState() as ApplicationState;
      const quoteState = getQuoteState(state);
      const currentQuote = getCurrentActiveQuote(quoteState);
      if (!currentQuote) {
        logApiError(
          new Error(
            JSON.stringify({
              message: 'No active quote found',
              activeCarQuoteIndex: quoteState.activeCarQuoteIndex,
              activeHouseQuoteIndex: quoteState.activeHouseQuoteIndex,
              activeContentsQuoteIndex: quoteState.activeContentsQuoteIndex,
              activeLandlordsQuoteIndex: quoteState.activeLandlordsQuoteIndex,
              activeBoatsQuoteIndex: quoteState.activeBoatsQuoteIndex,
              activeCtpsQuoteIndex: quoteState.activeCtpsQuoteIndex,
              carsLength: quoteState.cars.length,
              housesLength: quoteState.houses.length,
              contentsLength: quoteState.contents.length,
              landlordsLength: quoteState.landlords.length,
              boatsLength: quoteState.boats.length,
              ctpsLength: quoteState.ctps.length
            })
          ),
          'ui-api-get-packages-no-active-quote',
          requestOptions
        );
      }
      let currentModelPath = carModelPath;
      if (currentQuote && currentQuote.type === 'house') {
        currentModelPath = houseModelPath;
      } else if (currentQuote.type === 'contents') {
        currentModelPath = contentsModelPath;
      } else if (currentQuote.type === 'landlord') {
        currentModelPath = landlordModelPath;
      }
      dispatch(formActions.change(`${currentModelPath}.packageTypes`, []));
      let result = [];
      if (currentQuote && currentQuote.type === 'car') {
        const carState = currentQuote.item as QuoteCarState;
        const typeOfPolicy =
          carState.vehicleUsedForBusiness === 'personal'
            ? ProductApiModels.KnownTypeOfPolicy.Personal
            : ProductApiModels.KnownTypeOfPolicy.Commercial;

        result = await services.productService.getMotorPackages(typeOfPolicy, XBrandId, {
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-motor-packages', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
      } else {
        result = await services.productService.getHomePackages(currentQuote.item.policyType, XBrandId, {
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-home-packages', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
      }
      if (result && result.length > 0) {
        dispatch(formActions.change(`${currentModelPath}.packageTypes`, result));
        // if car and must be agreed value then switch accordingly
        if (currentQuote.type === 'car') {
          if (carSelectors.checkCarQuoteMustBeComprehensiveAgreedValue(currentQuote.item as QuoteCarState)) {
            dispatch(formActions.change(`${currentModelPath}.coverages.agreedValue`, true));
          }
        }
      } else {
        throw Error();
      }
    } catch (ex) {
      logApiError(ex, 'ui-api-get-packages', requestOptions);
      dispatch(commonActions.globalError(true, '', null, null));
    }
    return true;
  },
  loadManualAddressDetailsIntoCarQuoteState: (carQuoteState: QuoteCarState) => async (dispatch: Dispatch) => {
    const carQuoteStateToUpdate = lodash.cloneDeep(carQuoteState);
    const { address } = carQuoteStateToUpdate;
    const { province } = carQuoteStateToUpdate.address.addressDetails as AddressDetailsResponse;
    const requestOptions = getDefaultRequestOptions();
    try {
      {
        const results = await services.addressService.getProvinces(XBrandId, {
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-provinces', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
        if (!(results instanceof Array)) {
          throw Error();
        }
        address.provinceNameResults = results;
      }
      if (province) {
        const results = await services.addressService.getCities(province, XBrandId, {
          requestOptions: requestOptions,
          onResponse: (response) => {
            if (response.status !== 200) {
              logApiError(new Error(response.bodyAsText), 'ui-api-get-cities', requestOptions);
              throw Error(response.bodyAsText);
            }
          }
        });
        if (!(results instanceof Array)) {
          throw Error();
        }
        address.cityNameResults = results;
      }
      dispatch(formActions.change(`${carModelPath}`, carQuoteStateToUpdate));
      return true;
    } catch (ex) {
      logApiError(ex, 'ui-api-get-provinces-cities', requestOptions);
      logError(ex, getFunctionName());
      dispatch(commonActions.globalError(true, '', null, null));
      return false;
    }
  },
  setDefaultExcess:
    (
      productType: ProductApiModels.ProductType,
      policyType: ProductApiModels.TypeOfPolicy,
      excesses: GetMotorExcessesResponse
    ) =>
    (dispatch: Dispatch, getState: () => ApplicationState) => {
      const state = getState();
      const isLivingInBarracks = livesInBarracks(getQuoteContentsState(state));

      const excessType = getProductUIType(productType, policyType);
      let defaultExcess: number = getDefaultExcess(excessType);

      if (policyType === ProductApiModels.KnownTypeOfPolicy.Commercial) {
        defaultExcess = getDefaultExcess(excessType, true);
      }

      if (policyType === ProductApiModels.KnownTypeOfPolicy.Personal) {
        defaultExcess = getDefaultExcess(excessType, false);
      }

      if (isLivingInBarracks) {
        defaultExcess = t('quote/contents:barracksAddress.defaultExcess');
      }

      defaultExcess = excesses.find((excess) => Number(excess) === Number(defaultExcess)) || excesses[0];

      dispatch(formActions.change(`${modelPathMap[excessType]}.excess`, Number(defaultExcess)));
    },
  loadExcesses:
    (
      productType: ProductApiModels.ProductType,
      policyType: ProductApiModels.TypeOfPolicy,
      selectDefault?: boolean,
      boatType?: string,
      howBoatStored?: string,
      sumInsured?: number
    ) =>
    async (dispatch: Dispatch, getState: () => ApplicationState) => {
      const requestOptions = getDefaultRequestOptions();

      try {
        const excesses =
          productType === ProductApiModels.KnownProductType.Motor
            ? policyType !== ProductApiModels.KnownTypeOfPolicy.Boat
              ? await productService.getMotorExcesses(productToMotorExcessApiType(policyType), XBrandId, {
                  requestOptions: requestOptions,
                  onResponse: (response) => {
                    if (response.status !== 200) {
                      logApiError(new Error(response.bodyAsText), 'ui-api-get-motor-excesses', requestOptions);
                      throw Error(response.bodyAsText);
                    }
                  }
                })
              : await productService.getMotorExcesses(productToMotorExcessApiType(policyType), XBrandId, {
                  requestOptions: requestOptions,
                  boatType: boatType,
                  howBoatStored: howBoatStored,
                  sumInsured: sumInsured,
                  onResponse: (response) => {
                    if (response.status !== 200) {
                      logApiError(new Error(response.bodyAsText), 'ui-api-get-boat-excesses', requestOptions);
                      throw Error(response.bodyAsText);
                    }
                  }
                })
            : await productService.getHomeExcesses(productToHomeExcessApiType(policyType), XBrandId, {
                requestOptions: requestOptions,
                onResponse: (response) => {
                  if (response.status !== 200) {
                    logApiError(new Error(response.bodyAsText), 'ui-api-get-home-excesses', requestOptions);
                    throw Error(response.bodyAsText);
                  }
                }
              });

        const excessType = getProductUIType(productType, policyType);

        dispatch({
          type: actionTypes.UPDATE_EXCESSES,
          payload: {
            [excessType]: excesses
          }
        });

        if (selectDefault) {
          actions.setDefaultExcess(productType, policyType, excesses)(dispatch, getState);
        }
      } catch (ex) {
        logApiError(ex, 'ui-api-get-product-excesses', requestOptions);
      }
    },

  setGetQuoteCompShown: () => async (dispatch: Dispatch) => {
    dispatch(formActions.change(`${modelPath}.getQuoteCompShown`, true));
  },

  loadProductTypes: () => async (dispatch: Dispatch) => {
    const requestOptions = getDefaultRequestOptions();
    const productTypes = await productService.getTypes(XBrandId, {
      requestOptions: requestOptions,
      onResponse: (response) => {
        if (response.status !== 200) {
          logApiError(new Error(response.bodyAsText), 'ui-api-get-product-types', requestOptions);
          throw Error(response.bodyAsText);
        }
      }
    });

    dispatch({
      type: actionTypes.SET_AVAILABLE_PRODUCT_TYPES,
      payload: productTypes
    });
  },

  loadContentsEstimateForQuote:
    (policyNumber: string, productType: KnownProductType) =>
    async (dispatch: Dispatch, getState: () => ApplicationState) => {
      dispatch({
        type: actionTypes.SET_CROSS_SELL_ESTIMATE,
        payload: null
      });
      const requestOptions = getDefaultRequestOptions();
      const accessToken = localStorage.getItem('access_token');
      const state = getState();
      const { contents, cars, houses, boats, landlords } = getQuoteState(state);
      const singleCarInBundle =
        cars.length === 1 &&
        contents.length === 0 &&
        houses.length === 0 &&
        boats.length === 0 &&
        boats.length === 0 &&
        landlords.length === 0;
      const singleHouseInBundle =
        houses.length === 1 &&
        contents.length === 0 &&
        cars.length === 0 &&
        boats.length === 0 &&
        boats.length === 0 &&
        landlords.length === 0;
      if (singleCarInBundle || singleHouseInBundle) {
        try {
          const contentsEstimate: GetContentsEstimateForQuoteResponse = accessToken
            ? await policyCrossSellWithAccessToken(accessToken).getContentsEstimateForCustomerQuote(
                policyNumber,
                productType,
                XBrandId,
                { requestOptions: requestOptions }
              )
            : await policyCrossSellService.getContentsEstimateForQuote(policyNumber, productType, XBrandId, {
                requestOptions: requestOptions
              });
          dispatch({
            type: actionTypes.SET_CROSS_SELL_ESTIMATE,
            payload: contentsEstimate
          });
        } catch (ex) {
          logApiError(ex, 'ui-api-loadContentsEstimateQ2B', requestOptions);
        }
      }
    },

  loadHouseEstimateForQuote:
    (policyNumber: string, productType: KnownProductType) =>
    async (dispatch: Dispatch, getState: () => ApplicationState) => {
      dispatch({
        type: actionTypes.SET_CROSS_SELL_ESTIMATE,
        payload: null
      });
      const requestOptions = getDefaultRequestOptions();
      const state = getState();
      const accessToken = localStorage.getItem('access_token');
      const isAnonymousUser = !accessToken;
      const { contents, cars, houses, boats, landlords } = getQuoteState(state);
      const singleContentsInBundle =
        cars.length === 0 &&
        contents.length === 1 &&
        houses.length === 0 &&
        boats.length === 0 &&
        boats.length === 0 &&
        landlords.length === 0;
      // !accessToken checks if customer is anonymous user -
      if (singleContentsInBundle && isAnonymousUser) {
        try {
          const houseEstimate: GetHouseEstimateForQuoteResponse = await policyCrossSellService.getHouseEstimateForQuote(
            policyNumber,
            productType,
            XBrandId,
            {
              requestOptions: requestOptions
            }
          );
          dispatch({
            type: actionTypes.SET_CROSS_SELL_ESTIMATE,
            payload: houseEstimate
          });
        } catch (ex) {
          logApiError(ex, 'ui-api-loadHouseEstimateQ2B', requestOptions);
        }
      }
    }
};

export interface UpdateQuotesAction {
  type:
    | typeof actionTypes.UPDATE_QUOTES
    | typeof actionTypes.RESUME_QUOTES
    | typeof actionTypes.UPDATE_QUOTES_FINANCIAL_INTERESTED_PARTY
    | typeof actionTypes.CLEAR_FINANCIAL_INTERESTED_PARTY
    | typeof actionTypes.CLEAR_ALL_FINANCIAL_INTERESTED_PARTIES;
  payload: QuoteState;
}

export interface AddCarAction {
  type: typeof actionTypes.ADD_CAR;
}

export interface EditCarAction {
  type: typeof actionTypes.EDIT_CAR;
  payload: { index: number; car: QuoteCarState };
}

export interface RemoveCarAction {
  type: typeof actionTypes.REMOVE_CAR;
  payload: number;
}

export interface SetActiveCarAction {
  type: typeof actionTypes.SET_ACTIVE_CAR;
  payload: number;
}

export interface AddHouseAction {
  type: typeof actionTypes.ADD_HOUSE;
}

export interface EditHouseAction {
  type: typeof actionTypes.EDIT_HOUSE;
  payload: { index: number; house: QuoteHouseState };
}

export interface RemoveHouseAction {
  type: typeof actionTypes.REMOVE_HOUSE;
  payload: number;
}

export interface SetActiveHouseAction {
  type: typeof actionTypes.SET_ACTIVE_HOUSE;
  payload: number;
}

export interface AddContentsAction {
  type: typeof actionTypes.ADD_CONTENTS;
}

export interface EditContentsAction {
  type: typeof actionTypes.EDIT_CONTENTS;
  payload: { index: number; contents: QuoteContentsState };
}

export interface RemoveContentsAction {
  type: typeof actionTypes.REMOVE_CONTENTS;
  payload: number;
}

export interface SetActiveContentsAction {
  type: typeof actionTypes.SET_ACTIVE_CONTENTS;
  payload: number;
}

export interface AddLandlordAction {
  type: typeof actionTypes.ADD_LANDLORD;
}

export interface EditLandlordAction {
  type: typeof actionTypes.EDIT_LANDLORD;
  payload: { index: number; landlord: QuoteLandlordsState };
}

export interface RemoveLandlordAction {
  type: typeof actionTypes.REMOVE_LANDLORD;
  payload: number;
}

export interface SetActiveLandlordAction {
  type: typeof actionTypes.SET_ACTIVE_LANDLORD;
  payload: number;
}

export interface UpdateLandlordAction {
  type: typeof actionTypes.UPDATE_LANDLORD;
  payload: { landlords: QuoteLandlordsState[] };
}

export interface AddBoatAction {
  type: typeof actionTypes.ADD_BOAT;
}

export interface EditBoatAction {
  type: typeof actionTypes.EDIT_BOAT;
  payload: { index: number; boat: QuoteBoatsState };
}

export interface RemoveBoatAction {
  type: typeof actionTypes.REMOVE_BOAT;
  payload: number;
}

export interface SetActiveBoatAction {
  type: typeof actionTypes.SET_ACTIVE_BOAT;
  payload: number;
}

export interface AddMotorbikeAction {
  type: typeof actionTypes.ADD_MOTORBIKE;
}

export interface EditMotorbikeAction {
  type: typeof actionTypes.EDIT_MOTORBIKE;
  payload: { index: number; motorbike: QuoteMotorbikeState };
}

export interface RemoveMotorbikeAction {
  type: typeof actionTypes.REMOVE_MOTORBIKE;
  payload: number;
}

export interface SetActiveMotorbikeAction {
  type: typeof actionTypes.SET_ACTIVE_MOTORBIKE;
  payload: number;
}

export interface AddCtpAction {
  type: typeof actionTypes.ADD_CTP;
}

export interface EditCtpAction {
  type: typeof actionTypes.EDIT_CTP;
  payload: { index: number; ctp: QuoteCtpState };
}

export interface RemoveCtpAction {
  type: typeof actionTypes.REMOVE_CTP;
  payload: number;
}

export interface SetActiveCtpAction {
  type: typeof actionTypes.SET_ACTIVE_CTP;
  payload: number;
}

export interface UpdateExcessesAction {
  type: typeof actionTypes.UPDATE_EXCESSES;
  payload: Partial<Excesses>;
}

export interface SetAvailableProductTypesAction {
  type: typeof actionTypes.SET_AVAILABLE_PRODUCT_TYPES;
  payload: ProductApiModels.TypesResponse[];
}

export interface SyncActiveQuotesAction {
  type: typeof actionTypes.SYNC_ACTIVE_QUOTES;
  payload: SyncQuote;
}

export interface SetBundleBuilderLoginAction {
  type: typeof actionTypes.SET_BUNDLE_BUILDER_LOGIN;
  payload: string;
}

export interface SetCrossSellEstimateAction {
  type: typeof actionTypes.SET_CROSS_SELL_ESTIMATE;
  payload: CrossSellEstimate;
}

export interface ResetAction {
  type: typeof actionTypes.RESET;
}

export type QuoteActions =
  | UpdateQuotesAction
  | AddCarAction
  | EditCarAction
  | RemoveCarAction
  | SetActiveCarAction
  | AddHouseAction
  | EditHouseAction
  | RemoveHouseAction
  | SetActiveHouseAction
  | AddContentsAction
  | EditContentsAction
  | RemoveContentsAction
  | SetActiveContentsAction
  | AddLandlordAction
  | EditLandlordAction
  | RemoveLandlordAction
  | SetActiveLandlordAction
  | UpdateLandlordAction
  | AddBoatAction
  | EditBoatAction
  | RemoveBoatAction
  | SetActiveBoatAction
  | AddMotorbikeAction
  | EditMotorbikeAction
  | RemoveMotorbikeAction
  | SetActiveMotorbikeAction
  | AddCtpAction
  | EditCtpAction
  | RemoveCtpAction
  | SetActiveCtpAction
  | UpdateExcessesAction
  | SetAvailableProductTypesAction
  | SyncActiveQuotesAction
  | SetBundleBuilderLoginAction
  | SetCrossSellEstimateAction
  | ResetAction;

// reducer
export const quoteReducer = (state: QuoteState = getDefaultQuoteState(), action: QuoteActions) => {
  switch (action.type) {
    case actionTypes.UPDATE_QUOTES_FINANCIAL_INTERESTED_PARTY:
    case actionTypes.CLEAR_FINANCIAL_INTERESTED_PARTY:
    case actionTypes.CLEAR_ALL_FINANCIAL_INTERESTED_PARTIES:
    case actionTypes.RESUME_QUOTES:
    case actionTypes.UPDATE_QUOTES: {
      return {
        ...state,
        cars: action.payload.cars as QuoteCarState[],
        boats: action.payload.boats as QuoteBoatsState[],
        ctps: action.payload.ctps as QuoteCtpState[],
        houses: action.payload.houses as QuoteHouseState[],
        landlords: action.payload.landlords as QuoteLandlordsState[],
        contents: doYouLiveInBarracksDecorator(action.payload.contents)
      } as QuoteState;
    }
    case actionTypes.ADD_CAR: {
      const newCars = [...state.cars];
      newCars.push(getDefaultQuoteCarState());
      return { ...state, cars: newCars };
    }
    case actionTypes.EDIT_CAR: {
      const newCars = [...state.cars];
      const { index, car } = action.payload;
      newCars[index] = car;
      return { ...state, cars: newCars };
    }
    case actionTypes.REMOVE_CAR: {
      const newCars = [...state.cars];
      newCars.splice(action.payload || 0, 1);
      return { ...state, cars: newCars, activeCarQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_CAR: {
      return { ...state, activeCarQuoteIndex: action.payload };
    }
    case actionTypes.ADD_HOUSE: {
      const newHouses = [...state.houses];
      newHouses.push(getDefaultQuoteHouseState());
      return { ...state, houses: newHouses };
    }
    case actionTypes.EDIT_HOUSE: {
      const newHouses = [...state.houses];
      const { index, house } = action.payload;
      newHouses[index] = house;
      return { ...state, houses: newHouses };
    }
    case actionTypes.REMOVE_HOUSE: {
      const newHouses = [...state.houses];
      newHouses.splice(action.payload || 0, 1);
      return { ...state, houses: newHouses, activeHouseQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_HOUSE: {
      return { ...state, activeHouseQuoteIndex: action.payload };
    }
    case actionTypes.ADD_CONTENTS: {
      const newContents = [...state.contents];
      newContents.push(getDefaultQuoteContentsState());
      return { ...state, contents: newContents };
    }
    case actionTypes.EDIT_CONTENTS: {
      const newContents = [...state.contents];
      const { index, contents } = action.payload;
      newContents[index] = contents;
      return { ...state, contents: newContents };
    }
    case actionTypes.REMOVE_CONTENTS: {
      const newContents = [...state.contents];
      newContents.splice(action.payload || 0, 1);
      return { ...state, contents: newContents, activeContentsQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_CONTENTS: {
      return { ...state, activeContentsQuoteIndex: action.payload };
    }
    case actionTypes.ADD_LANDLORD: {
      const newLandlords = [...state.landlords];
      newLandlords.push(getDefaultQuoteLandlordsState());
      return { ...state, landlords: newLandlords };
    }
    case actionTypes.EDIT_LANDLORD: {
      const newLandlords = [...state.landlords];
      const { index, landlord } = action.payload;
      newLandlords[index] = landlord;
      return { ...state, landlords: newLandlords };
    }
    case actionTypes.REMOVE_LANDLORD: {
      const newLandlords = [...state.landlords];
      newLandlords.splice(action.payload || 0, 1);
      return { ...state, landlords: newLandlords, activeLandlordsQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_LANDLORD: {
      return { ...state, activeLandlordsQuoteIndex: action.payload };
    }
    case actionTypes.UPDATE_LANDLORD: {
      return { ...state, landlords: action.payload.landlords };
    }
    case actionTypes.ADD_BOAT: {
      return { ...state, boats: [...state.boats, getDefaultQuoteBoatsState()] };
    }
    case actionTypes.EDIT_BOAT: {
      const newBoats = [...state.boats];
      const { index, boat } = action.payload;
      newBoats[index] = boat;
      return { ...state, boats: newBoats };
    }
    case actionTypes.REMOVE_BOAT: {
      const newBoats = [...state.boats];
      newBoats.splice(action.payload || 0, 1);
      return { ...state, boats: newBoats, activeBoatsQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_BOAT: {
      return { ...state, activeBoatsQuoteIndex: action.payload };
    }
    case actionTypes.ADD_MOTORBIKE: {
      return { ...state, motorbikes: [...state.motorbikes, getDefaultQuoteMotorbikeState()] };
    }
    case actionTypes.EDIT_MOTORBIKE: {
      const newMotorbikes = [...state.motorbikes];
      const { index, motorbike } = action.payload;
      newMotorbikes[index] = motorbike;
      return { ...state, motorbikes: newMotorbikes };
    }
    case actionTypes.REMOVE_MOTORBIKE: {
      const newMotorbikes = [...state.motorbikes];
      newMotorbikes.splice(action.payload || 0, 1);
      return { ...state, motorbikes: newMotorbikes, activeMotorbikeQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_MOTORBIKE: {
      return { ...state, activeMotorbikeQuoteIndex: action.payload };
    }
    case actionTypes.ADD_CTP: {
      return { ...state, ctps: [...state.ctps, getDefaultQuoteCtpState()] };
    }
    case actionTypes.EDIT_CTP: {
      const newCtps = state.ctps;
      const { index, ctp } = action.payload;
      newCtps[index] = ctp;
      return { ...state, ctps: newCtps };
    }
    case actionTypes.REMOVE_CTP: {
      const newCtps = state.ctps;
      newCtps.splice(action.payload || 0, 1);
      return { ...state, ctps: newCtps, activeCtpsQuoteIndex: -1 };
    }
    case actionTypes.SET_ACTIVE_CTP: {
      return { ...state, activeCtpsQuoteIndex: action.payload };
    }
    case actionTypes.UPDATE_EXCESSES: {
      return {
        ...state,
        excesses: {
          ...state.excesses,
          ...action.payload
        }
      };
    }
    case actionTypes.SET_AVAILABLE_PRODUCT_TYPES: {
      return {
        ...state,
        productTypes: action.payload
      };
    }
    case actionTypes.SYNC_ACTIVE_QUOTES: {
      const {
        activeCarQuoteIndex,
        activeBoatsQuoteIndex,
        activeMotorbikeQuoteIndex,
        activeHouseQuoteIndex,
        activeContentsQuoteIndex,
        activeLandlordsQuoteIndex,
        activeCtpsQuoteIndex
      } = state;
      const { cars = [], boats = [], motorbikes = [], houses = [], contents = [], landlords = [], ctps = [] } = state;
      const data = action.payload as SyncQuote;
      const newCars = [...cars];
      if (activeCarQuoteIndex !== -1) {
        newCars[activeCarQuoteIndex] = data.carQuote;
      }
      const newHouses = [...houses];
      if (activeHouseQuoteIndex !== -1) {
        newHouses[activeHouseQuoteIndex] = data.houseQuote;
      }
      const newContents = [...contents];
      if (activeContentsQuoteIndex !== -1) {
        newContents[activeContentsQuoteIndex] = data.contentsQuote;
      }
      const newLandlords = [...landlords];
      if (activeLandlordsQuoteIndex !== -1) {
        newLandlords[activeLandlordsQuoteIndex] = data.landlordQuote;
      }
      const newBoats = [...boats];
      if (activeBoatsQuoteIndex !== -1) {
        newBoats[activeBoatsQuoteIndex] = data.boatsQuote;
      }
      const newMotorbikes = [...motorbikes];
      if (activeMotorbikeQuoteIndex !== -1) {
        newMotorbikes[activeMotorbikeQuoteIndex] = data.motorbikeQuote;
      }
      const newCtps = [...ctps];
      if (activeCtpsQuoteIndex !== -1) {
        newCtps[activeCtpsQuoteIndex] = data.ctpQuote;
      }
      return {
        ...state,
        cars: newCars,
        houses: newHouses,
        contents: newContents,
        landlords: newLandlords,
        boats: newBoats,
        ctps: newCtps
      };
    }
    case actionTypes.SET_BUNDLE_BUILDER_LOGIN: {
      return { ...state, bundleBuilderLogin: action.payload };
    }
    case actionTypes.SET_CROSS_SELL_ESTIMATE: {
      return { ...state, crossSellEstimate: action.payload };
    }
    case actionTypes.RESET: {
      return {
        ...state,
        ...getDefaultQuoteState()
      };
    }
    default: {
      return state;
    }
  }
};

/**
 * Sneakily reinserts the "doYouLiveInBarracks" option
 * as it is dynamically resolved at runtime (not stored anywhere)
 * @param contents
 */
function doYouLiveInBarracksDecorator(contents: QuoteContentsState[]) {
  return contents.map((content) => {
    let doYouLiveInBarracks: boolean | undefined;

    if (!isEmpty(content.address.addressSearch)) {
      doYouLiveInBarracks = /barracks/i.test(content.address.addressSearch.toString());
    }

    return {
      ...content,
      doYouLiveInBarracks
    };
  });
}

/**
 *
 */
export const getBrandPageNumber = (onSaveAction: boolean, locationPath: string) => {
  let value = '';
  if (onSaveAction) {
    switch (locationPath) {
      case routes.QUOTE.CAR.PAGE1:
      case routes.QUOTE.BOAT.PAGE1:
      case routes.QUOTE.MOTORBIKE.PAGE1:
      case routes.QUOTE.HOUSE.PAGE1:
      case routes.QUOTE.LANDLORD.PAGE1:
      case routes.QUOTE.CONTENTS.PAGE1:
      case routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE1:
        value = `${process.env.brand}_1`;
        break;
      case routes.QUOTE.CAR.PAGE2:
      case routes.QUOTE.BOAT.PAGE2:
      case routes.QUOTE.MOTORBIKE.PAGE2:
      case routes.QUOTE.HOUSE.PAGE2:
      case routes.QUOTE.LANDLORD.PAGE2:
      case routes.QUOTE.CONTENTS.PAGE2:
      case routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2:
        value = `${process.env.brand}_2`;
        break;
      case routes.QUOTE.SHARED.QUOTE_SUMMARY:
        value = `${process.env.brand}_3a`;
        break;
      case routes.QUOTE.SHARED.PEOPLE:
        value = `${process.env.brand}_3`;
        break;
      case routes.QUOTE.SHARED.LEGAL:
        value = `${process.env.brand}_4`;
        break;
      case routes.QUOTE.SHARED.FINAL_SUMMARY:
        value = `${process.env.brand}_5`;
        break;
      case routes.QUOTE.SHARED.PAYMENT:
        value = `${process.env.brand}_6`;
        break;
      case routes.QUOTE.SHARED.THANK_YOU:
        value = `${process.env.brand}_7`;
        break;
    }
  } else {
    switch (locationPath) {
      case routes.QUOTE.SHARED.BUNDLE_BUILDER:
        value = `${process.env.brand}_1`;
        break;
      case routes.QUOTE.CAR.PAGE1:
      case routes.QUOTE.BOAT.PAGE1:
      case routes.QUOTE.MOTORBIKE.PAGE1:
      case routes.QUOTE.HOUSE.PAGE1:
      case routes.QUOTE.LANDLORD.PAGE1:
      case routes.QUOTE.CONTENTS.PAGE1:
      case routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE1:
        value = `${process.env.brand}_2`;
        break;
      case routes.QUOTE.CAR.PAGE2:
      case routes.QUOTE.BOAT.PAGE2:
      case routes.QUOTE.MOTORBIKE.PAGE2:
      case routes.QUOTE.HOUSE.PAGE2:
      case routes.QUOTE.LANDLORD.PAGE2:
      case routes.QUOTE.CONTENTS.PAGE2:
        value = `${process.env.brand}_3a`;
        break;
      case routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2:
      case routes.QUOTE.SHARED.QUOTE_SUMMARY:
        value = `${process.env.brand}_3`;
        break;
      case routes.QUOTE.SHARED.PEOPLE:
        value = `${process.env.brand}_4`;
        break;
      case routes.QUOTE.SHARED.LEGAL:
        value = `${process.env.brand}_5`;
        break;
      case routes.QUOTE.SHARED.FINAL_SUMMARY:
        value = `${process.env.brand}_6`;
        break;
      case routes.QUOTE.SHARED.PAYMENT:
        value = `${process.env.brand}_7`;
        break;
      case routes.QUOTE.SHARED.THANK_YOU:
        value = `${process.env.brand}_8`;
        break;
    }
  }

  return value;
};

/**
 * This function returns the partner code only in the scenario where
 * the customer is associated with a staff agency (westpack_staff).
 * Reference: MOADEV-1059
 */
export const getStaffPartnerCode = async (customer: Customer): Promise<string> => {
  const agencies = customer?.associatedAgencies ?? [];
  const staffAgency = t('base:staffAgency');
  return  agencies.find((a) => a.agencyCode === staffAgency)?.partnerCode || '';
};
/**
 * Quick underwrite the active quote
 */
export const newQuickUnderwriteActiveQuote: AppThunk<Promise<CustomUnderwriteResponse>> = async (
  dispatch,
  getState
) => {
  const state = getState() as ApplicationState;
  const {
    activeCarQuoteIndex,
    activeBoatsQuoteIndex,
    activeContentsQuoteIndex,
    activeHouseQuoteIndex,
    activeLandlordsQuoteIndex,
    activeCtpsQuoteIndex
  } = getQuoteState(state);
  let activeState = {} as QuoteTypes;
  if (activeCarQuoteIndex > -1) {
    activeState = carSelectors.getQuoteCarState(state);
  } else if (activeBoatsQuoteIndex > -1) {
    activeState = boatSelectors.getQuoteBoatState(state);
  } else if (activeCtpsQuoteIndex > -1) {
    activeState = ctpSelectors.getQuoteCtpState(state);
  } else if (activeHouseQuoteIndex > -1) {
    activeState = houseSelectors.getQuoteHouseState(state);
  } else if (activeLandlordsQuoteIndex > -1) {
    activeState = landlordSelectors.getQuoteLandlordState(state);
  } else if (activeContentsQuoteIndex > -1) {
    activeState = contentsSelectors.getQuoteContentsState(state);
  }
  const sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
  const uwData = await actions.quickUnderwriteQuote(activeState, sharedQuoteState, state.flags);
  dispatch(formActions.change(`${modelPath}.customUnderwriteResponse`, uwData));
  if (!uwData || uwData.status === CustomUnderwriteType.ERROR) {
    dispatch(commonActions.globalError(true, '', null, null));
  }
  return uwData;
};

export const updateLandlordWithHouseState =
  (houseIndex: number): AppThunk<Promise<number>> =>
  async (dispatch: AppDispatch, getState) => {
    const state = getState() as ApplicationState;
    const quoteState = getQuoteState(state);
    const houseQuote = quoteState.houses[houseIndex];
    const activeLandlordIndex = quoteState.activeLandlordsQuoteIndex;
    const landlords = quoteState.landlords;
    const landlordQuote = landlords[activeLandlordIndex];
    landlordQuote.address = houseQuote.address;
    landlordQuote.houseDetails = {
      ...houseQuote.houseDetails,
      houseRentedTenants: PolicyApiModels.KnownOccupancyType.Tenants
    };
    landlordQuote.redirectedFromHouse = true;
    landlords[activeLandlordIndex] = landlordQuote;

    // copy house state to landlord
    dispatch({ type: actionTypes.UPDATE_LANDLORD, payload: { landlords } });
    // remove house quote
    await dispatch(actions.removePolicy('house', houseIndex, houseQuote.policyNumber, true));

    return activeLandlordIndex;
  };

/**
 * Update the quote state attribute
 */
export const newUpdateQuoteState =
  (onSaveAction?: boolean): AppThunk =>
  async (dispatch: AppDispatch, getState) => {
    const state = getState();
    const quoteState = getQuoteState(state);
    const {
      cars = [],
      houses = [],
      contents = [],
      landlords = [],
      boats = [],
      motorbikes = [],
      ctps = []
    } = quoteState;
    const allQuotes = [...cars, ...houses, ...contents, ...landlords, ...boats, ...motorbikes, ...ctps];

    const value = getBrandPageNumber(onSaveAction, location.pathname);
    allQuotes.forEach((quote) => {
      quote.quoteState = value;
      switch (quote.policyType) {
        case 'car':
          dispatch(formActions.change('myForms.carQuote.quoteState', value));
          break;
        case 'house':
          dispatch(formActions.change('myForms.houseQuote.quoteState', value));
          break;
        case 'contents':
          dispatch(formActions.change('myForms.contentsQuote.quoteState', value));
          break;
        case 'landlord':
          dispatch(formActions.change('myForms.landlordQuote.quoteState', value));
          break;
        case 'boat':
          dispatch(formActions.change('myForms.boatsQuote.quoteState', value));
          break;
        case 'motorbike':
          dispatch(formActions.change('myForms.motorbikesQuote.quoteState', value));
          break;
        case 'compulsoryThirdParty':
          dispatch(formActions.change('myForms.ctpQuote.quoteState', value));
          break;
      }
    });

    dispatch({
      type: actionTypes.UPDATE_QUOTES,
      payload: {
        cars: allQuotes.filter((x) => x.policyType === 'car'),
        boats: allQuotes.filter((x) => x.policyType === 'boat'),
        motorbikes: allQuotes.filter((x) => x.policyType === 'motorbike'),
        ctps: allQuotes.filter((x) => x.policyType === 'compulsoryThirdParty'),
        houses: allQuotes.filter((x) => x.policyType === 'house'),
        contents: allQuotes.filter((x) => x.policyType === 'contents'),
        landlords: allQuotes.filter((x) => x.policyType === 'landlord')
      }
    });
  };

/**
 * Called from the save quote dialog and back to my tower menu.
 * Returns HandleSaveQuoteResult (hasError, invalidVersionHandled)
 */
export const handleSaveQuote =
  () =>
  async (dispatch: Dispatch, getState: () => ApplicationState): Promise<HandleSaveQuoteResult> => {
    await actions.updateQuoteState(true)(dispatch, getState);
    const isOnSummaryPg =
      location.pathname === routes.QUOTE.SHARED.FINAL_SUMMARY ||
      location.pathname === routes.QUOTE.COMPULSORYTHIRDPARTY.PAGE2;
    const isOnPaymentPg = location.pathname === routes.QUOTE.SHARED.PAYMENT;
    const state = getState();
    const sharedQuoteState = sharedSelectors.getQuoteSharedState(state);
    const path = location.pathname || '';

    if (path.indexOf('bundle-builder') > -1 && !sharedQuoteState.bundleId) {
      return { hasError: false, invalidVersionHandled: false };
    }

    if (path.indexOf('thankyou') > -1) {
      return { hasError: false, invalidVersionHandled: false };
    }

    if (path.indexOf('page1') > -1 || path.indexOf('page2') > -1) {
      actions.syncCurrentQuotesForStore()(dispatch, getState);
      actions.syncCarDriversToSharedState()(dispatch, getState);
    }

    let hasError = false;
    try {
      if (isOnSummaryPg) {
        // save and move to rated
        await actions.saveQuotes(null, true)(dispatch, getState);
        // move to rated only if they have specified a start date
        if (sharedQuoteState.policyStartDate) {
          const moveToRated = await actions.moveQuotesToRated()(dispatch, getState);
          if (!moveToRated) {
            hasError = true;
          }
        }
      } else if (isOnPaymentPg) {
        // if payment frequency use change payment details api
        if (sharedQuoteState.payment.paymentFrequency) {
          const changedPaymentDetails = await actions.changeQuotesPaymentDetails()(dispatch, getState);
          if (!changedPaymentDetails) {
            hasError = true;
          }
        } else {
          // otherwise move to rated
          const moveToRated = await actions.moveQuotesToRated()(dispatch, getState);
          if (!moveToRated) {
            hasError = true;
          }
        }
      } else {
        const result = await actions.saveQuotes(null, true)(dispatch, getState);
        if (!result) {
          hasError = true;
        }
      }
    } catch (ex) {
      logError(ex, getFunctionName());

      if (ex instanceof Error && ex.message === 'VERSION_CONFLICT') {
        dispatch(formActions.change(`${modelPath}.invalidVersionModalVisible`, true));

        return {
          hasError: true,
          invalidVersionHandled: true
        };
      }

      return { hasError: true, invalidVersionHandled: false };
    }

    return { hasError, invalidVersionHandled: false };

    const latestSharedQuoteState = sharedSelectors.getQuoteSharedState(getState());
    return { hasError, invalidVersionHandled: hasError && latestSharedQuoteState.invalidVersionModalVisible == true };
  };

export interface HandleSaveQuoteResult {
  hasError: boolean;
  invalidVersionHandled: boolean;
}
