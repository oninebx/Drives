import {
  getBaseState,
  getBaseFormState,
  getClaim,
  getClaimCauseOfLoss,
  getClaimSecondaryCauseOfLoss,
  getCarDescription,
  getCarWhenLastSeenDate,
  getLastSeenDate,
  getMissingDate,
  getCarWhenLastSeenTime,
  getCarWhenLastSeenAmPm,
  getLossDate,
  getCarDiscoveredMissingDate,
  getDriverOid,
  getCarDiscoveredMissingDateAsMoment,
  getCarDiscoveredMissingTime,
  getCarDiscoveredMissingAmPm,
  getVehicleDescription,
  getNamedDrivers,
  getInsuredFromClaim,
  getNamedDriversAndInsured,
  getPartiesFromClaim,
  someOneElseDriverAsParty,
  isDriverSelectedAsSomeOneElse,
  isDriverLoggedInCustomer,
  getOtherDrivers,
  getOtherDriversArray,
  getAllOtherDriversContactDetailsMissing,
  getAllOtherDriversNamesMissing,
  getEventLocationOrDescription,
  hasOtherDrivers,
  getOtherPeopleDetailsArray,
  getOtherPeopleDetailsArrayMissingDetails,
  getAllOtherPeopleNamesMissing,
  getOtherPeopleResponsibilityDetails,
  getWitnessDetailsArray,
  hasWitnessContactDetails,
  hasNoWitnessName,
  isOtherDriver,
  maxOtherDriversReached,
  showPassengersInCar,
  showSupervisorInCar,
  showDriverLicenceCountry,
  showDriverLicenceCountryOther,
  showDriverExperience,
  getDriver,
  getSelectedDriver,
  getDriverFullName,
  getDriverLastName,
  getDriverDateOfBirth,
  getDriverPhoneNumber,
  getDriverLicenceTypeLabel,
  getDriverLicenceCountry,
  getDriverLicenceCountryOther,
  getPassengersInCar,
  getSupervisorInCar,
  getIsDriverAvailable,
  getDriverAvailableInSummary,
  getDriverExperience,
  showDriverName,
  showDriverDateOfBirth,
  showDriverContactDetails,
  showDriverAlcoholDrugsMedicationDetails,
  getDriverAlcoholDrugsMedication,
  getAlcoholDrugsMedicationDetails,
  showMissingKeys,
  showMissingKeyDetails,
  showVehicleContentsStolenMessage,
  showReportToPoliceMessage,
  hireCarCoverageLimitAmount,
  isCauseOfLossTheft,
  getWasDoorLocked,
  getIsKeysMissing,
  getMissingKeyDetails,
  getIsKeysMissingString,
  getVehicleContentsStolen,
  isVehicleRecovered,
  showPoliceAttendQuestions,
  getWasTestedForAlcoholOrDrugs,
  getWasAnyoneCharged,
  getPoliceReference,
  getVehicleMakes,
  showOtherDriversQuestions,
  showYourVehicleQuestions,
  isOtherDriverInvolved,
  getClaimNumber,
  askCustomerWantsToClaimDamage,
  showOtherPersonDetailsQuestions,
  showOtherPeoplePropertyQuestions,
  showYourDriverQuestions,
  getYourDriver,
  showOtherVehiclesDamageQuestions,
  showWitnessQuestions,
  showAuthorityReportQuestions,
  showFireAuthorityReport,
  showOtherPeoplePropertyVehicleOption,
  showHailRepairer,
  hideRepairerQuestions,
  hideCarDamageQuestions,
  showHireCarBenefitStolenConfirmationText,
  showExcessDWPOrAWDConfirmationText,
  showExcessConfirmationText,
  showHireVehicleStolenConfirmationText,
  showHireVehicleNotDrivableConfirmationText,
  showDriverDetailsConfirmationText,
  showOtherPartyConfirmationText,
  showNotReportedToPoliceConfirmationText,
  showSettlementMarketValueConfirmationText,
  showSettlementAgreedValueConfirmationText,
  showStolenVehicleConfirmationText,
  showPoliceFollowUpConfirmationText,
  showHireCarBenefitNotDrivableConfirmationText,
  getCarDamageSelections,
  getAirBagsDeployedSelection,
  getVehicleDamageDescription,
  hideVehicleDrivableQuestion,
  getIsDamageToClaimValue,
  isDamageToClaim,
  isDamageClaimableCauseOfLoss,
  carDamage,
  hasWitness,
  getWitnesses,
  getWitnessCount,
  getOtherPropertyDamages,
  getOtherPropertyDamage,
  isPropertyDamagedBusiness,
  isPropertyDamagedSubTypeVehicle,
  knowDamagedPropertyOwner,
  getKnowDamagedPropertyOwnerString,
  hasVehicleDamageDetails,
  getDamageVehicleModels,
  hasOtherPropertyDamages,
  getOtherPropertyDamageCount,
  getOtherPeopleDetails,
  hasOtherPeopleDetails,
  getOtherPeopleDetailsCount,
  drivableUnsure,
  getIsVehicleDrivable,
  getIsVehicleDrivableAsText,
  askVehicleLocation,
  getVehicleLocation,
  isContamination,
  askTypeOfBusiness,
  defaultUsedCommerciallyAsTrue,
  getIsUsedCommercially,
  getCommercialUse,
  getPoliceAttendDetails,
  getFireServiceAttend,
  policeAttended,
  hasBeenReportedToPolice,
  isAnyOneCharged,
  getRepairerRegion,
  hasRepairerRegionSelected,
  getRepairers,
  getRepairersAllOrSelected,
  hasRepairers,
  getSelectedRepairerId,
  getSelectedRepairer,
  getOwnSelectedRepairer,
  getFindAnotherLinkVisible,
  getOwnRepairerSectionVisible,
  getSelectedRepairerSingleLineAddress,
  getSelectedRepairerNameAndAddress,
  getEventDescriptionLabel,
  getEventLocationLabel,
  getEventLocationHeaderLabel,
  isDriverEmailCorrect,
  isWitnessEmailValid,
  isOtherPeopleDetailsEmailValid,
  isOtherPeoplePropertyEmailValid,
  areThirdPartiesInvolved,
  showClaimDamageQuestions,
} from './selectors';

