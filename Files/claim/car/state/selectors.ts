import type { AddressDetailsResponse } from '~/common/state';
import { ClaimsApiModels, selectors as commonSelectors } from '~/common/state';
import { momentNZ as moment } from '~/common/twr-moment/twr-moment';
import type { ClaimParty } from '~/feature/claim/shared/state';
import {
  CAUSE_OF_LOSS_NATURAL_DISASTER,
  ClaimType,
  LicenceType,
  selectors as sharedSelectors
} from '~/feature/claim/shared/state';
import { t } from '~/root/i18n';
import type { ApplicationState } from '~/root/rootReducer';
import type { ClaimCarFormState, ClaimCarState, ContactDetails } from './constants';
import {
  DAMAGE_PROPERTY_TYPE_OTH,
  DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE,
  DRIVER_LICENCE_COUNTRY_ARRAY,
  DRIVER_SOME_ONE_ELSE,
  KEYS_MISSING_NO,
  KEYS_MISSING_UNSURE,
  KEYS_MISSING_YES,
  NO,
  SOME_ONE_ELSE,
  UNSURE,
  YES
} from './constants';

import type { FieldState } from 'react-redux-form';
import type { AutoDamageArea } from '~/common/state/autorest/Claims/src/models';
import {
  KnownAutoRoleType as AutoRoleType,
  KnownCauseOfLoss as COL,
  KnownAutoRoleType,
  KnownSecondaryCauseOfLoss,
  KnownLicenceCountry as LicenceCountry,
  KnownNameType as NameType,
  KnownSecondaryCauseOfLoss as SCOL
} from '~/common/state/autorest/Claims/src/models';
import type { CarRiskPolicy } from '~/common/state/autorest/Policy/src/models';
import { KnownMotorPackage } from '~/common/state/autorest/Policy/src/models';
import { checkYesNoNull, checkYesNoUnsure, formatPhoneNumber, isEmptyObj } from '~/common/utilities';
import { mapAutoDamageAreaUiToApi, MapThirdPartyAtFaultValue, momentDate, momentDateTime } from '~/feature/claim/utils';

export const getBaseState = (state: ApplicationState) => {
  return state.myForms.carClaim as ClaimCarState;
};
export const getBaseFormState = (state: ApplicationState) => {
  return state.myForms.forms.carClaim as ClaimCarFormState;
};
export const getClaim = (state: ApplicationState) => {
  return getBaseState(state).eisClaim;
};

export const getClaimCauseOfLoss = (state: ApplicationState) => {
  return getClaim(state).causeOfLoss;
};

export const getClaimSecondaryCauseOfLoss = (state: ApplicationState) => {
  return getClaim(state).secondaryCauseOfLoss;
};

export const getCarDescription = (state: ApplicationState) => {
  const claimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = claimState.policyDetails;
  const vehicle = policyDetails.risk as CarRiskPolicy;
  let carDescription = null;

  if (vehicle) {
    carDescription = `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.registrationNo}`;
  }

  return carDescription;
};

export const getCarWhenLastSeenDate = (state: ApplicationState) => {
  return getBaseState(state).theft.carLastSeenDate;
};

export const getLastSeenDate = (state: ApplicationState) => {
  if (getCarWhenLastSeenDate(state)) {
    return getCarWhenLastSeenTime(state)
      ? momentDateTime(
          getCarWhenLastSeenDate(state),
          getCarWhenLastSeenTime(state),
          getCarWhenLastSeenAmPm(state)
        ).toDate()
      : moment(getCarWhenLastSeenDate(state), 'DD MMMM YYYY').toDate();
  } else {
    return undefined;
  }
};

export const getMissingDate = (state: ApplicationState) => {
  if (getCarDiscoveredMissingDate(state)) {
    return getCarDiscoveredMissingTime(state)
      ? momentDateTime(
          getCarDiscoveredMissingDate(state),
          getCarDiscoveredMissingTime(state),
          getCarDiscoveredMissingAmPm(state)
        ).toDate()
      : momentDate(getCarDiscoveredMissingDate(state)).toDate();
  } else {
    return undefined;
  }
};

export const getCarWhenLastSeenTime = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return theft && theft.carLastSeenTime;
};

export const getCarWhenLastSeenAmPm = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return theft && theft.carLastSeenAmPm;
};

export const getLossDate = (state: ApplicationState) => {
  return getClaim(state) ? getClaim(state).lossDate : undefined;
};

export const getCarDiscoveredMissingDate = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return theft && theft.carDiscoveredMissingDate;
};

export const getDriverOid = (state: ApplicationState) => {
  const driver = getBaseState(state).driver;
  return driver && driver.oid;
};

export const getCarDiscoveredMissingDateAsMoment = (state: ApplicationState) => {
  const missingDate = getCarDiscoveredMissingDate(state);
  // missing date get populated from loss date on car page1 mount
  return missingDate ? moment(missingDate, 'DD MMMM YYYY') : undefined;
};

export const getCarDiscoveredMissingTime = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return theft && theft.carDiscoveredMissingTime;
};

export const getCarDiscoveredMissingAmPm = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return theft && theft.carDiscoveredMissingAmPm;
};

export const getVehicleDescription = (state: ApplicationState) => {
  const claimState = sharedSelectors.getClaimSharedState(state);
  return claimState && claimState.policyDetails && claimState.policyDetails.description;
};

export const getNamedDrivers = (state: ApplicationState): ClaimParty[] => {
  return getPartiesFromClaim(state, [AutoRoleType.PolicyDriver, AutoRoleType.Driver, AutoRoleType.DriverAndOwner]);
};

export const getInsuredFromClaim = (state: ApplicationState): ClaimParty[] => {
  return getPartiesFromClaim(state, [AutoRoleType.PolicyInsured, AutoRoleType.MainContact]);
};

export const getNamedDriversAndInsured = (state: ApplicationState): ClaimParty[] => {
  return getPartiesFromClaim(state, [
    AutoRoleType.PolicyDriver,
    AutoRoleType.Driver,
    AutoRoleType.DriverAndOwner,
    AutoRoleType.PolicyInsured,
    AutoRoleType.MainContact
  ]);
};

export const getPartiesFromClaim = (state: ApplicationState, roleTypes: AutoRoleType[]): ClaimParty[] => {
  const claim = getClaim(state);
  const loginEmail = commonSelectors.getLoginEmail(state);
  const customer = commonSelectors.getCustomer(state);
  let parties: ClaimParty[] = [];
  if (claim && claim.parties) {
    parties = claim.parties
      .filter(
        (party) =>
          party.nameType === NameType.Individual &&
          party.roles &&
          party.roles.some((r) => roleTypes.indexOf(r as AutoRoleType) !== -1)
      )
      .map((party) => {
        return {
          oid: party.oid,
          isLoggedInCustomer:
            party.email === loginEmail &&
            party.firstName === customer.firstName &&
            party.lastName === customer.lastName,
          firstName: party.firstName,
          lastName: party.lastName,
          email: party.email,
          phone: party.phoneNumbers !== undefined && party.phoneNumbers.length ? party.phoneNumbers[0].number : null,
          contactPreference: party.contactPreference,
          roleTypes: party.roles
        };
      })
      .sort((a, b) =>
        a.isLoggedInCustomer < b.isLoggedInCustomer ? 1 : b.isLoggedInCustomer < a.isLoggedInCustomer ? -1 : 0
      );
  }

  return parties;
};

export const someOneElseDriverAsParty = (state: ApplicationState) => {
  const claimCarState = getBaseState(state);
  return {
    oid: DRIVER_SOME_ONE_ELSE,
    firstName: claimCarState.driver.firstName,
    lastName: claimCarState.driver.lastName,
    email: claimCarState.driver.email,
    phone: claimCarState.driver.phone
  };
};

export const isDriverSelectedAsSomeOneElse = (state: ApplicationState) => {
  return getDriverOid(state) === SOME_ONE_ELSE;
};

