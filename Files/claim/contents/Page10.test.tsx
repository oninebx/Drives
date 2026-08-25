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

const mockInitialise = jest.fn();
const mockSetClaimTypeToContents =
  jest.fn();
const mockSetBackToPreStepsPrevented =
  jest.fn();

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT
  })
}));

jest.mock('react-redux-form', () => ({
  Form: ({
    children
  }: {
    children: React.ReactNode;
  }) => (
    <div data-testid="form">
      {children}
    </div>
  )
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: jest.fn()
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      CONTENTS: {
        PAGE2: '/claim/contents/page2'
      }
    }
  }
}));

/**
 * Mock state modules completely.
 *
 * Selectors already have their own unit tests.
 * Page1 tests only need controllable selector
 * dependencies and do not test selector behaviour.
 *
 * Do NOT use requireActual here.
 */
jest.mock('~/feature/claim/contents/state', () => ({
  formPath: 'forms.contentsClaim.page1',

  modelPath: 'contentsClaim',

  thunks: {
    initContentsPage1: jest.fn()
  },

  selectors: {
    getClaim: jest.fn(),
    getBaseState: jest.fn(),
    getItemsDiscoveredMissingDate:
      jest.fn(),
    getLossDate: jest.fn(),

    showEventLocationDescription:
      jest.fn(),

    showEventLocationSomewhereElse:
      jest.fn(),

    showVehicleParked: jest.fn(),
    showOccupancy: jest.fn(),
    showVacancyDate: jest.fn(),
    showHouseLocked: jest.fn(),
    showVehicleLocked: jest.fn(),
    showAlarmSet: jest.fn(),
    showKeysStolen: jest.fn(),

    showItemsDiscoveredMissingAndLastSeenDates:
      jest.fn(),

    showWhereWereItemsAtTimeOfTheft:
      jest.fn(),

    showHouseLivable: jest.fn(),

    showFireAuthorityReport:
      jest.fn(),

    showPoliceAuthorityReport:
      jest.fn(),

    showWitnesses: jest.fn(),

    showOtherPeopleDetails:
      jest.fn(),

    getContentsRisk: jest.fn(),

    showRiskAddressOption:
      jest.fn(),

    showEventLocation: jest.fn()
  }
}));

jest.mock('~/feature/claim/shared/state', () => ({
  ClaimType: {
    Contents: 'contents'
  },

  modelPath: 'claim',

  thunks: {
    setClaimTypeForPage1: jest.fn(),
    setBackToPreStepsPrevented:
      jest.fn()
  },

  selectors: {
    getClaimType: jest.fn(),
    getPolicyDescription: jest.fn(),
    getBackToPreStepsPrevented:
      jest.fn(),
    getContentsRiskAddress: jest.fn(),
    getClaimSharedState: jest.fn()
  }
}));

/**
 * Child components are mocked because they have
 * their own unit tests.
 */
jest.mock(
  '~/feature/claim/contents/components',
  () => ({
    AlarmSet: () => (
      <div data-testid="alarm-set" />
    ),

    AuthorityReportFire: () => (
      <div data-testid="authority-report-fire" />
    ),

    AuthorityReportPolice: () => (
      <div data-testid="authority-report-police" />
    ),

    ContentsEventLocation: () => (
      <div data-testid="contents-event-location" />
    ),

    HouseLivable: () => (
      <div data-testid="house-livable" />
    ),

    HouseLocked: () => (
      <div data-testid="house-locked" />
    ),

    ItemsDiscoveredMissingDateTime:
      () => (
        <div data-testid="items-discovered-missing-date-time" />
      ),

    ItemsLastSeenDateTime: () => (
      <div data-testid="items-last-seen-date-time" />
    ),

    KeysStolen: () => (
      <div data-testid="keys-stolen" />
    ),

    Occupancy: () => (
      <div data-testid="occupancy" />
    ),

    OtherPeopleDetail: () => (
      <div data-testid="other-people-detail" />
    ),

    VacantDate: () => (
      <div data-testid="vacant-date" />
    ),

    VehicleLocked: () => (
      <div data-testid="vehicle-locked" />
    ),

    VehicleParked: () => (
      <div data-testid="vehicle-parked" />
    ),

    WhereWereItems: () => (
      <div data-testid="where-were-items" />
    )
  })
);

