import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Page1Component } from './Page1';

import type { Page1Props } from './Page1';

import { routes } from '~/common/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import history from '~/root/history';

const mockNavigate = jest.fn();
const mockInitialise = jest.fn();
const mockSetClaimTypeToContents = jest.fn();
const mockSetBackToPreStepsPrevented = jest.fn();

const mockT = jest.fn((key: string) => key);

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('react-redux-form', () => ({
  Form: ({
    children
  }: {
    children: React.ReactNode;
  }) => <div data-testid="form">{children}</div>
}));

jest.mock('~/root/history', () => ({
  __esModule: true,
  default: {
    push: jest.fn()
  }
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
 * Page1Component owns the conditional rendering.
 *
 * Child component behaviour is covered by their own unit tests,
 * so they are intentionally mocked here.
 */
jest.mock('~/feature/claim/contents/components', () => ({
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
  ItemsDiscoveredMissingDateTime: () => (
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
}));

jest.mock('~/feature/claim/shared/components', () => ({
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
  FormFooter: () => (
    <div data-testid="form-footer" />
  ),
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
    causeOfLoss: 'theft',
    secondaryCauseOfLoss: 'other',
    lossDate: new Date(
      '2026-08-01T02:45:00.000Z'
    )
  } as Page1Props['claim'];

  const createProps = (
    overrides: Partial<Page1Props> = {}
  ): Page1Props => ({
    state: {
      eventLocationAddress: undefined
    } as Page1Props['state'],

    claim,

    claimType: 'contents',

    description: 'Test description',

    missingDate: '2026-08-02',

    lossDate: claim.lossDate,

    backToPreStepsPrevented: true,

    contentsRiskAddress: '1 Test Street',

    claimSharedState: {
      claimNumber: 'CLM123'
    } as Page1Props['claimSharedState'],

    showEventLocationDescription: false,
    showEventLocationSomewhereElse: false,
    showVehicleParked: false,
    showOccupancy: false,
    showVacancyDate: false,
    showHouseLocked: false,
    showVehicleLocked: false,
    showAlarmSet: false,
    showKeysStolen: false,
    showItemsDiscoveredMissingAndLastSeenDates: false,
    showWhereWereItemsAtTimeOfTheft: false,
    showHouseLivable: false,
    showFireAuthorityReport: false,
    showPoliceAuthorityReport: false,
    showWitnesses: false,
    showOtherPeopleDetails: false,
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
    name: string
  ) => {
    expect(
      screen.getByRole('heading', {
        level: 2,
        name
      })
    ).toBeInTheDocument();
  };

  const expectHeadingNotRendered = (
    name: string
  ) => {
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name
      })
    ).not.toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.useFakeTimers();

    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders the basic page content', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

      expectRendered('form');
      expectRendered('claim-number');
      expectRendered('pre-steps-summary');
      expectRendered('event-description');
      expectRendered('form-footer');
      expectRendered('floating-toolbar');
    });

    it('renders the claim number', () => {
      render(
        <Page1Component
          {...createProps()}
      />
      );

      expect(
        screen.getByTestId('claim-number')
      ).toHaveTextContent('CLM123');
    });

    it('renders the page heading', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

      expectHeadingRendered(
        'claim/contents:headings.page1'
      );
    });

    it('renders the incident information heading', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

      expectHeadingRendered(
        'claim/contents:headings.incidentInformation'
      );
    });
  });

  describe('pre steps summary', () => {
    it('renders the policy description when available', () => {
      render(
        <Page1Component
          {...createProps({
            description: 'Policy description'
          })}
        />
      );

      expectRendered('pre-steps-summary');
    });

    it('uses the risk address when policy description is unavailable', () => {
      render(
        <Page1Component
          {...createProps({
            description: '',
            contentsRiskAddress:
              '123 Queen Street'
          })}
        />
      );

      expectRendered('pre-steps-summary');
    });
  });

  describe('event location', () => {
    it('renders the contents event location when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocation: true
          })}
        />
      );

      expectRendered(
        'contents-event-location'
      );
    });

    it('does not render the contents event location when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocation: false
          })}
      );

      expectNotRendered(
        'contents-event-location'
      );
    });

    it('renders event location description when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocationDescription: true
          })}
        />
      );

      expectRendered(
        'event-location-description'
      );
    });

    it('renders EventLocation when somewhere else is selected', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocationSomewhereElse:
              true
          })}
        />
      );

      expectRendered('event-location');
    });

    it('does not render EventLocation when somewhere else is not selected', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocationSomewhereElse:
              false
          })}
        />
      );

      expectNotRendered('event-location');
    });
  });

  describe('vehicle and property sections', () => {
    it.each([
      [
        'showVehicleParked',
        'vehicle-parked'
      ],
      [
        'showOccupancy',
        'occupancy'
      ],
      [
        'showVacancyDate',
        'vacant-date'
      ],
      [
        'showHouseLocked',
        'house-locked'
      ],
      [
        'showVehicleLocked',
        'vehicle-locked'
      ],
      [
        'showAlarmSet',
        'alarm-set'
      ],
      [
        'showKeysStolen',
        'keys-stolen'
      ],
      [
        'showHouseLivable',
        'house-livable'
      ],
      [
        'showPoliceAuthorityReport',
        'authority-report-police'
      ],
      [
        'showOtherPeopleDetails',
        'other-people-detail'
      ]
    ] as const)(
      'renders %s when enabled',
      (prop, testId) => {
        render(
          <Page1Component
            {...createProps({
              [prop]: true
            })}
          />
        );

        expectRendered(testId);
      }
    );
  });

  describe('missing and last seen dates', () => {
    it('renders both date sections when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showItemsDiscoveredMissingAndLastSeenDates:
              true
          })}
        />
      );

      expectRendered(
        'items-discovered-missing-date-time'
      );

      expectRendered(
        'items-last-seen-date-time'
      );
    });

    it('does not render the date sections when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showItemsDiscoveredMissingAndLastSeenDates:
              false
          })}
      );

      expectNotRendered(
        'items-discovered-missing-date-time'
      );

      expectNotRendered(
        'items-last-seen-date-time'
      );
    });

    it('renders where were items when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showItemsDiscoveredMissingAndLastSeenDates:
              true,
            showWhereWereItemsAtTimeOfTheft:
              true
          })}
        />
      );

      expectRendered(
        'where-were-items'
      );
    });

    it('does not render where were items when date section is disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showItemsDiscoveredMissingAndLastSeenDates:
              false,
            showWhereWereItemsAtTimeOfTheft:
              true
          })}
        />
      );

      expectNotRendered(
        'where-were-items'
      );
    });
  });

  describe('fire authority report', () => {
    it('does not render the fire section when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showFireAuthorityReport:
              false
          })}
        />
      );

      expectHeadingNotRendered(
        'claim/contents:headings.fire'
      );

      expectNotRendered(
        'authority-report-fire'
      );
    });

    it('renders the fire section when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showFireAuthorityReport:
              true
          })}
        />
      );

      expectHeadingRendered(
        'claim/contents:headings.fire'
      );

      expectRendered(
        'authority-report-fire'
      );
    });
  });

  describe('witness section', () => {
    it('does not render witnesses when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showWitnesses: false
          })}
        />
      );

      expectHeadingNotRendered(
        'claim/contents:headings.witnesses'
      );

      expectNotRendered(
        'witness-section'
      );
    });

    it('renders witnesses when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showWitnesses: true
          })}
        />
      );

      expectHeadingRendered(
        'claim/contents:headings.witnesses'
      );

      expectRendered(
        'witness-section'
      );
    });
  });

  describe('componentDidMount', () => {
    it('initialises the page on mount', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

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

    it('sets the claim type to contents on mount', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

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

    it('prevents navigating back when it has not already been prevented', () => {
      render(
        <Page1Component
          {...createProps({
            backToPreStepsPrevented:
              false
          })}
        />
      );

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

    it('does not prevent navigating back when already prevented', () => {
      render(
        <Page1Component
          {...createProps({
            backToPreStepsPrevented:
              true
          })}
        />
      );

      expect(
        history.push
      ).not.toHaveBeenCalled();

      expect(
        mockSetBackToPreStepsPrevented
      ).not.toHaveBeenCalled();
    });

    it('scrolls to the top after mount', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

      expect(
        window.scrollTo
      ).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(
        window.scrollTo
      ).toHaveBeenCalledTimes(1);

      expect(
        window.scrollTo
      ).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('next action', () => {
    it('renders FormFooter', () => {
      render(
        <Page1Component
          {...createProps()}
        />
      );

      expectRendered('form-footer');
    });
  });
});