export const isDriverLoggedInCustomer = (state: ApplicationState, drivers: ClaimParty[]): boolean => {
  const driverClaimCarState = getBaseState(state).driver;
  const driverOid = driverClaimCarState?.oid;
  const driver = getDriver(driverOid, drivers);
  return driver?.isLoggedInCustomer;
};

export const getOtherDrivers = (state: ApplicationState) => {
  return getBaseState(state).otherDrivers;
};

export const getOtherDriversArray = (state: ApplicationState): string[] => {
  const claimCarState = getBaseState(state);
  const otherDriversStringArray: string[] = [];
  if (claimCarState.otherDrivers && claimCarState.otherDrivers.length > 0) {
    claimCarState.otherDrivers.forEach((drivers) => {
      let otherDriverDetails = '';

      otherDriverDetails += drivers.firstName ? drivers.firstName + ' ' : '';
      otherDriverDetails += drivers.lastName ? drivers.lastName : '';
      otherDriverDetails +=
        otherDriverDetails.length > 0 && (drivers.make || drivers.model || drivers.rego || drivers.insuranceDetails)
          ? '<br/>'
          : '';
      otherDriverDetails += drivers.make ? drivers.make : '';
      otherDriverDetails += drivers.make && drivers.model ? ' ' : '';
      otherDriverDetails += drivers.model ? drivers.model : '';
      otherDriverDetails += drivers.make && drivers.model ? ' ' : '';
      otherDriverDetails += drivers.rego ? drivers.rego.toUpperCase() : '';
      otherDriverDetails += drivers.thirdPartyAtFault ? '<br/>' : '';
      otherDriverDetails += drivers.thirdPartyAtFault
        ? `Which party do you think is primarily at fault? ${MapThirdPartyAtFaultValue(drivers.thirdPartyAtFault)}`
        : '';
      otherDriverDetails += drivers.insuranceDetails ? '<br/>' : '';
      otherDriverDetails += drivers.insuranceDetails ?? '';
      otherDriverDetails += otherDriverDetails.length > 0 && drivers.phone ? '<br/>' : '';
      otherDriverDetails += drivers.phone ? formatPhoneNumber(drivers.phone) : '';
      otherDriverDetails += otherDriverDetails.length > 0 && drivers.email ? '<br/>' : '';
      otherDriverDetails += drivers.email ? drivers.email : '';
      otherDriverDetails +=
        otherDriverDetails.length > 0 && drivers.address && drivers.address.addressSearch ? '<br/>' : '';
      otherDriverDetails += drivers.address && drivers.address.addressSearch ? drivers.address.addressSearch : '';

      otherDriversStringArray.push(otherDriverDetails);
    });
  }
  return otherDriversStringArray;
};

export const getAllOtherDriversContactDetailsMissing = (state: ApplicationState) => {
  const claimCarState = getBaseState(state);
  const claimType = sharedSelectors.getClaimType(state);
  const otherDriversArray = claimCarState.otherDrivers;

  if (otherDriversArray) {
    return (
      otherDriversArray.filter(
        (drivers) =>
          claimType !== ClaimType.Boat &&
          !!drivers.rego === false &&
          !!drivers.make === false &&
          !!drivers.model === false &&
          !!drivers.email === false &&
          !!drivers.phone === false &&
          !!drivers.address &&
          !!drivers.address.addressSearch === false
      ).length > 0
    );
  } else {
    return true;
  }
};

export const getAllOtherDriversNamesMissing = (state: ApplicationState) => {
  const claimCarState = getBaseState(state);
  const otherDriversArray = claimCarState.otherDrivers;
  return otherDriversArray.filter((driver) => !!driver.firstName === false).length > 0;
};

export const getEventLocationOrDescription = (state: ApplicationState): string => {
  const claimCarState = getBaseState(state);
  const eventLocationAddress = claimCarState.eventLocationAddress;
  const addressDetails = eventLocationAddress.addressDetails as AddressDetailsResponse;

  if (eventLocationAddress?.addressSearch) {
    const searchAddress = eventLocationAddress.addressSearch as string;
    return searchAddress;
  } else if (addressDetails.province && addressDetails.city && addressDetails.suburb && addressDetails.streetName) {
    const provincialAddress = `${addressDetails.unitAndFloor ? addressDetails.unitAndFloor : ''}${
      addressDetails.unitAndFloor && addressDetails.streetNumber ? '/' : ' '
    }${addressDetails.streetNumber ? addressDetails.streetNumber : ''} ${
      addressDetails.streetName ? addressDetails.streetName : ''
    } ${addressDetails.suburb ? addressDetails.suburb : ''} ${addressDetails.city ? addressDetails.city : ''} ${
      addressDetails.province ? addressDetails.province : ''
    }`;
    return provincialAddress.trim();
  } else if (claimCarState.eventLocationDescription) {
    return claimCarState.eventLocationDescription;
  } else {
    return '';
  }
};

export const hasOtherDrivers = (state: ApplicationState) => {
  const otherDrivers = getOtherDrivers(state);
  return otherDrivers && otherDrivers.length > 0;
};

export const getOtherPeopleDetailsArray = (state: ApplicationState): string[] => {
  const otherPeopleClaimCarState = getBaseState(state).otherPeopleDetails;
  const otherPeopleStringArray: string[] = [];
  if (otherPeopleClaimCarState && otherPeopleClaimCarState.length > 0) {
    otherPeopleClaimCarState.map((others) => {
      otherPeopleStringArray.push(
        (others.firstName ? others.firstName + ' ' : '') +
          (others.lastName ? others.lastName : '') +
          (others.phone ? '</br>' + formatPhoneNumber(others.phone) : '') +
          (others.email ? '</br>' + others.email : '') +
          (others.address && others.address.addressSearch ? '</br>' + others.address.addressSearch : '') +
          (others.description
            ? '</br></br><strong>Why do you think they might be responsible</strong></br>' + others.description
            : '')
      );
    });
  }
  return otherPeopleStringArray;
};

