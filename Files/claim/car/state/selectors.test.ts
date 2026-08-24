import type { FieldState } from 'react-redux-form';
import { actions as formActions } from 'react-redux-form';
import {
  KnownServiceArea as Area,
  KnownCauseOfLoss as COL,
  KnownCauseOfLoss,
  KnownLicenceCountry as LicenceCountry,
  KnownSecondaryCauseOfLoss as SCOL
} from '~/common/state/autorest/Claims/src/models/index';
import { KnownMotorTypeOfPolicy } from '~/common/state/autorest/Policy/src/models';
import {
  DAMAGE_PROPERTY_TYPE_IND,
  DAMAGE_PROPERTY_TYPE_OTH,
  DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS,
  DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE,
  emptyContactDetailsModel,
  getDefaultOtherDriverState,
  getDefaultOtherPropertyState,
  getDefaultPoliceAttendState,
  KEYS_MISSING_NO,
  KEYS_MISSING_YES,
  modelPath,
  NO,
  SOME_ONE_ELSE,
  UNSURE,
  YES
} from '~/feature/claim/car/state/constants';
import {
  testClaimCarState,
  testClaimState,
  testCustomerState,
  testNamedDrivers,
  testOtherDrivers,
  testRepairers
} from '~/feature/claim/shared/state/claimTestData';
import * as i18next from '~/root/i18n';
import * as selectors from './selectors';

import { KnownBrandType, KnownMotorPackage } from '~/common/state/autorest/PolicyAuth/src';
import { renderNothing } from '~/common/test-utilities/renderComponent';
import * as localeUtils from '~/common/utilities/localeUtils';
import type { ApplicationState } from '~/root/rootReducer';
import { CAUSE_OF_LOSS_NATURAL_DISASTER, ClaimType } from '../../shared/state';

const mockRules = {
  nz: {
    dialingCode: '0064',
    minLength: 8,
    maxLength: 10
  },
  fj: {
    dialingCode: '00679',
    minLength: 5,
    maxLength: 8
  },
  vu: {
    dialingCode: '00678',
    minLength: 5,
    maxLength: 7
  },
  other: {
    dialingCode: '',
    minLength: 7,
    maxLength: 20
  }
};
const mockTestRepairers = [
  {
    id: 123,
    name: 'Dummy 1',
    address: {
      addressLine1: 'address line one',
      addressLine2: 'address line two',
      addressLine3: 'address line three',
      suburb: 'test suburb 1',
      city: 'auckland'
    }
  }
];

