import { screen } from '@testing-library/react';
import * as React from 'react';
import { KnownCauseOfLoss, KnownSecondaryCauseOfLoss } from '~/common/state/autorest/Claims/src';
import { KnownMotorPackage } from '~/common/state/autorest/PolicyAuth/src';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationState } from '~/root/rootReducer';
import { ClaimType } from '../../shared/state';
import { testClaimCarState, testClaimState } from '../../shared/state/claimTestData';
import { NO, UNSURE, YES } from '../state';
import Page2 from './Page2';

describe('Page2 Car', () => {
  const translationData = {
    'claim:documentUpload.suggestions.motor': [
      { suggestion: 'A sketch of the accident scene and location' },
      { suggestion: 'Police reports for illegal acts (e.g. theft)' },
      {
        suggestion:
          "Photos of:<ul><li>the scene and location</li><li>the third party's driver's licence (if one was involved)</li><li>damage to vehicles, items and property</li></ul>"
      }
    ],
    'claim/car:repairer': {
      benefitsLearnMore: [
        {
          id: 'firstBenefit',
          title: 'Get booked in, fast',
          description:
            'A call from your Repair Partner within two hours of them receiving acceptance of your claim, and your booking scheduled within one business day of contact with your Repair Partner.'
        },
        {
          id: 'secondBenefit',
          title: 'Guarantee on repairs',
          description: 'A guarantee on your repairs for as long as you own the vehicle.'
        },
        {
          id: 'thirdBenefit',
          title: 'Complimentary Uber',
          description:
            'Complimentary Uber when you drop your vehicle off and to pick it up once your repair is complete (participating repairers only).'
        },
        {
          id: 'fourthBenefit',
          title: 'Remote assessment tool',
          description:
            'Access to remote digital assessment of your damage, so you can have your repair assessed from wherever you are (participating repairers only).'
        },
        {
          id: 'fifthBenefit',
          title: 'Other benefits',
          description:
            '<ul><li>A clean car ready for pick up.</li><li>Your repair managed every step of the way by Tower.</li></ul>'
        }
      ],
      benefits: [
        {
          iconType: 'EventAvailable',
          description: 'Get booked in, fast'
        },
        {
          iconType: 'VerifiedUser',
          description: 'Guarantee on repairs for as long as you own the vehicle'
        },
        {
          iconType: 'LocalTaxi',
          description: 'Uber to and from the Repair Partner (participating repairers only)'
        },
        {
          iconType: 'NestRemoteComfortSensor',
          description: 'Remote assessment tool (participating repairers only)'
        }
      ]
    }
  };

  it('Should render correctly on first load', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: testClaimCarState.eisClaim.causeOfLoss,
            secondaryCauseOfLoss: testClaimCarState.eisClaim.secondaryCauseOfLoss
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;

    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('Your claim number: C1234567890')).toBeInTheDocument();
    expect(screen.queryByText('Not submitted')).toBeInTheDocument();
    expect(
      screen.queryByText("Save your progress by clicking 'Save for later' in the bottom right corner.")
    ).toBeInTheDocument();
    expect(screen.queryByText('headings.page2')).toBeInTheDocument();
    expect(screen.queryByText('headings.yourVehicle')).toBeInTheDocument();
    expect(screen.queryByText('carDamage.title')).toBeInTheDocument();
    expect(screen.queryByText('page2.damages.damageDescription.car.title')).toBeInTheDocument();
    expect(screen.queryByText('page2.damages.damageDescription.car.description')).toBeInTheDocument();
    expect(screen.queryByText('0 / 399')).toBeInTheDocument();
    expect(screen.queryByText('vehicleDamage.drivable.title')).toBeInTheDocument();
    expect(screen.queryAllByText('button.yes')).toHaveLength(2);
    expect(screen.queryAllByText('button.no')).toHaveLength(2);
    expect(screen.queryByText('button.unsure')).toBeInTheDocument();
    expect(screen.queryByText('headings.vehicleUse')).toBeInTheDocument();
    expect(screen.queryByText('vehicleDamage.usedCommercially.title')).toBeInTheDocument();
    expect(screen.queryByText('headings.addAttachments')).toBeInTheDocument();
    expect(screen.queryByText('Drag and drop files, or')).toBeInTheDocument();
  });

  it('If showYourVehicle is false it should NOT render YourVehicleDetails', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.Other,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.Other
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('headings.yourVehicle')).not.toBeInTheDocument();
  });
  it('If showVehicleDriveableQuestionForStolenRecovered and showVehicleDriveableQuestion is false it should NOT render questionDrivable', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.Contamination,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.Methamphetamine
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('vehicleDamage.drivable.title')).not.toBeInTheDocument();
  });

  it('If vehicle is driveable unsure then safety message should render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.Contamination,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.Methamphetamine
          },
          carDamageDetails: {
            drivable: UNSURE
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('vehicleDamage.safetyFirst.title')).toBeInTheDocument();
  });
  it('If vehicle is driveable yes then safety message should NOT render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.Contamination,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.Methamphetamine
          },
          carDamageDetails: {
            drivable: YES
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('vehicleDamage.safetyFirst.title')).not.toBeInTheDocument();
  });
  it('If vehicle is driveable no then vehicle location should render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.Contamination,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.Methamphetamine
          },
          carDamageDetails: {
            drivable: NO,
            carDamage: {
              boot: true
            }
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });
    expect(screen.queryByText('vehicleDamage.vehicleLocation.title')).toBeInTheDocument();
  });

  it('If vehicle is driveable yes and SCOL is vehcile recovered ', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.Stolen,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.VehicleRecovered
          },
          carDamageDetails: {
            drivable: YES,
            carDamage: {
              boot: true
            }
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as Partial<ApplicationState>;
    renderComponent(<Page2 />, { initialState, translationData });
    expect(screen.queryByText('vehicleDamage.vehicleLocation.title')).toBeInTheDocument();
  });

  it('showRepairer, selectClaimDamageWhenStartClaim and wantsToClaimDamage is true region repairers should render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.DamagedWhileParked,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.HitByAnotherVehicle
          },
          carDamageDetails: {
            drivable: NO,
            carDamage: {
              boot: true
            }
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });
    expect(screen.queryByText('repairer.regions.title')).toBeInTheDocument();
  });

  it('showRepairer, selectClaimDamageWhenStartClaim or wantsToClaimDamage is false region repairers should NOT render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: testClaimCarState.eisClaim.causeOfLoss,
            secondaryCauseOfLoss: testClaimCarState.eisClaim.secondaryCauseOfLoss
          },
          carDamageDetails: {
            drivable: NO,
            carDamage: {
              boot: true
            }
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });
    expect(screen.queryByText('repairer.regions.title')).not.toBeInTheDocument();
  });

  it('If SCOL is Hailstorm HailRepairer should render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.NaturalDisaster,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.HailStorm
          },
          carDamageDetails: {
            drivable: NO,
            carDamage: {
              boot: true
            }
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });
    expect(screen.queryByText('hailRepairer.title')).toBeInTheDocument();
  });

  it('If SCOL is NOT Hailstorm HailRepairer should NOT render', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.NaturalDisaster,
            secondaryCauseOfLoss: KnownSecondaryCauseOfLoss.Other
          },
          carDamageDetails: {
            drivable: NO,
            carDamage: {
              boot: true
            }
          }
        },
        sharedClaim: {
          ...testClaimState,
          claimType: ClaimType.Car,
          car: {
            damage: null
          }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });
    expect(screen.queryByText('hailRepairer.title')).not.toBeInTheDocument();
  });

  it('If brand TMI and cover third party and COL accident while driving then should NOT render YourVehicleDetails', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.AccidentWhileDriving
          }
        },
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, package: KnownMotorPackage.ThirdParty }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('claim/car:vehicleDamage.wantToClaimDamage')).not.toBeInTheDocument();
  });

  it('If brand TMI and cover third party fire and theft and COL accident while driving then should NOT render YourVehicleDetails', () => {
    const initialState = {
      myForms: {
        carClaim: {
          eisClaim: {
            claimNumber: 'C1234567890',
            causeOfLoss: KnownCauseOfLoss.AccidentWhileDriving
          }
        },
        sharedClaim: {
          ...testClaimState,
          policyDetails: { ...testClaimState.policyDetails, package: KnownMotorPackage.ThirdPartyFireTheft }
        }
      }
    } as ApplicationState;
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.queryByText('claim/car:vehicleDamage.wantToClaimDamage')).not.toBeInTheDocument();
  });
});
