import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { Page1Component } from './Page1';

import type { Page1Props } from './Page1';

import { routes } from '~/common/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';

/**
 * ---------------------------------------------------------
 * Mocks
 * ---------------------------------------------------------
 */

const mockNavigate = jest.fn();
const mockT = jest.fn((key: string) => key);
const mockFormFooter = jest.fn();

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT
  })
}));

jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form">{children}</div>
  )
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: jest.fn()
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      CAR: {
        PAGE2: '/claim/car/page2'
      }
    }
  }
}));

/**
 * Mock state modules completely.
 *
 * Important:
 * Do NOT use requireActual here.
 *
 * Page1 imports selectors from these modules, but selectors
 * themselves have their own unit tests. Therefore Page1 tests
 * only need controllable selector dependencies.
 */
jest.mock('~/feature/claim/car/state', () => ({
  formPath: 'forms.carClaim.page1',
  modelPath: 'carClaim',

  thunks: {
    initCarPage1: jest.fn()
  },

  selectors: {
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
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimType: jest.fn(),
    getPolicyDetails: jest.fn(),
    getPolicyDescription: jest.fn(),
    getBackToPreStepsPrevented: jest.fn()
  }
}));

/**
 * Child components are mocked because they have their own
 * unit tests.
 */
jest.mock('~/feature/claim/car/components', () => ({
  AuthorityReportFire: () => (
    <div data-testid="authority-report-fire" />
  ),

  AuthorityReportPolice: () => (
    <div data-testid="authority-report-police" />
  ),

  OtherDrivers: () => (
    <div data-testid="other-drivers" />
  )
}));

jest.mock('~/feature/claim/car/components/dumb', () => ({
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
}));

jest.mock('~/feature/claim/shared/components', () => ({
  EventDescription: () => (
    <div data-testid="event-description" />
  ),

  EventLocation: () => (
    <div data-testid="event-location" />
  ),

  FloatingToolbar: () => (
    <div data-testid="floating-toolbar" />
  ),

  /**
   * FormFooter is intentionally a dumb mock.
   *
   * We do NOT reproduce its button behaviour here.
   * We only capture the props Page1 passes to it.
   */
  FormFooter: (props: unknown) => {
    mockFormFooter(props);

    return (
      <div data-testid="form-footer" />
    );
  },

  PreStepsSummary: () => (
    <div data-testid="pre-steps-summary" />
  ),

  WitnessSection: () => (
    <div data-testid="witness-section" />
  )
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
  ClaimNumber: ({
    claimNumber
  }: {
    claimNumber: string;
  }) => (
    <div data-testid="claim-number">
      {claimNumber}
    </div>
  )
}));