import {
  ClaimType,
  LicenceType,
  selectors as sharedSelectors,
} from '~/feature/claim/shared/state';

import {
  KnownAutoRoleType,
  KnownCauseOfLoss as COL,
  KnownSecondaryCauseOfLoss as SCOL,
  KnownLicenceCountry as LicenceCountry,
} from '~/common/state/autorest/Claims/src/models';

import {
  DAMAGE_PROPERTY_TYPE_OTH,
  DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE,
  DRIVER_SOME_ONE_ELSE,
  KEYS_MISSING_YES,
  KEYS_MISSING_NO,
  KEYS_MISSING_UNSURE,
  SOME_ONE_ELSE,
  YES,
  NO,
  UNSURE,
} from './constants';

import { t } from '~/root/i18n';

jest.mock('~/feature/claim/shared/state', () => {
  const actual = jest.requireActual(
    '~/feature/claim/shared/state'
  );

  return {
    ...actual,
    selectors: {
      getClaimSharedState: jest.fn(),
      getClaimType: jest.fn(),
      isCommercialMotorPolicy: jest.fn(),
      isThirdPartyPackage: jest.fn(),
      isThirdPartyFireTheftPackage: jest.fn(),
      getPolicyDetails: jest.fn(),
    },
  };
});

jest.mock('~/root/i18n', () => ({
  t: jest.fn(),
}));

jest.mock('~/feature/claim/utils', () => ({
  mapAutoDamageAreaUiToApi: jest.fn((value) => value),
  MapThirdPartyAtFaultValue: jest.fn((value) => value),
  momentDate: jest.fn((value) => ({
    toDate: () => new Date(value),
  })),
  momentDateTime: jest.fn((date, time) => ({
    toDate: () => new Date(`${date} ${time}`),
  })),
}));

jest.mock('~/common/utilities', () => ({
  checkYesNoNull: jest.fn((value) => value),
  checkYesNoUnsure: jest.fn((value) => value),
  formatPhoneNumber: jest.fn((value) => `formatted:${value}`),
  isEmptyObj: jest.fn((value) => Object.keys(value).length === 0),
}));

