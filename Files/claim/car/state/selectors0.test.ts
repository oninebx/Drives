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

describe('basic selectors', () => {
  it('returns base state and form state', () => {
    const currentState = state();

    expect(getBaseState(currentState)).toBe(currentState.myForms.carClaim);
    expect(getBaseFormState(currentState)).toBe(
      currentState.myForms.forms.carClaim
    );
  });

  it('returns claim information', () => {
    const currentState = state();

    expect(getClaim(currentState)).toBe(
      currentState.myForms.carClaim.eisClaim
    );

    expect(getClaimCauseOfLoss(currentState)).toBe(
      COL.AccidentWhileDriving
    );

    expect(getClaimSecondaryCauseOfLoss(currentState)).toBe(
      SCOL.SingleVehicle
    );

    expect(getLossDate(currentState)).toBeUndefined();
    expect(getClaimNumber(currentState)).toBe('CLM001');
  });

  it('returns driver information', () => {
    const currentState = state();

    expect(getDriverOid(currentState)).toBe('driver-1');
    expect(getDriverFullName(currentState)).toBe('John Smith');
    expect(getDriverLastName(currentState)).toBe('Smith');
    expect(getDriverPhoneNumber(currentState)).toBe('021123456');
  });

  it('returns collection selectors', () => {
    const currentState = state();

    expect(getOtherDrivers(currentState)).toEqual([]);
    expect(hasOtherDrivers(currentState)).toBe(false);

    expect(getWitnesses(currentState)).toEqual([]);
    expect(hasWitness(currentState)).toBe(false);
    expect(getWitnessCount(currentState)).toBe(0);

    expect(getOtherPropertyDamages(currentState)).toEqual([]);
    expect(hasOtherPropertyDamages(currentState)).toBe(false);
    expect(getOtherPropertyDamageCount(currentState)).toBe(0);

    expect(getOtherPeopleDetails(currentState)).toEqual([]);
    expect(hasOtherPeopleDetails(currentState)).toBe(false);
    expect(getOtherPeopleDetailsCount(currentState)).toBe(0);
  });
});

describe('driver selectors', () => {
  it('returns selected driver details', () => {
    const currentState = state();

    expect(getSelectedDriver(currentState)).toBe(
      'John Smith</br>formatted:021123456'
    );
  });

  it('returns Someone else when driver has no name', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            oid: SOME_ONE_ELSE,
            firstName: '',
            lastName: '',
          },
        },
      },
    });

    expect(getSelectedDriver(currentState)).toBe('Someone else');
  });

  it('returns empty selected driver when driver has no full name', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            firstName: '',
            lastName: '',
          },
        },
      },
    });

    expect(getSelectedDriver(currentState)).toBe('');
  });

  it('detects someone else driver', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            oid: SOME_ONE_ELSE,
          },
        },
      },
    });

    expect(isDriverSelectedAsSomeOneElse(currentState)).toBe(true);
    expect(showDriverName(currentState)).toBe(true);
  });

  it('returns driver licence information', () => {
    const currentState = state();

    expect(getDriverLicenceTypeLabel(currentState)).toBe(
      `claim/car:driverLicenceType.labels.${LicenceType.Full}`
    );

    expect(getDriverLicenceCountry(currentState)).toBe('New Zealand');

    expect(getDriverLicenceCountryOther(currentState)).toBeUndefined();
  });

  it('returns passengers information', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            licenceType: LicenceType.Restricted,
            passengersInCar: true,
          },
        },
      },
    });

    expect(getPassengersInCar(currentState)).toBe('Yes');

    const noPassengers = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            licenceType: LicenceType.Restricted,
            passengersInCar: false,
          },
        },
      },
    });

    expect(getPassengersInCar(noPassengers)).toBe('No');
  });

  it('returns empty passengers value for non-restricted licence', () => {
    expect(getPassengersInCar(state())).toBe('');
  });

  it('returns supervisor value', () => {
    const learners = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            licenceType: LicenceType.Learners,
            supervisorInCar: true,
          },
        },
      },
    });

    expect(getSupervisorInCar(learners)).toBe('Yes');

    const learnersNoSupervisor = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            licenceType: LicenceType.Learners,
            supervisorInCar: false,
          },
        },
      },
    });

    expect(getSupervisorInCar(learnersNoSupervisor)).toBe('No');
  });

  it('returns driver availability', () => {
    expect(getIsDriverAvailable(state())).toBe(true);
    expect(getDriverAvailableInSummary(state())).toBe('Yes');

    const unavailable = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            driverAvailable: false,
          },
        },
      },
    });

    expect(getDriverAvailableInSummary(unavailable)).toBe('No');

    const unknown = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          driver: {
            ...state().myForms.carClaim.driver,
            driverAvailable: null,
          },
        },
      },
    });

    expect(getDriverAvailableInSummary(unknown)).toBe('');
  });
});