describe('Car Claim Selectors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return CauseOfLoss when getClaimCauseOfLoss is called', () => {
    const causeOfLoss = selectors.getClaimCauseOfLoss({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: testClaimCarState
      }
    } as any);
    expect(causeOfLoss).toBe(COL.Stolen);
  });

  it('should return SecondaryCauseOfLoss when getClaimSecondaryCauseOfLoss is called', () => {
    const secondaryCauseOfLoss = selectors.getClaimSecondaryCauseOfLoss({
      myForms: {
        carClaim: testClaimCarState
      }
    } as any);
    expect(secondaryCauseOfLoss).toBe(SCOL.VehicleRecovered);
  });

  it('should select named driver when party has driver and who is also a logged in user', () => {
    const namedDrivers = selectors.getNamedDrivers({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: testClaimCarState
      }
    } as any);
    expect(namedDrivers.length).toBe(4);
    expect(namedDrivers[0].firstName).toBe('John');
    expect(namedDrivers[0].lastName).toBe('Smith');
    expect(namedDrivers[0].email).toBe('test@def.com');
    expect(namedDrivers[0].phone).toBe('123456780');
    expect(namedDrivers[0].isLoggedInCustomer).toBe(true);
  });

  it('should select named driver with email or phone indicator as false ', () => {
    const namedDrivers = selectors.getNamedDrivers({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: {
          ...testClaimCarState,
          eisClaim: {
            ...testClaimCarState.eisClaim,
            parties: [{ ...testClaimCarState.eisClaim.parties[1], email: null, phoneNumbers: [] }]
          }
        }
      }
    } as any);

    expect(namedDrivers.length).toBe(1);
    expect(namedDrivers[0].email).toBeFalsy();
    expect(namedDrivers[0].phone).toBeFalsy();
    expect(namedDrivers[0].isLoggedInCustomer).toBe(false);
  });

  it('should select named driver with phone indicator as false ', () => {
    const namedDrivers = selectors.getNamedDrivers({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: {
          ...testClaimCarState,
          eisClaim: {
            ...testClaimCarState.eisClaim,
            parties: [{ ...testClaimCarState.eisClaim.parties[1], phoneNumbers: [] }]
          }
        }
      }
    } as any);
    expect(namedDrivers.length).toBe(1);
    expect(namedDrivers[0].email).toBe('test@def.com');
    expect(namedDrivers[0].phone).toBeFalsy();
    expect(namedDrivers[0].isLoggedInCustomer).toBe(true);
  });

  it('should select named driver with email indicator as false ', () => {
    const namedDrivers = selectors.getNamedDrivers({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: {
          ...testClaimCarState,
          eisClaim: {
            ...testClaimCarState.eisClaim,
            parties: [{ ...testClaimCarState.eisClaim.parties[1], email: null }]
          }
        }
      }
    } as any);
    expect(namedDrivers.length).toBe(1);
    expect(namedDrivers[0].email).toBeFalsy();
    expect(namedDrivers[0].phone).toBe('123456780');
    expect(namedDrivers[0].isLoggedInCustomer).toBe(false);
  });

  it('should sort named driver as to be displayed first', () => {
    const namedDrivers = selectors.getNamedDrivers({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: testClaimCarState
      }
    } as any);
    expect(namedDrivers.length).toBe(4);
    expect(namedDrivers[0].isLoggedInCustomer).toBe(true);
    expect(namedDrivers[1].isLoggedInCustomer).toBe(false);
    expect(namedDrivers[2].isLoggedInCustomer).toBe(false);
  });

  it('should have showDriverName as false without driver selection', () => {
    const { store } = renderNothing();
    const showDriverName = selectors.showDriverName(store.getState());
    expect(showDriverName).toBe(false);
  });

  it('should have showDriverName as true with driver as someone else', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, SOME_ONE_ELSE));
    const showDriverName = selectors.showDriverName(store.getState());
    expect(showDriverName).toBe(true);
  });

  it('should have showDriverName as false with valid driver', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, testNamedDrivers[0].oid));
    const showDriverName = selectors.showDriverName(store.getState());
    expect(showDriverName).toBe(false);
  });

  it('should show driver date of birth if there is no oid', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, ''));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.parties`, testClaimCarState.eisClaim.parties));
    const showDriverDob = selectors.showDriverDateOfBirth(store.getState());
    expect(showDriverDob).toBe(true);
  });
  it('should show driver date of birth if there is no selected driver', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver`, null));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.parties`, testClaimCarState.eisClaim.parties));
    const showDriverDob = selectors.showDriverDateOfBirth(store.getState());
    expect(showDriverDob).toBe(true);
  });

  it('should show driver date of birth if driver is not policy driver or policy insured', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, testClaimCarState.eisClaim.parties[3].oid));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.parties`, testClaimCarState.eisClaim.parties));
    store.dispatch(
      formActions.change(`${modelPath}.eisClaim.parties.roles`, testClaimCarState.eisClaim.parties[3].roles)
    );
    const showDriverDob = selectors.showDriverDateOfBirth(store.getState());
    expect(showDriverDob).toBe(true);
  });

  it('should not show driver date of birth if driver is policy driver', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, testClaimCarState.eisClaim.parties[1].oid));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.parties`, testClaimCarState.eisClaim.parties));
    store.dispatch(
      formActions.change(`${modelPath}.eisClaim.parties.roles`, testClaimCarState.eisClaim.parties[1].roles)
    );
    const showDriverDob = selectors.showDriverDateOfBirth(store.getState());
    expect(showDriverDob).toBe(false);
  });

  it('should not show driver date of birth if driver is policy insured', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, testClaimCarState.eisClaim.parties[0].oid));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.parties`, testClaimCarState.eisClaim.parties));
    store.dispatch(
      formActions.change(`${modelPath}.eisClaim.parties.roles`, testClaimCarState.eisClaim.parties[0].roles)
    );
    const showDriverDob = selectors.showDriverDateOfBirth(store.getState());
    expect(showDriverDob).toBe(false);
  });

  it('should have showDriverContactDetails as false without driver selection', () => {
    const showDriverName = selectors.showDriverContactDetails({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: {
          ...testClaimCarState,
          driver: {}
        }
      }
    } as any);
    expect(showDriverName).toBe(false);
  });

  it('should have showDriverContactDetails as false with driver logged in customer', () => {
    const showDriverName = selectors.showDriverContactDetails({
      common: { customer: testCustomerState },
      myForms: {
        carClaim: {
          ...testClaimCarState,
          driver: { oid: '124', email: 'test@def.com' }
        }
      }
    } as any);
    expect(showDriverName).toBe(false);
  });

  it('should have showDriverContactDetails as true with driver not logged in customer', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(modelPath, testClaimCarState));
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, testNamedDrivers[1].oid));
    const showDriverName = selectors.showDriverContactDetails(store.getState());
    expect(showDriverName).toBe(true);
  });

  it('should have showDriverContactDetails as true with driver as someone else', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, SOME_ONE_ELSE));
    const showDriverName = selectors.showDriverContactDetails(store.getState());
    expect(showDriverName).toBe(true);
  });

  it('should have showDriverAlcoholOrDrugsDetails as false with alcoholDrugsMedication is null', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.alcoholDrugsMedication`, null));
    const showDriverName = selectors.showDriverAlcoholDrugsMedicationDetails(store.getState());
    expect(showDriverName).toBe(false);
  });

  it('should have showDriverAlcoholOrDrugsDetails as true with alcoholDrugsMedication is true', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.alcoholDrugsMedication`, true));
    const showDriverName = selectors.showDriverAlcoholDrugsMedicationDetails(store.getState());
    expect(showDriverName).toBe(true);
  });

  it('should have showDriverAlcoholOrDrugsDetails as false with alcoholDrugsMedication is false', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.alcoholDrugsMedication`, false));
    const showDriverName = selectors.showDriverAlcoholDrugsMedicationDetails(store.getState());
    expect(showDriverName).toBe(false);
  });

  it('should get Yes if user selects has had alcohol or drugs from getDriverAlcoholDrugsMedication', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.alcoholDrugsMedication`, true));
    const result = selectors.getDriverAlcoholDrugsMedication(store.getState());
    expect(result).toBeTruthy();
  });

  it('should get blank string if user doesnt select has had alcohol or drugs from getAlcoholDrugsMedicationDetails', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.driver.alcoholDrugsMedication`));
    const result = selectors.getAlcoholDrugsMedicationDetails(store.getState());
    expect(result).toBe('');
  });

  it('should return blank string when testedForAlcoholOrDrugs not selected', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.policeAttendDetails.testedForAlcoholOrDrug`));
    const result = selectors.getWasTestedForAlcoholOrDrugs(store.getState());
    expect(result).toBe('');
  });

  it('should return blank string when getWasAnyoneCharged not selected', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.policeAttendDetails.anyoneCharged`));
    const result = selectors.getWasAnyoneCharged(store.getState());
    expect(result).toBe('');
  });

  it('should have showReportToPoliceMessage as true with secondary cause of loss', () => {
    let result = selectors.showReportToPoliceMessage('', SCOL.BreakIn.toString(), false);
    expect(result).toBe(true);
    result = selectors.showReportToPoliceMessage('', SCOL.IntentionalDamage.toString(), false);
    expect(result).toBe(true);
    result = selectors.showReportToPoliceMessage('', SCOL.Methamphetamine.toString(), false);
    expect(result).toBe(true);
  });

  it('should have showReportToPoliceMessage as correct with cause of loss', () => {
    let result = selectors.showReportToPoliceMessage(COL.Stolen.toString(), '', false);
    expect(result).toBe(true);
    result = selectors.showReportToPoliceMessage(COL.NaturalDisaster, SCOL.Landslide.toString(), false);
    expect(result).toBe(false);
  });

  it('should have showReportToPoliceMessage as false when already reported', () => {
    const result = selectors.showReportToPoliceMessage(COL.Stolen.toString(), SCOL.VehicleRecovered.toString(), true);
    expect(result).toBe(false);
  });

  it('should return false if has been reported to police has not been selected from hasBeenReportedToPolice', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.authorityReportPolice.isReported`));
    const result = selectors.hasBeenReportedToPolice(store.getState());
    expect(result).toBe(false);
  });

  it('should return correct result for getCarWhenLastSeenDate', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.carLastSeenDate`, '2019-04-16'));
    const result = selectors.getCarWhenLastSeenDate(store.getState());
    expect(result).toBe('2019-04-16');
  });

  it('should return correct result for  getCarWhenLastSeenTime', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.carLastSeenTime`, '07:30'));
    const result = selectors.getCarWhenLastSeenTime(store.getState());
    expect(result).toBe('07:30');
  });

  it('should return correct result for getCarWhenLastSeenTime AM or PM', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.carLastSeenAmPm`, 'pm'));
    const result = selectors.getCarWhenLastSeenAmPm(store.getState());

    expect(result).toBe('pm');
  });

  it('should return correct result for getCarDiscoveredMissingDate', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.carDiscoveredMissingDate`, '2019-04-16'));
    const result = selectors.getCarDiscoveredMissingDate(store.getState());
    expect(result).toBe('2019-04-16');
  });

  it('should return correct result for getLossDate', () => {
    const { store } = renderNothing();
    const date = new Date();
    store.dispatch(formActions.change(`${modelPath}.eisClaim`, { lossDate: date }));
    const result = selectors.getLossDate(store.getState());
    expect(result).toBe(date);
  });

  it('should return correct result for getCarDiscoveredMissingTime', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.carDiscoveredMissingTime`, '07:30'));
    const result = selectors.getCarDiscoveredMissingTime(store.getState());
    expect(result).toBe('07:30');
  });

  it('should return correct result for getCarDiscoveredMissingAmPm', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.carDiscoveredMissingAmPm`, 'pm'));
    const result = selectors.getCarDiscoveredMissingAmPm(store.getState());
    expect(result).toBe('pm');
  });

  it('should return correct result for getDriverOid', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.oid`, 'SOME_ONE_ELSE'));
    const result = selectors.getDriverOid(store.getState());
    expect(result).toBe('SOME_ONE_ELSE');
  });

  it('should return Someone else when driverOid is SOME_ONE_ELSE for getSelectedDriver', () => {
    const { store } = renderNothing();
    const result = selectors.getSelectedDriver({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          driver: { oid: SOME_ONE_ELSE }
        }
      }
    });
    expect(result).toBe('Someone else');
  });

  it('should return named driver when named driver is selected from getSelectedDriver', () => {
    const { store } = renderNothing();
    jest.spyOn(localeUtils, 'getPhoneNumberRules').mockReturnValue(mockRules);
    const result = selectors.getSelectedDriver({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          driver: {
            firstName: 'Fred',
            lastName: 'Flinstone',
            phone: '021111111'
          }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return empty string when no named driver is selected from getSelectedDriver', () => {
    const { store } = renderNothing();
    const result = selectors.getSelectedDriver({
      ...(store.getState() as any),
      myForms: {
        carClaim: {}
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return search address for getEventLocationOrDescription', () => {
    const { store } = renderNothing();
    store.dispatch(
      formActions.change(`${modelPath}.eventLocationAddress.addressSearch`, '21 Green Street, Auckland, NZ')
    );
    const result = selectors.getEventLocationOrDescription(store.getState());
    expect(result).toBe('21 Green Street, Auckland, NZ');
  });

  it('should return provincial address for getEventLocationOrDescription', () => {
    const { store } = renderNothing();

    store.dispatch(formActions.change(`${modelPath}.eventLocationAddress.addressSearch`, ''));
    const addressDetails = {
      unitAndFloor: 'Unit',
      streetNumber: 'StreetNumber',
      streetName: 'StreetName',
      suburb: 'Suburb',
      city: 'City',
      province: 'Province'
    };
    store.dispatch(formActions.change(`${modelPath}.eventLocationAddress.addressDetails`, addressDetails));

    const result = selectors.getEventLocationOrDescription(store.getState());
    expect(result).toBe('Unit/StreetNumber StreetName Suburb City Province');
  });

  it('should return description for getEventLocationOrDescription', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.eventLocationAddress.addressSearch`, ''));
    store.dispatch(formActions.change(`${modelPath}.eventLocationDescription`, 'Something'));
    const result = selectors.getEventLocationOrDescription(store.getState());
    expect(result).toBe('Something');
  });

  it('should return empty string for getEventLocationOrDescription', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.eventLocationAddress.addressSearch`, ''));
    store.dispatch(formActions.change(`${modelPath}.eventLocationDescription`, ''));
    const result = selectors.getEventLocationOrDescription(store.getState());
    expect(result).toBe('');
  });

  it('should return a blank string if vehicle location is empty from getVehicleLocation', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.vehicleLocation`, ''));
    const result = selectors.getVehicleLocation(store.getState());
    expect(result).toBe('');
  });

  it('should showMissingKeyDetails when keysMissing is yes', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.isKeyMissing`, KEYS_MISSING_YES));
    const result = selectors.showMissingKeyDetails(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return false for showMissingKeyDetails when keysMissing is not yes', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.isKeyMissing`, KEYS_MISSING_NO));
    const result = selectors.showMissingKeyDetails(store.getState());
    expect(result).toBeFalsy();
  });

  it('should return empty string for getWasDoorLocked if nothing entered', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.theft.doorsLocked`));
    const result = selectors.getWasDoorLocked(store.getState());
    expect(result).toBe('');
  });

  it('should return blank string for getMissingKeyDetails if nothing entered', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}`, ''));
    const result = selectors.getMissingKeyDetails(store.getState());
    expect(result).toBe('');
  });

  it('should return Yes for getIsKeysMissingString if yes selected', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.theft.isKeyMissing`, KEYS_MISSING_YES));
    const result = selectors.getIsKeysMissingString(store.getState());
    expect(result).toBe('Yes');
  });

  it('should return vehicle description correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getVehicleDescription({
      ...(store.getState() as any),
      myForms: { sharedClaim: testClaimState }
    });
    expect(result).toBe('test description');
  });

  describe('isDamageToClaim', () => {
    it.each`
      liabilityOnly | expectedResult
      ${false}      | ${true}
      ${true}       | ${false}
    `('should return $expectedResult when liabilityOnly is $liabilityOnly', ({ liabilityOnly, expectedResult }) => {
      const { store } = renderNothing();
      store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, 'damaged'));
      store.dispatch(formActions.change(`${modelPath}.carDamageDetails.liabilityOnly`, liabilityOnly));
      const result = selectors.isDamageToClaim(store.getState());
      expect(result).toBe(expectedResult);
    });
    it.each`
      causeOfLoss                 | expectedResult
      ${COL.DamagedWhileParked}   | ${true}
      ${COL.NaturalDisaster}      | ${true}
      ${COL.AccidentWhileDriving} | ${false}
    `('should return $expectedResult when causeOfLoss is $causeOfLoss', ({ causeOfLoss, expectedResult }) => {
      const { store } = renderNothing();
      store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, causeOfLoss));
      const result = selectors.isDamageToClaim(store.getState());
      expect(result).toBe(expectedResult);
    });
    it.each`
      damage                            | expectedResult
      ${CAUSE_OF_LOSS_NATURAL_DISASTER} | ${true}
      ${'anystring'}                    | ${false}
    `('should return $expectedResult when damage is $damage', ({ damage, expectedResult }) => {
      const { store } = renderNothing();
      store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, COL.Damaged));
      store.dispatch(formActions.change(`myForms.sharedClaim.car.damage`, damage));
      const result = selectors.isDamageToClaim(store.getState());
      expect(result).toBe(expectedResult);
    });
    it('should return true when claimType is Boat', () => {
      const { store } = renderNothing();
      store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, COL.MaliciousDamage));
      store.dispatch(formActions.change(`myForms.sharedClaim.claimType`, ClaimType.Boat));
      const result = selectors.isDamageToClaim(store.getState());
      expect(result).toBe(true);
    });
  });

  it('should return drivableUnsure correctly', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, UNSURE));
    const result = selectors.drivableUnsure(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return askVehicleLocation true if drivable is unsure', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, UNSURE));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, KnownCauseOfLoss.AccidentWhileDriving));
    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return askVehicleLocation true if drivable is no', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, NO));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, KnownCauseOfLoss.AccidentWhileDriving));

    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return askVehicleLocation true if cause of loss is  is no', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.carDamageDetails.drivable`));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, COL.Contamination));
    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return askVehicleLocation false if drivable yes', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.eisClaim`));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, KnownCauseOfLoss.AccidentWhileDriving));
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, YES));
    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeFalsy();
  });

  it('should return askVehicleLocation false if drivable stolen but not recovered', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, YES));
    store.dispatch(
      formActions.change(`${modelPath}.eisClaim`, {
        causeOfLoss: COL.Stolen,
        secondaryCauseOfLoss: SCOL.Other
      })
    );
    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeFalsy();
  });

  it('should return askVehicleLocation true if drivable stolen and recovered', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, YES));
    store.dispatch(
      formActions.change(`${modelPath}.eisClaim`, {
        causeOfLoss: COL.Stolen,
        secondaryCauseOfLoss: SCOL.VehicleRecovered
      })
    );
    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return askVehicleLocation false if not stolen', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, YES));
    store.dispatch(
      formActions.change(`${modelPath}.eisClaim`, {
        causeOfLoss: COL.Stolen,
        secondaryCauseOfLoss: SCOL.Other
      })
    );
    const result = selectors.askVehicleLocation(store.getState());
    expect(result).toBeFalsy();
  });

  it('should return askTypeOfBusiness false if not commercial policy', () => {
    const { store } = renderNothing();
    const result = selectors.askTypeOfBusiness({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, typeOfPolicy: KnownMotorTypeOfPolicy.Personal }
        },
        carClaim: {
          ...testClaimCarState
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return askTypeOfBusiness true if commercial policy and usedCommercialls is yes', () => {
    const { store } = renderNothing();
    const result = selectors.askTypeOfBusiness({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, typeOfPolicy: KnownMotorTypeOfPolicy.Commercial }
        },
        carClaim: {
          carDamageDetails: {
            usedCommercially: true
          }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return askTypeOfBusiness true if not commercial policy but used Commercially', () => {
    const { store } = renderNothing();
    const result = selectors.askTypeOfBusiness({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, typeOfPolicy: KnownMotorTypeOfPolicy.Personal }
        },
        carClaim: {
          carDamageDetails: {
            usedCommercially: true
          }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return askTypeOfBusiness false if claim type is boat', () => {
    const { store } = renderNothing();
    const result = selectors.askTypeOfBusiness({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Boat
        },
        carClaim: {
          carDamageDetails: {}
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return defaultUsedCommerciallyAsTrue as true if used Commercially is null and commercial policy', () => {
    const { store } = renderNothing();
    const result = selectors.defaultUsedCommerciallyAsTrue({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, typeOfPolicy: KnownMotorTypeOfPolicy.Commercial }
        },
        carClaim: {
          carDamageDetails: {
            usedCommercially: null
          }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return defaultUsedCommerciallyAsTrue as false if used Commercially is not null and commercial policy', () => {
    const { store } = renderNothing();
    const result = selectors.defaultUsedCommerciallyAsTrue({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, typeOfPolicy: KnownMotorTypeOfPolicy.Commercial }
        },
        carClaim: {
          carDamageDetails: {
            usedCommercially: false
          }
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return defaultUsedCommerciallyAsTrue as false if used Commercially is null and personal policy', () => {
    const { store } = renderNothing();
    const result = selectors.defaultUsedCommerciallyAsTrue({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, typeOfPolicy: KnownMotorTypeOfPolicy.Personal }
        },
        carClaim: {
          carDamageDetails: {
            usedCommercially: null
          }
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return hasWitness as false if there witnesses is null', () => {
    const { store } = renderNothing();
    const result = selectors.hasWitness({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: null
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return hasWitness as false if there witnesses are empty', () => {
    const { store } = renderNothing();
    const result = selectors.hasWitness({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: []
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return hasWitness as true if there are witnesses', () => {
    const { store } = renderNothing();
    const result = selectors.hasWitness({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: [emptyContactDetailsModel]
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return getWitnesses correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getWitnesses({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: [emptyContactDetailsModel]
        }
      }
    });
    expect(result).toMatchObject([emptyContactDetailsModel]);
  });

  it('should return getWitnessCount correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getWitnessCount({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: [emptyContactDetailsModel]
        }
      }
    });
    expect(result).toBe(1);
  });

  it('should return as true if witness has no first name', () => {
    const { store } = renderNothing();
    const result = selectors.hasNoWitnessName({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: [
            {
              firstName: null,
              lastName: null,
              phone: null,
              email: null,
              address: null
            }
          ]
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return as false if witness has first name', () => {
    const { store } = renderNothing();
    const result = selectors.hasNoWitnessName({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: [
            {
              firstName: 'Naruto',
              lastName: null,
              phone: null,
              email: null,
              address: null
            }
          ]
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return hasOtherPropertyDamages as false if there witnesses is null', () => {
    const { store } = renderNothing();
    const result = selectors.hasOtherPropertyDamages({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherPropertyDamages: null
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return hasOtherPropertyDamages as false if there witnesses are empty', () => {
    const { store } = renderNothing();
    const result = selectors.hasOtherPropertyDamages({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherPropertyDamages: []
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return hasOtherPropertyDamages as true if there are witnesses', () => {
    const { store } = renderNothing();
    const result = selectors.hasOtherPropertyDamages({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherPropertyDamages: [getDefaultOtherPropertyState()]
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return getOtherPropertyDamages correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getOtherPropertyDamages({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherPropertyDamages: [getDefaultOtherPropertyState()]
        }
      }
    });
    expect(result).toMatchObject([getDefaultOtherPropertyState()]);
  });

  it('should return getOtherPropertyDamageCount correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getOtherPropertyDamageCount({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherPropertyDamages: [getDefaultOtherPropertyState()]
        }
      }
    });
    expect(result).toBe(1);
  });

  it('should return true for isPropertyDamagedBusiness with OTH value', () => {
    const { store } = renderNothing();
    const result = selectors.isPropertyDamagedBusiness(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [{ ...getDefaultOtherPropertyState(), propertyType: DAMAGE_PROPERTY_TYPE_OTH }]
          }
        }
      },
      0
    );
    expect(result).toBeTruthy();
  });

  it('should return true for isPropertyDamagedSubTypeVehicle with VEHICLE value', () => {
    const { store } = renderNothing();
    const result = selectors.isPropertyDamagedSubTypeVehicle(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [
              { ...getDefaultOtherPropertyState(), damageSubType: DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE }
            ]
          }
        }
      },
      0
    );
    expect(result).toBeTruthy();
  });

  it('should return false for isPropertyDamagedSubTypeVehicle with non VEHICLE value', () => {
    const { store } = renderNothing();
    const result = selectors.isPropertyDamagedSubTypeVehicle(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [
              { ...getDefaultOtherPropertyState(), damageSubType: DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS }
            ]
          }
        }
      },
      0
    );
    expect(result).toBeFalsy();
  });

  it('should return false for isPropertyDamagedBusiness with IND value', () => {
    const { store } = renderNothing();
    const result = selectors.isPropertyDamagedBusiness(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [{ ...getDefaultOtherPropertyState(), propertyType: DAMAGE_PROPERTY_TYPE_IND }]
          }
        }
      },
      0
    );
    expect(result).toBeFalsy();
  });

  it('should return false for isPropertyDamagedBusiness with null value', () => {
    const { store } = renderNothing();
    const result = selectors.isPropertyDamagedBusiness(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [getDefaultOtherPropertyState()]
          }
        }
      },
      0
    );
    expect(result).toBeFalsy();
  });

  it('should return false for knowDamagedPropertyOwner with null value', () => {
    const { store } = renderNothing();
    const result = selectors.knowDamagedPropertyOwner(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [getDefaultOtherPropertyState()]
          }
        }
      },
      0
    );
    expect(result).toBeFalsy();
  });

  it('should return true for knowDamagedPropertyOwner with true value', () => {
    const { store } = renderNothing();
    const result = selectors.knowDamagedPropertyOwner(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [{ ...getDefaultOtherPropertyState(), knowPropertyOwner: true }]
          }
        }
      },
      0
    );
    expect(result).toBeTruthy();
  });

  it('should return true for hasVehicleDamageDetails with true value', () => {
    const { store } = renderNothing();
    const result = selectors.hasVehicleDamageDetails(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [{ ...getDefaultOtherPropertyState(), hasDriverDetails: true }]
          }
        }
      },
      0
    );
    expect(result).toBeTruthy();
  });

  it('should return getDamageVehicleModels correctly', () => {
    const { store } = renderNothing();
    const models = ['one', 'two'];
    const result = selectors.getDamageVehicleModels(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [
              { ...getDefaultOtherPropertyState(), driverDetails: { ...getDefaultOtherDriverState(), models: models } }
            ]
          }
        }
      },
      0
    );
    expect(result).toBe(models);
  });

  it('should return false for hasVehicleDamageDetails with false value', () => {
    const { store } = renderNothing();
    const result = selectors.hasVehicleDamageDetails(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [{ ...getDefaultOtherPropertyState() }]
          }
        }
      },
      0
    );
    expect(result).toBeFalsy();
  });

  it('should return false for knowDamagedPropertyOwner with false value', () => {
    const { store } = renderNothing();
    const result = selectors.knowDamagedPropertyOwner(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: [{ ...getDefaultOtherPropertyState(), knowPropertyOwner: false }]
          }
        }
      },
      0
    );
    expect(result).toBeFalsy();
  });

  it('should return false for getKnowDamagedPropertyOwnerString if owner is not known', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}`, ''));
    const result = selectors.getKnowDamagedPropertyOwnerString(store.getState(), 0);
    expect(result).toBeFalsy();
  });

  it('should return true for getKnowDamagedPropertyOwnerString if owner is known', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}`, ''));
    const result = selectors.getKnowDamagedPropertyOwnerString(
      {
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherPropertyDamages: testClaimCarState.otherPropertyDamages
          }
        }
      },
      0
    );
    expect(result).toBeTruthy();
  });

  it('should return hasPoliceAttend as true when there is police attend', () => {
    const { store } = renderNothing();
    const result = selectors.policeAttended({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          policeAttendDetails: { policeAttended: true }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return hasPoliceAttend as false when there is no police attend', () => {
    const { store } = renderNothing();
    const result = selectors.policeAttended({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          policeAttendDetails: { policeAttended: false }
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return isAnyOneCharged false if anyoneCharged is null', () => {
    const { store } = renderNothing();
    const result = selectors.isAnyOneCharged({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          policeAttendDetails: { ...getDefaultPoliceAttendState(), anyoneCharged: null }
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return isAnyOneCharged true if anyoneCharged is YES', () => {
    const { store } = renderNothing();
    const result = selectors.isAnyOneCharged({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          policeAttendDetails: { ...getDefaultPoliceAttendState(), anyoneCharged: YES }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return other drivers correctly on get other drivers', () => {
    const { store } = renderNothing();
    const result = selectors.getOtherDrivers({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherDrivers: testOtherDrivers
        }
      }
    });
    expect(result).toMatchObject(testOtherDrivers);
  });

  it('should return a string array of other drivers details from getOtherDriversArray', () => {
    const { store } = renderNothing();
    jest.spyOn(localeUtils, 'getPhoneNumberRules').mockReturnValue(mockRules);

    const result = selectors.getOtherDriversArray({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherDrivers: testOtherDrivers
        }
      }
    });
    expect(result.length > 0).toBeTruthy();
  });

  it('should return an empty array of other drivers details from getOtherDriversArray', () => {
    const { store } = renderNothing();
    const result = selectors.getOtherDriversArray({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherDrivers: []
        }
      }
    });
    expect(result.length > 0).toBeFalsy();
  });

  it('should return an empty array of other drivers details from getOtherPeopleDetailsArray', () => {
    const { store } = renderNothing();
    const result = selectors.getOtherPeopleDetailsArray({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherPeople: []
        }
      }
    });
    expect(result.length > 0).toBeFalsy();
  });

  it('should return hasOtherDrivers true if there are other drivers', () => {
    const { store } = renderNothing();
    const result = selectors.hasOtherDrivers({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherDrivers: testOtherDrivers
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return hasOtherDrivers false if there are no other drivers', () => {
    const { store } = renderNothing();
    const result = selectors.hasOtherDrivers({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          otherDrivers: []
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return driver full name if has both last and first name values', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.firstName`, 'Naruto'));
    store.dispatch(formActions.change(`${modelPath}.driver.lastName`, 'Uzumaki'));
    const result = selectors.getDriverFullName(store.getState());
    expect(result).toMatch('Naruto Uzumaki');
  });

  it('should return empty string if only one name value exists', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.firstName`, 'Naruto'));
    const result = selectors.getDriverFullName(store.getState());
    expect(result).toMatch('');
  });

  it('should return driver date of birth', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.dateOfBirth`, '2019-04-16'));
    const result = selectors.getDriverDateOfBirth(store.getState());
    expect(result).toMatch('2019-04-16');
  });

  it('should return driver phone number', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.phone`, '+640277223344'));
    const result = selectors.getDriverPhoneNumber(store.getState());
    expect(result).toMatch('+640277223344');
  });

  it('should return driver licence type from getDriverLicenceType', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'Learners'));
    const result = selectors.getDriverLicenceTypeLabel(store.getState());
    expect(result).toMatch('Learners');
  });

  it('should return blank string if licence question not answered from getDriverLicenceType', () => {
    const { store } = renderNothing();
    const result = selectors.getDriverLicenceTypeLabel(store.getState());
    expect(result).toMatch('');
  });

  it('should return driver licence country from getDriverLicenceCountry', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.licenceCountry`, LicenceCountry.Australia));
    const result = selectors.getDriverLicenceCountry(store.getState());
    expect(result).toBe('Australia');
  });

  it('should return empty string if question skipped from getDriverLicenceCountry', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.licenceCountry`, ''));
    const result = selectors.getDriverLicenceCountry(store.getState());
    expect(result).toBe('');
  });

  it('should return Yes if passengers in car is selected true from getPassengersInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.passengersInCar`, true));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'restricted'));
    const result = selectors.getPassengersInCar(store.getState());
    expect(result).toBe('Yes');
  });

  it('should return No if passengers in car is selected false from getPassengersInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.passengersInCar`, false));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'restricted'));
    const result = selectors.getPassengersInCar(store.getState());
    expect(result).toBe('No');
  });

  it('should return empty string if licese type is full from getPassengersInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.passengersInCar`, undefined));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'full'));
    const result = selectors.getPassengersInCar(store.getState());
    expect(result).toBe('');
  });

  it('should return Yes if supervisor in car is selected true from getSupervisorInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.supervisorInCar`, true));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'learners'));
    const result = selectors.getSupervisorInCar(store.getState());
    expect(result).toBe('Yes');
  });

  it('should return No if supervisor in car is selected false from getSupervisorInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.supervisorInCar`, false));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'learners'));
    const result = selectors.getSupervisorInCar(store.getState());
    expect(result).toBe('No');
  });

  it('should return empty string if licese type is full from getSupervisorInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.supervisorInCar`, undefined));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'full'));
    const result = selectors.getSupervisorInCar(store.getState());
    expect(result).toBe('');
  });

  it('should return empty string if no passangers in car from getSupervisorInCar', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.passengersInCar`, false));
    store.dispatch(formActions.change(`${modelPath}.driver.licenceType`, 'restricted'));
    const result = selectors.getSupervisorInCar(store.getState());
    expect(result).toBe('');
  });

  it('should return true if driver available is selected yes', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.driverAvailable`, true));
    const result = selectors.getIsDriverAvailable(store.getState());
    expect(result).toBe(true);
  });

  it('should return false if driver available is selected no', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.driverAvailable`, false));
    const result = selectors.getIsDriverAvailable(store.getState());
    expect(result).toBe(false);
  });

  it('should return repairerRegion correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getRepairerRegion({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            repairerRegion: Area.AucklandEast
          }
        }
      }
    });
    expect(result).toBe(Area.AucklandEast);
  });

  it('should return selectedRepairerId correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getSelectedRepairerId({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            selectedRepairerId: '123'
          }
        }
      }
    });
    expect(result).toBe('123');
  });

  it('should return getRepairers correctly', () => {
    const { store } = renderNothing();
    const result = selectors.getRepairers({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            repairers: testRepairers
          }
        }
      }
    });
    expect(result).toBe(testRepairers);
  });

  it('should return hasRepairers true if there are repairers', () => {
    const { store } = renderNothing();
    const result = selectors.hasRepairers({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            repairers: testRepairers
          }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return a string of repairer details if repairer is selecter from getSelectedRepairerNameAndAddress', () => {
    const { store } = renderNothing();
    const result = selectors.getSelectedRepairerNameAndAddress({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            selectedRepairer: testRepairers[0],
            repairers: testRepairers
          }
        }
      }
    });
    expect(result.length).toBeTruthy();
  });

  it('should return hasRepairers false if there are no repairers', () => {
    const { store } = renderNothing();
    const result = selectors.hasRepairers({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            repairers: []
          }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for isCauseOfLossTheft for COL Stolen', () => {
    const { store } = renderNothing();
    const result = selectors.isCauseOfLossTheft({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Stolen }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for isCauseOfLossTheft for COL not Stolen', () => {
    const { store } = renderNothing();
    const result = selectors.isCauseOfLossTheft({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.NaturalDisaster }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showPoliceAttendQuestions for SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showPoliceAttendQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showPoliceAttendQuestions for SCOL SingleVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.showPoliceAttendQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.SingleVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showPoliceAttendQuestions for SCOL HitByAnotherVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.showPoliceAttendQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.HitByAnotherVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showPoliceAttendQuestions for SCOL Storm', () => {
    const { store } = renderNothing();
    const result = selectors.showPoliceAttendQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Storm }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showPoliceAttendQuestions for claim type boat', () => {
    const { store } = renderNothing();
    const result = selectors.showPoliceAttendQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Storm }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for getPoliceAttend if police attended is true', () => {
    const { store } = renderNothing();
    const result = selectors.getPoliceAttendDetails({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          policeAttendDetails: true
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return true for getFireServiceAttend if fire attended is true', () => {
    const { store } = renderNothing();
    const result = selectors.getFireServiceAttend({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          authorityReportFire: {
            isReported: true
          }
        }
      }
    });
    expect(result).toBeTruthy();
  });

  it('should return true for showOtherDriversQuestions for SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherDriversQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherDriversQuestions for SCOL HitByAnotherVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherDriversQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.HitByAnotherVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherDriversQuestions for COL ImpactUnderWater', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherDriversQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactUnderwater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showOtherDriversQuestions for COL ImpactOutOfWater', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherDriversQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactOutOfWater }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showOtherDriversQuestions for COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherDriversQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other, secondaryCauseOfLoss: SCOL.Other }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showYourVehicleQuestions if there is no carClaim', () => {
    const { store } = renderNothing();
    const result = selectors.showYourVehicleQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {}
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showYourVehicleQuestions for COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showYourVehicleQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showYourVehicleQuestions for COL Other with feature flag off and SCOL VehicleNotRecovered', () => {
    const { store } = renderNothing();
    const result = selectors.showYourVehicleQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other, secondaryCauseOfLoss: SCOL.VehicleNotRecovered }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showYourVehicleQuestions and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showYourVehicleQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showYourVehicleQuestions and SCOL VehicleNotRecovered', () => {
    const { store } = renderNothing();
    const result = selectors.showYourVehicleQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.VehicleNotRecovered }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for askCustomerWantsToClaimDamage and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for askCustomerWantsToClaimDamage and SCOL SingleVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.SingleVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for askCustomerWantsToClaimDamage and SCOL Storm', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Storm }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for askCustomerWantsToClaimDamage and COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other, secondaryCauseOfLoss: SCOL.Other }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for askCustomerWantsToClaimDamage  for claim type boat and SCOL ImpactOutOfWater ', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactOutOfWater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for askCustomerWantsToClaimDamage  for claim type boat and SCOL ImpactUnderwater ', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactUnderwater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for askCustomerWantsToClaimDamage  for claim type boat and COL MaliciousDamage ', () => {
    const { store } = renderNothing();
    const result = selectors.askCustomerWantsToClaimDamage({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.MaliciousDamage }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showOtherPersonDetailsQuestions and COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPersonDetailsQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showOtherPersonDetailsQuestions and COL DamagedWhileParked and SCOL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPersonDetailsQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.DamagedWhileParked, secondaryCauseOfLoss: SCOL.Other }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherPersonDetailsQuestions and SCOL Methamphetamine', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPersonDetailsQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Methamphetamine }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherPersonDetailsQuestions and SCOL SingleVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPersonDetailsQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.SingleVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherPersonDetailsQuestions and SCOL IntentionalDamage', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPersonDetailsQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.IntentionalDamage }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showOtherPersonDetailsQuestions and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPersonDetailsQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false showOtherPeoplePropertyQuestions and COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showOtherPeoplePropertyQuestions and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherPeoplePropertyQuestions and SCOL SingleVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.SingleVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showOtherPeoplePropertyQuestions and SCOL Storm', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Storm }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showOtherPeoplePropertyQuestions for claim type boat and COL AccidentDamage', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherPeoplePropertyQuestions for claim type boat and COL Fire', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Fire }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showOtherPeoplePropertyQuestions for claim type boat and COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherPeoplePropertyQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showYourDriverQuestions and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showYourDriverQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for showYourDriverQuestions and SCOL SingleVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.showYourDriverQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.SingleVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showYourDriverQuestions and SCOL Weather', () => {
    const { store } = renderNothing();
    const result = selectors.showYourDriverQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Weather }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showYourDriverQuestions and SCOL ImpactOutOfWater', () => {
    const { store } = renderNothing();
    const result = selectors.showYourDriverQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.ImpactOutOfWater }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showYourDriverQuestions and SCOL ImpactUnderwater', () => {
    const { store } = renderNothing();
    const result = selectors.showYourDriverQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.ImpactUnderwater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for getYourDriver', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}`, ''));
    const result = selectors.getYourDriver(store.getState());
    expect(result).toBeFalsy();
  });

  it('should return true for getYourDriver', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.driver.firstName`, testClaimCarState));
    const result = selectors.getYourDriver(store.getState());
    expect(result).toBeTruthy();
  });

  it('should return true for showOtherVehiclesDamageQuestions hasOtherDrivers and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherVehiclesDamageQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles },
          otherDrivers: testOtherDrivers
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showOtherVehiclesDamageQuestions hasOtherDrivers and COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherVehiclesDamageQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other },
          otherDrivers: testOtherDrivers
        }
      }
    });
    expect(result).toBeFalsy();
  });

  it('should return false for showOtherVehiclesDamageQuestions hasOtherDrivers false and SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.showOtherVehiclesDamageQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles },
          otherDrivers: []
        }
      }
    });
    expect(result).toBe(false);
  });

  it.each`
    claimType         | col                         | scol                        | expectedResult
    ${ClaimType.Car}  | ${COL.Other}                | ${SCOL.Other}               | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Weather}             | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Earthquake}          | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Landslide}           | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Flood}               | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Tsunami}             | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.VolcanicActivity}    | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Storm}               | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.HitByAnotherVehicle} | ${true}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.BreakIn}             | ${true}
    ${ClaimType.Car}  | ${COL.Contamination}        | ${SCOL.Other}               | ${false}
    ${ClaimType.Car}  | ${COL.NaturalDisaster}      | ${SCOL.Other}               | ${true}
    ${ClaimType.Car}  | ${COL.AccidentWhileDriving} | ${SCOL.MultipleVehicles}    | ${true}
    ${ClaimType.Boat} | ${COL.AccidentDamage}       | ${SCOL.ImpactOutOfWater}    | ${true}
    ${ClaimType.Boat} | ${COL.MaliciousDamage}      | ${null}                     | ${true}
  `(
    'should return true for showWitnessQuestions claimType $claimType, col $col, scol $scol, expectedResult $expectedResult',
    ({ claimType, col, scol, expectedResult }) => {
      const { store } = renderNothing();
      const result = selectors.showWitnessQuestions({
        ...(store.getState() as any),
        myForms: {
          sharedClaim: {
            claimType: claimType
          },
          carClaim: {
            eisClaim: { causeOfLoss: col, secondaryCauseOfLoss: scol }
          }
        }
      });
      expect(result).toBe(expectedResult);
    }
  );

  it('should return a string array of witness details from getWitnessDetailsArray', () => {
    const { store } = renderNothing();
    const result = selectors.getWitnessDetailsArray({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: testClaimCarState.witnesses
        }
      }
    });
    expect(result.length > 0).toBeTruthy();
  });

  it('should return an empty array of witness details from getWitnessDetailsArray', () => {
    const { store } = renderNothing();
    const result = selectors.getWitnessDetailsArray({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          witnesses: []
        }
      }
    });
    expect(result.length > 0).toBeFalsy();
  });

  it.each`
    claimType         | col                         | scol                        | expectedResult
    ${ClaimType.Car}  | ${COL.Other}                | ${SCOL.Other}               | ${true}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Weather}             | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Earthquake}          | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Landslide}           | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Flood}               | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Tsunami}             | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.VolcanicActivity}    | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.Storm}               | ${false}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.HitByAnotherVehicle} | ${true}
    ${ClaimType.Car}  | ${COL.DamagedWhileParked}   | ${SCOL.BreakIn}             | ${true}
    ${ClaimType.Car}  | ${COL.Contamination}        | ${SCOL.Other}               | ${false}
    ${ClaimType.Car}  | ${COL.NaturalDisaster}      | ${SCOL.Other}               | ${true}
    ${ClaimType.Car}  | ${COL.AccidentWhileDriving} | ${SCOL.MultipleVehicles}    | ${true}
    ${ClaimType.Boat} | ${COL.AccidentDamage}       | ${SCOL.ImpactOutOfWater}    | ${false}
  `(
    'should return true for showAuthorityReportQuestions claimType $claimType, col $col, scol $scol, expectedResult $expectedResult',
    ({ claimType, col, scol, expectedResult }) => {
      const { store } = renderNothing();
      const result = selectors.showAuthorityReportQuestions({
        ...(store.getState() as any),
        myForms: {
          sharedClaim: {
            claimType: claimType
          },
          carClaim: {
            eisClaim: { causeOfLoss: col, secondaryCauseOfLoss: scol },
            policeAttendDetails: { policeAttended: false }
          }
        }
      });
      expect(result).toBe(expectedResult);
    }
  );

  it('should return false for showAuthorityReportQuestions SCOL MultipleVehicles but police attended as true', () => {
    const { store } = renderNothing();
    const result = selectors.showAuthorityReportQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles },
          policeAttendDetails: { policeAttended: true }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for showFireAuthorityReport when SCOL is Fire', () => {
    const { store } = renderNothing();
    const result = selectors.showFireAuthorityReport({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.DamagedWhileParked, secondaryCauseOfLoss: SCOL.Fire }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for showFireAuthorityReport when claim type is boat', () => {
    const { store } = renderNothing();
    const result = selectors.showFireAuthorityReport({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactUnderwater }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return false for showHailRepairer when not storm', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, 'damaged'));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.secondaryCauseOfLoss`, 'accidentalDamage'));

    const result = selectors.showHailRepairer(store.getState());
    expect(result).toBe(false);
  });

  it('should return true for showHailRepairer when storm', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, 'damaged'));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.secondaryCauseOfLoss`, 'hailStorm'));

    const result = selectors.showHailRepairer(store.getState());
    expect(result).toBe(true);
  });

  it('should return true for hideCarDamageQuestions COL Contamination', () => {
    const { store } = renderNothing();
    const result = selectors.hideCarDamageQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Contamination }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideCarDamageQuestions SCOL VehicleNotRecovered', () => {
    const { store } = renderNothing();
    const result = selectors.hideCarDamageQuestions({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.VehicleNotRecovered }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for hideCarDamageQuestions SCOL Storm', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, 'damaged'));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.secondaryCauseOfLoss`, 'storm'));

    const result = selectors.hideCarDamageQuestions(store.getState());
    expect(result).toBe(false);
  });

  it('should return empty array for getCarDamageSelections if no damage selected', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails`, []));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, 'damaged'));
    const result = selectors.getCarDamageSelections(store.getState());
    expect(result.length === 0).toBeTruthy();
  });

  it('should return true for hideRepairerQuestions COL Contamination', () => {
    const { store } = renderNothing();
    const result = selectors.hideRepairerQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Contamination }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideRepairerQuestions SCOL VehicleNotRecovered', () => {
    const { store } = renderNothing();
    const result = selectors.hideRepairerQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.VehicleNotRecovered }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideRepairerQuestions SCOL Storm', () => {
    const { store } = renderNothing();
    const result = selectors.hideRepairerQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.HailStorm }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideRepairerQuestions COL Other and keys and locks flag is on', () => {
    const { store } = renderNothing();
    const result = selectors.hideRepairerQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for hideRepairerQuestions when not SCOL Storm/VehicleNotRecovered/Contamination/other with keys flag ', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.eisClaim.causeOfLoss`, 'damaged'));
    store.dispatch(formActions.change(`${modelPath}.eisClaim.secondaryCauseOfLoss`, 'accidentalDamage'));

    const result = selectors.hideRepairerQuestions(store.getState());
    expect(result).toBe(false);
  });

  it.each`
    claimType
    ${ClaimType.Caravan}
    ${ClaimType.Trailer}
    ${ClaimType.Motorbike}
    ${ClaimType.Motorhome}
  `('should return true for hideRepairerQuestions claimType $claimType', ({ claimType }) => {
    const { store } = renderNothing();
    const result = selectors.hideRepairerQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: claimType
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentWhileDriving, secondaryCauseOfLoss: SCOL.SingleVehicle }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for hideRepairerQuestions when claimType boat ', () => {
    const { store } = renderNothing();
    const result = selectors.hideRepairerQuestions({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactUnderwater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideVehicleDrivableQuestion SCOL VehicleNotRecovered', () => {
    const { store } = renderNothing();
    const result = selectors.hideVehicleDrivableQuestion({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.VehicleNotRecovered }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideVehicleDrivableQuestion SCOL Methamphetamine', () => {
    const { store } = renderNothing();
    const result = selectors.hideVehicleDrivableQuestion({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Methamphetamine }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return false for hideVehicleDrivableQuestion SCOL Flood', () => {
    const { store } = renderNothing();
    const result = selectors.hideVehicleDrivableQuestion({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.Flood }
        }
      }
    });
    expect(result).toBe(false);
  });

  it('should return true for hideVehicleDrivableQuestion COL Contamination and SCOL Other', () => {
    const { store } = renderNothing();
    const result = selectors.hideVehicleDrivableQuestion({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Contamination, secondaryCauseOfLoss: SCOL.Other }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideVehicleDrivableQuestion COL Other and keys and lock flag on', () => {
    const { store } = renderNothing();
    const result = selectors.hideVehicleDrivableQuestion({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Car
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other, secondaryCauseOfLoss: SCOL.Other }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for hideVehicleDrivableQuestion claim type boat', () => {
    const { store } = renderNothing();
    const result = selectors.hideVehicleDrivableQuestion({
      ...(store.getState() as any),
      myForms: {
        sharedClaim: {
          claimType: ClaimType.Boat
        },
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentDamage, secondaryCauseOfLoss: SCOL.ImpactOutOfWater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return unsure for getIsVehicleDrivableAsText when unsure is selected', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, 'UNSURE'));
    const result = selectors.getIsVehicleDrivableAsText(store.getState());
    expect(result).toBe('UNSURE');
  });

  it('should return empty string for getIsVehicleDrivableAsText when nothing is selected', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.drivable`, ''));
    const result = selectors.getIsVehicleDrivableAsText(store.getState());
    expect(result).toBe('');
  });

  it('should return correct value for getClaimNumber', () => {
    const { store } = renderNothing();
    const result = selectors.getClaimNumber({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { claimNumber: '1234' }
        }
      }
    });
    expect(result).toBe('1234');
  });

  it('should return true for isMultipleVehicleDamage for SCOL MultipleVehicles', () => {
    const { store } = renderNothing();
    const result = selectors.isOtherDriverInvolved({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.MultipleVehicles }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for isMultipleVehicleDamage for SCOL ImpactUnderwater', () => {
    const { store } = renderNothing();
    const result = selectors.isOtherDriverInvolved({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.ImpactUnderwater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for isMultipleVehicleDamage for SCOL ImpactOutOfWater', () => {
    const { store } = renderNothing();
    const result = selectors.isOtherDriverInvolved({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { secondaryCauseOfLoss: SCOL.ImpactOutOfWater }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return an empty sting if no vehicle damage description entered for getVehicleDamageDescription', () => {
    const { store } = renderNothing();
    const result = selectors.getVehicleDamageDescription(store.getState());
    expect(result).toBe('');
  });

  it('should return true for isContamination for COL Contamination', () => {
    const { store } = renderNothing();
    const result = selectors.isContamination({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Contamination }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for selectClaimDamageWhenStartClaim and COL AccidentWhileDriving', () => {
    const { store } = renderNothing();
    const result = selectors.isDamageClaimableCauseOfLoss({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.AccidentWhileDriving }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for selectClaimDamageWhenStartClaim and COL DamagedWhileParked', () => {
    const { store } = renderNothing();
    const result = selectors.isDamageClaimableCauseOfLoss({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.DamagedWhileParked }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for selectClaimDamageWhenStartClaim and COL NaturalDisaster', () => {
    const { store } = renderNothing();
    const result = selectors.isDamageClaimableCauseOfLoss({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.NaturalDisaster }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for selectClaimDamageWhenStartClaim and COL Other', () => {
    const { store } = renderNothing();
    const result = selectors.isDamageClaimableCauseOfLoss({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: COL.Other }
        }
      }
    });
    expect(result).toBe(true);
  });
  it('should return true for isDriverEmailCorrect if email valid is true', () => {
    const { store } = renderNothing();
    const result = selectors.isDriverEmailCorrect({
      ...(store.getState() as any),
      myForms: {
        forms: {
          carClaim: {
            driver: {
              email: {
                valid: true
              } as FieldState
            }
          }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for isWitnessEmailValid if email valid is true', () => {
    const { store } = renderNothing();
    const result = selectors.isWitnessEmailValid({
      ...(store.getState() as any),
      myForms: {
        forms: {
          carClaim: {
            witnesses: {
              email: {
                valid: true
              } as FieldState
            }
          }
        }
      }
    });
    expect(result).toBe(true);
  });
  it('should return true for isOtherPeopleDetailsEmailValid if email valid is true', () => {
    const { store } = renderNothing();
    const result = selectors.isOtherPeopleDetailsEmailValid({
      ...(store.getState() as any),
      myForms: {
        forms: {
          carClaim: {
            otherPeopleDetails: {
              email: {
                valid: true
              } as FieldState
            }
          }
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true for otherPropertyDamages if email valid is true', () => {
    const { store } = renderNothing();
    const result = selectors.isOtherPeoplePropertyEmailValid({
      ...(store.getState() as any),
      myForms: {
        forms: {
          carClaim: {
            otherPropertyDamages: {
              email: {
                valid: true
              } as FieldState
            }
          }
        }
      }
    });
    expect(result).toBe(true);
  });

  describe('showSupervisorInCar selector', () => {
    const { store } = renderNothing();
    it.each`
      claimType      | driver                                                   | expectedResult
      ${'car'}       | ${{ licenceType: 'learners' }}                           | ${true}
      ${'car'}       | ${{ licenceType: 'restricted', passengersInCar: true }}  | ${true}
      ${'car'}       | ${{ licenceType: 'restricted', passengersInCar: false }} | ${false}
      ${'car'}       | ${{ licenceType: 'international' }}                      | ${false}
      ${'motorbike'} | ${{ licenceType: 'learners' }}                           | ${false}
      ${'motorbike'} | ${{ licenceType: 'restricted', passengersInCar: true }}  | ${false}
    `(
      'should return $expectedResult when licenceType is $driver.licenceType',
      ({ expectedResult, driver, claimType }) => {
        jest.spyOn(i18next, 't').mockReturnValue(true); // Mock true for askSupervisorInCarForRestricted
        const data: ApplicationState = {
          ...(store.getState() as any),
          myForms: {
            carClaim: {
              driver
            },
            sharedClaim: {
              claimType
            }
          }
        };
        const result = selectors.showSupervisorInCar(data);
        expect(result).toEqual(expectedResult);
      }
    );
  });

  it('should return true for getAirBagsDeployedSelection if airbagsDeployed true', () => {
    const { store } = renderNothing();
    const result = selectors.getAirBagsDeployedSelection({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            airbagDeployed: true
          }
        }
      }
    });
    expect(result).toBe(true);
  });
  it('should return false for getAirBagsDeployedSelection if airbagsDeployed false', () => {
    const { store } = renderNothing();
    const result = selectors.getAirBagsDeployedSelection({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          carDamageDetails: {
            airbagDeployed: false
          }
        }
      }
    });
    expect(result).toBe(false);
  });
  describe('isOtherDriver', () => {
    it('should return true if there is an other driver with any details', () => {
      const { store } = renderNothing();
      const result = selectors.isOtherDriver({
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherDrivers: [
              {
                firstName: 'Bob',
                last: 'The Builder'
              }
            ]
          }
        }
      });
      expect(result).toBe(true);
    });
    it('should return false if no other driver ', () => {
      const { store } = renderNothing();
      const result = selectors.isOtherDriver({
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            otherDrivers: []
          }
        }
      });
      expect(result).toBe(false);
    });
  });

  it('should return all repairer from getRepairersAllOrSelected', () => {
    const { store } = renderNothing();
    const result = selectors.getRepairersAllOrSelected({
      ...store.getState(),
      myForms: {
        carClaim: {
          carDamageDetails: {
            selectedRepairer: [],
            repairers: testRepairers
          }
        }
      }
    });
    expect(result[0]).toEqual(mockTestRepairers[0]);
  });

  it('should return selected repairer from getRepairersAllOrSelected if repairer is null', () => {
    const { store } = renderNothing();
    const result = selectors.getRepairersAllOrSelected({
      ...store.getState(),
      myForms: {
        carClaim: {
          carDamageDetails: {
            selectedRepairer: testRepairers[0],
            repairers: []
          }
        }
      }
    });
    expect(result).toEqual(mockTestRepairers);
  });

  it('should return false if region repairer is not selected (getOwnSelectedRepairer)', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.carDamageDetails.isOwnRepairerSelected`));
    const result = selectors.getOwnSelectedRepairer(store.getState());
    expect(result).toBe(false);
  });

  it('should return true for FindAnotherRepairerLinkVisible (getFindAnotherLinkVisible)', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.carDamageDetails.isFindAnotherRepairerLinkVisible`));
    const result = selectors.getFindAnotherLinkVisible(store.getState());
    expect(result).toBe(true);
  });

  it('should return false for own repairer section visible (getOwnRepairerSectionVisible)', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.reset(`${modelPath}.carDamageDetails.isOwnRepairerSectionVisible`));
    const result = selectors.getOwnRepairerSectionVisible(store.getState());
    expect(result).toBe(true);
  });

  it('should return false from areThirdPartiesInvolved if there are no third parties', () => {
    const { store } = renderNothing();
    const result = selectors.areThirdPartiesInvolved(store.getState());
    expect(result).toBe(false);
  });

  it('should return true from areThirdPartiesInvolved if there is a witness', () => {
    const { store } = renderNothing();
    const result = selectors.areThirdPartiesInvolved({
      ...store.getState(),
      myForms: {
        carClaim: {
          witnesses: [{ firstName: 'firstName' }]
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true from areThirdPartiesInvolved if there is another driver involved', () => {
    const { store } = renderNothing();
    const result = selectors.areThirdPartiesInvolved({
      ...store.getState(),
      myForms: {
        carClaim: {
          otherDrivers: [{ firstName: 'firstName' }]
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true from areThirdPartiesInvolved if there is other people involved', () => {
    const { store } = renderNothing();
    const result = selectors.areThirdPartiesInvolved({
      ...store.getState(),
      myForms: {
        carClaim: {
          otherPeopleDetails: [{ firstName: 'firstName' }]
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return true from areThirdPartiesInvolved if there is other property damage', () => {
    const { store } = renderNothing();
    const result = selectors.areThirdPartiesInvolved({
      ...store.getState(),
      myForms: {
        carClaim: {
          otherPropertyDamages: [{ firstName: 'firstName' }]
        }
      }
    });
    expect(result).toBe(true);
  });

  it('should return accidentInformation from getEventLocationHeaderLabel if cause of loss is AccidentWhileDriving', () => {
    const { store } = renderNothing();
    const result = selectors.getEventLocationHeaderLabel({
      ...store.getState(),
      myForms: {
        carClaim: {
          eisClaim: {
            causeOfLoss: COL.AccidentWhileDriving
          }
        }
      }
    });
    expect(result).toBe('accidentInformation');
  });

  it('should return accidentInformation from getEventLocationHeaderLabel if cause of loss is AccidentDamage', () => {
    const { store } = renderNothing();
    const result = selectors.getEventLocationHeaderLabel({
      ...store.getState(),
      myForms: {
        carClaim: {
          eisClaim: {
            causeOfLoss: COL.AccidentWhileDriving
          }
        }
      }
    });
    expect(result).toBe('accidentInformation');
  });

  it('should return accidentInformation from getEventLocationHeaderLabel if COL is DamagedWhileParked and SCOL is HitByAnotherVehicle', () => {
    const { store } = renderNothing();
    const result = selectors.getEventLocationHeaderLabel({
      ...store.getState(),
      myForms: {
        carClaim: {
          eisClaim: {
            causeOfLoss: COL.AccidentWhileDriving,
            secondaryCauseOfLoss: SCOL.HitByAnotherVehicle
          }
        }
      }
    });
    expect(result).toBe('accidentInformation');
  });

  it('should return incidentInformation from getEventLocationHeaderLabel if cause of loss is NaturalDisaster', () => {
    const { store } = renderNothing();
    const result = selectors.getEventLocationHeaderLabel({
      ...store.getState(),
      myForms: {
        carClaim: {
          eisClaim: {
            causeOfLoss: COL.NaturalDisaster
          }
        }
      }
    });
    expect(result).toBe('incidentInformation');
  });

  it.each`
    col                         | expectedResult
    ${COL.AccidentWhileDriving} | ${true}
    ${COL.DamagedWhileParked}   | ${true}
    ${COL.NaturalDisaster}      | ${true}
    ${COL.Other}                | ${true}
    ${COL.AccidentDamage}       | ${true}
    ${COL.MaliciousDamage}      | ${true}
    ${COL.Submersion}           | ${true}
    ${COL.RepairerNegligence}   | ${true}
    ${COL.WeatherEvent}         | ${true}
    ${COL.Fire}                 | ${true}
  `('should return true for isDamageClaimableCauseOfLoss col $col', ({ col, expectedResult }) => {
    const { store } = renderNothing();
    const result = selectors.isDamageClaimableCauseOfLoss({
      ...(store.getState() as any),
      myForms: {
        carClaim: {
          eisClaim: { causeOfLoss: col }
        }
      }
    });
    expect(result).toBe(expectedResult);
  });
  it('should return libilityOnly correctly when liabilityOnly false', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.liabilityOnly`, false));
    const result = selectors.getIsDamageToClaimValue(store.getState());
    expect(result).toBe('Yes');
  });

  it('should return libilityOnly correctly when liabilityOnly true', () => {
    const { store } = renderNothing();
    store.dispatch(formActions.change(`${modelPath}.carDamageDetails.liabilityOnly`, true));
    const result = selectors.getIsDamageToClaimValue(store.getState());
    expect(result).toBe('No');
  });
});