export const getOtherPeopleDetailsArrayMissingDetails = (state: ApplicationState): boolean => {
  const otherPeopleClaimState = getBaseState(state).otherPeopleDetails;

  if (otherPeopleClaimState && otherPeopleClaimState.length > 0) {
    if (
      otherPeopleClaimState.filter(
        (others) =>
          (others.email === undefined || others.email === null || others.email === '') &&
          (others.phone === undefined || others.phone === '' || others.phone === null) &&
          others.address.addressSearch === ''
      ).length > 0
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

export const getAllOtherPeopleNamesMissing = (state: ApplicationState): boolean => {
  const otherPeopleClaimState = getBaseState(state).otherPeopleDetails;
  return (
    otherPeopleClaimState.filter(
      (others) =>
        (!!others.firstName === false || others.firstName === '') &&
        (!!others.lastName === false || others.lastName === '')
    ).length > 0
  );
};

export const getOtherPeopleResponsibilityDetails = (state: ApplicationState): boolean => {
  const otherPeopleClaimCarState2 = getBaseState(state).otherPeopleDetails;
  const otherPeopleStringArray2: string[] = [];
  if (otherPeopleClaimCarState2 && otherPeopleClaimCarState2.length > 0) {
    otherPeopleClaimCarState2.map((others2) => {
      otherPeopleStringArray2.push(others2.description ? others2.description : '');
    });
  }
  return !(otherPeopleStringArray2.filter((item) => item === '').length === 0);
};

export const getWitnessDetailsArray = (state: ApplicationState): string[] => {
  const witnessesClaimCarState = getBaseState(state).witnesses;
  const witnessStringArray: string[] = [];
  if (witnessesClaimCarState && witnessesClaimCarState.length > 0) {
    witnessesClaimCarState.map((witness) => {
      witnessStringArray.push(
        (witness.firstName ? witness.firstName + ' ' : '') +
          (witness.lastName ? witness.lastName : '') +
          (witness.phone ? '</br>' + formatPhoneNumber(witness.phone) : '') +
          (witness.email ? '</br>' + witness.email : '') +
          (witness.address && witness.address.addressSearch ? '</br>' + witness.address.addressSearch : '')
      );
    });
  }
  return witnessStringArray;
};

export const hasWitnessContactDetails = (state: ApplicationState) => {
  const witnessesClaimCarState = getBaseState(state).witnesses;
  return (
    witnessesClaimCarState.filter((witness) => !!witness.address.addressSearch || !!witness.email || !!witness.phone)
      .length > 0
  );
};

export const hasNoWitnessName = (state: ApplicationState) => {
  const witnessesClaimState = getBaseState(state).witnesses;
  return witnessesClaimState.filter((witness) => !!witness.firstName === false || witness.firstName === '').length > 0;
};

export const isOtherDriverQuestionSufficientyAnswered = () => {
  // state: ApplicationState, otherDriverIndex: number
  // const claimCarState = getBaseState(state);
  // const driver = claimCarState.otherDrivers[otherDriverIndex];
  // currently all fields are optional

  return true;
};

export const isOtherDriver = (state: ApplicationState) => {
  const otherDriverArray = state.myForms.carClaim.otherDrivers;
  return otherDriverArray.length > 0;
};

export const maxOtherDriversReached = () => {
  // currently no max for number of other drivers
  return false;
};

export const showPassengersInCar = (state: ApplicationState) => {
  const claimType = sharedSelectors.getClaimType(state);
  const driver = getBaseState(state).driver;

  return claimType === ClaimType.Car && driver && driver.licenceType === LicenceType.Restricted;
};

export const showSupervisorInCar = (state: ApplicationState) => {
  const driver = getBaseState(state).driver;
  const askSupervisorInCarForRestrictedConfig = t('claim:config.askSupervisorInCarForRestricted') === true;
  const claimType = sharedSelectors.getClaimType(state);

  return (
    claimType === ClaimType.Car &&
    (driver?.licenceType === LicenceType.Learners ||
      (askSupervisorInCarForRestrictedConfig &&
        driver?.licenceType === LicenceType.Restricted &&
        driver.passengersInCar))
  );
};

export const showDriverLicenceCountry = (state: ApplicationState) => {
  const askLicenceCountryConfig = t('claim:config.askLicenceCountry') === true;

  const driver = getBaseState(state).driver;
  return askLicenceCountryConfig && driver && driver.licenceType === LicenceType.International;
};

export const showDriverLicenceCountryOther = (state: ApplicationState) => {
  const driver = getBaseState(state).driver;

  return (
    showDriverLicenceCountry(state) &&
    driver &&
    driver.licenceCountry &&
    driver.licenceCountry.toLowerCase() === LicenceCountry.Other
  );
};
export const showDriverExperience = (state: ApplicationState): boolean => {
  const driver = getBaseState(state).driver;
  return driver && driver.licenceType !== LicenceType.NoLicence;
};

export const getDriver = (driverOid: string, drivers: ClaimParty[]) =>
  driverOid !== SOME_ONE_ELSE ? drivers.find((driver) => driver.oid === driverOid) : undefined;

export const getSelectedDriver = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  const driverHasFullName = driver && !!(driver.firstName && driver.lastName);
  const namedDriver = driverHasFullName
    ? `${driver.firstName ? driver.firstName + ' ' : ''}` +
      `${driver.lastName ? driver.lastName : ''}` +
      `${driver.email ? '</br>' + driver.email : ''}` +
      `${driver.phone ? '</br>' + formatPhoneNumber(driver.phone) : ''}`
    : '';

  return driver && driver.oid === 'SOME_ONE_ELSE'
    ? driverHasFullName && namedDriver.length > 0
      ? namedDriver
      : 'Someone else'
    : driverHasFullName && namedDriver.length > 0
    ? namedDriver
    : '';
};

export const getDriverFullName = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver?.firstName && driver.lastName ? `${driver.firstName} ${driver.lastName}` : '';
};

export const getDriverLastName = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver?.lastName;
};

export const getDriverDateOfBirth = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver?.dateOfBirth;
};

export const getDriverPhoneNumber = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver?.phone;
};

export const getDriverLicenceTypeLabel = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;

  if (driver && !!driver.licenceType) {
    return t(`claim/car:driverLicenceType.labels.${driver.licenceType}`);
  } else {
    return '';
  }
};

export const getDriverLicenceCountry = (state: ApplicationState): string => {
  let licenceCountry = '';

  const driver = getBaseState(state).driver;

  if (driver && !!driver.licenceCountry) {
    for (let i = 0; DRIVER_LICENCE_COUNTRY_ARRAY.length > i; i++) {
      if (DRIVER_LICENCE_COUNTRY_ARRAY[i].value === driver.licenceCountry) {
        licenceCountry = DRIVER_LICENCE_COUNTRY_ARRAY[i].label;
      }
    }
  }

  return licenceCountry;
};

export const getDriverLicenceCountryOther = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver.licenceCountryOther;
};

export const getPassengersInCar = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  if (driver.licenceType !== LicenceType.Restricted) {
    return '';
  } else if (driver.passengersInCar) {
    return 'Yes';
  } else {
    return 'No';
  }
};

export const getSupervisorInCar = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  if (
    (driver.licenceType === LicenceType.Learners && driver.supervisorInCar) ||
    (driver.licenceType === LicenceType.Restricted && driver.passengersInCar && driver.supervisorInCar)
  ) {
    return 'Yes';
  } else if (
    (driver.licenceType === LicenceType.Learners && !driver.supervisorInCar) ||
    (driver.licenceType === LicenceType.Restricted && driver.passengersInCar && !driver.supervisorInCar)
  ) {
    return 'No';
  } else {
    return '';
  }
};

export const getIsDriverAvailable = (state: ApplicationState): boolean | null => {
  const driver = getBaseState(state).driver;
  return driver?.driverAvailable;
};

export const getDriverAvailableInSummary = (state: ApplicationState): string => {
  const driver = getBaseState(state)?.driver;
  if (driver?.driverAvailable === null) {
    return '';
  } else if (driver?.driverAvailable === true) {
    return 'Yes';
  } else {
    return 'No';
  }
};

export const getDriverExperience = (state: ApplicationState): string => {
  const carClaimState = getBaseState(state);
  const driver = carClaimState.driver;
  const driverExperienceString = driver && !!driver.drivingExperience ? driver.drivingExperience : '';

  if (showDriverExperience(state) && driverExperienceString) {
    switch (driverExperienceString) {
      case ClaimsApiModels.KnownLicenceTime.LessThan1Year:
        return t('claim/car:driverExperience.labels.XpUnder1Year');
      case ClaimsApiModels.KnownLicenceTime.Between1To2Years:
        return t('claim/car:driverExperience.labels.Xp1To2Years');
      case ClaimsApiModels.KnownLicenceTime.Between2To3Years:
        return t('claim/car:driverExperience.labels.Xp2To3Years');
      case ClaimsApiModels.KnownLicenceTime.Between3To4Years:
        return t('claim/car:driverExperience.labels.Xp3To4Years');
      case ClaimsApiModels.KnownLicenceTime.MoreThan4Years:
        return t('claim/car:driverExperience.labels.Xp4OrMoreYears');
      default:
        return '';
    }
  } else {
    return '';
  }
};

export const showDriverName = (state: ApplicationState): boolean => {
  const driver = getBaseState(state).driver;
  return driver && driver.oid ? driver.oid === SOME_ONE_ELSE : false;
};

export const showDriverDateOfBirth = (state: ApplicationState): boolean => {
  const carState = getBaseState(state);
  const driver = carState?.driver;
  const parties = carState?.eisClaim?.parties;
  const currentParty = parties && driver ? parties.filter((party) => party.oid === driver.oid) : [];
  if (currentParty.length === 0) {
    return true;
  } else {
    const isCurrentParyNamedDriver = currentParty.filter((party) => {
      return (
        party.roles.includes(KnownAutoRoleType.PolicyDriver) || party.roles.includes(KnownAutoRoleType.PolicyInsured)
      );
    });
    return isCurrentParyNamedDriver.length === 0;
  }
};