describe('party selectors', () => {
  const parties = [
    {
      oid: 'driver-1',
      nameType: 'Individual',
      roles: [KnownAutoRoleType.PolicyDriver],
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@test.com',
      phoneNumbers: [{ number: '021111111' }],
      contactPreference: 'Email',
    },
    {
      oid: 'driver-2',
      nameType: 'Individual',
      roles: [KnownAutoRoleType.Driver],
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      phoneNumbers: [],
      contactPreference: 'Phone',
    },
    {
      oid: 'company',
      nameType: 'Organisation',
      roles: [KnownAutoRoleType.Driver],
      firstName: 'Ignored',
      lastName: 'Party',
    },
  ];

  it('filters, maps and sorts claim parties', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eisClaim: {
            ...state().myForms.carClaim.eisClaim,
            parties,
          },
        },
      },
    });

    const result = getNamedDrivers(currentState);

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual(
      expect.objectContaining({
        oid: 'driver-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@test.com',
        phone: '021111111',
        isLoggedInCustomer: true,
      })
    );

    expect(result[1]).toEqual(
      expect.objectContaining({
        oid: 'driver-2',
        phone: null,
        isLoggedInCustomer: false,
      })
    );
  });

  it('returns empty array when claim has no parties', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eisClaim: {
            ...state().myForms.carClaim.eisClaim,
            parties: [],
          },
        },
      },
    });

    expect(getNamedDrivers(currentState)).toEqual([]);
  });

  it('returns insured and combined parties', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eisClaim: {
            ...state().myForms.carClaim.eisClaim,
            parties,
          },
        },
      },
    });

    expect(getInsuredFromClaim(currentState)).toEqual([]);

    expect(getNamedDriversAndInsured(currentState)).toHaveLength(2);
  });

  it('does not return a driver for SOME_ONE_ELSE', () => {
    const drivers = [
      {
        oid: 'driver-1',
        isLoggedInCustomer: false,
      },
    ] as any;

    expect(getDriver(SOME_ONE_ELSE, drivers)).toBeUndefined();
    expect(getDriver('driver-1', drivers)).toEqual(drivers[0]);
  });
});