describe(' showClaimDamageQuestions with TWR ', () => {
  it.each`
    brand                 | cover                           | col                         | expectedResult
    ${KnownBrandType.TWR} | ${KnownMotorPackage.ThirdParty} | ${COL.AccidentWhileDriving} | ${true}
  `(
    'should return expected result for showClaimDamageQuestions brand $brand, cover $cover, col $col, expectedResult $expectedResult',
    ({ col, cover, expectedResult }) => {
      const { store } = renderNothing();
      const result = selectors.showClaimDamageQuestions({
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            eisClaim: { causeOfLoss: col },
            policeAttendDetails: { policeAttended: false }
          },
          sharedClaim: {
            ...testClaimState,
            policyDetails: {
              ...testClaimState.policyDetails,
              risk: {
                coverages: {
                  vehicleUninsured3RdPartyAccidentsCoverage: {
                    limitAmount: 4000
                  }
                }
              },
              package: cover
            }
          }
        }
      });
      expect(result).toBe(expectedResult);
    }
  );
  it.each`
    brand                 | cover                                    | col                       | scol                        | expectedResult
    ${KnownBrandType.TWR} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.HitByAnotherVehicle} | ${true}
    ${KnownBrandType.TWR} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.BreakIn}             | ${true}
    ${KnownBrandType.TWR} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.IntentionalDamage}   | ${true}
    ${KnownBrandType.TWR} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.Fire}                | ${true}
  `(
    'should return expected results for showClaimDamageQuestions brand $brand, cover $cover, col $col,  socl $scol, expectedResult $expectedResult',
    ({ col, scol, cover, expectedResult }) => {
      const { store } = renderNothing();
      const result = selectors.showClaimDamageQuestions({
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            eisClaim: { causeOfLoss: col, secondaryCauseOfLoss: scol },
            policeAttendDetails: { policeAttended: false }
          },
          sharedClaim: {
            ...testClaimState,
            policyDetails: {
              ...testClaimState.policyDetails,
              risk: {
                coverages: {
                  vehicleUninsured3RdPartyAccidentsCoverage: {
                    limitAmount: 4000
                  }
                }
              },
              package: cover
            }
          }
        }
      });
      expect(result).toBe(expectedResult);
    }
  );
});