export const showDriverContactDetails = (state: ApplicationState): boolean => {
  const driver = getBaseState(state).driver;
  const driverOid = driver && driver.oid ? driver.oid : false;
  const getDriverLoggedIn = getDriver(driverOid.toString(), getNamedDrivers(state));

  if (driverOid && getDriver) {
    return (
      driverOid === SOME_ONE_ELSE || (getDriverLoggedIn !== undefined ? !getDriverLoggedIn.isLoggedInCustomer : false)
    );
  }
  return false;
};

export const showDriverAlcoholDrugsMedicationDetails = (state: ApplicationState): boolean => {
  const driver = getBaseState(state).driver;
  return driver && !!driver.alcoholDrugsMedication;
};

export const getDriverAlcoholDrugsMedication = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver && checkYesNoNull(driver.alcoholDrugsMedication);
};

export const getAlcoholDrugsMedicationDetails = (state: ApplicationState): string => {
  const driver = getBaseState(state).driver;
  return driver && !!driver.alcoholDrugsMedication && showDriverAlcoholDrugsMedicationDetails(state)
    ? driver.alcoholDrugsMedicationDetails
    : '';
};

export const showMissingKeys = (state: ApplicationState): boolean => {
  const claimType = sharedSelectors.getClaimType(state);
  return (
    claimType === ClaimType.Car ||
    claimType === ClaimType.Caravan ||
    claimType === ClaimType.Motorbike ||
    claimType === ClaimType.Motorhome ||
    claimType === ClaimType.Boat
  );
};

export const showMissingKeyDetails = (state: ApplicationState): boolean => {
  const theft = getBaseState(state).theft;
  return theft && theft.isKeyMissing === KEYS_MISSING_YES;
};

export const showVehicleContentsStolenMessage = (state: ApplicationState): boolean => {
  const theft = getBaseState(state).theft;
  const claimType = sharedSelectors.getClaimType(state);
  return claimType === ClaimType.Car && theft && theft.vehicleContentsStolen === YES;
};

export const showReportToPoliceMessage = (causeOfLoss: string, secondaryCauseOfLoss: string, isReported: boolean) => {
  const array = [SCOL.BreakIn.toString(), SCOL.IntentionalDamage.toString(), SCOL.Methamphetamine.toString()];
  return isReported === false && (causeOfLoss === COL.Stolen || array.includes(secondaryCauseOfLoss));
};

export const hireCarCoverageLimitAmount = (state: ApplicationState): number => {
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const carPolicyRisk = (policyDetails && policyDetails.risk) as CarRiskPolicy;
  if (
    carPolicyRisk.coverages &&
    carPolicyRisk.coverages.vehicleRentalCarSubstituteTransportCoverage &&
    carPolicyRisk.coverages.vehicleRentalCarSubstituteTransportCoverage.limitAmount
  ) {
    return carPolicyRisk.coverages.vehicleRentalCarSubstituteTransportCoverage.limitAmount;
  } else {
    return 0;
  }
};

export const isCauseOfLossTheft = (state: ApplicationState): boolean =>
  getClaim(state) && getClaim(state).causeOfLoss === COL.Stolen;

export const getWasDoorLocked = (state: ApplicationState): string => {
  const theft = getBaseState(state).theft;
  return isCauseOfLossTheft && !!theft && !!theft.doorsLocked ? theft.doorsLocked : '';
};

export const getIsKeysMissing = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return isCauseOfLossTheft && !!theft && !!theft.isKeyMissing ? theft.isKeyMissing : '';
};

export const getMissingKeyDetails = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return isCauseOfLossTheft && !!theft && !!theft.missingKeyDetails ? theft.missingKeyDetails : '';
};

export const getIsKeysMissingString = (state: ApplicationState) => {
  const isKeyMissing = getIsKeysMissing(state);
  if (isKeyMissing) {
    switch (getBaseState(state).theft.isKeyMissing) {
      case KEYS_MISSING_YES:
        return 'Yes';
      case KEYS_MISSING_NO:
        return 'No';
      case KEYS_MISSING_UNSURE:
        return 'Unsure';
      default:
        return '';
    }
  } else {
    return '';
  }
};

export const getVehicleContentsStolen = (state: ApplicationState) => {
  const theft = getBaseState(state).theft;
  return isCauseOfLossTheft && !!theft && !!theft.vehicleContentsStolen ? theft.vehicleContentsStolen : '';
};
export const isVehicleRecovered = (state: ApplicationState): boolean =>
  getClaim(state) && getClaim(state).secondaryCauseOfLoss === SCOL.VehicleRecovered;

export const showPoliceAttendQuestions = (state: ApplicationState): boolean => {
  const claimType = sharedSelectors.getClaimType(state);
  const scol = getClaim(state) && getClaim(state).secondaryCauseOfLoss;
  return (
    claimType !== ClaimType.Boat &&
    scol &&
    (scol === SCOL.MultipleVehicles || scol === SCOL.SingleVehicle || scol === SCOL.HitByAnotherVehicle)
  );
};

export const getWasTestedForAlcoholOrDrugs = (state: ApplicationState): string => {
  const policeAttendDetails = state.myForms.carClaim.policeAttendDetails;
  return policeAttendDetails && !!policeAttendDetails.testedForAlcoholOrDrug
    ? checkYesNoUnsure(policeAttendDetails.testedForAlcoholOrDrug)
    : '';
};

export const getWasAnyoneCharged = (state: ApplicationState): string => {
  const policeAttendDetails = state.myForms.carClaim.policeAttendDetails;
  return policeAttendDetails && !!policeAttendDetails.anyoneCharged
    ? checkYesNoUnsure(policeAttendDetails.anyoneCharged)
    : '';
};

export const getPoliceReference = (state: ApplicationState): string => {
  const policeAuthorityReport = state.myForms.carClaim.authorityReportPolice;
  return policeAuthorityReport && !!policeAuthorityReport.referenceNumber ? policeAuthorityReport.referenceNumber : '';
};

export const getVehicleMakes = (state: ApplicationState): string[] => {
  const claimCarState = getBaseState(state);

  return claimCarState.vehicleMakes;
};

export const showOtherDriversQuestions = (state: ApplicationState): boolean => {
  const scol = getClaim(state) && getClaim(state).secondaryCauseOfLoss;
  return (
    scol && (scol === SCOL.MultipleVehicles || scol === SCOL.HitByAnotherVehicle || scol === SCOL.ImpactUnderwater)
  );
};

export const showYourVehicleQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  if (claim) {
    if (claim.causeOfLoss === COL.Other) {
      return false;
    } else {
      const scol = claim.secondaryCauseOfLoss;
      return scol !== SCOL.VehicleNotRecovered;
    }
  } else {
    return false;
  }
};

export const isOtherDriverInvolved = (state: ApplicationState): boolean => {
  const claimState = getClaim(state);
  return (
    claimState &&
    (claimState.secondaryCauseOfLoss === SCOL.MultipleVehicles ||
      claimState.secondaryCauseOfLoss === SCOL.ImpactUnderwater ||
      claimState.secondaryCauseOfLoss === SCOL.ImpactOutOfWater)
  );
};

export const getClaimNumber = (state: ApplicationState) => {
  return getClaim(state) && getClaim(state).claimNumber;
};

export const askCustomerWantsToClaimDamage = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  if (claim) {
    const scol = claim.secondaryCauseOfLoss;
    return (
      scol === SCOL.MultipleVehicles ||
      scol === SCOL.SingleVehicle ||
      scol === SCOL.ImpactOutOfWater ||
      scol === SCOL.ImpactUnderwater
    );
  } else {
    return false;
  }
};