describe('other parties', () => {
  it('formats other drivers', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          otherDrivers: [
            {
              firstName: 'Jane',
              lastName: 'Doe',
              make: 'Toyota',
              model: 'Corolla',
              rego: 'abc123',
              phone: '021123456',
              email: 'jane@test.com',
              insuranceDetails: 'AA Insurance',
              thirdPartyAtFault: YES,
              address: {
                addressSearch: 'Auckland',
              },
            },
          ],
        },
      },
    });

    expect(getOtherDriversArray(currentState)[0]).toContain('Jane Doe');
    expect(getOtherDriversArray(currentState)[0]).toContain('TOYOTA');
    expect(getOtherDriversArray(currentState)[0]).toContain('ABC123');
    expect(getOtherDriversArray(currentState)[0]).toContain(
      'formatted:021123456'
    );
    expect(getOtherDriversArray(currentState)[0]).toContain(
      'jane@test.com'
    );
    expect(getOtherDriversArray(currentState)[0]).toContain('Auckland');
  });

  it('returns true when other driver contact details are missing', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          otherDrivers: [
            {
              rego: '',
              make: '',
              model: '',
              email: '',
              phone: '',
              address: {
                addressSearch: '',
              },
            },
          ],
        },
      },
    });

    expect(getAllOtherDriversContactDetailsMissing(currentState)).toBe(true);
  });

  it('returns true when other driver name is missing', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          otherDrivers: [
            {
              firstName: '',
            },
          ],
        },
      },
    });

    expect(getAllOtherDriversNamesMissing(currentState)).toBe(true);
  });

  it('formats other people and witnesses', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,

          otherPeopleDetails: [
            {
              firstName: 'Alice',
              lastName: 'Brown',
              phone: '021111111',
              email: 'alice@test.com',
              address: {
                addressSearch: 'Auckland',
              },
              description: 'They caused the damage',
            },
          ],

          witnesses: [
            {
              firstName: 'Bob',
              lastName: 'White',
              phone: '021222222',
              email: 'bob@test.com',
              address: {
                addressSearch: 'Wellington',
              },
            },
          ],
        },
      },
    });

    expect(getOtherPeopleDetailsArray(currentState)[0]).toContain(
      'Alice Brown'
    );

    expect(getOtherPeopleDetailsArray(currentState)[0]).toContain(
      'They caused the damage'
    );

    expect(getWitnessDetailsArray(currentState)[0]).toContain(
      'Bob White'
    );

    expect(hasWitnessContactDetails(currentState)).toBe(true);
  });
});

describe('claim visibility selectors', () => {
  const withClaim = (
    causeOfLoss: COL,
    secondaryCauseOfLoss?: SCOL,
    claimType = ClaimType.Car
  ) =>
    createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eisClaim: {
            ...state().myForms.carClaim.eisClaim,
            causeOfLoss,
            secondaryCauseOfLoss,
          },
        },
      },
    });

  it.each([
    [SCOL.MultipleVehicles, true],
    [SCOL.HitByAnotherVehicle, true],
    [SCOL.ImpactUnderwater, true],
    [SCOL.SingleVehicle, false],
  ])(
    'showOtherDriversQuestions: %s -> %s',
    (scol, expected) => {
      expect(
        showOtherDriversQuestions(
          withClaim(COL.AccidentWhileDriving, scol)
        )
      ).toBe(expected);
    }
  );

  it.each([
    [SCOL.MultipleVehicles, true],
    [SCOL.SingleVehicle, true],
    [SCOL.ImpactOutOfWater, true],
    [SCOL.ImpactUnderwater, true],
    [SCOL.VehicleNotRecovered, false],
  ])(
    'askCustomerWantsToClaimDamage: %s -> %s',
    (scol, expected) => {
      expect(
        askCustomerWantsToClaimDamage(
          withClaim(COL.AccidentWhileDriving, scol)
        )
      ).toBe(expected);
    }
  );

  it.each([
    [COL.Other, false],
    [COL.AccidentWhileDriving, true],
  ])(
    'showYourVehicleQuestions: %s -> %s',
    (col, expected) => {
      expect(
        showYourVehicleQuestions(
          withClaim(col, SCOL.SingleVehicle)
        )
      ).toBe(expected);
    }
  );

  it('does not show your vehicle when vehicle is not recovered', () => {
    expect(
      showYourVehicleQuestions(
        withClaim(COL.Stolen, SCOL.VehicleNotRecovered)
      )
    ).toBe(false);
  });

  it('detects theft', () => {
    expect(
      isCauseOfLossTheft(
        withClaim(COL.Stolen, SCOL.VehicleNotRecovered)
      )
    ).toBe(true);

    expect(
      isCauseOfLossTheft(
        withClaim(COL.Other, SCOL.SingleVehicle)
      )
    ).toBe(false);
  });

  it('detects recovered vehicle', () => {
    expect(
      isVehicleRecovered(
        withClaim(COL.Stolen, SCOL.VehicleRecovered)
      )
    ).toBe(true);
  });
});

