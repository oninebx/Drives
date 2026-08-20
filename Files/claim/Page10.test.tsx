import { screen } from '@testing-library/react';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import * as carState from '~/feature/claim/car/state';
import * as sharedState from '~/feature/claim/shared/state';
import type { ApplicationState } from '~/root/rootReducer';
import { getDefaultClaimCarState } from '../state';
import Page1 from './Page1';

jest.mock('~/feature/claim/car/state', () => {
  const actual = jest.requireActual('~/feature/claim/car/state');

  return {
    ...actual,
    selectors: {
      ...actual.selectors,
      getClaim: jest.fn(),
      getBaseState: jest.fn(),
      isCauseOfLossTheft: jest.fn(),
      showYourDriverQuestions: jest.fn(),
      showOtherPersonDetailsQuestions: jest.fn(),
      showPoliceAttendQuestions: jest.fn(),
      showFireAuthorityReport: jest.fn(),
      showAuthorityReportQuestions: jest.fn(),
      showOtherDriversQuestions: jest.fn(),
      isOtherDriverInvolved: jest.fn(),
      showWitnessQuestions: jest.fn(),
      getCarDiscoveredMissingDate: jest.fn(),
      getLossDate: jest.fn(),
      getVehicleMakes: jest.fn(),
      getEventLocationHeaderLabel: jest.fn(),
      getEventLocationLabel: jest.fn()
    }
  };
});

jest.mock('~/feature/claim/shared/state', () => {
  const actual = jest.requireActual('~/feature/claim/shared/state');

  return {
    ...actual,
    selectors: {
      ...actual.selectors,
      getClaimType: jest.fn(),
      getPolicyDetails: jest.fn(),
      getPolicyDescription: jest.fn(),
      getBackToPreStepsPrevented: jest.fn()
    }
  };
});

jest.mock('~/feature/claim/car/components', () => {
  const actual = jest.requireActual('~/feature/claim/car/components');

  return {
    ...actual,
    AuthorityReportFire: () => (
      <div data-testid="AuthorityReportFire" />
    ),
    AuthorityReportPolice: () => (
      <div data-testid="AuthorityReportPolice" />
    ),
    OtherDrivers: () => (
      <div data-testid="OtherDrivers" />
    )
  };
});

jest.mock('~/feature/claim/car/components/dumb', () => {
  const actual = jest.requireActual(
    '~/feature/claim/car/components/dumb'
  );

  return {
    ...actual,
    DriverDetails: () => (
      <div data-testid="DriverDetails" />
    ),
    OtherPeopleDetail: () => (
      <div data-testid="OtherPeopleDetail" />
    ),
    PoliceAttend: () => (
      <div data-testid="PoliceAttend" />
    ),
    TheftSection1: () => (
      <div data-testid="TheftSection1" />
    ),
    TheftSection2: () => (
      <div data-testid="TheftSection2" />
    )
  };
});

jest.mock('~/feature/claim/shared/components', () => {
  const actual = jest.requireActual(
    '~/feature/claim/shared/components'
  );

  return {
    ...actual,
    EventDescription: () => (
      <div data-testid="EventDescription" />
    ),
    EventLocation: () => (
      <div data-testid="EventLocation" />
    ),
    FloatingToolbar: () => (
      <div data-testid="FloatingToolbar" />
    ),
    FormFooter: () => (
      <div data-testid="FormFooter" />
    ),
    WitnessSection: () => (
      <div data-testid="WitnessSection" />
    )
  };
});