export const showOtherPersonDetailsQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  const claimType = sharedSelectors.getClaimType(state);
  const col = claim.causeOfLoss;

  if (claim) {
    if (claimType === ClaimType.Boat) {
      return (
        col === COL.AccidentDamage ||
        col === COL.MaliciousDamage ||
        col === COL.MaliciousDamage ||
        col === COL.Submersion ||
        col === COL.Fire ||
        col === COL.Stolen ||
        col === COL.Other
      );
    } else {
      if (col === COL.Other) {
        return false;
      } else {
        const scol = claim.secondaryCauseOfLoss;
        return (
          scol &&
          ((col === COL.DamagedWhileParked && scol === SCOL.Other) ||
            scol === SCOL.Methamphetamine ||
            scol === SCOL.SingleVehicle ||
            scol === SCOL.IntentionalDamage)
        );
      }
    }
  } else {
    return false;
  }
};

export const showOtherPeoplePropertyQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  const claimType = sharedSelectors.getClaimType(state);

  if (claimType === ClaimType.Boat) {
    const col = claim.causeOfLoss;
    return col === COL.AccidentDamage || col === COL.Fire || col === COL.Other;
  } else {
    const scol = claim.secondaryCauseOfLoss;
    return scol === SCOL.MultipleVehicles || scol === SCOL.SingleVehicle;
  }
};

export const showYourDriverQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  const scol = claim.secondaryCauseOfLoss;
  const claimType = sharedSelectors.getClaimType(state);

  if (claimType === ClaimType.Boat) {
    return scol && scol === SCOL.ImpactUnderwater;
  } else {
    return scol && (scol === SCOL.MultipleVehicles || scol === SCOL.SingleVehicle);
  }
};

export const getYourDriver = (state: ApplicationState): boolean => {
  const driver = getBaseState(state).driver;
  return (
    driver &&
    !!(
      driver.firstName ||
      driver.lastName ||
      driver.phone ||
      driver.email ||
      driver.oid ||
      driver.licenceCountry ||
      driver.licenceType
    )
  );
};

export const showOtherVehiclesDamageQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  if (hasOtherDrivers(state) && claim) {
    const scol = claim.secondaryCauseOfLoss;
    return scol && (scol === SCOL.MultipleVehicles || scol === SCOL.HitByAnotherVehicle);
  } else {
    return false;
  }
};

export const showWitnessQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  const col = claim.causeOfLoss;
  const scol = claim.secondaryCauseOfLoss;

  return !(
    col === COL.Other ||
    scol === SCOL.Weather ||
    scol === SCOL.Earthquake ||
    scol === SCOL.Landslide ||
    scol === SCOL.Flood ||
    scol === SCOL.Tsunami ||
    scol === SCOL.VolcanicActivity ||
    scol === SCOL.Storm ||
    (col === COL.Contamination && scol === SCOL.Other)
  );
};

export const showAuthorityReportQuestions = (state: ApplicationState): boolean => {
  const claimType = sharedSelectors.getClaimType(state);
  const claim = getClaim(state);
  const col = claim.causeOfLoss;
  const scol = claim.secondaryCauseOfLoss;

  // don't show if police attend is selected
  return (
    claimType !== ClaimType.Boat &&
    !(
      policeAttended(state) ||
      scol === SCOL.Weather ||
      scol === SCOL.Earthquake ||
      scol === SCOL.Landslide ||
      scol === SCOL.Flood ||
      scol === SCOL.Tsunami ||
      scol === SCOL.VolcanicActivity ||
      scol === SCOL.Storm ||
      (col === COL.Contamination && scol === SCOL.Other)
    )
  );
};

export const showFireAuthorityReport = (state: ApplicationState): boolean => {
  const claimType = sharedSelectors.getClaimType(state);
  const claim = getClaim(state);
  const col = claim.causeOfLoss;
  const scol = claim.secondaryCauseOfLoss;
  return (
    claimType !== ClaimType.Boat &&
    scol &&
    (scol === SCOL.Fire ||
      scol === SCOL.Arson ||
      scol === SCOL.AccidentalFire ||
      scol === SCOL.ElectricalFire ||
      (col === COL.Fire && scol === SCOL.Other))
  );
};

export const showOtherPeoplePropertyVehicleOption = (state: ApplicationState): boolean => {
  return getClaim(state) && getClaim(state).causeOfLoss === COL.Other;
};

export const showHailRepairer = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  return claim?.secondaryCauseOfLoss === SCOL.HailStorm;
};

export const hideRepairerQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  const claimType = sharedSelectors.getClaimType(state);
  if (claim) {
    const scol = claim.secondaryCauseOfLoss;
    return (
      claimType === ClaimType.Caravan ||
      claimType === ClaimType.Trailer ||
      claimType === ClaimType.Motorbike ||
      claimType === ClaimType.Motorhome ||
      claimType === ClaimType.Boat ||
      (claimType === ClaimType.Car &&
        (claim.causeOfLoss === COL.Contamination ||
          (scol && (scol === SCOL.Fire || scol === SCOL.VehicleNotRecovered || scol === SCOL.HailStorm)) ||
          claim.causeOfLoss === COL.Other))
    );
  } else {
    return false;
  }
};

export const hideCarDamageQuestions = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  if (claim) {
    const scol = claim.secondaryCauseOfLoss;
    return (
      claim.causeOfLoss === COL.Contamination || (scol && (scol === SCOL.Fire || scol === SCOL.VehicleNotRecovered))
    );
  } else {
    return false;
  }
};

export const showHireCarBenefitStolenConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const packageProperty = policyDetails.package;

  return (
    (packageProperty === KnownMotorPackage.ComprehensiveAgreedValue ||
      packageProperty === KnownMotorPackage.ComprehensiveMarketValue ||
      packageProperty === KnownMotorPackage.ThirdPartyFireTheft) &&
    eisClaim &&
    eisClaim.causeOfLoss === COL.Stolen &&
    eisClaim.secondaryCauseOfLoss === SCOL.VehicleNotRecovered
  );
};

export const showExcessDWPOrAWDConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);

  return (
    (eisClaim.causeOfLoss === COL.DamagedWhileParked && eisClaim.secondaryCauseOfLoss === SCOL.HitByAnotherVehicle) ||
    (eisClaim.causeOfLoss === COL.AccidentWhileDriving && eisClaim.secondaryCauseOfLoss === SCOL.MultipleVehicles)
  );
};

export const showExcessConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);

  return !(
    (eisClaim.causeOfLoss === COL.DamagedWhileParked && eisClaim.secondaryCauseOfLoss === SCOL.HitByAnotherVehicle) ||
    (eisClaim.causeOfLoss === COL.AccidentWhileDriving && eisClaim.secondaryCauseOfLoss === SCOL.MultipleVehicles) ||
    (eisClaim.causeOfLoss === COL.Stolen && eisClaim.secondaryCauseOfLoss === SCOL.VehicleNotRecovered)
  );
};

export const showRepairerSelectedDrivableConfirmationText = (state: ApplicationState): boolean => {
  const carClaimState = getBaseState(state);
  const carDamageDetails = carClaimState.carDamageDetails;
  const selectedRepairerId = getSelectedRepairerId(state);
  const hideVehicleDrivable = hideVehicleDrivableQuestion(state);
  const showYourVehicle = showYourVehicleQuestions(state);

  return (
    selectedRepairerId !== null &&
    showYourVehicle &&
    (hideVehicleDrivable ||
      (!hideVehicleDrivable && carDamageDetails.liabilityOnly === false && carDamageDetails.drivable === YES))
  );
};

export const showRepairerSelectedNotDrivableConfirmationText = (state: ApplicationState): boolean => {
  const carClaimState = getBaseState(state);
  const carDamageDetails = carClaimState.carDamageDetails;
  const selectedRepairerId = getSelectedRepairerId(state);
  const hideVehicleDrivable = hideVehicleDrivableQuestion(state);
  const showYourVehicle = showYourVehicleQuestions(state);

  return (
    selectedRepairerId !== null &&
    showYourVehicle &&
    !hideVehicleDrivable &&
    (carDamageDetails.drivable === NO || carDamageDetails.drivable === UNSURE)
  );
};

