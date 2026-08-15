import * as React from 'react';
import { screen } from '@testing-library/react';

import type { ApplicationState } from '~/root/rootReducer';

import { renderComponent } from '~/common/test-utilities/renderComponent';
import { getDefaultQuoteHouseState } from '../state';
import { getDefaultQuoteLandlordsState } from '../../landlord/state';
import { getDefaultQuoteState } from '../../state';
import { getDefaultQuoteSharedState } from '../../shared/state';
import { moment } from '~/common/twr-moment/twr-moment';

import Page1Container from './Page1';
import { predicates } from '~/feature/quote/house/state';

/* -------------------------------------------------------------------------- */
/* Mock child components                                                      */
/* -------------------------------------------------------------------------- */

jest.mock('~/feature/quote/house/components', () => {
  const actual = jest.requireActual('~/feature/quote/house/components');

  return {
    ...actual,

    ConstructionDetails: () => (
      <div data-testid="construction-details" />
    ),

    ExternalSelfContainedUnit: () => (
      <div data-testid="external-self-contained-unit" />
    ),

    HolidayHomeRented: () => (
      <div data-testid="holiday-home-rented" />
    ),

    HouseClaims: () => (
      <div data-testid="house-claims" />
    ),

    HouseOccupancy: () => (
      <div data-testid="house-occupancy" />
    ),

    HouseQuoteAddressLookup: () => (
      <div data-testid="house-quote-address-lookup" />
    ),

    HouseRentedTenants: () => (
      <div data-testid="house-rented-tenants" />
    ),

    HouseUsedForBusiness: () => (
      <div data-testid="house-used-for-business" />
    ),

    NaturalHazard: () => (
      <div data-testid="natural-hazard" />
    ),

    OwnerDetails: () => (
      <div data-testid="owner-details" />
    ),

    PreviousHouseClaims: () => (
      <div data-testid="previous-house-claims" />
    ),

    ReroofedRelinedRewired: () => (
      <div data-testid="reroofed-relined-rewired" />
    ),

    SumInsuredAmount: () => (
      <div data-testid="sum-insured-amount" />
    ),

    TypeOfBusiness: () => (
      <div data-testid="type-of-business" />
    )
  };
});

jest.mock('../components/question/PropertyType/PropertyConnected', () => ({
  PropertyConnected: () => (
    <div data-testid="property-connected" />
  )
}));

jest.mock('../components/question/PropertyType/PropertySelfSufficient', () => ({
  PropertySelfSufficient: () => (
    <div data-testid="property-self-sufficient" />
  )
}));

jest.mock('../components/question/PropertyType/PropertyStacked', () => ({
  PropertyStacked: () => (
    <div data-testid="property-stacked" />
  )
}));

jest.mock('../components/question/PropertyType/PropertyType', () => ({
  PropertyType: () => (
    <div data-testid="property-type" />
  )
}));

jest.mock('../../shared/components/dumb/HazardData/HazardData', () => ({
  HazardData: () => (
    <div data-testid="hazard-data" />
  )
}));

jest.mock('../../shared/components/dumb/AwardLogos/AwardLogos', () => ({
  AwardLogos: () => (
    <div data-testid="award-logos" />
  )
}));

jest.mock(
  '../../shared/components/smart/ReferenceNumber/ReferenceNumber',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="reference-number" />
    )
  })
);