describe('Page1', () => {
  const claim = {
    claimNumber: 'ABC123',
    lossDate: new Date('2025-01-15T02:45:00.000Z'),
    causeOfLoss: 'accidentWhileDriving',
    secondaryCauseOfLoss: 'animal'
  } as ReturnType<typeof carState.selectors.getClaim>;

  const baseState = {
    eventLocationAddress: undefined
  } as ReturnType<typeof carState.selectors.getBaseState>;

  const initialState = {
    myForms: {
      carClaim: {
        ...getDefaultClaimCarState()
      }
    }
  } as Partial<ApplicationState>;

  const renderPage = (
    state: Partial<ApplicationState> = initialState
  ) => {
    renderComponent(<Page1 />, {
      initialState: state
    });
  };

  const expectRendered = (testId: string) => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  };

  const expectNotRendered = (testId: string) => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  };

  const expectHeadingRendered = (
    name: string,
    level: 2 | 5 = 2
  ) => {
    expect(
      screen.getByRole('heading', {
        level,
        name
      })
    ).toBeInTheDocument();
  };

  const expectHeadingNotRendered = (
    name: string,
    level: 2 | 5 = 2
  ) => {
    expect(
      screen.queryByRole('heading', {
        level,
        name
      })
    ).not.toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .mocked(carState.selectors.getClaim)
      .mockReturnValue(claim);

    jest
      .mocked(carState.selectors.getBaseState)
      .mockReturnValue(baseState);

    jest
      .mocked(carState.selectors.isCauseOfLossTheft)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showYourDriverQuestions)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showOtherPersonDetailsQuestions)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showPoliceAttendQuestions)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showFireAuthorityReport)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showAuthorityReportQuestions)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showOtherDriversQuestions)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.isOtherDriverInvolved)
      .mockReturnValue(false);

    jest
      .mocked(carState.selectors.showWitnessQuestions)
      .mockReturnValue(true);

    jest
      .mocked(carState.selectors.getCarDiscoveredMissingDate)
      .mockReturnValue(undefined);

    jest
      .mocked(carState.selectors.getLossDate)
      .mockReturnValue(claim.lossDate);

    jest
      .mocked(carState.selectors.getVehicleMakes)
      .mockReturnValue([]);

    jest
      .mocked(carState.selectors.getEventLocationHeaderLabel)
      .mockReturnValue('accidentInformation');

    jest
      .mocked(carState.selectors.getEventLocationLabel)
      .mockReturnValue(
        'accidentWhileDriving.search'
      );

    jest
      .mocked(sharedState.selectors.getClaimType)
      .mockReturnValue('car');

    jest
      .mocked(sharedState.selectors.getPolicyDetails)
      .mockReturnValue(undefined);

    jest
      .mocked(sharedState.selectors.getPolicyDescription)
      .mockReturnValue(undefined);

    jest
      .mocked(sharedState.selectors.getBackToPreStepsPrevented)
      .mockReturnValue(false);
  });

  describe('basic rendering', () => {
    it('should render the claim number and status', () => {
      renderPage();

      expect(
        screen.getByText('Your claim number: ABC123')
      ).toBeInTheDocument();

      expect(
        screen.getByText('Not submitted')
      ).toBeInTheDocument();
    });

    it('should render the page heading', () => {
      renderPage();

      expectHeadingRendered('headings.page1');
    });

    it('should render the pre steps summary with the correct details', () => {
      renderPage();

      expect(
        screen.getByText('15/01/2025 at 3:45 pm')
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          'preStepsSummary.causeLabels.accidentWhileDrivingAnimal'
        )
      ).toBeInTheDocument();
    });

    it('should render the event location section', () => {
      renderPage();

      expectHeadingRendered(
        'headings.accidentInformation'
      );

      expectRendered('EventLocation');
    });

    it('should render the event description', () => {
      renderPage();

      expectRendered('EventDescription');
    });

    it('should render the form footer', () => {
      renderPage();

      expectRendered('FormFooter');
    });

    it('should render the floating toolbar', () => {
      renderPage();

      expectRendered('FloatingToolbar');
    });
  });

  describe('theft section', () => {
    it('should not render the theft section when the selector returns false', () => {
      jest
        .mocked(carState.selectors.isCauseOfLossTheft)
        .mockReturnValue(false);

      renderPage();

      expectNotRendered('TheftSection1');
      expectNotRendered('TheftSection2');
    });

    it('should render the theft sections when the selector returns true', () => {
      jest
        .mocked(carState.selectors.isCauseOfLossTheft)
        .mockReturnValue(true);

      renderPage();

      expectRendered('TheftSection1');
      expectRendered('TheftSection2');
    });
  });

  describe('your driver section', () => {
    it('should not render the your driver section when the selector returns false', () => {
      jest
        .mocked(carState.selectors.showYourDriverQuestions)
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.yourDriver'
      );

      expectNotRendered('DriverDetails');
    });

    it('should render the your driver section when the selector returns true', () => {
      jest
        .mocked(carState.selectors.showYourDriverQuestions)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.yourDriver'
      );

      expectRendered('DriverDetails');
    });
  });

  describe('other driver section', () => {
    it('should not render the other driver section when the selector returns false', () => {
      jest
        .mocked(carState.selectors.showOtherDriversQuestions)
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.otherDriverDetails'
      );

      expectHeadingNotRendered(
        'headings.driverDetails'
      );

      expectNotRendered('OtherDrivers');
    });

    it('should render otherDriverDetails when another driver is involved', () => {
      jest
        .mocked(carState.selectors.showOtherDriversQuestions)
        .mockReturnValue(true);

      jest
        .mocked(carState.selectors.isOtherDriverInvolved)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.otherDriverDetails'
      );

      expectHeadingNotRendered(
        'headings.driverDetails'
      );

      expectRendered('OtherDrivers');
    });

    it('should render driverDetails when another driver is not involved', () => {
      jest
        .mocked(carState.selectors.showOtherDriversQuestions)
        .mockReturnValue(true);

      jest
        .mocked(carState.selectors.isOtherDriverInvolved)
        .mockReturnValue(false);

      renderPage();

      expectHeadingRendered(
        'headings.driverDetails'
      );

      expectHeadingNotRendered(
        'headings.otherDriverDetails'
      );

      expectRendered('OtherDrivers');
    });
  });

  describe('other person details', () => {
    it('should not render other person details when the selector returns false', () => {
      jest
        .mocked(carState.selectors.showOtherPersonDetailsQuestions)
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.otherPeopleDetails'
      );

      expectNotRendered('OtherPeopleDetail');
    });

    it('should render other person details when the selector returns true', () => {
      jest
        .mocked(carState.selectors.showOtherPersonDetailsQuestions)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.otherPeopleDetails'
      );

      expectRendered('OtherPeopleDetail');
    });
  });

  describe('fire authority report', () => {
    it('should not render the fire authority report when the selector returns false', () => {
      jest
        .mocked(carState.selectors.showFireAuthorityReport)
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.fire'
      );

      expectNotRendered('AuthorityReportFire');
    });

    it('should render the fire authority report when the selector returns true', () => {
      jest
        .mocked(carState.selectors.showFireAuthorityReport)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.fire'
      );

      expectRendered('AuthorityReportFire');
    });
  });

  describe('police section', () => {
    it('should not render the police section when neither selector returns true', () => {
      jest
        .mocked(carState.selectors.showPoliceAttendQuestions)
        .mockReturnValue(false);

      jest
        .mocked(carState.selectors.showAuthorityReportQuestions)
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.police'
      );

      expectNotRendered('PoliceAttend');
      expectNotRendered('AuthorityReportPolice');
    });

    it('should render authority report police when the authority report selector returns true', () => {
      jest
        .mocked(carState.selectors.showPoliceAttendQuestions)
        .mockReturnValue(false);

      jest
        .mocked(carState.selectors.showAuthorityReportQuestions)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.police'
      );

      expectNotRendered('PoliceAttend');
      expectRendered('AuthorityReportPolice');
    });

    it('should render police attend when the police attend selector returns true', () => {
      jest
        .mocked(carState.selectors.showPoliceAttendQuestions)
        .mockReturnValue(true);

      jest
        .mocked(carState.selectors.showAuthorityReportQuestions)
        .mockReturnValue(false);

      renderPage();

      expectHeadingRendered(
        'headings.police'
      );

      expectRendered('PoliceAttend');
      expectNotRendered('AuthorityReportPolice');
    });

    it('should render both police sections when both selectors return true', () => {
      jest
        .mocked(carState.selectors.showPoliceAttendQuestions)
        .mockReturnValue(true);

      jest
        .mocked(carState.selectors.showAuthorityReportQuestions)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.police'
      );

      expectRendered('PoliceAttend');
      expectRendered('AuthorityReportPolice');
    });
  });

  describe('witness section', () => {
    it('should not render the witness section when the selector returns false', () => {
      jest
        .mocked(carState.selectors.showWitnessQuestions)
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.witnesses'
      );

      expectNotRendered('WitnessSection');
    });

    it('should render the witness section when the selector returns true', () => {
      jest
        .mocked(carState.selectors.showWitnessQuestions)
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.witnesses'
      );

      expectRendered('WitnessSection');
    });
  });

  describe('event location', () => {
    it('should render the configured event location heading', () => {
      jest
        .mocked(carState.selectors.getEventLocationHeaderLabel)
        .mockReturnValue('accidentInformation');

      renderPage();

      expectHeadingRendered(
        'headings.accidentInformation'
      );
    });

    it('should render the event location component', () => {
      renderPage();

      expectRendered('EventLocation');
    });
  });
});