describe('theft selectors', () => {
  it('returns theft details', () => {
    const currentState = state();

    expect(getWasDoorLocked(currentState)).toBe(YES);
    expect(getIsKeysMissing(currentState)).toBe(KEYS_MISSING_YES);
    expect(getMissingKeyDetails(currentState)).toBe('Lost keys');
    expect(getVehicleContentsStolen(currentState)).toBe(YES);
  });

  it.each([
    [KEYS_MISSING_YES, 'Yes'],
    [KEYS_MISSING_NO, 'No'],
    [KEYS_MISSING_UNSURE, 'Unsure'],
  ])(
    'formats missing keys %s as %s',
    (value, expected) => {
      const currentState = createState({
        myForms: {
          carClaim: {
            ...state().myForms.carClaim,
            theft: {
              ...state().myForms.carClaim.theft,
              isKeyMissing: value,
            },
          },
        },
      });

      expect(getIsKeysMissingString(currentState)).toBe(expected);
    }
  );

  it('shows missing key details only when keys are missing', () => {
    const currentState = state();

    expect(showMissingKeyDetails(currentState)).toBe(true);

    const no = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          theft: {
            ...state().myForms.carClaim.theft,
            isKeyMissing: KEYS_MISSING_NO,
          },
        },
      },
    });

    expect(showMissingKeyDetails(no)).toBe(false);
  });
});

describe('damage selectors', () => {
  it('returns damage information', () => {
    const currentState = state();

    expect(getAirBagsDeployedSelection(currentState)).toBe(YES);
    expect(getVehicleDamageDescription(currentState)).toBe('Front damage');
    expect(getIsDamageToClaimValue(currentState)).toBe('Yes');
    expect(getIsVehicleDrivable(currentState)).toBe(false);
    expect(getIsVehicleDrivableAsText(currentState)).toBe(YES);
  });

  it('returns No when liability only is true', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          carDamageDetails: {
            ...state().myForms.carClaim.carDamageDetails,
            liabilityOnly: true,
          },
        },
      },
    });

    expect(getIsDamageToClaimValue(currentState)).toBe('No');
  });

  it('returns empty damage claim value when liabilityOnly is undefined', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          carDamageDetails: {
            ...state().myForms.carClaim.carDamageDetails,
            liabilityOnly: undefined,
          },
        },
      },
    });

    expect(getIsDamageToClaimValue(currentState)).toBe('');
  });

  it('returns repairer information', () => {
    const repairer = {
      name: 'Repair Shop',
      address: {
        addressLine1: '1 Queen Street',
        addressLine2: 'Level 2',
        addressLine3: '',
        suburb: 'CBD',
        city: 'Auckland',
      },
    };

    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          carDamageDetails: {
            ...state().myForms.carClaim.carDamageDetails,
            selectedRepairerId: 'R1',
            selectedRepairer: repairer,
            repairers: [repairer],
          },
        },
      },
    });

    expect(getSelectedRepairerId(currentState)).toBe('R1');
    expect(getSelectedRepairer(currentState)).toBe(repairer);
    expect(getRepairers(currentState)).toEqual([repairer]);
    expect(hasRepairers(currentState)).toBe(true);

    expect(getSelectedRepairerSingleLineAddress(currentState)).toBe(
      '1 Queen Street, Level 2, CBD, Auckland'
    );

    expect(getSelectedRepairerNameAndAddress(currentState)).toBe(
      'Repair Shop</br>1 Queen Street, Level 2, CBD, Auckland'
    );
  });
});