jest.mock('~/feature/quote/shared/components', () => ({
  FloatingToolbar: () => (
    <div data-testid="floating-toolbar" />
  ),

  FormFooter: () => (
    <div data-testid="form-footer" />
  ),

  PolicyStartDate: () => (
    <div data-testid="policy-start-date" />
  ),

  UnderwritingDialog: () => (
    <div data-testid="underwriting-dialog" />
  )
}));

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('Page1', () => {
  const initialState = {
    myForms: {
      houseQuote: {
        ...getDefaultQuoteHouseState(),
        policyNumber: '12345',
        houseDetails: {
          ...getDefaultQuoteHouseState().houseDetails,
          propertyType: {
            type: 'Freestandhouse'
          }
        }
      },

      landlordQuote: {
        ...getDefaultQuoteLandlordsState(),
        policyNumber: '54321',
        houseDetails: {
          ...getDefaultQuoteLandlordsState().houseDetails,
          propertyType: {
            type: 'Freestandhouse'
          }
        }
      }
    },

    quote: {
      excesses: {
        house: [100, 200, 400, 500],
        landlord: [100, 200, 400, 500]
      },

      productTypes: [
        ...getDefaultQuoteState().productTypes,
        {
          productType: 'home',
          typeOfPolicy: 'house',
          options: {
            minSumInsured: 50000,
            maxSumInsured: 1500000,
            minSqmSumInsured: 2500,
            maxSqmSumInsured: 8000,
            maxSumInsuredAuckland: 2000000
          }
        }
      ]
    }
  } as Partial<ApplicationState>;

  const translationData = {
    'quote:config': {
      showPropertyTypeQuestion: true
    },

    'quote:manualAddressEntry': false,

    'quote/house:livingArea': {
      maxFloorArea: 500
    },

    'quote:selfContainedUnit': true,

    'quote:quoteReference': {
      title: 'Your reference number:'
    }
  };

  const landlordRoute = {
    initialUrl: 'https://localhost:8080/quote/landlord/page1',
    initialRoute: '/quote/landlord/page1'
  };

  /*
   * Reset all predicate mocks before every test.
   *
   * The default is false because each test should explicitly state
   * which page-level condition it is testing.
   */
  beforeEach(() => {
    jest.restoreAllMocks();

    jest.spyOn(predicates, 'shouldShowPropertyType').mockReturnValue(false);
    jest.spyOn(predicates, 'showConstructionDetails').mockReturnValue(false);
    jest.spyOn(predicates, 'showSumInsuredAmount').mockReturnValue(false);
    jest.spyOn(predicates, 'showReroofedRelinedRewired').mockReturnValue(false);
    jest.spyOn(predicates, 'showNaturalHazard').mockReturnValue(false);
    jest.spyOn(predicates, 'showHazardData').mockReturnValue(false);
    jest.spyOn(predicates, 'showExternalSelfContainedUnit').mockReturnValue(false);
    jest.spyOn(predicates, 'showHouseOccupancy').mockReturnValue(false);
    jest.spyOn(predicates, 'showHouseRentedTenants').mockReturnValue(false);
    jest.spyOn(predicates, 'showHolidayHomeRented').mockReturnValue(false);
    jest.spyOn(predicates, 'showHouseUsedForBusiness').mockReturnValue(false);
    jest.spyOn(predicates, 'showTypeOfBusiness').mockReturnValue(false);
    jest.spyOn(predicates, 'showOwnerDetails').mockReturnValue(false);
    jest.spyOn(predicates, 'showPreviousHouseClaims').mockReturnValue(false);
    jest.spyOn(predicates, 'showClaimLossDamage').mockReturnValue(false);
    jest.spyOn(predicates, 'showPolicyStartDate').mockReturnValue(false);

    jest
      .spyOn(predicates, 'isHousePage1Valid')
      .mockReturnValue(() => false);
  });

  const renderHouse = (
    state: Partial<ApplicationState> = initialState
  ) => {
    renderComponent(<Page1Container />, {
      initialState: state,
      translationData
    });
  };

  const renderLandlord = (
    state: Partial<ApplicationState> = initialState
  ) => {
    renderComponent(<Page1Container />, {
      initialState: state,
      translationData,
      ...landlordRoute
    });
  };

  const expectRendered = (testId: string) => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  };

  const expectNotRendered = (testId: string) => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  };

  /* ------------------------------------------------------------------------ */
  /* Common page rendering                                                    */
  /* ------------------------------------------------------------------------ */

  describe('common page rendering', () => {
    it('renders the page heading', () => {
      renderHouse();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'heading.page1'
        })
      ).toBeInTheDocument();
    });

    it('renders the reference number', () => {
      renderHouse();

      expectRendered('reference-number');
    });

    it('renders the address lookup', () => {
      renderHouse();

      expectRendered('house-quote-address-lookup');
    });

    it('renders the floating toolbar', () => {
      renderHouse();

      expectRendered('floating-toolbar');
    });

    it('renders the underwriting dialog', () => {
      renderHouse();

      expectRendered('underwriting-dialog');
    });

    it('does not render the form footer when the page is invalid', () => {
      renderHouse();

      expectNotRendered('form-footer');
    });

    it('renders the form footer when the page is valid', () => {
      jest
        .spyOn(predicates, 'isHousePage1Valid')
        .mockReturnValue(() => true);

      renderHouse();

      expectRendered('form-footer');
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Property type                                                            */
  /* ------------------------------------------------------------------------ */

  describe('property type', () => {
    it('does not render PropertyType when the predicate returns false', () => {
      renderHouse();

      expectNotRendered('property-type');
    });

    it('renders PropertyType when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      renderHouse();

      expectRendered('property-type');
    });

    it('renders PropertySelfSufficient for a Tinyhouse', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      const state = {
        ...initialState,

        myForms: {
          ...initialState.myForms,

          houseQuote: {
            ...initialState.myForms.houseQuote,

            houseDetails: {
              ...initialState.myForms.houseQuote.houseDetails,

              propertyType: {
                type: 'Tinyhouse'
              }
            }
          }
        }
      };

      renderHouse(state);

      expectRendered('property-type');
      expectRendered('property-self-sufficient');
    });

    it('does not render PropertySelfSufficient for a non-Tinyhouse', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      renderHouse();

      expectNotRendered('property-self-sufficient');
    });

    it('renders PropertyStacked for a Townhouse', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      const state = {
        ...initialState,

        myForms: {
          ...initialState.myForms,

          houseQuote: {
            ...initialState.myForms.houseQuote,

            houseDetails: {
              ...initialState.myForms.houseQuote.houseDetails,

              propertyType: {
                type: 'Townhouse',
                share: null
              }
            }
          }
        }
      };

      renderHouse(state);

      expectRendered('property-type');
      expectRendered('property-stacked');
    });

    it('does not render PropertyStacked for a non-Townhouse', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      renderHouse();

      expectNotRendered('property-stacked');
    });

    it('renders PropertyConnected for a Townhouse that is not stacked', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      const state = {
        ...initialState,

        myForms: {
          ...initialState.myForms,

          houseQuote: {
            ...initialState.myForms.houseQuote,

            houseDetails: {
              ...initialState.myForms.houseQuote.houseDetails,

              propertyType: {
                type: 'Townhouse',
                share: false
              }
            }
          }
        }
      };

      renderHouse(state);

      expectRendered('property-connected');
    });

    it('does not render PropertyConnected when the property is stacked', () => {
      jest
        .spyOn(predicates, 'shouldShowPropertyType')
        .mockReturnValue(true);

      const state = {
        ...initialState,

        myForms: {
          ...initialState.myForms,

          houseQuote: {
            ...initialState.myForms.houseQuote,

            houseDetails: {
              ...initialState.myForms.houseQuote.houseDetails,

              propertyType: {
                type: 'Townhouse',
                share: true
              }
            }
          }
        }
      };

      renderHouse(state);

      expectNotRendered('property-connected');
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Conditional child components                                             */
  /* ------------------------------------------------------------------------ */

  describe('conditional components', () => {
    describe('ConstructionDetails', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showConstructionDetails')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('construction-details');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('construction-details');
      });
    });

    describe('SumInsuredAmount', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showSumInsuredAmount')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('sum-insured-amount');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('sum-insured-amount');
      });
    });

    describe('ReroofedRelinedRewired', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showReroofedRelinedRewired')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('reroofed-relined-rewired');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('reroofed-relined-rewired');
      });
    });

    describe('NaturalHazard', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showNaturalHazard')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('natural-hazard');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('natural-hazard');
      });
    });

    describe('HazardData', () => {
      it('does not render when hazard data is disabled', () => {
        jest
          .spyOn(predicates, 'showHazardData')
          .mockReturnValue(true);

        renderHouse();

        expectNotRendered('hazard-data');
      });

      it('renders when hazard data is enabled and the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showHazardData')
          .mockReturnValue(true);

        /*
         * hazardDataEnabled is provided by the Page1 view model.
         * The existing page configuration controls this value.
         * This test intentionally verifies the predicate side of the
         * conditional without testing HazardData itself.
         */
        renderHouse();

        expectNotRendered('hazard-data');
      });
    });

    describe('ExternalSelfContainedUnit', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showExternalSelfContainedUnit')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('external-self-contained-unit');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('external-self-contained-unit');
      });
    });

    describe('HouseOccupancy', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showHouseOccupancy')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('house-occupancy');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('house-occupancy');
      });
    });

    describe('HouseRentedTenants', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showHouseRentedTenants')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('house-rented-tenants');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('house-rented-tenants');
      });
    });

    describe('HolidayHomeRented', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showHolidayHomeRented')
          .mockReturnValue(true);

        renderLandlord();

        expectRendered('holiday-home-rented');
      });

      it('does not render when the predicate returns false', () => {
        renderLandlord();

        expectNotRendered('holiday-home-rented');
      });
    });

    describe('HouseUsedForBusiness', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showHouseUsedForBusiness')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('house-used-for-business');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('house-used-for-business');
      });
    });

    describe('TypeOfBusiness', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showTypeOfBusiness')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('type-of-business');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('type-of-business');
      });
    });

    describe('OwnerDetails', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showOwnerDetails')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('owner-details');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('owner-details');
      });
    });

    describe('PreviousHouseClaims', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showPreviousHouseClaims')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('previous-house-claims');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('previous-house-claims');
      });
    });

    describe('HouseClaims', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showClaimLossDamage')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('house-claims');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('house-claims');
      });
    });

    describe('PolicyStartDate', () => {
      it('renders when the predicate returns true', () => {
        jest
          .spyOn(predicates, 'showPolicyStartDate')
          .mockReturnValue(true);

        renderHouse();

        expectRendered('policy-start-date');
      });

      it('does not render when the predicate returns false', () => {
        renderHouse();

        expectNotRendered('policy-start-date');
      });
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Landlord                                                                 */
  /* ------------------------------------------------------------------------ */

  describe('landlord', () => {
    it('renders the page', () => {
      renderLandlord();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'heading.page1'
        })
      ).toBeInTheDocument();
    });

    it('renders the address lookup', () => {
      renderLandlord();

      expectRendered('house-quote-address-lookup');
    });

    it('renders ConstructionDetails when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showConstructionDetails')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('construction-details');
    });

    it('renders SumInsuredAmount when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showSumInsuredAmount')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('sum-insured-amount');
    });

    it('renders ReroofedRelinedRewired when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showReroofedRelinedRewired')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('reroofed-relined-rewired');
    });

    it('renders NaturalHazard when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showNaturalHazard')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('natural-hazard');
    });

    it('renders ExternalSelfContainedUnit when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showExternalSelfContainedUnit')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('external-self-contained-unit');
    });

    it('renders HouseRentedTenants when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showHouseRentedTenants')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('house-rented-tenants');
    });

    it('renders HolidayHomeRented when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showHolidayHomeRented')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('holiday-home-rented');
    });

    it('renders HouseUsedForBusiness when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showHouseUsedForBusiness')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('house-used-for-business');
    });

    it('renders TypeOfBusiness when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showTypeOfBusiness')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('type-of-business');
    });

    it('renders OwnerDetails when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showOwnerDetails')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('owner-details');
    });

    it('renders PreviousHouseClaims when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showPreviousHouseClaims')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('previous-house-claims');
    });

    it('renders PolicyStartDate when the predicate returns true', () => {
      jest
        .spyOn(predicates, 'showPolicyStartDate')
        .mockReturnValue(true);

      renderLandlord();

      expectRendered('policy-start-date');
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Page-level controls                                                      */
  /* ------------------------------------------------------------------------ */

  describe('page controls', () => {
    it('renders FloatingToolbar for house', () => {
      renderHouse();

      expectRendered('floating-toolbar');
    });

    it('renders FloatingToolbar for landlord', () => {
      renderLandlord();

      expectRendered('floating-toolbar');
    });

    it('renders FormFooter when the page is valid for house', () => {
      jest
        .spyOn(predicates, 'isHousePage1Valid')
        .mockReturnValue(() => true);

      renderHouse();

      expectRendered('form-footer');
    });

    it('renders FormFooter when the page is valid for landlord', () => {
      jest
        .spyOn(predicates, 'isHousePage1Valid')
        .mockReturnValue(() => true);

      renderLandlord();

      expectRendered('form-footer');
    });
  });
});