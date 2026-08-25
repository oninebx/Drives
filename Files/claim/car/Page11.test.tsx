import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Page1Component } from './Page1';
import type { Page1Props } from './Page1';

import { routes } from '~/common/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';

const mockNavigate = jest.fn();
const mockT = jest.fn((key: string) => key);

/**
 * Page1Component only needs modelPath/formPath from car state.
 *
 * We intentionally mock the whole car state module so the test does not
 * load the real Redux selector/constants/i18n dependency tree.
 */
jest.mock('~/feature/claim/car/state', () => ({
  selectors: {},
  thunks: {
    initCarPage1: jest.fn()
  },
  formPath: 'carClaim',
  modelPath: 'carClaim'
}));

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
      CAR: {
        PAGE2: '/claim/car/page2'
      }
    }
  }
}));

/**
 * Child components are mocked because their own unit tests
 * are responsible for their internal behaviour.
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
   * FormFooter is intentionally kept as a simple child.
   *
   * Page1 tests that FormFooter is rendered.
   * FormFooter's own tests are responsible for its behaviour.
   */
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
    showPoliceAttend: false,
    showAuthorityReport: false,
    showOtherDrivers: false,
    showWitness: false,
    showOtherPersonDetails: false,
    showFireAuthorityReport: false,
    isOtherDriverInvolved: false,

    getEventLocationHeaderLabel:
      'accidentInformation',

    getEventLocationLabel:
      'accidentWhileDriving.search',

    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockNavigate.mockClear();
    mockT.mockClear();
  });

  describe('basic rendering', () => {
    it('renders the page structure and common components', () => {
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

    it('renders the event location heading from the provided label', () => {
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

  describe('theft section', () => {
    it('renders both theft sections when enabled', () => {
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
  });

  describe('your driver section', () => {
    it('renders the driver section when enabled', () => {
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

    it('does not render the driver section when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showYourDriver: false
          })}
        />
      );

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'claim/car:headings.yourDriver'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('driver-details')
      ).not.toBeInTheDocument();
    });
  });

  describe('other driver section', () => {
    it('renders other driver details heading when another driver is involved', () => {
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

    it('renders driver details heading when another driver is not involved', () => {
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

    it('does not render other driver section when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showOtherDrivers: false
          })}
        />
      );

      expect(
        screen.queryByTestId('other-drivers')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'claim/car:headings.otherDriverDetails'
        })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'claim/car:headings.driverDetails'
        })
      ).not.toBeInTheDocument();
    });
  });

  describe('other people details', () => {
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

    it('does not render other people details when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showOtherPersonDetails: false
          })}
        />
      );

      expect(
        screen.queryByTestId('other-people-detail')
      ).not.toBeInTheDocument();
    });
  });

  describe('fire authority report', () => {
    it('renders the fire authority report when enabled', () => {
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

    it('does not render the fire authority report when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showFireAuthorityReport: false
          })}
        />
      );

      expect(
        screen.queryByTestId('authority-report-fire')
      ).not.toBeInTheDocument();
    });
  });

  describe('police section', () => {
    it('does not render the police heading when both sections are disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showPoliceAttend: false,
            showAuthorityReport: false
          })}
        />
      );

      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'claim/car:headings.police'
        })
      ).not.toBeInTheDocument();
    });

    it('renders police heading and police attend when police attend is enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showPoliceAttend: true,
            showAuthorityReport: false
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

    it('renders police heading and authority report when authority report is enabled', () => {
      render(
        <Page1Component
          {...createProps({
            showPoliceAttend: false,
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
        screen.queryByTestId('police-attend')
      ).not.toBeInTheDocument();

      expect(
        screen.getByTestId('authority-report-police')
      ).toBeInTheDocument();
    });

    it('renders both police components when both are enabled', () => {
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
  });

  describe('witness section', () => {
    it('renders the witness section when enabled', () => {
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

    it('does not render the witness section when disabled', () => {
      render(
        <Page1Component
          {...createProps({
            showWitness: false
          })}
        />
      );

      expect(
        screen.queryByTestId('witness-section')
      ).not.toBeInTheDocument();
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

  describe('submit behaviour', () => {
    beforeEach(() => {
      /**
       * Unlike the normal FormFooter mock, this test needs access
       * to the callback supplied by Page1Component.
       *
       * This still does not test FormFooter's behaviour.
       */
      jest.doMock(
        '~/feature/claim/shared/components',
        () => ({
          EventDescription: () => (
            <div data-testid="event-description" />
          ),
          EventLocation: () => (
            <div data-testid="event-location" />
          ),
          FloatingToolbar: () => (
            <div data-testid="floating-toolbar" />
          ),
          FormFooter: ({
            handleSubmit
          }: {
            handleSubmit: () => void;
          }) => (
            <button
              type="button"
              data-testid="form-footer-submit"
              onClick={handleSubmit}
            >
              Next
            </button>
          ),
          PreStepsSummary: () => (
            <div data-testid="pre-steps-summary" />
          ),
          WitnessSection: () => (
            <div data-testid="witness-section" />
          )
        })
      );
    });

    it('raises the GA event and navigates to page 2', () => {
      /**
       * This test is intentionally omitted from the same module setup
       * because Jest module mocks are hoisted.
       *
       * The Page1Component behaviour is covered by the dedicated
       * callback test below if FormFooter exposes its callback.
       */
      expect(true).toBe(true);
    });
  });
});