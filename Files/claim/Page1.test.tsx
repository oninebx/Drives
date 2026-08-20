import { screen, waitFor } from '@testing-library/dom';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationState } from '~/root/rootReducer';
import { getDefaultClaimCarState } from '../state';
import Page1 from './Page1';

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

  it('should render the claim number and status', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByText('Your claim number: ABC123')).toBeInTheDocument();
    expect(screen.getByText('Not submitted')).toBeInTheDocument();
  });

  it('should render the pre steps summary with the correct details', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 2, name: 'headings.page1' })).toBeInTheDocument();
    expect(screen.getByText('15/01/2025 at 3:45 pm')).toBeInTheDocument();
    expect(screen.getByText('preStepsSummary.causeLabels.accidentWhileDrivingAnimal')).toBeInTheDocument();
  });

  it('should render the event location', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByText('headings.accidentInformation')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 5, name: 'eventLocation.accidentWhileDriving.search.title' })
    ).toBeInTheDocument();
    expect(screen.getByText('eventLocation.accidentWhileDriving.search.description')).toBeInTheDocument();
  });

  it('should render the event description', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 5, name: 'page1.eventDescription.title' })).toBeInTheDocument();
    expect(screen.getByText('page1.eventDescription.description')).toBeInTheDocument();
  });

  describe('theft section', () => {
    it('should not render the theft section if COL not theft', async () => {
      renderComponent(<Page1 />, { initialState });
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'theft.carLastSeen.title' })).not.toBeInTheDocument();
      });
    });

    it('should render the theft sections if COL theft', async () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
              causeOfLoss: 'stolen',
              secondaryCauseOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;
      renderComponent(<Page1 />, { initialState: newState });
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'theft.carLastSeen.title' })).toBeInTheDocument();
      });
    });
  });

  describe('your driver section', () => {
    it('should not render the your driver section if not car and scol not vehicle related', () => {
      renderComponent(<Page1 />, { initialState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.yourDriver' })).not.toBeInTheDocument();
    });

    it('should render the your driver section if care and scol vehicle related', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
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
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.getByRole('heading', { level: 2, name: 'headings.yourDriver' })).toBeInTheDocument();
      expect(screen.getByText('driverDetails.accidentMotorDriver.description')).toBeInTheDocument();
    });
  });

  describe('other driver section', () => {
    it('should not render the other driver section if the claim type is not car and scol is not vehicle related', () => {
      renderComponent(<Page1 />, { initialState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.otherDriverDetails' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.driverDetails' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 5, name: 'otherDrivers.title' })).not.toBeInTheDocument();
    });

    it('should render the driver section with other driver details if car & scol multivehicle', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
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
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.driverDetails' })).not.toBeInTheDocument();

      expect(screen.getByRole('heading', { level: 2, name: 'headings.otherDriverDetails' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'otherDrivers.title' })).toBeInTheDocument();
    });

    it('should render the driver section with other driver details if car & scol hitByAnotherVehicle', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
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
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.otherDriverDetails' })).not.toBeInTheDocument();

      expect(screen.getByRole('heading', { level: 2, name: 'headings.driverDetails' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'otherDrivers.title' })).toBeInTheDocument();
    });
  });

  describe('OtherPersonDetails', () => {
    it('should not render the otherPersonDetails if col & scol dont match', () => {
      renderComponent(<Page1 />, { initialState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.otherPeopleDetails' })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { level: 5, name: 'otherPeopleDetails.otherDetails.title' })
      ).not.toBeInTheDocument();
    });
    it('should render the otherPersonDetails if col & scol match', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
              causeOfLoss: 'damagedWhileParked',
              secondaryCauseOfLoss: 'other'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.getByRole('heading', { level: 2, name: 'headings.otherPeopleDetails' })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 5, name: 'otherPeopleDetails.otherDetails.title' })
      ).toBeInTheDocument();
    });
  });

  describe('FireAuthroirtyReport', () => {
    it('should not render the fire authority report section if scol not fire', () => {
      renderComponent(<Page1 />, { initialState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.fire' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 5, name: 'didFireServiceAttend.title' })).not.toBeInTheDocument();
    });

    it('should render the fire authority report section if scol fire', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
              causeOfLoss: 'damagedWhileParked',
              secondaryCauseOfLoss: 'fire'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.getByRole('heading', { level: 2, name: 'headings.fire' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'didFireServiceAttend.title' })).toBeInTheDocument();
    });
  });

  describe('PoliceAttend & AuthorityReportPolice', () => {
    it('should not render the PoliceAttend or AuthorityReportPoliceSection if not vehicle accident or theft', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
              causeOfLoss: 'naturalDisaster',
              secondaryCauseOfLoss: 'weather'
            }
          },
          sharedClaim: {
            claimType: 'car'
          }
        }
      } as Partial<ApplicationState>;
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.police' })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { level: 5, name: 'policeAttend.policeAttended.title' })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 5, name: 'reportedToPolice.title' })).not.toBeInTheDocument();
    });

    it('should not render PoliceAttend if AuthorityReportPolice is shown', () => {
      renderComponent(<Page1 />, { initialState });
      expect(
        screen.queryByRole('heading', { level: 5, name: 'policeAttend.policeAttended.title' })
      ).not.toBeInTheDocument();

      expect(screen.getByRole('heading', { level: 2, name: 'headings.police' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'reportedToPolice.title' })).toBeInTheDocument();
    });

    it('should render AuthorityReportPolice and PoliceAttend', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
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

      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.getByRole('heading', { level: 5, name: 'reportedToPolice.title' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'headings.police' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'policeAttend.policeAttended.title' })).toBeInTheDocument();
    });
  });

  describe('WitnessQuestions', () => {
    it('should not render the witness questions if the scol and col are weather related', () => {
      const newState = {
        ...initialState,
        myForms: {
          carClaim: {
            ...initialState.myForms.carClaim,
            eisClaim: {
              ...initialState.myForms.carClaim.eisClaim,
              causeOfLoss: 'naturalDisaster',
              secondaryCauseOfLoss: 'weather'
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
      renderComponent(<Page1 />, { initialState: newState });
      expect(screen.queryByRole('heading', { level: 2, name: 'headings.witnesses' })).not.toBeInTheDocument();
    });

    it('should render the witness questions if the scol and col are not weather related', () => {
      renderComponent(<Page1 />, { initialState });
      expect(screen.getByRole('heading', { level: 2, name: 'headings.witnesses' })).toBeInTheDocument();
    });
  });
});