/**
 * Shared child components are mocked because they
 * have their own unit tests.
 */
jest.mock(
  '~/feature/claim/shared/components',
  () => ({
    EventDescription: () => (
      <div data-testid="event-description" />
    ),

    EventLocation: () => (
      <div data-testid="event-location" />
    ),

    EventLocationDescription: () => (
      <div data-testid="event-location-description" />
    ),

    FloatingToolbar: () => (
      <div data-testid="floating-toolbar" />
    ),

    /**
     * FormFooter is intentionally a dumb mock.
     *
     * We capture the props passed by Page1 so that
     * the Page1 submit handler can be tested directly.
     *
     * We do NOT test FormFooter behaviour.
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
  })
);

jest.mock(
  '~/feature/claim/shared/components/dumb',
  () => ({
    ClaimNumber: ({
      claimNumber
    }: {
      claimNumber: string;
    }) => (
      <div data-testid="claim-number">
        {claimNumber}
      </div>
    )
  })
);

describe('Page1Component', () => {
  const claim = {
    claimNumber: 'CLM123',
    causeOfLoss: 'theft',
    secondaryCauseOfLoss: 'other',
    lossDate: new Date(
      '2026-08-01T02:45:00.000Z'
    )
  } as Page1Props['claim'];

  const createProps = (
    overrides: Partial<Page1Props> = {}
  ): Page1Props => ({
    claim,

    claimType: 'contents',

    description: 'Test description',

    state: {
      eventLocationAddress: undefined
    } as Page1Props['state'],

    missingDate: '2026-08-02',

    lossDate: claim.lossDate,

    backToPreStepsPrevented: true,

    contentsRiskAddress:
      '1 Test Street',

    claimSharedState: {
      claimNumber: 'CLM123'
    } as Page1Props['claimSharedState'],

    showEventLocationDescription:
      false,

    showEventLocationSomewhereElse:
      false,

    showVehicleParked: false,

    showOccupancy: false,

    showVacancyDate: false,

    showHouseLocked: false,

    showVehicleLocked: false,

    showAlarmSet: false,

    showKeysStolen: false,

    showItemsDiscoveredMissingAndLastSeenDates:
      false,

    showWhereWereItemsAtTimeOfTheft:
      false,

    showHouseLivable: false,

    showFireAuthorityReport:
      false,

    showPoliceAuthorityReport:
      false,

    showWitnesses: false,

    showOtherPeopleDetails:
      false,

    showRiskAddressOption: false,

    showEventLocation: false,

    risk: {} as Page1Props['risk'],

    initialise: mockInitialise,

    setClaimTypeToContents:
      mockSetClaimTypeToContents,

    setBackToPreStepsPrevented:
      mockSetBackToPreStepsPrevented,

    t: mockT,

    navigate: mockNavigate,

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

  const expectRendered = (
    testId: string
  ) => {
    expect(
      screen.getByTestId(testId)
    ).toBeInTheDocument();
  };

  const expectNotRendered = (
    testId: string
  ) => {
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
        'claim/contents:headings.page1'
      );
    });

    it('renders the incident information heading', () => {
      renderPage();

      expectHeadingRendered(
        'claim/contents:headings.incidentInformation'
      );
    });
  });

  describe('conditional sections', () => {
    it('does not render optional sections by default', () => {
      renderPage();

      expectNotRendered(
        'contents-event-location'
      );

      expectNotRendered(
        'event-location-description'
      );

      expectNotRendered(
        'event-location'
      );

      expectNotRendered(
        'vehicle-parked'
      );

      expectNotRendered('occupancy');
      expectNotRendered('vacant-date');
      expectNotRendered('house-locked');
      expectNotRendered('vehicle-locked');
      expectNotRendered('alarm-set');
      expectNotRendered('keys-stolen');

      expectNotRendered(
        'items-discovered-missing-date-time'
      );

      expectNotRendered(
        'items-last-seen-date-time'
      );

      expectNotRendered(
        'where-were-items'
      );

      expectNotRendered('house-livable');

      expectNotRendered(
        'authority-report-fire'
      );

      expectNotRendered(
        'authority-report-police'
      );

      expectNotRendered(
        'witness-section'
      );

      expectNotRendered(
        'other-people-detail'
      );
    });

    it('renders ContentsEventLocation when enabled', () => {
      renderPage({
        showEventLocation: true
      });

      expectRendered(
        'contents-event-location'
      );
    });

    it('renders EventLocationDescription when enabled', () => {
      renderPage({
        showEventLocationDescription:
          true
      });

      expectRendered(
        'event-location-description'
      );
    });

    it('renders EventLocation when somewhere else is selected', () => {
      renderPage({
        showEventLocationSomewhereElse:
          true
      });

      expectRendered('event-location');
    });

    it('renders vehicle and property sections when enabled', () => {
      renderPage({
        showVehicleParked: true,
        showOccupancy: true,
        showVacancyDate: true,
        showHouseLocked: true,
        showVehicleLocked: true,
        showAlarmSet: true,
        showKeysStolen: true,
        showHouseLivable: true
      });

      expectRendered('vehicle-parked');
      expectRendered('occupancy');
      expectRendered('vacant-date');
      expectRendered('house-locked');
      expectRendered('vehicle-locked');
      expectRendered('alarm-set');
      expectRendered('keys-stolen');
      expectRendered('house-livable');
    });

    it('renders missing and last seen date sections when enabled', () => {
      renderPage({
        showItemsDiscoveredMissingAndLastSeenDates:
          true
      });

      expectRendered(
        'items-discovered-missing-date-time'
      );

      expectRendered(
        'items-last-seen-date-time'
      );
    });

    it('renders WhereWereItems when date sections and theft location are enabled', () => {
      renderPage({
        showItemsDiscoveredMissingAndLastSeenDates:
          true,
        showWhereWereItemsAtTimeOfTheft:
          true
      });

      expectRendered(
        'items-discovered-missing-date-time'
      );

      expectRendered(
        'items-last-seen-date-time'
      );

      expectRendered(
        'where-were-items'
      );
    });

    it('does not render WhereWereItems when date sections are disabled', () => {
      renderPage({
        showItemsDiscoveredMissingAndLastSeenDates:
          false,
        showWhereWereItemsAtTimeOfTheft:
          true
      });

      expectNotRendered(
        'where-were-items'
      );
    });

    it('renders police authority report when enabled', () => {
      renderPage({
        showPoliceAuthorityReport:
          true
      });

      expectRendered(
        'authority-report-police'
      );
    });

    it('renders fire authority report when enabled', () => {
      renderPage({
        showFireAuthorityReport: true
      });

      expectHeadingRendered(
        'claim/contents:headings.fire'
      );

      expectRendered(
        'authority-report-fire'
      );
    });

    it('renders witnesses when enabled', () => {
      renderPage({
        showWitnesses: true
      });

      expectHeadingRendered(
        'claim/contents:headings.witnesses'
      );

      expectRendered(
        'witness-section'
      );
    });

    it('renders other people details when enabled', () => {
      renderPage({
        showOtherPeopleDetails: true
      });

      expectHeadingRendered(
        'claim/contents:headings.otherPeople'
      );

      expectRendered(
        'other-people-detail'
      );
    });
  });

  describe('pre steps summary', () => {
    it('renders PreStepsSummary when description is available', () => {
      renderPage({
        description:
          'Policy description'
      });

      expectRendered(
        'pre-steps-summary'
      );
    });

    it('renders PreStepsSummary when description is unavailable', () => {
      renderPage({
        description: '',
        contentsRiskAddress:
          '123 Queen Street'
      });

      expectRendered(
        'pre-steps-summary'
      );
    });
  });

  describe('componentDidMount', () => {
    it('initialises page 1 on mount', () => {
      renderPage();

      expect(
        mockInitialise
      ).toHaveBeenCalledTimes(1);

      expect(
        mockInitialise
      ).toHaveBeenCalledWith(
        claim.lossDate,
        '2026-08-02',
        false,
        expect.anything()
      );
    });

    it('initialises page 1 with the current props', () => {
      const lossDate = new Date(
        '2026-08-10T03:00:00.000Z'
      );

      const missingDate =
        '2026-08-11';

      const risk = {
        policyNumber: 'POL123'
      } as Page1Props['risk'];

      renderPage({
        lossDate,
        missingDate,
        risk,
        showRiskAddressOption: true
      });

      expect(
        mockInitialise
      ).toHaveBeenCalledTimes(1);

      expect(
        mockInitialise
      ).toHaveBeenCalledWith(
        lossDate,
        missingDate,
        true,
        risk
      );
    });

    it('sets the claim type to contents on mount', () => {
      renderPage();

      expect(
        mockSetClaimTypeToContents
      ).toHaveBeenCalledTimes(1);

      expect(
        mockSetClaimTypeToContents
      ).toHaveBeenCalledWith(
        expect.any(String),
        'CLM123',
        'contents'
      );
    });

    it('prevents back navigation when it has not already been prevented', () => {
      renderPage({
        backToPreStepsPrevented:
          false
      });

      expect(
        history.push
      ).toHaveBeenCalledTimes(10);

      expect(
        mockSetBackToPreStepsPrevented
      ).toHaveBeenCalledTimes(1);

      expect(
        mockSetBackToPreStepsPrevented
      ).toHaveBeenCalledWith(
        expect.any(String),
        true
      );
    });

    it('does not prevent back navigation when already prevented', () => {
      renderPage({
        backToPreStepsPrevented:
          true
      });

      expect(
        history.push
      ).not.toHaveBeenCalled();

      expect(
        mockSetBackToPreStepsPrevented
      ).not.toHaveBeenCalled();
    });
  });

  describe('scroll behaviour', () => {
    it('scrolls to the top after mount', () => {
      const scrollTo = jest.spyOn(
        window,
        'scrollTo'
      );

      renderPage();

      expect(
        scrollTo
      ).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(
        scrollTo
      ).toHaveBeenCalledTimes(1);

      expect(
        scrollTo
      ).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('FormFooter', () => {
    it('renders FormFooter', () => {
      renderPage();

      expectRendered('form-footer');

      expect(
        mockFormFooter
      ).toHaveBeenCalledTimes(1);
    });

    it('passes the expected props to FormFooter', () => {
      renderPage();

      expect(
        mockFormFooter
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: false,
          validating: false,
          submitButtonLabel:
            'claim:footer.nextButton.contents.page1',
          handleSubmit:
            expect.any(Function)
        })
      );
    });
  });

  describe('next action', () => {
    it('raises the GA event when FormFooter submit handler is invoked', async () => {
      renderPage();

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => void;
        };

      formFooterProps.handleSubmit();

      expect(
        raiseClaimGAEvent
      ).toHaveBeenCalledTimes(1);

      expect(
        raiseClaimGAEvent
      ).toHaveBeenCalledWith(
        'CLM123',
        'contents'
      );
    });

    it('navigates to contents page 2 when FormFooter submit handler is invoked', () => {
      renderPage();

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => void;
        };

      formFooterProps.handleSubmit();

      expect(
        mockNavigate
      ).toHaveBeenCalledTimes(1);

      expect(
        mockNavigate
      ).toHaveBeenCalledWith(
        routes.CLAIM.CONTENTS.PAGE2
      );
    });
  });
});
