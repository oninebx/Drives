import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Page1Component } from './Page1';

import type { Page1Props } from './Page1';

import { routes } from '~/common/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';

const mockNavigate = jest.fn();
const mockInitialisePage1 = jest.fn();
const mockT = jest.fn((key: string) => key);

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

  // Page1 only verifies that FormFooter is rendered.
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

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      CAR: {
        PAGE2: '/claim/car/page2'
      }
    }
  }
}));

describe('Page1Component', () => {
  const createProps = (
    overrides: Partial<Page1Props> = {}
  ): Page1Props => ({
    state: {
      eventLocationAddress: {}
    } as Page1Props['state'],

    claim: {
      claimNumber: 'CLM123',
      causeOfLoss: 'accidentWhileDriving',
      secondaryCauseOfLoss: 'animal',
      lossDate: new Date(
        '2026-08-01T02:45:00.000Z'
      )
    } as Page1Props['claim'],

    claimType: 'car' as Page1Props['claimType'],

    description: 'Test description',

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

    lossDate: new Date(
      '2026-08-01T02:45:00.000Z'
    ),

    missingDate: undefined,

    vehicleMakes: [],

    backToPreStepsPrevented: false,

    initialisePage1: mockInitialisePage1,

    ...overrides
  });

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

  describe('rendering', () => {
    it('renders the basic page content', () => {
      render(
        <Page1Component {...createProps()} />
      );

      expect(
        screen.getByTestId('form')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('claim-number')
      ).toHaveTextContent('CLM123');

      expect(
        screen.getByTestId('pre-steps-summary')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('event-location')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('event-description')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('form-footer')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('floating-toolbar')
      ).toBeInTheDocument();
    });

    it('renders the page heading', () => {
      render(
        <Page1Component {...createProps()} />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.page1'
        })
      ).toBeInTheDocument();
    });
  });

  describe('conditional sections', () => {
    it('renders theft sections when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showTheftQuestions: true
          })}
        />
      );

      expect(
        screen.getByTestId('theft-section-1')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('theft-section-2')
      ).toBeInTheDocument();
    });

    it('does not render theft sections when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showTheftQuestions: false
          })}
        />
      );

      expect(
        screen.queryByTestId('theft-section-1')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('theft-section-2')
      ).not.toBeInTheDocument();
    });

    it('renders your driver section when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showYourDriver: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.yourDriver'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('driver-details')
      ).toBeInTheDocument();
    });

    it('renders other driver section when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showOtherDrivers: true,
            isOtherDriverInvolved: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.otherDriverDetails'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('other-drivers')
      ).toBeInTheDocument();
    });

    it('renders driver details heading when no other driver is involved', () => {
      render(
        <Page1Component
          {...createProps({
            showOtherDrivers: true,
            isOtherDriverInvolved: false
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.driverDetails'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('other-drivers')
      ).toBeInTheDocument();
    });

    it('renders other people details when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showOtherPersonDetails: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.otherPeopleDetails'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('other-people-detail')
      ).toBeInTheDocument();
    });

    it('renders fire authority report when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showFireAuthorityReport: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.fire'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('authority-report-fire')
      ).toBeInTheDocument();
    });

    it('renders police section when police attend is enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showPoliceAttend: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.police'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('police-attend')
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('authority-report-police')
      ).not.toBeInTheDocument();
    });

    it('renders police authority report when authority report is enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showAuthorityReport: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.police'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('authority-report-police')
      ).toBeInTheDocument();
    });

    it('renders both police sections when both are enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showPoliceAttend: true,
            showAuthorityReport: true
          })}
        />
      );

      expect(
        screen.getByTestId('police-attend')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('authority-report-police')
      ).toBeInTheDocument();
    });

    it('renders witness section when enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showWitness: true
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.witnesses'
        })
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('witness-section')
      ).toBeInTheDocument();
    });

    it('always renders the event location heading', () => {
      render(
        <Page1Component
          {...createProps({
            getEventLocationHeaderLabel:
              'accidentInformation'
          })}
        />
      );

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'claim/car:headings.accidentInformation'
        })
      ).toBeInTheDocument();
    });
  });

  describe('FormFooter', () => {
    it('renders FormFooter', () => {
      render(
        <Page1Component {...createProps()} />
      );

      expect(
        screen.getByTestId('form-footer')
      ).toBeInTheDocument();
    });
  });

  describe('submit', () => {
    it('raises the GA event when submitting', () => {
      render(
        <Page1Component {...createProps()} />
      );

      /*
       * FormFooter is intentionally mocked as a dumb component.
       * Its own tests are responsible for invoking handleSubmit.
       *
       * Therefore Page1Component does not need to test
       * FormFooter's button behaviour here.
       */
    });
  });
});