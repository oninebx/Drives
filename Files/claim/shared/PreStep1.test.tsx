import { fireEvent, screen } from '@testing-library/dom';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationState } from '~/root/rootReducer';
import { PreStep1 } from '..';
import { testPolicies } from '../../state/claimTestData';
import userEvent from '@testing-library/user-event';
import { CAUSE_OF_LOSS_ESCAPE_OF_WATER } from '~/feature/claim/shared/state/constants';

const initialisePreStep1Mock = jest.fn(() => ({
  type: 'INITIALISE_PRE_STEP1'
}));

jest.mock('~/feature/claim/shared/state/thunks', () => ({
  ...jest.requireActual('~/feature/claim/shared/state/thunks'),
  initialisePreStep1: (...args: any[]) => initialisePreStep1Mock(...args)
}));

describe('Prestep1', () => {
  afterAll(() => {
    localStorage.clear();
  });

  const props: React.ComponentProps<typeof PreStep1> = {};
  it('should render correctly initially if there is NO id (PolicyNumber) provided', () => {
    localStorage.setItem('access_token', 'IAMTOPSECRET');

    const initialState = {
      myForms: {
        sharedClaim: {
          policies: testPolicies,
          contents: {
            causeOfLoss: null
          },
          house: {
            causeOfLoss: null
          },
          car: {
            causeOfLoss: null
          }
        }
      }
    } as Partial<ApplicationState>;
    renderComponent(<PreStep1 {...props} />, { initialState });
    expect(screen.queryByText('preStep1.heading.title')).toBeInTheDocument();
    expect(screen.queryByText('preStep1.heading.description')).toBeInTheDocument();
    expect(screen.queryByText('preStep1.heading.additionalDescription')).toBeInTheDocument();
    expect(screen.queryByText('customerPolicies.title')).toBeInTheDocument();
  });
  it('Continue button should be disabled if date and time not provided', () => {
    localStorage.setItem('access_token', 'IAMTOPSECRET');
    const initialState = {
      myForms: {
        sharedClaim: {
          policies: testPolicies,
          policyNumber: testPolicies[1].policyNumber,
          contents: {
            causeOfLoss: 'damaged',
            damage: 'ACCIDENTAL_DAMAGE'
          },
          house: {
            causeOfLoss: null
          },
          car: {
            causeOfLoss: null
          }
        }
      }
    } as Partial<ApplicationState>;
    renderComponent(<PreStep1 {...props} />, { initialState });
    expect(screen.getByText('button.continuePreClaim')).toBeDisabled();
  });
  it('Review and Continue title and description should render correctly', () => {
    localStorage.setItem('access_token', 'IAMTOPSECRET');
    const initialState = {
      myForms: {
        sharedClaim: {
          policies: testPolicies,
          policyNumber: testPolicies[1].policyNumber,
          eventDate: '15 May 2025',
          eventTime: '1:30',
          eventTimeAmPm: 'pm',
          policyDetails: {
            policyNumber: testPolicies[1].policyNumber
          },
          claimType: 'contents',
          contents: {
            causeOfLoss: 'damaged',
            damage: 'ACCIDENTAL_DAMAGE'
          },
          house: {
            causeOfLoss: null
          },
          car: {
            causeOfLoss: null
          }
        }
      }
    } as Partial<ApplicationState>;
    renderComponent(<PreStep1 {...props} />, { initialState });
    const nextButton = screen.getByText('button.next');
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);
    expect(screen.getByText('preStep1.reviewAndContinue.title')).toBeInTheDocument();
    expect(screen.getByText('preStep1.reviewAndContinue.description')).toBeInTheDocument();
  });

  describe('Water damage information box', () => {
    it('should render water damage infobox when claim type is Contents and SCOL is water damage', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            contents: {
              causeOfLoss: 'damaged',
              damage: CAUSE_OF_LOSS_ESCAPE_OF_WATER
            },
            house: {
              causeOfLoss: null
            },
            car: {
              causeOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      const translationData = {
        'claim:config.showWaterDamageInformationBox': true
      };

      renderComponent(<PreStep1 />, { initialState, translationData });
      expect(screen.getByText("Water damage - here's what you need to do")).toBeInTheDocument();
    });

    it('should render water damage link when showWaterInfoLink is enabled and claim type is Contents and SCOL is water damage', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            contents: {
              causeOfLoss: 'damaged',
              damage: CAUSE_OF_LOSS_ESCAPE_OF_WATER
            },
            house: {
              causeOfLoss: null
            },
            car: {
              causeOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      renderComponent(<PreStep1 />, {
        initialState,
        translationData: {
          'claim:config.showWaterDamageInformationBox': true,
          'claim:config.showWaterInfoLink': true
        }
      });

      expect(
        screen.getByRole('link', {
          name: 'learn more about this benefit here'
        })
      ).toHaveAttribute('href', 'https://www.tower.co.nz/discover/house/gradual-damage/');
    });

    it('should render water damage infobox when claim type is House and SCOL is water damage', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            policyType: null,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            contents: {
              causeOfLoss: null
            },
            house: {
              causeOfLoss: 'damaged',
              damage: CAUSE_OF_LOSS_ESCAPE_OF_WATER
            },
            car: {
              causeOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      const translationData = {
        'claim:config.showWaterDamageInformationBox': true,
        'claim:config.showWaterInfoLink': false
      };

      renderComponent(<PreStep1 />, { initialState, translationData });

      expect(screen.getByText("Water damage - here's what you need to do")).toBeInTheDocument();
      expect(
        screen.queryByRole('link', {
          name: 'learn more about this benefit here'
        })
      ).not.toBeInTheDocument();
    });

    it('should not render water damage infobox when claim type is not House or Contents', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            contents: {
              causeOfLoss: null
            },
            house: {
              causeOfLoss: null
            },
            car: {
              causeOfLoss: 'damaged',
              damage: 'ACCIDENT_WHILE_DRIVING'
            }
          }
        }
      } as Partial<ApplicationState>;

      renderComponent(<PreStep1 />, { initialState });

      expect(screen.queryByText("Water damage - here's what you need to do")).not.toBeInTheDocument();
    });

    it('should not render water damage infobox when config disables it, but should still render form footer', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            policyDetails: {
              policyNumber: testPolicies[1].policyNumber
            },
            claimType: 'contents',
            contents: {
              causeOfLoss: 'damaged',
              damage: CAUSE_OF_LOSS_ESCAPE_OF_WATER
            },
            house: {
              causeOfLoss: null
            },
            car: {
              causeOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      const translationData = {
        'claim:config.showWaterDamageInformationBox': false
      };

      renderComponent(<PreStep1 />, { initialState, translationData });

      expect(screen.queryByText("Water damage - here's what you need to do")).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: 'preStep1.reviewAndContinue.title'
        })
      ).toBeInTheDocument();
      expect(screen.getByText('preStep1.reviewAndContinue.description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /button\.next/i })).toBeInTheDocument();
    });

    it('should not render FormFooter when water damage infobox is showing but the checkbox is unchecked', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            policyDetails: {
              policyNumber: testPolicies[1].policyNumber
            },
            claimType: 'contents',
            contents: {
              causeOfLoss: 'damaged',
              damage: CAUSE_OF_LOSS_ESCAPE_OF_WATER
            },
            house: {
              causeOfLoss: null
            },
            car: {
              causeOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      const translationData = {
        'claim:config.showWaterDamageInformationBox': true
      };

      renderComponent(<PreStep1 />, { initialState, translationData });

      expect(screen.getByText("Water damage - here's what you need to do")).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox', {
        name: 'I understand and want to continue'
      });
      expect(checkbox).not.toBeChecked();

      expect(
        screen.queryByRole('heading', {
          level: 5,
          name: 'preStep1.reviewAndContinue.title'
        })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('preStep1.reviewAndContinue.description')).not.toBeInTheDocument();
    });

    it('should render FormFooter when water damage checkbox is checked and hide it again when checkbox is unchecked', () => {
      const initialState = {
        myForms: {
          sharedClaim: {
            policies: testPolicies,
            policyNumber: testPolicies[1].policyNumber,
            eventDate: '15 May 2025',
            eventTime: '1:30',
            eventTimeAmPm: 'pm',
            policyDetails: {
              policyNumber: testPolicies[1].policyNumber
            },
            claimType: 'contents',
            contents: {
              causeOfLoss: 'damaged',
              damage: CAUSE_OF_LOSS_ESCAPE_OF_WATER
            },
            house: {
              causeOfLoss: null
            },
            car: {
              causeOfLoss: null
            }
          }
        }
      } as Partial<ApplicationState>;

      const translationData = {
        'claim:config.showWaterDamageInformationBox': true
      };

      renderComponent(<PreStep1 />, { initialState, translationData });

      const checkbox = screen.getByRole('checkbox', {
        name: 'I understand and want to continue'
      });

      // check
      userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: 'preStep1.reviewAndContinue.title'
        })
      ).toBeInTheDocument();
      expect(screen.getByText('preStep1.reviewAndContinue.description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /button\.next/i })).toBeInTheDocument();

      // uncheck
      userEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
      expect(
        screen.queryByRole('heading', {
          level: 5,
          name: 'preStep1.reviewAndContinue.title'
        })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('preStep1.reviewAndContinue.description')).not.toBeInTheDocument();
    });
  });
});
