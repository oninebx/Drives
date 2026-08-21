import { screen } from '@testing-library/react';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import * as carState from '~/feature/claim/car/state';
import * as sharedState from '~/feature/claim/shared/state';
import type { ApplicationState } from '~/root/rootReducer';
import { getDefaultClaimCarState } from '../state';
import Page1 from './Page1';

jest.mock('~/feature/claim/car/components', () => {
  const actual = jest.requireActual(
    '~/feature/claim/car/components'
  );

  return {
    ...actual,
    AuthorityReportFire: () => (
      <div data-testid="authority-report-fire" />
    ),
    AuthorityReportPolice: () => (
      <div data-testid="authority-report-police" />
    ),
    OtherDrivers: () => (
      <div data-testid="other-drivers" />
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
      <div data-testid="driver-details" />
    ),
    OtherPeopleDetail: () => (
      <div data-testid="other-people-detail" />
    ),
    PoliceAttend: () => (
      <div data-testid="police-attend" />
    ),
    TheftSection1: () => (
      <div data-testid="theft-section-1" />
    ),
    TheftSection2: () => (
      <div data-testid="theft-section-2" />
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
      <div data-testid="event-description" />
    ),
    EventLocation: () => (
      <div data-testid="event-location" />
    ),
    FloatingToolbar: () => (
      <div data-testid="floating-toolbar" />
    ),
    FormFooter: () => (
      <div data-testid="form-footer" />
    ),
    WitnessSection: () => (
      <div data-testid="witness-section" />
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
    expect(
      screen.getByTestId(testId)
    ).toBeInTheDocument();
  };

  const expectNotRendered = (testId: string) => {
    expect(
      screen.queryByTestId(testId)
    ).not.toBeInTheDocument();
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
    jest.restoreAllMocks();

    jest
      .spyOn(carState.selectors, 'getClaim')
      .mockReturnValue(claim);

    jest
      .spyOn(carState.selectors, 'getBaseState')
      .mockReturnValue(baseState);

    jest
      .spyOn(carState.selectors, 'isCauseOfLossTheft')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showYourDriverQuestions')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showOtherPersonDetailsQuestions')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showPoliceAttendQuestions')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showFireAuthorityReport')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showAuthorityReportQuestions')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showOtherDriversQuestions')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'isOtherDriverInvolved')
      .mockReturnValue(false);

    jest
      .spyOn(carState.selectors, 'showWitnessQuestions')
      .mockReturnValue(true);

    jest
      .spyOn(carState.selectors, 'getCarDiscoveredMissingDate')
      .mockReturnValue(undefined);

    jest
      .spyOn(carState.selectors, 'getLossDate')
      .mockReturnValue(claim.lossDate);

    jest
      .spyOn(carState.selectors, 'getVehicleMakes')
      .mockReturnValue([]);

    jest
      .spyOn(
        carState.selectors,
        'getEventLocationHeaderLabel'
      )
      .mockReturnValue('accidentInformation');

    jest
      .spyOn(
        carState.selectors,
        'getEventLocationLabel'
      )
      .mockReturnValue(
        'accidentWhileDriving.search'
      );

    jest
      .spyOn(sharedState.selectors, 'getClaimType')
      .mockReturnValue('car');

    jest
      .spyOn(sharedState.selectors, 'getPolicyDetails')
      .mockReturnValue(undefined);

    jest
      .spyOn(sharedState.selectors, 'getPolicyDescription')
      .mockReturnValue(undefined);

    jest
      .spyOn(
        sharedState.selectors,
        'getBackToPreStepsPrevented'
      )
      .mockReturnValue(false);
  });

  describe('basic rendering', () => {
    it('should render the claim number and status', () => {
      renderPage();

      expect(
        screen.getByText(
          'Your claim number: ABC123'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText('Not submitted')
      ).toBeInTheDocument();
    });

    it('should render the page heading', () => {
      renderPage();

      expectHeadingRendered(
        'headings.page1'
      );
    });

    it('should render the pre steps summary with the correct details', () => {
      renderPage();

      expect(
        screen.getByText(
          '15/01/2025 at 3:45 pm'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          'preStepsSummary.causeLabels.accidentWhileDrivingAnimal'
        )
      ).toBeInTheDocument();
    });

    it('should render the event location', () => {
      renderPage();

      expectHeadingRendered(
        'headings.accidentInformation'
      );

      expectRendered(
        'event-location'
      );
    });

    it('should render the event description', () => {
      renderPage();

      expectRendered(
        'event-description'
      );
    });

    it('should render the form footer', () => {
      renderPage();

      expectRendered(
        'form-footer'
      );
    });

    it('should render the floating toolbar', () => {
      renderPage();

      expectRendered(
        'floating-toolbar'
      );
    });
  });

  describe('theft section', () => {
    it('should not render the theft section when cause of loss is not theft', () => {
      jest
        .spyOn(
          carState.selectors,
          'isCauseOfLossTheft'
        )
        .mockReturnValue(false);

      renderPage();

      expectNotRendered(
        'theft-section-1'
      );

      expectNotRendered(
        'theft-section-2'
      );
    });

    it('should render the theft sections when cause of loss is theft', () => {
      jest
        .spyOn(
          carState.selectors,
          'isCauseOfLossTheft'
        )
        .mockReturnValue(true);

      renderPage();

      expectRendered(
        'theft-section-1'
      );

      expectRendered(
        'theft-section-2'
      );
    });
  });

  describe('your driver section', () => {
    it('should not render the your driver section when selector returns false', () => {
      jest
        .spyOn(
          carState.selectors,
          'showYourDriverQuestions'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.yourDriver'
      );

      expectNotRendered(
        'driver-details'
      );
    });

    it('should render the your driver section when selector returns true', () => {
      jest
        .spyOn(
          carState.selectors,
          'showYourDriverQuestions'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.yourDriver'
      );

      expectRendered(
        'driver-details'
      );
    });
  });

  describe('other driver section', () => {
    it('should not render the other driver section when selector returns false', () => {
      jest
        .spyOn(
          carState.selectors,
          'showOtherDriversQuestions'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.otherDriverDetails'
      );

      expectHeadingNotRendered(
        'headings.driverDetails'
      );

      expectNotRendered(
        'other-drivers'
      );
    });

    it('should render the other driver details when another driver is involved', () => {
      jest
        .spyOn(
          carState.selectors,
          'showOtherDriversQuestions'
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          carState.selectors,
          'isOtherDriverInvolved'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.otherDriverDetails'
      );

      expectHeadingNotRendered(
        'headings.driverDetails'
      );

      expectRendered(
        'other-drivers'
      );
    });

    it('should render the driver details when another driver is not involved', () => {
      jest
        .spyOn(
          carState.selectors,
          'showOtherDriversQuestions'
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          carState.selectors,
          'isOtherDriverInvolved'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingRendered(
        'headings.driverDetails'
      );

      expectHeadingNotRendered(
        'headings.otherDriverDetails'
      );

      expectRendered(
        'other-drivers'
      );
    });
  });

  describe('other person details', () => {
    it('should not render other person details when selector returns false', () => {
      jest
        .spyOn(
          carState.selectors,
          'showOtherPersonDetailsQuestions'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.otherPeopleDetails'
      );

      expectNotRendered(
        'other-people-detail'
      );
    });

    it('should render other person details when selector returns true', () => {
      jest
        .spyOn(
          carState.selectors,
          'showOtherPersonDetailsQuestions'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.otherPeopleDetails'
      );

      expectRendered(
        'other-people-detail'
      );
    });
  });

  describe('fire authority report', () => {
    it('should not render the fire authority report when selector returns false', () => {
      jest
        .spyOn(
          carState.selectors,
          'showFireAuthorityReport'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.fire'
      );

      expectNotRendered(
        'authority-report-fire'
      );
    });

    it('should render the fire authority report when selector returns true', () => {
      jest
        .spyOn(
          carState.selectors,
          'showFireAuthorityReport'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.fire'
      );

      expectRendered(
        'authority-report-fire'
      );
    });
  });

  describe('police section', () => {
    it('should not render the police section when neither selector returns true', () => {
      jest
        .spyOn(
          carState.selectors,
          'showPoliceAttendQuestions'
        )
        .mockReturnValue(false);

      jest
        .spyOn(
          carState.selectors,
          'showAuthorityReportQuestions'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.police'
      );

      expectNotRendered(
        'police-attend'
      );

      expectNotRendered(
        'authority-report-police'
      );
    });

    it('should render the police heading and authority report when authority report is shown', () => {
      jest
        .spyOn(
          carState.selectors,
          'showPoliceAttendQuestions'
        )
        .mockReturnValue(false);

      jest
        .spyOn(
          carState.selectors,
          'showAuthorityReportQuestions'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.police'
      );

      expectNotRendered(
        'police-attend'
      );

      expectRendered(
        'authority-report-police'
      );
    });

    it('should render the police heading and police attend when police attend is shown', () => {
      jest
        .spyOn(
          carState.selectors,
          'showPoliceAttendQuestions'
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          carState.selectors,
          'showAuthorityReportQuestions'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingRendered(
        'headings.police'
      );

      expectRendered(
        'police-attend'
      );

      expectNotRendered(
        'authority-report-police'
      );
    });

    it('should render both police sections when both selectors return true', () => {
      jest
        .spyOn(
          carState.selectors,
          'showPoliceAttendQuestions'
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          carState.selectors,
          'showAuthorityReportQuestions'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.police'
      );

      expectRendered(
        'police-attend'
      );

      expectRendered(
        'authority-report-police'
      );
    });
  });

  describe('witness section', () => {
    it('should not render the witness section when selector returns false', () => {
      jest
        .spyOn(
          carState.selectors,
          'showWitnessQuestions'
        )
        .mockReturnValue(false);

      renderPage();

      expectHeadingNotRendered(
        'headings.witnesses'
      );

      expectNotRendered(
        'witness-section'
      );
    });

    it('should render the witness section when selector returns true', () => {
      jest
        .spyOn(
          carState.selectors,
          'showWitnessQuestions'
        )
        .mockReturnValue(true);

      renderPage();

      expectHeadingRendered(
        'headings.witnesses'
      );

      expectRendered(
        'witness-section'
      );
    });
  });

  describe('event location heading', () => {
    it('should render the event location heading returned by the selector', () => {
      jest
        .spyOn(
          carState.selectors,
          'getEventLocationHeaderLabel'
        )
        .mockReturnValue(
          'accidentInformation'
        );

      renderPage();

      expectHeadingRendered(
        'headings.accidentInformation'
      );
    });
  });
});