export const showRepairerNotSelectedDrivableConfirmationText = (state: ApplicationState): boolean => {
  const carClaimState = getBaseState(state);
  const carDamageDetails = carClaimState.carDamageDetails;
  const selectedRepairerId = getSelectedRepairerId(state);
  const hideVehicleDrivable = hideVehicleDrivableQuestion(state);
  const showYourVehicle = showYourVehicleQuestions(state);

  return (
    selectedRepairerId === null &&
    showYourVehicle &&
    (hideVehicleDrivable ||
      (!hideVehicleDrivable && carDamageDetails.liabilityOnly === false && carDamageDetails.drivable === YES))
  );
};

export const showRepairerNotSelectedNotDrivableConfirmationText = (state: ApplicationState): boolean => {
  const carClaimState = getBaseState(state);
  const carDamageDetails = carClaimState.carDamageDetails;
  const selectedRepairerId = getSelectedRepairerId(state);
  const hideVehicleDrivable = hideVehicleDrivableQuestion(state);
  const showYourVehicle = showYourVehicleQuestions(state);

  return (
    selectedRepairerId === null &&
    showYourVehicle &&
    !hideVehicleDrivable &&
    (carDamageDetails.drivable === NO || carDamageDetails.drivable === UNSURE)
  );
};

export const showHireVehicleStolenConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const packageProperty = policyDetails.package;

  return (
    (packageProperty === KnownMotorPackage.ComprehensiveAgreedValue ||
      packageProperty === KnownMotorPackage.ComprehensiveMarketValue ||
      packageProperty === KnownMotorPackage.ThirdPartyFireTheft) &&
    eisClaim &&
    eisClaim.causeOfLoss === COL.Stolen &&
    eisClaim.secondaryCauseOfLoss === SCOL.VehicleNotRecovered
  );
};

export const showHireVehicleNotDrivableConfirmationText = (state: ApplicationState): boolean => {
  const carClaimState = getBaseState(state);
  const carDamageDetails = carClaimState.carDamageDetails;
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const packageProperty = policyDetails.package;
  const hideVehicleDrivable = hideVehicleDrivableQuestion(state);
  const showYourVehicle = showYourVehicleQuestions(state);

  return (
    (packageProperty === KnownMotorPackage.ComprehensiveAgreedValue ||
      packageProperty === KnownMotorPackage.ComprehensiveMarketValue ||
      packageProperty === KnownMotorPackage.ThirdPartyFireTheft) &&
    showYourVehicle &&
    !hideVehicleDrivable &&
    (carDamageDetails.drivable === NO || carDamageDetails.drivable === UNSURE)
  );
};

export const showDriverDetailsConfirmationText = (state: ApplicationState): boolean => {
  const drivers = getNamedDrivers(state);
  const carClaimState = getBaseState(state);
  const driverDetails = carClaimState.driver;
  const driverOid = driverDetails && driverDetails.oid;

  return driverOid && !isDriverLoggedInCustomer(state, drivers);
};

export const showOtherPartyConfirmationText = (state: ApplicationState): boolean => {
  const carClaimState = getBaseState(state);

  return carClaimState.otherDrivers.length > 0 || carClaimState.otherPeopleDetails.length > 0;
};

export const showNotReportedToPoliceConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const causeOfLoss = eisClaim.causeOfLoss;
  const secondaryCauseOfLoss = eisClaim.secondaryCauseOfLoss;

  return (
    (causeOfLoss === COL.DamagedWhileParked && secondaryCauseOfLoss === SCOL.BreakIn) ||
    (causeOfLoss === COL.DamagedWhileParked && secondaryCauseOfLoss === SCOL.IntentionalDamage) ||
    causeOfLoss === COL.Stolen ||
    (causeOfLoss === COL.Contamination && secondaryCauseOfLoss === SCOL.Methamphetamine)
  );
};

export const showSettlementMarketValueConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const causeOfLoss = eisClaim.causeOfLoss;
  const secondaryCauseOfLoss = eisClaim.secondaryCauseOfLoss;
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const packageProperty = policyDetails.package;

  return (
    causeOfLoss === COL.Stolen &&
    secondaryCauseOfLoss === SCOL.VehicleNotRecovered &&
    packageProperty === KnownMotorPackage.ComprehensiveMarketValue
  );
};

export const showSettlementAgreedValueConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const causeOfLoss = eisClaim.causeOfLoss;
  const secondaryCauseOfLoss = eisClaim.secondaryCauseOfLoss;
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const packageProperty = policyDetails.package;

  return (
    causeOfLoss === COL.Stolen &&
    secondaryCauseOfLoss === SCOL.VehicleNotRecovered &&
    packageProperty === KnownMotorPackage.ComprehensiveAgreedValue
  );
};

export const showStolenVehicleConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const causeOfLoss = eisClaim.causeOfLoss;
  const secondaryCauseOfLoss = eisClaim.secondaryCauseOfLoss;

  return causeOfLoss === COL.Stolen && secondaryCauseOfLoss === SCOL.VehicleNotRecovered;
};

export const showPoliceFollowUpConfirmationText = (state: ApplicationState): boolean => {
  const eisClaim = getClaim(state);
  const causeOfLoss = eisClaim.causeOfLoss;
  const secondaryCauseOfLoss = eisClaim.secondaryCauseOfLoss;

  return causeOfLoss === COL.Stolen && secondaryCauseOfLoss === SCOL.VehicleNotRecovered;
};

export const showHireCarBenefitNotDrivableConfirmationText = (state: ApplicationState): boolean => {
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  const policyDetails = sharedClaimState.policyDetails;
  const packageProperty = policyDetails.package;
  const carClaimState = getBaseState(state);
  const carDamageDetails = carClaimState.carDamageDetails;
  const hideVehicleDrivable = hideVehicleDrivableQuestion(state);
  return (
    (packageProperty === KnownMotorPackage.ComprehensiveAgreedValue ||
      packageProperty === KnownMotorPackage.ComprehensiveMarketValue ||
      packageProperty === KnownMotorPackage.ThirdPartyFireTheft) &&
    !hideVehicleDrivable &&
    (carDamageDetails.drivable === NO || carDamageDetails.drivable === UNSURE)
  );
};

export const getCarDamageSelections = (state: ApplicationState): AutoDamageArea[] => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  const sharedClaimState = sharedSelectors.getClaimSharedState(state);
  return carDamageDetails && !!carDamageDetails.carDamage
    ? mapAutoDamageAreaUiToApi(carDamageDetails.carDamage, sharedClaimState.car.causeOfLoss)
    : [];
};

export const getAirBagsDeployedSelection = (state: ApplicationState) => {
  return getBaseState(state).carDamageDetails.airbagDeployed;
};

export const getVehicleDamageDescription = (state: ApplicationState): string => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.damageDescription ? carDamageDetails.damageDescription : '';
};

export const hideVehicleDrivableQuestion = (state: ApplicationState): boolean => {
  const claimType = sharedSelectors.getClaimType(state);
  if (claimType === ClaimType.Boat) {
    return true;
  }

  const claim = getClaim(state);
  if (claim) {
    const scol = claim.secondaryCauseOfLoss;
    return (
      (claim.causeOfLoss === COL.Contamination && scol && scol === SCOL.Other) ||
      (scol && (scol === SCOL.VehicleNotRecovered || scol === SCOL.Methamphetamine)) ||
      claim.causeOfLoss === COL.Other
    );
  } else {
    return false;
  }
};

export const getIsDamageToClaimValue = (state: ApplicationState) => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  let isDamageToClaimValue = '';
  if (carDamageDetails?.liabilityOnly === false) {
    isDamageToClaimValue = 'Yes';
  } else if (carDamageDetails?.liabilityOnly === true) {
    isDamageToClaimValue = 'No';
  }
  return isDamageToClaimValue;
};

