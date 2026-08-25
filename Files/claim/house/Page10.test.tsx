import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Page1Component } from './Page1';

import type { Page1Props } from './Page1';

import { routes } from '~/common/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import history from '~/root/history';

const mockNavigate = jest.fn();

const mockSetClaimTypeToHouse = jest.fn();
const mockSetBackToPreStepsPrevented = jest.fn();

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
      HOUSE: {
        PAGE2: '/claim/house/page2'
      }
    }
  }
}));

/**
 * Dumb / child components
 *
 * We don't need to test them here.
 * Their own unit tests should cover their behaviour.
 */
jest.mock('~/feature/claim/house/components', () => ({
  AlarmSet: () => <div data-testid="AlarmSet" />,
  AuthorityReportFire: () => <div data-testid="AuthorityReportFire" />,
  AuthorityReportPolice: () => <div data-testid="AuthorityReportPolice" />,
  HouseEventLocation: () => <div data-testid="HouseEventLocation" />,
  HouseLivable: () => <div data-testid="HouseLivable" />,
  HouseLocked: () => <div data-testid="HouseLocked" />,
  KeysStolen: () => <div data-testid="KeysStolen" />,
  LastPropertyInspection: () => (
    <div data-testid="LastPropertyInspection" />
  ),
  Occupancy: () => <div data-testid="Occupancy" />,
  OtherPeopleDetail: () => <div data-testid="OtherPeopleDetail" />,
  VacantDate: () => <div data-testid="VacantDate" />
}));

jest.mock('~/feature/claim/shared/components', () => ({
  EventDescription: () => <div data-testid="EventDescription" />,
  EventLocation: () => <div data-testid="EventLocation" />,
  FloatingToolbar: () => <div data-testid="FloatingToolbar" />,
  FormFooter: ({
    disabled,
    validating,
    submitButtonLabel,
    handleSubmit
  }: {
    disabled: boolean;
    validating: boolean;
    submitButtonLabel: string;
    handleSubmit: () => void;
  }) => (
    <div>
      <button
        data-testid="next-button"
        disabled={disabled}
        onClick={handleSubmit}
      >
        {submitButtonLabel}
      </button>

      <span data-testid="validating">{String(validating)}</span>
    </div>
  ),
  PreStepsSummary: () => <div data-testid="PreStepsSummary" />,
  WitnessSection: () => <div data-testid="WitnessSection" />
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
  ClaimNumber: ({ claimNumber }: { claimNumber: string }) => (
    <div data-testid="ClaimNumber">{claimNumber}</div>
  )
}));