jest.mock('~/common/state', () => {
  const actual = jest.requireActual('~/common/state');

  return {
    ...actual,
    selectors: {
      getLoginEmail: jest.fn(),
      getCustomer: jest.fn(),
    },
  };
});

import { selectors as commonSelectors } from '~/common/state';

const mockedSharedSelectors = sharedSelectors as jest.Mocked<typeof sharedSelectors>;
const mockedCommonSelectors = commonSelectors as jest.Mocked<typeof commonSelectors>;
const mockedT = t as jest.Mock;

const createState = (overrides: any = {}): any => ({
  myForms: {
    carClaim: {
      eisClaim: {
        causeOfLoss: COL.AccidentWhileDriving,
        secondaryCauseOfLoss: SCOL.SingleVehicle,
        claimNumber: 'CLM001',
        parties: [],
      },

      driver: {
        oid: 'driver-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@test.com',
        phone: '021123456',
        licenceType: LicenceType.Full,
        licenceCountry: LicenceCountry.NewZealand,
        passengersInCar: false,
        supervisorInCar: false,
        driverAvailable: true,
        drivingExperience: undefined,
      },

      theft: {
        carLastSeenDate: '01 January 2026',
        carLastSeenTime: '10:00',
        carLastSeenAmPm: 'AM',
        carDiscoveredMissingDate: '02 January 2026',
        carDiscoveredMissingTime: '11:00',
        carDiscoveredMissingAmPm: 'AM',
        isKeyMissing: KEYS_MISSING_YES,
        missingKeyDetails: 'Lost keys',
        doorsLocked: YES,
        vehicleContentsStolen: YES,
      },

      otherDrivers: [],
      otherPeopleDetails: [],
      witnesses: [],
      otherPropertyDamages: [],

      carDamageDetails: {
        carDamage: {},
        airbagDeployed: YES,
        damageDescription: 'Front damage',
        liabilityOnly: false,
        drivable: YES,
        vehicleLocation: 'Garage',
        usedCommercially: false,
        typeOfBusiness: '',
        repairerRegion: 'Auckland',
        repairers: [],
        selectedRepairerId: null,
        selectedRepairer: null,
        isOwnRepairerSelected: false,
        isFindAnotherRepairerLinkVisible: false,
        isOwnRepairerSectionVisible: false,
      },

      eventLocationAddress: {
        addressSearch: '',
        addressDetails: {},
      },

      eventLocationDescription: 'Event description',

      policeAttendDetails: {
        policeAttended: false,
        testedForAlcoholOrDrug: YES,
        anyoneCharged: NO,
      },

      authorityReportPolice: {
        referenceNumber: 'POL123',
        isReported: true,
      },

      authorityReportFire: {
        isReported: true,
      },

      vehicleMakes: ['Toyota', 'Mazda'],
    },

    forms: {
      carClaim: {
        driver: {
          email: {
            valid: true,
          },
        },
        witnesses: {},
        otherPeopleDetails: {},
        otherPropertyDamages: {},
      },
    },
  },

  ...overrides,
});

const state = () => createState();

beforeEach(() => {
  jest.clearAllMocks();

  mockedSharedSelectors.getClaimType.mockReturnValue(ClaimType.Car);

  mockedSharedSelectors.getClaimSharedState.mockReturnValue({
    claimType: ClaimType.Car,
    policyDetails: {
      package: undefined,
      risk: undefined,
    },
    car: {
      causeOfLoss: undefined,
      damage: undefined,
    },
  } as any);

  mockedSharedSelectors.isCommercialMotorPolicy.mockReturnValue(false);
  mockedSharedSelectors.isThirdPartyPackage.mockReturnValue(false);
  mockedSharedSelectors.isThirdPartyFireTheftPackage.mockReturnValue(false);
  mockedSharedSelectors.getPolicyDetails.mockReturnValue({
    risk: {
      coverages: {},
    },
  } as any);

  mockedCommonSelectors.getLoginEmail.mockReturnValue('john@test.com');

  mockedCommonSelectors.getCustomer.mockReturnValue({
    firstName: 'John',
    lastName: 'Smith',
  });

  mockedT.mockImplementation((key: string) => key);
});