export const isDamageToClaim = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  const carDamageDetails = getBaseState(state).carDamageDetails;
  const claimSharedState = sharedSelectors.getClaimSharedState(state);
  const sharedCarDamage = claimSharedState.car.damage;
  return (
    carDamageDetails?.liabilityOnly === false ||
    claim.causeOfLoss === COL.DamagedWhileParked ||
    claim.causeOfLoss === COL.NaturalDisaster ||
    sharedCarDamage === CAUSE_OF_LOSS_NATURAL_DISASTER ||
    claimSharedState.claimType === ClaimType.Boat
  );
};

export const isDamageClaimableCauseOfLoss = (state: ApplicationState): boolean => {
  const claim = getClaim(state);
  return (
    claim.causeOfLoss === COL.AccidentWhileDriving ||
    claim.causeOfLoss === COL.DamagedWhileParked ||
    claim.causeOfLoss === COL.NaturalDisaster ||
    claim.causeOfLoss === COL.Other ||
    claim.causeOfLoss === COL.AccidentDamage ||
    claim.causeOfLoss === COL.MaliciousDamage ||
    claim.causeOfLoss === COL.Submersion ||
    claim.causeOfLoss === COL.RepairerNegligence ||
    claim.causeOfLoss === COL.WeatherEvent ||
    claim.causeOfLoss === COL.Fire
  );
};

export const carDamage = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !isEmptyObj(carDamageDetails.carDamage) && !!carDamageDetails.carDamage;
};

export const hasWitness = (state: ApplicationState): boolean => getWitnesses(state) && getWitnesses(state).length > 0;

export const getWitnesses = (state: ApplicationState) => getBaseState(state).witnesses;

export const getWitnessCount = (state: ApplicationState) => getWitnesses(state) && getWitnesses(state).length;

export const getOtherPropertyDamages = (state: ApplicationState) => getBaseState(state).otherPropertyDamages;

export const getOtherPropertyDamage = (state: ApplicationState, index: number) =>
  getOtherPropertyDamages(state) && getOtherPropertyDamages(state)[index];

export const isPropertyDamagedBusiness = (state: ApplicationState, index: number) =>
  getOtherPropertyDamages(state) && getOtherPropertyDamages(state)[index].propertyType === DAMAGE_PROPERTY_TYPE_OTH;

export const isPropertyDamagedSubTypeVehicle = (state: ApplicationState, index: number) =>
  getOtherPropertyDamages(state) &&
  getOtherPropertyDamages(state)[index] &&
  getOtherPropertyDamages(state)[index].damageSubType === DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE;

export const knowDamagedPropertyOwner = (state: ApplicationState, index: number) => {
  const otherPropertyDamages = getOtherPropertyDamages(state);
  return otherPropertyDamages && otherPropertyDamages[index] && otherPropertyDamages[index].knowPropertyOwner === true;
};

export const getKnowDamagedPropertyOwnerString = (state: ApplicationState, index: number) => {
  const propertyDamage = getOtherPropertyDamages(state);
  if (propertyDamage && propertyDamage.length > 0) {
    switch (propertyDamage[index].knowPropertyOwner) {
      case true:
        return 'Yes';
      case false:
        return 'No';
      default:
        return '';
    }
  } else {
    return '';
  }
};

export const hasVehicleDamageDetails = (state: ApplicationState, index: number): boolean => {
  const otherPropertyDamages = getOtherPropertyDamages(state);
  return otherPropertyDamages && otherPropertyDamages[index] && !!otherPropertyDamages[index].hasDriverDetails;
};

export const getDamageVehicleModels = (state: ApplicationState, index: number) => {
  const otherPropertyDamages = getOtherPropertyDamages(state);
  return (
    otherPropertyDamages &&
    otherPropertyDamages[index] &&
    otherPropertyDamages[index].driverDetails &&
    otherPropertyDamages[index].driverDetails.models
  );
};

export const hasOtherPropertyDamages = (state: ApplicationState): boolean =>
  getOtherPropertyDamages(state) && getOtherPropertyDamages(state).length > 0;

export const getOtherPropertyDamageCount = (state: ApplicationState) =>
  getOtherPropertyDamages(state) && getOtherPropertyDamages(state).length;

export const getOtherPeopleDetails = (state: ApplicationState) => getBaseState(state).otherPeopleDetails;

export const hasOtherPeopleDetails = (state: ApplicationState): boolean =>
  getOtherPeopleDetails(state) && getOtherPeopleDetails(state).length > 0;

export const getOtherPeopleDetailsCount = (state: ApplicationState) =>
  getOtherPeopleDetails(state) && getOtherPeopleDetails(state).length;

export const drivableUnsure = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && carDamageDetails.drivable === UNSURE;
};

export const getIsVehicleDrivable = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && carDamageDetails.drivable === NO;
};

export const getIsVehicleDrivableAsText = (state: ApplicationState): string => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.drivable ? carDamageDetails.drivable : '';
};

export const askVehicleLocation = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  const causeOfLoss = getClaim(state).causeOfLoss;
  const secondaryCauseOfLoss = getClaim(state).secondaryCauseOfLoss;
  return (
    carDamageDetails &&
    (carDamageDetails.drivable === NO ||
      carDamageDetails.drivable === UNSURE ||
      causeOfLoss === COL.Contamination ||
      (carDamageDetails.drivable === YES && secondaryCauseOfLoss === KnownSecondaryCauseOfLoss.VehicleRecovered))
  );
};

export const getVehicleLocation = (state: ApplicationState): string => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.vehicleLocation ? carDamageDetails.vehicleLocation : '';
};

export const isContamination = (state: ApplicationState): boolean => {
  return getClaim(state) && getClaim(state).causeOfLoss === COL.Contamination;
};

export const askTypeOfBusiness = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  const claimType = sharedSelectors.getClaimType(state);
  return claimType !== ClaimType.Boat && carDamageDetails && !!carDamageDetails.usedCommercially;
};

export const defaultUsedCommerciallyAsTrue = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return (
    carDamageDetails &&
    (carDamageDetails.usedCommercially === null || carDamageDetails.usedCommercially === undefined) &&
    sharedSelectors.isCommercialMotorPolicy(state)
  );
};

export const getIsUsedCommercially = (state: ApplicationState): any => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails &&
    (carDamageDetails.usedCommercially !== null || carDamageDetails.usedCommercially !== undefined)
    ? carDamageDetails.usedCommercially
    : '';
};

export const getCommercialUse = (state: ApplicationState): string => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.typeOfBusiness ? carDamageDetails.typeOfBusiness : '';
};

export const getPoliceAttendDetails = (state: ApplicationState) => {
  const policeAttendDetails = getBaseState(state).policeAttendDetails;
  return policeAttendDetails ? policeAttendDetails : null;
};

export const getFireServiceAttend = (state: ApplicationState) => {
  const authorityReportFire = getBaseState(state).authorityReportFire;
  return authorityReportFire && !!authorityReportFire.isReported ? authorityReportFire.isReported : null;
};

export const policeAttended = (state: ApplicationState): boolean => {
  const policeAttendDetails = getBaseState(state).policeAttendDetails;

  return policeAttendDetails.policeAttended;
};

export const hasBeenReportedToPolice = (state: ApplicationState): boolean => {
  const authorityReportPolice = getBaseState(state).authorityReportPolice;
  return authorityReportPolice && !!authorityReportPolice.isReported;
};

export const isAnyOneCharged = (state: ApplicationState) =>
  getPoliceAttendDetails(state) && getPoliceAttendDetails(state).anyoneCharged === YES;

export const getRepairerRegion = (state: ApplicationState): string => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.repairerRegion ? carDamageDetails.repairerRegion : '';
};

