import * as React from 'react';
import { screen } from '@testing-library/react';
import type { ApplicationState } from '~/root/rootReducer';

import Page1Container from './Page1';
import { renderComponent } from '~/common/test-utilities/renderComponent';

import { getDefaultQuoteHouseState } from '../state';
import { getDefaultQuoteLandlordsState } from '../../landlord/state';
import { completedHouseQuote } from '../state/__mocks__/houseTestData';
import { getDefaultQuoteState } from '../../state';
import { getDefaultQuoteSharedState } from '../../shared/state';
import { moment } from '~/common/twr-moment/twr-moment';

/**
 * Page1 is responsible for deciding which child components are rendered.
 *
 * The child components themselves have their own unit tests.
 * These mocks intentionally reduce Page1 tests to page-level composition tests.
 */

/* -------------------------------------------------------------------------- */
/* House question components                                                  */
/* -------------------------------------------------------------------------- */

jest.mock('~/feature/quote/house/components', () => ({
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
}));

/* -------------------------------------------------------------------------- */
/* Property type components                                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Shared child components                                                    */
/* -------------------------------------------------------------------------- */

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

/**
 * These components are imported from:
 *
 * ~/feature/quote/shared/components
 *
 * Mocking them keeps Page1 focused on whether the components are rendered,
 * rather than testing their implementation.
 */
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

  const landlordUrlOptions = {
    initialUrl: 'https://localhost:8080/quote/landlord/page1',
    initialRoute: '/quote/landlord/page1'
  };

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
      ...landlordUrlOptions
    });
  };

  const expectRendered = (testId: string) => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  };

  const expectNotRendered = (testId: string) => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  };

  describe('house', () => {
    it('renders the page', () => {
      renderHouse();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'heading.page1'
        })
      ).toBeInTheDocument();
    });

    describe('address', () => {
      it('renders the address lookup', () => {
        renderHouse();

        expectRendered('house-quote-address-lookup');
      });

      it('does not render construction details without an address', () => {
        renderHouse();

        expectNotRendered('construction-details');
      });
    });

    describe('property type', () => {
      it('does not render the property type question when the feature flag is disabled', () => {
        renderHouse();

        expectNotRendered('property-type');
      });

      it('renders the property type question when the feature flag is enabled', () => {
        const state = {
          ...initialState,

          flags: {
            'q2b-property-types': true
          },

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('property-type');
      });

      it('renders the property stacked question for a townhouse', () => {
        const state = {
          ...initialState,

          flags: {
            'q2b-property-types': true
          },

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,

                propertyType: {
                  type: 'Townhouse',
                  share: null
                }
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('property-stacked');
      });

      it('renders the property self-sufficient question for a tiny house', () => {
        const state = {
          ...initialState,

          flags: {
            'q2b-property-types': true
          },

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,

                propertyType: {
                  type: 'Tinyhouse',
                  selfSufficientTinyhouse: null
                }
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('property-self-sufficient');
      });

      it('renders the property connected question for a townhouse that is not stacked', () => {
        const state = {
          ...initialState,

          flags: {
            'q2b-property-types': true
          },

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,

                propertyType: {
                  type: 'Townhouse',
                  share: false,
                  connected: null
                }
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('property-connected');
      });
    });

    describe('construction details', () => {
      it('renders construction details when an address is available', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('construction-details');
      });
    });

    describe('sum insured', () => {
      it('does not render sum insured while the Cordell value is loading', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                cordellValueLoading: true
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('sum-insured-amount');
      });

      it('renders sum insured when the Cordell value has loaded', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('sum-insured-amount');
      });
    });

    describe('property age and natural hazard', () => {
      it('does not render reroofed, relined and rewired for the default property', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectNotRendered('reroofed-relined-rewired');
      });

      it('renders reroofed, relined and rewired for an older property', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                yearBuilt: 1930
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('reroofed-relined-rewired');
      });

      it('does not render natural hazard for an older property', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                yearBuilt: 1930
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('natural-hazard');
      });

      it('renders natural hazard when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('natural-hazard');
      });
    });

    describe('external self-contained unit', () => {
      it('does not render an external self-contained unit when the property is at risk from natural hazard', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                propertyAtRiskFromNaturalHazardInd: true
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('external-self-contained-unit');
      });

      it('renders an external self-contained unit when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('external-self-contained-unit');
      });
    });

    describe('occupancy and business', () => {
      it('does not render house occupancy when there are multiple self-contained units', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units2'
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('house-occupancy');
      });

      it('renders house occupancy when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('house-occupancy');
      });

      it('does not render house used for business when occupancy is not selected', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                houseOccupancy: null as string
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('house-used-for-business');
      });

      it('renders house used for business when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('house-used-for-business');
      });

      it('does not render type of business when business is not conducted', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectNotRendered('type-of-business');
      });

      it('renders type of business when business is conducted', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                businessConductedInd: true
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('type-of-business');
      });
    });

    describe('owner and claims', () => {
      it('renders owner details when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('owner-details');
      });

      it('does not render previous house claims when owner details are unavailable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                ownerDetails: null as string
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('previous-house-claims');
      });

      it('renders previous house claims when owner details are available', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderHouse(state);

        expectRendered('previous-house-claims');
      });

      it('does not render policy start date when there are previous house claims', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                previousHouseClaims: true
              }
            }
          }
        };

        renderHouse(state);

        expectNotRendered('policy-start-date');
      });

      it('renders policy start date when there are no previous house claims', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                previousHouseClaims: false
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('policy-start-date');
      });
    });

    describe('page controls', () => {
      it('renders the floating toolbar', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                previousHouseClaims: false
              }
            }
          }
        };

        renderHouse(state);

        expectRendered('floating-toolbar');
      });

      it('renders the footer when the page is valid', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            houseQuote: {
              ...getDefaultQuoteHouseState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                previousHouseClaims: false
              }
            },

            sharedQuote: {
              ...getDefaultQuoteSharedState(),
              policyStartDate: moment()
                .add(1, 'days')
                .toLocaleString()
            }
          }
        };

        renderHouse(state);

        expectRendered('form-footer');
      });

      it('renders the reference number component', () => {
        renderHouse();

        expectRendered('reference-number');
      });
    });
  });

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

    describe('address', () => {
      it('renders the address lookup', () => {
        renderLandlord();

        expectRendered('house-quote-address-lookup');
      });

      it('does not render construction details without an address', () => {
        renderLandlord();

        expectNotRendered('construction-details');
      });

      it('renders construction details when an address is available', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderLandlord(state);

        expectRendered('construction-details');
      });
    });

    describe('sum insured', () => {
      it('does not render sum insured while the Cordell value is loading', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                cordellValueLoading: true
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('sum-insured-amount');
      });

      it('renders sum insured when the Cordell value has loaded', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderLandlord(state);

        expectRendered('sum-insured-amount');
      });
    });

    describe('property age and natural hazard', () => {
      it('does not render reroofed, relined and rewired for the default property', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('reroofed-relined-rewired');
      });

      it('renders reroofed, relined and rewired for an older property', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                yearBuilt: 1930
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('reroofed-relined-rewired');
      });

      it('does not render natural hazard for an older property', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                yearBuilt: 1930
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('natural-hazard');
      });

      it('renders natural hazard when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderLandlord(state);

        expectRendered('natural-hazard');
      });
    });

    describe('external self-contained unit', () => {
      it('does not render an external self-contained unit when the property is at risk from natural hazard', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                propertyAtRiskFromNaturalHazardInd: true
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('external-self-contained-unit');
      });

      it('renders an external self-contained unit when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderLandlord(state);

        expectRendered('external-self-contained-unit');
      });
    });

    describe('rental occupancy', () => {
      it('does not render house rented tenants when there are multiple self-contained units', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units2'
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('house-rented-tenants');
      });

      it('renders house rented tenants when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,
              houseDetails: completedHouseQuote.houseDetails
            }
          }
        };

        renderLandlord(state);

        expectRendered('house-rented-tenants');
      });

      it('renders holiday home rented when the rental conditions are met', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants'
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('holiday-home-rented');
      });
    });

    describe('business', () => {
      it('does not render house used for business when the rental condition is not met', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                houseOccupancy: null as string
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('house-used-for-business');
      });

      it('renders house used for business when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('house-used-for-business');
      });

      it('does not render type of business when business is not conducted', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('type-of-business');
      });

      it('renders type of business when business is conducted', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                businessConductedInd: true,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('type-of-business');
      });
    });

    describe('owner and claims', () => {
      it('renders owner details when applicable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('owner-details');
      });

      it('does not render previous house claims when owner details are unavailable', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                ownerDetails: null as string,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('previous-house-claims');
      });

      it('renders previous house claims when owner details are available', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('previous-house-claims');
      });

      it('does not render policy start date when there are previous house claims', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false,
                previousHouseClaims: true
              }
            }
          }
        };

        renderLandlord(state);

        expectNotRendered('policy-start-date');
      });

      it('renders policy start date when there are no previous house claims', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false,
                previousHouseClaims: false
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('policy-start-date');
      });
    });

    describe('page controls', () => {
      it('renders the floating toolbar', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false,
                previousHouseClaims: false
              }
            }
          }
        };

        renderLandlord(state);

        expectRendered('floating-toolbar');
      });

      it('renders the footer when the page is valid', () => {
        const state = {
          ...initialState,

          myForms: {
            ...initialState.myForms,

            landlordQuote: {
              ...getDefaultQuoteLandlordsState(),
              policyNumber: '12345',
              address: completedHouseQuote.address,

              houseDetails: {
                ...completedHouseQuote.houseDetails,
                numberOfSelfContainedUnits: 'units1',
                houseRentedTenants: 'tenants',
                holidayHomeRented: false,
                previousHouseClaims: false
              }
            },

            sharedQuote: {
              ...getDefaultQuoteSharedState(),
              policyStartDate: moment()
                .add(1, 'days')
                .toLocaleString()
            }
          }
        };

        renderLandlord(state);

        expectRendered('form-footer');
      });

      it('renders the reference number component', () => {
        renderLandlord();

        expectRendered('reference-number');
      });
    });
  });
});