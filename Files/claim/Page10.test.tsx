import { screen } from '@testing-library/react';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationState } from '~/root/rootReducer';
import { getDefaultClaimCarState } from '../state';
import Page1 from './Page1';

/**
 * Mock child components.
 *
 * Page1 is responsible for deciding whether these components
 * should be rendered. Their own implementation is tested separately.
 */

jest.mock('~/feature/claim/car/components', () => ({
  AuthorityReportFire: () => <div data-testid="AuthorityReportFire" />,
  AuthorityReportPolice: () => <div data-testid="AuthorityReportPolice" />,
  OtherDrivers: () => <div data-testid="OtherDrivers" />
}));

jest.mock('~/feature/claim/car/components/dumb', () => ({
  DriverDetails: () => <div data-testid="DriverDetails" />,
  OtherPeopleDetail: () => <div data-testid="OtherPeopleDetail" />,
  PoliceAttend: () => <div data-testid="PoliceAttend" />,
  TheftSection1: () => <div data-testid="TheftSection1" />,
  TheftSection2: () => <div data-testid="TheftSection2" />
}));

jest.mock('~/feature/claim/shared/components', () => ({
  EventDescription: () => <div data-testid="EventDescription" />,
  EventLocation: () => <div data-testid="EventLocation" />,
  FloatingToolbar: () => <div data-testid="FloatingToolbar" />,
  FormFooter: () => <div data-testid="FormFooter" />,
  PreStepsSummary: ({
    causeOfLoss,
    secondaryCauseOfLoss,
    lossDateTime
  }: {
    causeOfLoss: string;
    secondaryCauseOfLoss: string | null;
    lossDateTime: Date;
  }) => (
    <div data-testid="PreStepsSummary">
      <span>
        {lossDateTime.toLocaleDateString('en-NZ')} at{' '}
        {lossDateTime.toLocaleTimeString('en-NZ', {
          hour: 'numeric',
          minute: '2-digit'
        })}
      </span>
      <span>
        {`preStepsSummary.causeLabels.${causeOfLoss}${
          secondaryCauseOfLoss
            ? secondaryCauseOfLoss.charAt(0).toUpperCase() + secondaryCauseOfLoss.slice(1)
            : ''
        }`}
      </span>
    </div>
  ),
  WitnessSection: () => <div data-testid="WitnessSection" />
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
  ClaimNumber: ({ claimNumber }: { claimNumber: string }) => (
    <div data-testid="ClaimNumber">Your claim number: {claimNumber}</div>
  )
}));

/**
 * Form itself is not part of Page1's responsibility.
 * Mock it so Page1 tests only exercise Page1 rendering logic.
 */
jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Page1', () => {
  const initialState = {
    myForms: {
      carClaim: {
        ...getDefaultClaimCarState(),
        eisClaim: {
          claimNumber: 'ABC123',
          lossDate: new Date('2025-01-15T02:45:00.000Z'),
          causeOfLoss: 'accidentWhileDriving',
          secondaryCauseOfLoss: 'animal'
        },
        policeAttendDetails: {
          policeAttended: false,
          anyoneCharged: null,
          testedForAlcoholOrDrug: null
        }
      }
    }
  } as Partial<ApplicationState>;

  const renderPage = (state: Partial<ApplicationState> = initialState) => {
    renderComponent(<Page1 />, {
      initialState: state
    });
  };

  describe('basic page rendering', () => {
    it('should render the claim number and status', () => {
      renderPage();

      expect(screen.getByText('Your claim number: ABC123')).toBeInTheDocument();
      expect(screen.getByText('Not submitted')).toBeInTheDocument();
    });

    it('should render the page heading', () => {
      renderPage();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.page1'
        })
      ).toBeInTheDocument();
    });

    it('should render the pre steps summary', () => {
      renderPage();

      expect(screen.getByTestId('PreStepsSummary')).toBeInTheDocument();
      expect(screen.getByText('15/01/2025 at 3:45 pm')).toBeInTheDocument();
      expect(
        screen.getByText(
          'preStepsSummary.causeLabels.accidentWhileDrivingAnimal'
        )
      ).toBeInTheDocument();
    });

    it('should render event location', () => {
      renderPage();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.accidentInformation'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('EventLocation')
      ).toBeInTheDocument();
    });

    it('should render event description', () => {
      renderPage();

      expect(
        screen.getByTestId('EventDescription')
      ).toBeInTheDocument();
    });

    it('should render the form footer', () => {
      renderPage();

      expect(
        screen.getByTestId('FormFooter')
      ).toBeInTheDocument();
    });

    it('should render the floating toolbar', () => {
      renderPage();

      expect(
        screen.getByTestId('FloatingToolbar')
      ).toBeInTheDocument();
    });
  });

  describe('theft section', () => {
    it('should not render the theft section if COL is not theft', () => {
      renderPage();

      expect(
        screen.queryByTestId('TheftSection1')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('TheftSection2')
      ).not.toBeInTheDocument();
    });

    it('should render both theft sections if COL is theft', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'stolen',
              secondaryCauseOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByTestId('TheftSection1')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('TheftSection2')
      ).toBeInTheDocument();
    });
  });

  describe('your driver section', () => {
    it('should not render the your driver section if conditions are not met', () => {
      renderPage();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.yourDriver'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('DriverDetails')
      ).not.toBeInTheDocument();
    });

    it('should render the your driver section when conditions are met', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'accidentWhileDriving',
              secondaryCauseOfLoss: 'multipleVehicles'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        },
        common: {
          customer: {
            firstName: 'Bob',
            lastName: 'Smith',
            emails: [{ emailAddress: 'bobSmith@gmail.com' }],
            phones: [{ phoneNumber: '000123456789' }]
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.yourDriver'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('DriverDetails')
      ).toBeInTheDocument();
    });
  });

  describe('other driver section', () => {
    it('should not render the other driver section if conditions are not met', () => {
      renderPage();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.otherDriverDetails'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.driverDetails'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('OtherDrivers')
      ).not.toBeInTheDocument();
    });

    it('should render otherDriverDetails when another driver is involved', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'accidentWhileDriving',
              secondaryCauseOfLoss: 'multipleVehicles'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        },
        common: {
          customer: {
            firstName: 'Bob',
            lastName: 'Smith',
            emails: [{ emailAddress: 'bobSmith@gmail.com' }],
            phones: [{ phoneNumber: '000123456789' }]
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.otherDriverDetails'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('OtherDrivers')
      ).toBeInTheDocument();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.driverDetails'
        })
      ).not.toBeInTheDocument();
    });

    it('should render driverDetails when another driver is not involved', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'accidentWhileDriving',
              secondaryCauseOfLoss: 'hitByAnotherVehicle'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        },
        common: {
          customer: {
            firstName: 'Bob',
            lastName: 'Smith',
            emails: [{ emailAddress: 'bobSmith@gmail.com' }],
            phones: [{ phoneNumber: '000123456789' }]
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.driverDetails'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('OtherDrivers')
      ).toBeInTheDocument();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.otherDriverDetails'
        })
      ).not.toBeInTheDocument();
    });
  });

  describe('other person details', () => {
    it('should not render other person details when conditions are not met', () => {
      renderPage();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.otherPeopleDetails'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('OtherPeopleDetail')
      ).not.toBeInTheDocument();
    });

    it('should render other person details when conditions are met', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'damagedWhileParked',
              secondaryCauseOfLoss: 'other'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.otherPeopleDetails'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('OtherPeopleDetail')
      ).toBeInTheDocument();
    });
  });

  describe('fire authority report', () => {
    it('should not render fire authority report when conditions are not met', () => {
      renderPage();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.fire'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('AuthorityReportFire')
      ).not.toBeInTheDocument();
    });

    it('should render fire authority report when conditions are met', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'damagedWhileParked',
              secondaryCauseOfLoss: 'fire'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.fire'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('AuthorityReportFire')
      ).toBeInTheDocument();
    });
  });

  describe('police sections', () => {
    it('should not render police section when neither police section is required', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'naturalDisaster',
              secondaryCauseOfLoss: 'weather'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.police'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('PoliceAttend')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('AuthorityReportPolice')
      ).not.toBeInTheDocument();
    });

    it('should render authority report police without police attend', () => {
      renderPage();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.police'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('AuthorityReportPolice')
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('PoliceAttend')
      ).not.toBeInTheDocument();
    });

    it('should render police attend without authority report police', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'accidentWhileDriving',
              secondaryCauseOfLoss: 'multipleVehicles'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        },
        common: {
          customer: {
            firstName: 'Bob',
            lastName: 'Smith',
            emails: [{ emailAddress: 'bobSmith@gmail.com' }],
            phones: [{ phoneNumber: '000123456789' }]
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.police'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('PoliceAttend')
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('AuthorityReportPolice')
      ).not.toBeInTheDocument();
    });

    it('should render both police attend and authority report police', () => {
      /**
       * This combination explicitly covers:
       *
       * showPoliceAttend === true
       * showAuthorityReport === true
       */
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'accidentWhileDriving',
              secondaryCauseOfLoss: 'multipleVehicles'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        },
        common: {
          customer: {
            firstName: 'Bob',
            lastName: 'Smith',
            emails: [{ emailAddress: 'bobSmith@gmail.com' }],
            phones: [{ phoneNumber: '000123456789' }]
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.police'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('PoliceAttend')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('AuthorityReportPolice')
      ).toBeInTheDocument();
    });
  });

  describe('witness section', () => {
    it('should not render witness questions when conditions are not met', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms!.carClaim,
            eisClaim: {
              ...initialState.myForms!.carClaim!.eisClaim,
              causeOfLoss: 'naturalDisaster',
              secondaryCauseOfLoss: 'weather'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;

      renderPage(newState);

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'headings.witnesses'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('WitnessSection')
      ).not.toBeInTheDocument();
    });

    it('should render witness questions when conditions are met', () => {
      renderPage();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'headings.witnesses'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('WitnessSection')
      ).toBeInTheDocument();
    });
  });
});