jest.mock('~/root/i18n', () => ({
  t: jest.fn()
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
      causeOfLoss: 'AccidentDamage',
      secondaryCauseOfLoss: 'Other',
      lossDate: '2026-08-01'
    } as Page1Props['claim'],

    claimType: 'House' as Page1Props['claimType'],

    description: 'Test description',

    showEventLocation: false,
    showEventLocationSomewhereElse: false,
    showLastPropertyInspection: false,
    showOtherPeopleDetails: false,
    showOccupancy: false,
    showVacancyDate: false,
    showTheftQuestions: false,
    showHouseLivable: false,
    showFireAuthorityReport: false,
    showPoliceAuthorityReport: false,
    showWitnesses: false,

    getHouseRiskAddress: '1 Test Street',

    sharedState: {
      homePolicyDetails: {
        typeOfPolicy: 'Home'
      }
    } as Page1Props['sharedState'],

    claimSharedState: {
      claimType: 'House',
      claimNumber: 'CLM123'
    } as Page1Props['claimSharedState'],

    backToPreStepsPrevented: true,

    setClaimTypeToHouse: mockSetClaimTypeToHouse,
    setBackToPreStepsPrevented: mockSetBackToPreStepsPrevented,

    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockNavigate.mockClear();
    mockSetClaimTypeToHouse.mockClear();
    mockSetBackToPreStepsPrevented.mockClear();
    mockT.mockClear();

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
      render(<Page1Component {...createProps()} />);

      expect(screen.getByTestId('ClaimNumber')).toHaveTextContent(
        'CLM123'
      );

      expect(screen.getByTestId('PreStepsSummary')).toBeInTheDocument();
      expect(screen.getByTestId('EventDescription')).toBeInTheDocument();
      expect(screen.getByTestId('FloatingToolbar')).toBeInTheDocument();
      expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('uses description when description is available', () => {
      render(
        <Page1Component
          {...createProps({
            description: 'Description from claim'
          })}
        />
      );

      expect(screen.getByTestId('PreStepsSummary')).toBeInTheDocument();
    });

    it('renders risk address when description is empty', () => {
      render(
        <Page1Component
          {...createProps({
            description: '',
            getHouseRiskAddress: '123 Queen Street'
          })}
        />
      );

      expect(screen.getByTestId('PreStepsSummary')).toBeInTheDocument();
    });
  });

  describe('conditional sections', () => {
    it('renders event location when showEventLocation is true', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocation: true
          })}
        />
      );

      expect(
        screen.getByTestId('HouseEventLocation')
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('EventLocation')
      ).not.toBeInTheDocument();
    });

    it('renders EventLocation when event location is shown somewhere else', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocation: true,
            showEventLocationSomewhereElse: true
          })}
        />
      );

      expect(
        screen.getByTestId('HouseEventLocation')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('EventLocation')
      ).toBeInTheDocument();
    });

    it('does not render EventLocation when showEventLocation is false', () => {
      render(
        <Page1Component
          {...createProps({
            showEventLocation: false,
            showEventLocationSomewhereElse: true
          })}
        />
      );

      expect(
        screen.queryByTestId('HouseEventLocation')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('EventLocation')
      ).not.toBeInTheDocument();
    });

    it.each([
      ['showOccupancy', 'Occupancy'],
      ['showLastPropertyInspection', 'LastPropertyInspection'],
      ['showVacancyDate', 'VacantDate'],
      ['showHouseLivable', 'HouseLivable'],
      ['showPoliceAuthorityReport', 'AuthorityReportPolice'],
      ['showOtherPeopleDetails', 'OtherPeopleDetail'],
      ['showWitnesses', 'WitnessSection']
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

        expect(screen.getByTestId(testId)).toBeInTheDocument();
      }
    );

    it('renders all theft questions when showTheftQuestions is true', () => {
      render(
        <Page1Component
          {...createProps({
            showTheftQuestions: true
          })}
        />
      );

      expect(screen.getByTestId('HouseLocked')).toBeInTheDocument();
      expect(screen.getByTestId('AlarmSet')).toBeInTheDocument();
      expect(screen.getByTestId('KeysStolen')).toBeInTheDocument();
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
        screen.getByTestId('AuthorityReportFire')
      ).toBeInTheDocument();
    });

    it('does not render optional sections when flags are false', () => {
      render(<Page1Component {...createProps()} />);

      expect(
        screen.queryByTestId('Occupancy')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('LastPropertyInspection')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('VacantDate')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('HouseLivable')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('HouseLocked')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('AuthorityReportPolice')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('AuthorityReportFire')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('WitnessSection')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('OtherPeopleDetail')
      ).not.toBeInTheDocument();
    });
  });

  describe('useEffect', () => {
    it('sets claim type to house on mount', () => {
      render(<Page1Component {...createProps()} />);

      expect(mockSetClaimTypeToHouse).toHaveBeenCalledTimes(1);

      expect(mockSetClaimTypeToHouse).toHaveBeenCalledWith(
        expect.any(String),
        'CLM123',
        'Home'
      );
    });

    it('prevents navigating back when it has not already been prevented', () => {
      render(
        <Page1Component
          {...createProps({
            backToPreStepsPrevented: false
          })}
        />
      );

      expect(history.push).toHaveBeenCalledTimes(10);

      expect(mockSetBackToPreStepsPrevented).toHaveBeenCalledTimes(1);

      expect(mockSetBackToPreStepsPrevented).toHaveBeenCalledWith(
        expect.any(String),
        true
      );
    });

    it('does not prevent navigating back when already prevented', () => {
      render(
        <Page1Component
          {...createProps({
            backToPreStepsPrevented: true
          })}
        />
      );

      expect(history.push).not.toHaveBeenCalled();
      expect(mockSetBackToPreStepsPrevented).not.toHaveBeenCalled();
    });

    it('scrolls to top after mount', () => {
      const scrollTo = jest.spyOn(window, 'scrollTo');

      render(<Page1Component {...createProps()} />);

      expect(scrollTo).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('next button', () => {
    it('starts loading when next is clicked', () => {
      render(<Page1Component {...createProps()} />);

      const button = screen.getByTestId('next-button');

      expect(button).not.toBeDisabled();

      fireEvent.click(button);

      expect(button).toBeDisabled();
      expect(screen.getByTestId('validating')).toHaveTextContent(
        'true'
      );
    });

    it('raises GA event when next is clicked', () => {
      render(<Page1Component {...createProps()} />);

      fireEvent.click(screen.getByTestId('next-button'));

      expect(raiseClaimGAEvent).toHaveBeenCalledTimes(1);

      expect(raiseClaimGAEvent).toHaveBeenCalledWith(
        'CLM123',
        'house'
      );
    });

    it('navigates to house page 2 when next is clicked', () => {
      render(<Page1Component {...createProps()} />);

      fireEvent.click(screen.getByTestId('next-button'));

      expect(mockNavigate).toHaveBeenCalledTimes(1);

      expect(mockNavigate).toHaveBeenCalledWith(
        routes.CLAIM.HOUSE.PAGE2
      );
    });
  });
});