describe('Page1Component', () => {
  const claim = {
    claimNumber: 'CLM123',
    causeOfLoss: 'accidentWhileDriving',
    secondaryCauseOfLoss: 'animal',
    lossDate: new Date('2026-08-01T02:45:00.000Z')
  } as Page1Props['claim'];

  const createProps = (
    overrides: Partial<Page1Props> = {}
  ): Page1Props => ({
    claim,

    claimType: 'car',

    description: 'Test description',

    state: {
      eventLocationAddress: undefined
    } as Page1Props['state'],

    showTheftQuestions: false,
    showYourDriver: false,
    showOtherPersonDetails: false,
    showPoliceAttend: false,
    showFireAuthorityReport: false,
    showAuthorityReport: false,
    showOtherDrivers: false,
    isOtherDriverInvolved: false,
    showWitness: false,

    getEventLocationHeaderLabel:
      'accidentInformation',

    getEventLocationLabel:
      'accidentWhileDriving.search',

    ...overrides
  });

  const renderPage = (
    overrides: Partial<Page1Props> = {}
  ) => {
    render(
      <Page1Component
        {...createProps(overrides)}
      />
    );
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
    text: string
  ) => {
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: text
      })
    ).toBeInTheDocument();
  };

  const expectHeadingNotRendered = (
    text: string
  ) => {
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: text
      })
    ).not.toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: jest.fn()
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders the basic page content', () => {
      renderPage();

      expectRendered('form');
      expectRendered('claim-number');
      expectRendered('pre-steps-summary');
      expectRendered('event-location');
      expectRendered('event-description');
      expectRendered('form-footer');
      expectRendered('floating-toolbar');
    });

    it('renders the claim number', () => {
      renderPage();

      expect(
        screen.getByTestId('claim-number')
      ).toHaveTextContent('CLM123');
    });

    it('renders the page heading', () => {
      renderPage();

      expectHeadingRendered(
        'claim/car:headings.page1'
      );
    });

    it('renders the event location heading', () => {
      renderPage();

      expectHeadingRendered(
        'claim/car:headings.accidentInformation'
      );
    });
  });

  describe('conditional sections', () => {
    it('does not render optional sections by default', () => {
      renderPage();

      expectNotRendered('theft-section-1');
      expectNotRendered('theft-section-2');
      expectNotRendered('driver-details');
      expectNotRendered('other-drivers');
      expectNotRendered('other-people-detail');
      expectNotRendered('authority-report-fire');
      expectNotRendered('police-attend');
      expectNotRendered('authority-report-police');
      expectNotRendered('witness-section');
    });

    it('renders theft sections when enabled', () => {
      renderPage({
        showTheftQuestions: true
      });

      expectRendered('theft-section-1');
      expectRendered('theft-section-2');
    });

    it('renders your driver section when enabled', () => {
      renderPage({
        showYourDriver: true
      });

      expectHeadingRendered(
        'claim/car:headings.yourDriver'
      );

      expectRendered('driver-details');
    });

    it('renders other driver section when enabled', () => {
      renderPage({
        showOtherDrivers: true
      });

      expectHeadingRendered(
        'claim/car:headings.driverDetails'
      );

      expectRendered('other-drivers');
    });

    it('renders other driver details heading when another driver is involved', () => {
      renderPage({
        showOtherDrivers: true,
        isOtherDriverInvolved: true
      });

      expectHeadingRendered(
        'claim/car:headings.otherDriverDetails'
      );

      expectHeadingNotRendered(
        'claim/car:headings.driverDetails'
      );

      expectRendered('other-drivers');
    });

    it('renders other people details when enabled', () => {
      renderPage({
        showOtherPersonDetails: true
      });

      expectHeadingRendered(
        'claim/car:headings.otherPeopleDetails'
      );

      expectRendered('other-people-detail');
    });

    it('renders fire authority report when enabled', () => {
      renderPage({
        showFireAuthorityReport: true
      });

      expectHeadingRendered(
        'claim/car:headings.fire'
      );

      expectRendered('authority-report-fire');
    });

    it('renders police attend when enabled', () => {
      renderPage({
        showPoliceAttend: true
      });

      expectHeadingRendered(
        'claim/car:headings.police'
      );

      expectRendered('police-attend');

      expectNotRendered(
        'authority-report-police'
      );
    });

    it('renders authority police report when enabled', () => {
      renderPage({
        showAuthorityReport: true
      });

      expectHeadingRendered(
        'claim/car:headings.police'
      );

      expectRendered(
        'authority-report-police'
      );

      expectNotRendered('police-attend');
    });

    it('renders both police sections when both are enabled', () => {
      renderPage({
        showPoliceAttend: true,
        showAuthorityReport: true
      });

      expectHeadingRendered(
        'claim/car:headings.police'
      );

      expectRendered('police-attend');
      expectRendered(
        'authority-report-police'
      );
    });

    it('renders witnesses when enabled', () => {
      renderPage({
        showWitness: true
      });

      expectHeadingRendered(
        'claim/car:headings.witnesses'
      );

      expectRendered('witness-section');
    });
  });

  describe('FormFooter', () => {
    it('renders FormFooter', () => {
      renderPage();

      expectRendered('form-footer');
      expect(mockFormFooter).toHaveBeenCalledTimes(1);
    });

    it('passes the expected props to FormFooter', () => {
      renderPage();

      expect(mockFormFooter).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: false,
          validating: false,
          submitButtonLabel:
            'claim:footer.nextButton.car.page1',
          handleSubmit: expect.any(Function)
        })
      );
    });

    it('does not test FormFooter behaviour', () => {
      /**
       * Intentionally empty.
       *
       * FormFooter has its own unit tests.
       * Page1 only verifies that it renders FormFooter
       * and provides the expected props.
       */
    });
  });

  describe('next action', () => {
    it('raises the GA event when FormFooter submit handler is invoked', async () => {
      renderPage();

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      expect(
        raiseClaimGAEvent
      ).toHaveBeenCalledTimes(1);

      expect(
        raiseClaimGAEvent
      ).toHaveBeenCalledWith(
        'CLM123',
        'car'
      );
    });

    it('navigates to car page 2 after submit', async () => {
      renderPage();

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      jest.runAllTimers();

      expect(mockNavigate).toHaveBeenCalledTimes(1);

      expect(mockNavigate).toHaveBeenCalledWith(
        routes.CLAIM.CAR.PAGE2
      );
    });
  });

  describe('event location', () => {
    it('passes the event location configuration to EventLocation', () => {
      renderPage({
        getEventLocationHeaderLabel:
          'accidentInformation',
        getEventLocationLabel:
          'accidentWhileDriving.search'
      });

      expectRendered('event-location');
    });
  });
});