import * as React from 'react';
import Page1Container from './Page1';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { screen } from '@testing-library/dom';
import type { ApplicationState } from '~/root/rootReducer';
import { getDefaultQuoteHouseState } from '../state';
import { getDefaultQuoteLandlordsState } from '../../landlord/state';
import { completedHouseQuote } from '../state/__mocks__/houseTestData';
import { getDefaultQuoteState } from '../../state';
import { getDefaultQuoteSharedState } from '../../shared/state';
import { moment } from '~/common/twr-moment/twr-moment';

// ============================================================================
// Performance Optimization: Mock heavy dependencies to avoid full page rendering
// ============================================================================

/**
 * Mock translation to return the key as-is.
 * This allows sub-components to render predictable text that matches
 * existing test assertions without initializing the full i18n engine.
 */
jest.mock('~/common/utilities/translation', () => ({
  translate: (namespaces?: string[]) => (Component: React.ComponentType<any>) => {
    const WrappedComponent = (props: any) => (
      <Component {...props} t={(key: string) => key} />
    );
    WrappedComponent.displayName = `Translate(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
  useTranslation: () => ({ t: (key: string) => key }),
}));

/**
 * Mock react-redux-form Form to avoid heavy form store initialization.
 * We preserve the children and standard form attributes so that
 * query selectors for buttons/headings inside the form still work.
 */
jest.mock('react-redux-form', () => {
  const actual = jest.requireActual('react-redux-form');
  return {
    ...actual,
    Form: React.forwardRef<any, any>(({ children, model, ...rest }, ref) => (
      <form ref={ref} data-model={model} {...rest}>{children}</form>
    )),
  };
});

/**
 * Mock the heavy view-model hook.
 * This is the primary performance bottleneck — the real hook performs
 * complex state derivation and side-effects. By mocking it we keep
 * component rendering logic under test while skipping the heavy lifting.
 *
 * Coverage note: useHousePage1ViewModel should have its own unit tests
 * in useHousePage1ViewModel.test.ts to ensure logic coverage.
 */
jest.mock('./useHousePage1ViewModel', () => ({
  useHousePage1ViewModel: jest.fn(),
}));

import { useHousePage1ViewModel } from './useHousePage1ViewModel';
const mockedUseHousePage1ViewModel = useHousePage1ViewModel as jest.Mock;

// ============================================================================
// ViewModel Mock Helpers
// ============================================================================

interface ViewModelOverrides {
  loading?: boolean;
  houseOrLandlord?: 'house' | 'landlord';
  actualState?: any;
  heading?: string;
  awardsEnabled?: boolean;
  awards?: any[];
  hazardDataEnabled?: boolean;
  formSubmitted?: boolean;
  holidayHomeRentedValidationValue?: any;
  modelPath?: string;
  formModelPath?: string;
  [key: string]: any;
}

const createDefaultViewModel = (overrides: ViewModelOverrides = {}) => ({
  setPolicies: jest.fn(),
  setOwnerDetails: jest.fn(),
  loadHouseOrLandlordExcesses: jest.fn(),
  changeModelPath: jest.fn(),
  handleLandlordTransition: jest.fn(),
  handleFormFooterSubmit: jest.fn(),
  loadHazardDataValues: jest.fn(),
  triggerGAEvents: jest.fn(),
  loading: false,
  houseOrLandlord: 'house' as const,
  modelPath: 'myForms.houseQuote',
  formModelPath: 'myForms.houseQuote.houseDetails',
  heading: 'heading.page1',
  awardsEnabled: false,
  awards: [],
  actualState: getDefaultQuoteHouseState(),
  hazardDataEnabled: false,
  formSubmitted: false,
  holidayHomeRentedValidationValue: null,
  ...overrides,
});

// ============================================================================
// Test Data
// ============================================================================

describe('House page1', () => {
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

  beforeEach(() => {
    mockedUseHousePage1ViewModel.mockReturnValue(createDefaultViewModel());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==============================================================================
  // House Flow
  // ==============================================================================
  describe('house', () => {
    it('should render the page', () => {
      renderComponent(<Page1Container />, { initialState });
      expect(screen.getByRole('heading', { level: 1, name: 'heading.page1' })).toBeInTheDocument();
    });

    // Question 1
    it('should render the address lookup', () => {
      renderComponent(<Page1Container />, { initialState });
      expect(screen.getByRole('heading', { level: 3, name: 'propertyType_address.title' })).toBeInTheDocument();
      expect(screen.getByText('propertyType_address.description')).toBeInTheDocument();
    });

    it('should not render the constructionDetails question', () => {
      renderComponent(<Page1Container />, { initialState, translationData });
      expect(screen.queryByRole('heading', { level: 4, name: 'constructionDetails.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('constructionDetails.description')).not.toBeInTheDocument();
    });

    // @TODO Remove the conditions for the PropertyType questions QQ-3498

    it('should not render the propertyType question', () => {
      renderComponent(<Page1Container />, { initialState, translationData });
      expect(
        screen.queryByRole('heading', { level: 3, name: 'propertyTypes.typeOfProperty.title' })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('propertyTypes.typeOfProperty.description')).not.toBeInTheDocument();
    });

    it('should render the propertyType question', () => {
      const newState = {
        ...initialState,
        flags: { 'q2b-property-types': true },
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'propertyTypes.typeOfProperty.title' })).toBeInTheDocument();
      expect(screen.getByText('propertyTypes.typeOfProperty.description')).toBeInTheDocument();
    });

    it('should render the propertyStacked question', () => {
      const newState = {
        ...initialState,
        flags: { 'q2b-property-types': true },
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              propertyType: { type: 'Townhouse', share: null },
            },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 4, name: 'propertyTypes.propertyStacked.title' }));
    });

    it('should render the PropertySelfSufficient question', () => {
      const newState = {
        ...initialState,
        flags: { 'q2b-property-types': true },
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              propertyType: { type: 'Tinyhouse', selfSufficientTinyhouse: null },
            },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 4, name: 'propertyTypes.propertySelfSufficient.title' }));
    });

    it('should render the propertyConnected question', () => {
      const newState = {
        ...initialState,
        flags: { 'q2b-property-types': true },
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              propertyType: { type: 'Townhouse', share: false, connected: null },
            },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 4, name: 'propertyTypes.propertyConnected.title' }));
    });

    // Question 2
    it('should render the contructionDetails question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );

      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(
        screen.getByRole('heading', { level: 3, name: '17E Watson Avenue, Sandringham, Auckland, 1025' })
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'constructionDetails.title' })).toBeInTheDocument();
      expect(screen.getByText('constructionDetails.description')).toBeInTheDocument();
    });

    it('should not render the sumInsured question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, cordellValueLoading: true },
          },
        })
      );

      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'sumInsuredAmount.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('sumInsuredAmount.description')).not.toBeInTheDocument();
    });

    // @TODO add test & negative test for PropertyStacked once predicate & conditional rendering has been set up QQ-3575
    // @TODO add test & negative test for PropertyConnected once predicate & conditional rendering has been set up QQ-3575
    // @TODO add test & negative test for PropertySelfSufficient once predicate & conditional rendering has been set up QQ-3575

    // Question 3
    it('should render the sumInsured question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'sumInsuredAmount.title' })).toBeInTheDocument();
      expect(screen.getByText('sumInsuredAmount.description')).toBeInTheDocument();
    });

    it('should not render refoofedRelinedRewired question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'reroofedRelinedRewired.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('reroofedRelinedRewired.description')).not.toBeInTheDocument();
    });

    // Question 4
    it('should render the refoofedRelinedRewired question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, yearBuilt: 1930 },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'reroofedRelinedRewired.title' })).toBeInTheDocument();
      expect(screen.getByText('reroofedRelinedRewired.description')).toBeInTheDocument();
    });

    it('should not render the NaturalHazard question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, yearBuilt: 1930 },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'naturalHazard.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('naturalHazard.description')).not.toBeInTheDocument();
    });

    // Question 5
    it('should render NaturalHazard question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'naturalHazard.title' })).toBeInTheDocument();
      expect(screen.getByText('naturalHazard.description')).toBeInTheDocument();
    });

    it('should not render ExternalSelfContainedUnit question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, propertyAtRiskFromNaturalHazardInd: true },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(
        screen.queryByRole('heading', { level: 3, name: 'externalSelfContainedUnit.title' })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('externalSelfContainedUnit.description')).not.toBeInTheDocument();
    });

    // Question 6
    it('should render ExternalSelfContainedUnit question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'externalSelfContainedUnit.title' })).toBeInTheDocument();
      expect(screen.getByText('externalSelfContainedUnit.description')).toBeInTheDocument();
    });

    it('should not render HouseOccupancy question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, numberOfSelfContainedUnits: 'units2' },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'houseOccupancy.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('houseOccupancy.description')).not.toBeInTheDocument();
    });

    // Question 7
    it('should render houseOccupancy question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'houseOccupancy.title' })).toBeInTheDocument();
      expect(screen.getByText('houseOccupancy.description')).toBeInTheDocument();
    });

    it('should not render HomeUsedForBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, houseOccupancy: null },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'houseUsedForBusiness.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('houseUsedForBusiness.description')).not.toBeInTheDocument();
    });

    // Question 8
    it('should render HomeUsedForBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'houseUsedForBusiness.title' })).toBeInTheDocument();
      expect(screen.getByText('houseUsedForBusiness.description')).toBeInTheDocument();
    });

    it('should not render TypeOfBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'typeOfBusiness.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('typeOfBusiness.description')).not.toBeInTheDocument();
    });

    // Question 9
    it('should render TypeOfBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, businessConductedInd: true },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'typeOfBusiness.title' })).toBeInTheDocument();
      expect(screen.getByText('typeOfBusiness.description')).toBeInTheDocument();
    });

    // Question 10
    it('should render the OwnerDateOfBirth question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'ownerDateOfBirth.title' })).toBeInTheDocument();
      expect(screen.getByText('ownerDateOfBirth.description')).toBeInTheDocument();
    });

    it('should not render the PreviousHouseClaims question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, ownerDetails: null },
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'previousHouseClaims.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('previousHouseClaims.description')).not.toBeInTheDocument();
    });

    // Question 10
    it('should render the PreviousHouseClaims question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'previousHouseClaims.title' })).toBeInTheDocument();
      expect(screen.getByText('previousHouseClaims.description')).toBeInTheDocument();
    });

    it('should not render the PolicyStartDate question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: true
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: true,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.queryByRole('heading', { level: 3, name: 'policyStartDate.title' })).not.toBeInTheDocument();
    });

    // Question 10
    it('should render the PolicyStartDate question', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: false
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByRole('heading', { level: 3, name: 'policyStartDate.title' })).toBeInTheDocument();
    });

    it('should render the floating toolbar', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: false
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByText('button.finishLater')).toBeInTheDocument();
    });

    it('should render the footer', () => {
      const newState = {
        ...initialState,
        myForms: {
          houseQuote: {
            ...getDefaultQuoteHouseState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: false
          },
          sharedQuote: {
            ...getDefaultQuoteSharedState(),
            policyStartDate: moment().add(1, 'days').toLocaleString()
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          actualState: {
            ...getDefaultQuoteHouseState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, { initialState: newState, translationData });
      expect(screen.getByText('button.nextCustomise')).toBeInTheDocument();
    });
  });

  // ==============================================================================
  // Landlord Flow
  // ==============================================================================
  describe('landlord', () => {
    it('should render the page - landlord', () => {
      renderComponent(<Page1Container />, {
        initialState,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 1, name: 'heading.page1' })).toBeInTheDocument();
    });

    // Question 1
    it('should render the address lookup - landlord', () => {
      renderComponent(<Page1Container />, {
        initialState,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'propertyType_address.title' })).toBeInTheDocument();
      expect(screen.getByText('propertyType_address.description')).toBeInTheDocument();
    });

    it('should not render the constructionDetails question', () => {
      renderComponent(<Page1Container />, {
        initialState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 4, name: 'constructionDetails.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('constructionDetails.description')).not.toBeInTheDocument();
    });

    // Question 2
    it('should render the contructionDetails question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );

      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });

      expect(
        screen.getByRole('heading', { level: 3, name: '17E Watson Avenue, Sandringham, Auckland, 1025' })
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'constructionDetails.title' })).toBeInTheDocument();
      expect(screen.getByText('constructionDetails.description')).toBeInTheDocument();
    });

    it('should not render the sumInsured question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, cordellValueLoading: true },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'sumInsuredAmount.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('sumInsuredAmount.description')).not.toBeInTheDocument();
    });

    // Question 3
    it('should render the sumInsured question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'sumInsuredAmount.title' })).toBeInTheDocument();
      expect(screen.getByText('sumInsuredAmount.description')).toBeInTheDocument();
    });

    it('should not render refoofedRelinedRewired question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'reroofedRelinedRewired.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('reroofedRelinedRewired.description')).not.toBeInTheDocument();
    });

    // Question 4
    it('should render the refoofedRelinedRewired question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, yearBuilt: 1930 },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'reroofedRelinedRewired.title' })).toBeInTheDocument();
      expect(screen.getByText('reroofedRelinedRewired.description')).toBeInTheDocument();
    });

    it('should not render the NaturalHazard question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, yearBuilt: 1930 },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'naturalHazard.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('naturalHazard.description')).not.toBeInTheDocument();
    });

    // Question 5
    it('should render NaturalHazard question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'naturalHazard.title' })).toBeInTheDocument();
      expect(screen.getByText('naturalHazard.description')).toBeInTheDocument();
    });

    it('should not render ExternalSelfContainedUnit question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, propertyAtRiskFromNaturalHazardInd: true },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(
        screen.queryByRole('heading', { level: 3, name: 'externalSelfContainedUnit.title' })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('externalSelfContainedUnit.description')).not.toBeInTheDocument();
    });

    // Question 6
    it('should render ExternalSelfContainedUnit question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'externalSelfContainedUnit.title' })).toBeInTheDocument();
      expect(screen.getByText('externalSelfContainedUnit.description')).toBeInTheDocument();
    });

    it('should not render HouseOccupancy question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, numberOfSelfContainedUnits: 'units2' },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'houseOccupancy.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('houseOccupancy.description')).not.toBeInTheDocument();
    });

    it('should render houseOccupancy question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, numberOfSelfContainedUnits: 'units2' },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'houseRentedTenants.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('houseRentedTenants.description')).not.toBeInTheDocument();
    });

    // Question 7
    it('should render houseOccupancy question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: completedHouseQuote.houseDetails,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'houseRentedTenants.title' })).toBeInTheDocument();
      expect(screen.getByText('houseRentedTenants.description')).toBeInTheDocument();
    });

    it('should not render HomeUsedForBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: { ...completedHouseQuote.houseDetails, houseOccupancy: null },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'houseUsedForBusiness.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('houseUsedForBusiness.description')).not.toBeInTheDocument();
    });

    it('should render the holidayHomeRented question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });

      expect(screen.getByRole('heading', { level: 3, name: 'holidayHomeRented.title' })).toBeInTheDocument();
      expect(screen.getByText('holidayHomeRented.description')).toBeInTheDocument();
    });

    // Question 8
    it('should render HomeUsedForBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'houseUsedForBusiness.title' })).toBeInTheDocument();
      expect(screen.getByText('houseUsedForBusiness.description')).toBeInTheDocument();
    });

    it('should not render TypeOfBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'typeOfBusiness.title' })).not.toBeInTheDocument();
      expect(screen.queryByText('typeOfBusiness.description')).not.toBeInTheDocument();
    });

    // Question 9
    it('should render TypeOfBusiness question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              businessConductedInd: true,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'typeOfBusiness.title' })).toBeInTheDocument();
      expect(screen.getByText('typeOfBusiness.description')).toBeInTheDocument();
    });

    // Question 10
    it('should render the OwnerDateOfBirth question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'ownerDateOfBirth.title' })).toBeInTheDocument();
      expect(screen.getByText('ownerDateOfBirth.description')).toBeInTheDocument();
    });

    it('should not render the PreviousHouseClaims question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              ownerDetails: null,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(
        screen.queryByRole('heading', { level: 3, name: 'previousHouseClaimsLandlord.title' })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('previousHouseClaimsLandlord.description')).not.toBeInTheDocument();
    });

    // Question 10
    it('should render the PreviousHouseClaims question', () => {
      const newState = {
        ...initialState,
        myForms: {
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
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'previousHouseClaimsLandlord.title' })).toBeInTheDocument();
      expect(screen.getByText('previousHouseClaimsLandlord.description')).toBeInTheDocument();
    });

    it('should not render the PolicyStartDate question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false
            },
            previousHouseClaims: true
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
            previousHouseClaims: true,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'policyStartDate.title' })).not.toBeInTheDocument();
    });

    // Question 10
    it('should render the PolicyStartDate question', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false
            },
            previousHouseClaims: false
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByRole('heading', { level: 3, name: 'policyStartDate.title' })).toBeInTheDocument();
    });

    it('should render the floating toolbar', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false
            },
            previousHouseClaims: false
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByText('button.finishLater')).toBeInTheDocument();
    });

    it('should render the footer', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false
            },
            previousHouseClaims: false
          },
          sharedQuote: {
            ...getDefaultQuoteSharedState(),
            policyStartDate: moment().add(1, 'days').toLocaleString()
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });
      expect(screen.getByText('button.nextCustomise')).toBeInTheDocument();
    });

    it('should render the reference component', () => {
      const newState = {
        ...initialState,
        myForms: {
          landlordQuote: {
            ...getDefaultQuoteLandlordsState(),
            policyNumber: '12345',
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false
            },
            previousHouseClaims: false
          }
        }
      };
      mockedUseHousePage1ViewModel.mockReturnValue(
        createDefaultViewModel({
          houseOrLandlord: 'landlord',
          actualState: {
            ...getDefaultQuoteLandlordsState(),
            address: completedHouseQuote.address,
            houseDetails: {
              ...completedHouseQuote.houseDetails,
              numberOfSelfContainedUnits: 'units1',
              houseRentedTenants: 'tenants',
              holidayHomeRented: false,
            },
            previousHouseClaims: false,
          },
        })
      );
      renderComponent(<Page1Container />, {
        initialState: newState,
        translationData,
        initialUrl: 'https://localhost:8080/quote/landlord/page1',
        initialRoute: '/quote/landlord/page1'
      });

      expect(screen.getByText('Your reference number:')).toBeInTheDocument();
    });
  });
});