describe('event labels', () => {
  const withClaim = (
    causeOfLoss: COL,
    secondaryCauseOfLoss?: SCOL
  ) =>
    createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eisClaim: {
            ...state().myForms.carClaim.eisClaim,
            causeOfLoss,
            secondaryCauseOfLoss,
          },
        },
      },
    });

  it.each([
    [COL.AccidentWhileDriving, undefined, 'accident'],
    [COL.DamagedWhileParked, SCOL.Weather, 'naturalDisaster'],
    [COL.DamagedWhileParked, SCOL.Fire, 'fire'],
    [COL.DamagedWhileParked, SCOL.SingleVehicle, 'damaged'],
    [COL.NaturalDisaster, undefined, 'naturalDisaster'],
    [COL.Contamination, SCOL.Methamphetamine, 'contaminationMeth'],
    [COL.Contamination, SCOL.Other, 'contaminationOther'],
    [COL.Stolen, SCOL.VehicleRecovered, 'stolenRecovered'],
    [COL.Stolen, SCOL.VehicleNotRecovered, 'stolenNotRecovered'],
  ])(
    'returns correct event description label',
    (col, scol, expected) => {
      expect(
        getEventDescriptionLabel(withClaim(col, scol))
      ).toBe(expected);
    }
  );

  it.each([
    [COL.AccidentWhileDriving, undefined, 'accidentWhileDriving'],
    [COL.DamagedWhileParked, SCOL.HitByAnotherVehicle, 'hitByAnotherVehicle'],
    [COL.DamagedWhileParked, SCOL.SingleVehicle, 'damaged'],
    [COL.NaturalDisaster, undefined, 'damaged'],
    [COL.Stolen, undefined, 'stolen'],
    [COL.Contamination, undefined, 'contamination'],
  ])(
    'returns correct event location label',
    (col, scol, expected) => {
      expect(
        getEventLocationLabel(withClaim(col, scol))
      ).toBe(expected);
    }
  );

  it.each([
    [COL.AccidentWhileDriving, undefined, 'accidentInformation'],
    [COL.AccidentDamage, undefined, 'accidentInformation'],
    [COL.DamagedWhileParked, SCOL.HitByAnotherVehicle, 'accidentInformation'],
    [COL.Other, undefined, 'incidentInformation'],
  ])(
    'returns correct event header label',
    (col, scol, expected) => {
      expect(
        getEventLocationHeaderLabel(withClaim(col, scol))
      ).toBe(expected);
    }
  );
});

describe('getEventLocationOrDescription', () => {
  it('returns searched address first', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eventLocationAddress: {
            addressSearch: '10 Queen Street',
            addressDetails: {},
          },
        },
      },
    });

    expect(getEventLocationOrDescription(currentState)).toBe(
      '10 Queen Street'
    );
  });

  it('builds address from address details', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eventLocationAddress: {
            addressSearch: '',
            addressDetails: {
              unitAndFloor: '2',
              streetNumber: '10',
              streetName: 'Queen Street',
              suburb: 'CBD',
              city: 'Auckland',
              province: 'Auckland',
            },
          },
        },
      },
    });

    expect(getEventLocationOrDescription(currentState)).toBe(
      '2/10 Queen Street CBD Auckland Auckland'
    );
  });

  it('falls back to event description', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eventLocationAddress: {
            addressSearch: '',
            addressDetails: {},
          },
          eventLocationDescription: 'Somewhere in Auckland',
        },
      },
    });

    expect(getEventLocationOrDescription(currentState)).toBe(
      'Somewhere in Auckland'
    );
  });

  it('returns empty string when no location is available', () => {
    const currentState = createState({
      myForms: {
        carClaim: {
          ...state().myForms.carClaim,
          eventLocationAddress: {
            addressSearch: '',
            addressDetails: {},
          },
          eventLocationDescription: '',
        },
      },
    });

    expect(getEventLocationOrDescription(currentState)).toBe('');
  });
});

describe('form validation selectors', () => {
  it('checks driver email', () => {
    expect(isDriverEmailCorrect(state())).toBe(true);
  });

  it('checks witness emails', () => {
    const currentState = createState({
      myForms: {
        forms: {
          carClaim: {
            ...state().myForms.forms.carClaim,
            witnesses: {
              first: {
                email: {
                  valid: true,
                },
              },
              last: {},
            },
          },
        },
      },
    });

    expect(isWitnessEmailValid(currentState)).toBe(true);
  });

  it('checks other people emails', () => {
    const currentState = createState({
      myForms: {
        forms: {
          carClaim: {
            ...state().myForms.forms.carClaim,
            otherPeopleDetails: {
              first: {
                email: {
                  valid: true,
                },
              },
              last: {},
            },
          },
        },
      },
    });

    expect(isOtherPeopleDetailsEmailValid(currentState)).toBe(true);
  });
});