describe(' showClaimDamageQuestions with TMI ', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.brand = 'tmi';
  });

  afterAll(() => {
    delete process.env.brand;
  });

  it.each`
    brand                 | cover                           | col                         | expectedResult
    ${KnownBrandType.TMI} | ${KnownMotorPackage.ThirdParty} | ${COL.AccidentWhileDriving} | ${false}
  `(
    'should return expected result for showClaimDamageQuestions brand $brand, cover $cover, col $col, expectedResult $expectedResult',
    ({ col, cover, expectedResult }) => {
      const { store } = renderNothing();
      const result = selectors.showClaimDamageQuestions({
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            eisClaim: { causeOfLoss: col },
            policeAttendDetails: { policeAttended: false }
          },
          sharedClaim: {
            ...testClaimState,
            policyDetails: { ...testClaimState.policyDetails, package: cover }
          }
        }
      });
      expect(result).toBe(expectedResult);
    }
  );
  it.each`
    brand                 | cover                                    | col                       | scol                        | expectedResult
    ${KnownBrandType.TMI} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.HitByAnotherVehicle} | ${false}
    ${KnownBrandType.TMI} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.BreakIn}             | ${false}
    ${KnownBrandType.TMI} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.IntentionalDamage}   | ${false}
    ${KnownBrandType.TMI} | ${KnownMotorPackage.ThirdPartyFireTheft} | ${COL.DamagedWhileParked} | ${SCOL.Fire}                | ${true}
  `(
    'should return expected results for showClaimDamageQuestions brand $brand, cover $cover, col $col,  socl $scol, expectedResult $expectedResult',
    ({ col, scol, cover, expectedResult }) => {
      const { store } = renderNothing();
      const result = selectors.showClaimDamageQuestions({
        ...(store.getState() as any),
        myForms: {
          carClaim: {
            eisClaim: { causeOfLoss: col, secondaryCauseOfLoss: scol },
            policeAttendDetails: { policeAttended: false }
          },
          sharedClaim: {
            ...testClaimState,
            policyDetails: { ...testClaimState.policyDetails, package: cover }
          }
        }
      });
      expect(result).toBe(expectedResult);
    }
  );
});