export const hasRepairerRegionSelected = (state: ApplicationState): boolean => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.repairerRegion;
};

export const getRepairers = (state: ApplicationState) => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && !!carDamageDetails.repairers ? carDamageDetails.repairers : [];
};
export const getRepairersAllOrSelected = (state: ApplicationState) => {
  const { repairers = [], selectedRepairer } = getBaseState(state).carDamageDetails;
  const defaultRepairers = repairers.length === 0 ? [selectedRepairer] : repairers;
  return defaultRepairers;
};

export const hasRepairers = (state: ApplicationState): boolean => getRepairers(state) && getRepairers(state).length > 0;

export const getSelectedRepairerId = (state: ApplicationState): string => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  if (carDamageDetails) {
    return carDamageDetails.selectedRepairerId;
  } else {
    return null;
  }
};

export const getSelectedRepairer = (state: ApplicationState) => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails && carDamageDetails.selectedRepairer;
};

export const getOwnSelectedRepairer = (state: ApplicationState) => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails?.isOwnRepairerSelected;
};

export const getFindAnotherLinkVisible = (state: ApplicationState) => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails?.isFindAnotherRepairerLinkVisible;
};

export const getOwnRepairerSectionVisible = (state: ApplicationState) => {
  const carDamageDetails = getBaseState(state).carDamageDetails;
  return carDamageDetails?.isOwnRepairerSectionVisible;
};

export const getSelectedRepairerSingleLineAddress = (state: ApplicationState): string => {
  const repairer = getSelectedRepairer(state);
  return repairer
    ? (repairer.address.addressLine1 ? repairer.address.addressLine1 : '') +
        (repairer.address.addressLine2 ? ', ' + repairer.address.addressLine2 : '') +
        (repairer.address.addressLine3 ? ', ' + repairer.address.addressLine3 : '') +
        (repairer.address.suburb ? ', ' + repairer.address.suburb : '') +
        (repairer.address.city ? ', ' + repairer.address.city : '')
    : '';
};

export const getSelectedRepairerNameAndAddress = (state: ApplicationState): string => {
  const repairer = getSelectedRepairer(state);

  return repairer ? repairer.name + '</br>' + getSelectedRepairerSingleLineAddress(state) : '';
};

export const getEventDescriptionLabel = (state: ApplicationState): string => {
  if (getBaseState(state).eisClaim) {
    const col = getBaseState(state).eisClaim.causeOfLoss;
    const scol = getBaseState(state).eisClaim.secondaryCauseOfLoss;

    switch (col) {
      case COL.AccidentWhileDriving:
        return 'accident';
      case COL.DamagedWhileParked:
        if (scol === SCOL.Weather) {
          return 'naturalDisaster';
        } else if (scol === SCOL.Fire) {
          return 'fire';
        } else {
          return 'damaged';
        }
      case COL.NaturalDisaster:
        return 'naturalDisaster';
      case COL.Contamination:
        if (scol === SCOL.Methamphetamine) {
          return 'contaminationMeth';
        } else {
          return 'contaminationOther';
        }
      case COL.Stolen:
        if (scol === SCOL.VehicleRecovered) {
          return 'stolenRecovered';
        } else {
          return 'stolenNotRecovered';
        }
      default:
        return 'other';
    }
  } else {
    return 'other';
  }
};

export const getEventLocationLabel = (state: ApplicationState): string => {
  if (getBaseState(state).eisClaim) {
    const col = getBaseState(state).eisClaim.causeOfLoss;
    const scol = getBaseState(state).eisClaim.secondaryCauseOfLoss;

    switch (col) {
      case COL.AccidentWhileDriving:
        return 'accidentWhileDriving';
      case COL.DamagedWhileParked:
        if (scol === SCOL.HitByAnotherVehicle) {
          return 'hitByAnotherVehicle';
        } else {
          return 'damaged';
        }
      case COL.NaturalDisaster:
        return 'damaged';
      case COL.Stolen:
        return 'stolen';
      case COL.Contamination:
        return 'contamination';
      default:
        break;
    }
  }
  return 'other';
};

export const getEventLocationHeaderLabel = (state: ApplicationState): string => {
  const eisClaim = getBaseState(state).eisClaim;

  if (
    eisClaim.causeOfLoss === COL.AccidentWhileDriving ||
    eisClaim.causeOfLoss === COL.AccidentDamage ||
    (eisClaim.causeOfLoss === COL.DamagedWhileParked && eisClaim.secondaryCauseOfLoss === SCOL.HitByAnotherVehicle)
  ) {
    return 'accidentInformation';
  } else {
    return 'incidentInformation';
  }
};

export const isDriverEmailCorrect = (state: ApplicationState) => {
  const driverEmailFormState = state.myForms.forms.carClaim.driver.email as FieldState;

  return driverEmailFormState.valid;
};
export const isWitnessEmailValid = (state: ApplicationState) => {
  const witnessFormState = Object.values(state.myForms.forms.carClaim.witnesses);
  witnessFormState.pop();

  return witnessFormState.every((contact: ContactDetails) => {
    const witnessEmail = contact.email as FieldState;
    return witnessEmail.valid;
  });
};

export const isOtherPeopleDetailsEmailValid = (state: ApplicationState) => {
  const otherPeopleDetailsFormState = Object.values(state.myForms.forms.carClaim.otherPeopleDetails);
  otherPeopleDetailsFormState.pop();

  return otherPeopleDetailsFormState.every((contact: ContactDetails) => {
    const otherPeopleDetailsEmail = contact.email as FieldState;
    return otherPeopleDetailsEmail.valid;
  });
};

export const isOtherPeoplePropertyEmailValid = (state: ApplicationState) => {
  const otherPeoplePropertyFormState = Object.values(state.myForms.forms.carClaim.otherPropertyDamages);
  otherPeoplePropertyFormState.pop();

  return otherPeoplePropertyFormState.every((contact: ContactDetails) => {
    const otherPeoplePropertyEmail = contact.email as FieldState;
    return otherPeoplePropertyEmail.valid;
  });
};

export const areThirdPartiesInvolved = (state: ApplicationState) => {
  const carState = getBaseState(state);
  const areOtherDrivers = carState.otherDrivers && carState.otherDrivers.length > 0;
  const areWitnesses = carState.witnesses && carState.witnesses.length > 0;
  const areOtherPeople = carState.otherPeopleDetails && carState.otherPeopleDetails.length > 0;
  const areOtherPropertyDamages = carState.otherPropertyDamages && carState.otherPropertyDamages.length > 0;

  return areOtherDrivers || areWitnesses || areOtherPeople || areOtherPropertyDamages;
};

export const showClaimDamageQuestions = (state: ApplicationState) => {
  const claim = getClaim(state);
  const thirdPartyOnly = sharedSelectors.isThirdPartyPackage(state);
  const thirdPartyFireAndTheft = sharedSelectors.isThirdPartyFireTheftPackage(state);
  const policyDetails = sharedSelectors.getPolicyDetails(state);
  const carPolicyRisk = (policyDetails && policyDetails.risk) as CarRiskPolicy;

  const vehicleUninsured3rdPartyAccidentsCoverage = carPolicyRisk.coverages.vehicleUninsured3RdPartyAccidentsCoverage;

  const scol = claim.secondaryCauseOfLoss;
  const col = claim?.causeOfLoss;

  if (claim) {
    if (thirdPartyOnly && !vehicleUninsured3rdPartyAccidentsCoverage) {
      return false;
    } else if (thirdPartyFireAndTheft && !vehicleUninsured3rdPartyAccidentsCoverage) {
      switch (col) {
        case COL.AccidentWhileDriving:
          return false;

        case COL.DamagedWhileParked:
          if (scol === SCOL.HitByAnotherVehicle || scol === SCOL.BreakIn || scol === SCOL.IntentionalDamage) {
            return false;
          } else {
            return true;
          }

        default:
          return true;
      }
    } else {
      return true;
    }
  }
};
