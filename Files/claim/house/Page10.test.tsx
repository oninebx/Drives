import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { Page1 } from '../Page1';

const mockNavigate = jest.fn();
const mockRaiseClaimGAEvent = jest.fn();

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-redux', () => ({
  connect: () => (Component: React.ComponentType<any>) => Component,
}));

jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form">{children}</div>
  ),
}));

jest.mock('~/root/history', () => ({
  __esModule: true,
  default: {
    push: jest.fn(),
  },
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: (...args: unknown[]) =>
    mockRaiseClaimGAEvent(...args),
}));

jest.mock('~/feature/claim/house/components', () => ({
  AlarmSet: () => <div data-testid="AlarmSet" />,
  AuthorityReportFire: () => (
    <div data-testid="AuthorityReportFire" />
  ),
  AuthorityReportPolice: () => (
    <div data-testid="AuthorityReportPolice" />
  ),
  HouseEventLocation: () => (
    <div data-testid="HouseEventLocation" />
  ),
  HouseLivable: () => <div data-testid="HouseLivable" />,
  HouseLocked: () => <div data-testid="HouseLocked" />,
  KeysStolen: () => <div data-testid="KeysStolen" />,
  LastPropertyInspection: () => (
    <div data-testid="LastPropertyInspection" />
  ),
  Occupancy: () => <div data-testid="Occupancy" />,
  OtherPeopleDetail: () => (
    <div data-testid="OtherPeopleDetail" />
  ),
  VacantDate: () => <div data-testid="VacantDate" />,
}));

jest.mock('~/feature/claim/shared/components', () => ({
  EventDescription: () => (
    <div data-testid="EventDescription" />
  ),

  EventLocation: () => (
    <div data-testid="EventLocation" />
  ),

  FloatingToolbar: () => (
    <div data-testid="FloatingToolbar" />
  ),

  FormFooter: ({
    handleSubmit,
    submitButtonLabel,
  }: {
    handleSubmit: () => void;
    submitButtonLabel: string;
  }) => (
    <button onClick={handleSubmit}>
      {submitButtonLabel}
    </button>
  ),

  PreStepsSummary: () => (
    <div data-testid="PreStepsSummary" />
  ),

  WitnessSection: () => (
    <div data-testid="WitnessSection" />
  ),
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
  ClaimNumber: () => <div data-testid="ClaimNumber" />,
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      HOUSE: {
        PAGE2: '/claim/house/page2',
      },
    },
  },
}));

const createProps = (overrides = {}) => ({
  claim: {
    claimNumber: 'CLM123',
    causeOfLoss: 'Fire',
    secondaryCauseOfLoss: 'Water',
    lossDate: '2026-01-01',
  },

  claimType: 'house',

  description: 'Test description',

  state: {
    eventLocationAddress: {},
  },

  sharedState: {
    claimType: 'house',
    claimNumber: 'CLM123',
    homePolicyDetails: {
      typeOfPolicy: 'HOME',
    },
  },

  claimSharedState: {
    claimType: 'house',
    claimNumber: 'CLM123',
  },

  backToPreStepsPrevented: true,

  showEventLocation: false,
  showEventLocationSomewhereElse: false,
  showLastPropertyInspection: false,
  getHouseRiskAddress: '123 Test Street',
  showOtherPeopleDetails: false,
  showOccupancy: false,
  showVacancyDate: false,
  showTheftQuestions: false,
  showHouseLivable: false,
  showFireAuthorityReport: false,
  showPoliceAuthorityReport: false,
  showWitnesses: false,

  setClaimTypeToHouse: jest.fn(),
  setBackToPreStepsPrevented: jest.fn(),

  ...overrides,
});

describe('Page1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page', () => {
    render(<Page1 {...createProps()} />);

    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(screen.getByTestId('ClaimNumber')).toBeInTheDocument();
    expect(screen.getByTestId('PreStepsSummary')).toBeInTheDocument();
    expect(screen.getByTestId('EventDescription')).toBeInTheDocument();
    expect(screen.getByTestId('FloatingToolbar')).toBeInTheDocument();
  });

  it('renders event location when enabled', () => {
    render(
      <Page1
        {...createProps({
          showEventLocation: true,
        })}
      />,
    );

    expect(
      screen.getByTestId('HouseEventLocation'),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId('EventLocation'),
    ).not.toBeInTheDocument();
  });

  it('renders EventLocation when event location is somewhere else', () => {
    render(
      <Page1
        {...createProps({
          showEventLocation: true,
          showEventLocationSomewhereElse: true,
        })}
      />,
    );

    expect(
      screen.getByTestId('HouseEventLocation'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('EventLocation'),
    ).toBeInTheDocument();
  });

  it('renders optional sections according to feature flags', () => {
    render(
      <Page1
        {...createProps({
          showOccupancy: true,
          showLastPropertyInspection: true,
          showVacancyDate: true,
          showHouseLivable: true,
          showPoliceAuthorityReport: true,
          showFireAuthorityReport: true,
          showWitnesses: true,
          showOtherPeopleDetails: true,
          showTheftQuestions: true,
        })}
      />,
    );

    expect(screen.getByTestId('Occupancy')).toBeInTheDocument();
    expect(
      screen.getByTestId('LastPropertyInspection'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('VacantDate')).toBeInTheDocument();
    expect(screen.getByTestId('HouseLivable')).toBeInTheDocument();

    expect(
      screen.getByTestId('AuthorityReportPolice'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('AuthorityReportFire'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('WitnessSection')).toBeInTheDocument();

    expect(
      screen.getByTestId('OtherPeopleDetail'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('HouseLocked')).toBeInTheDocument();
    expect(screen.getByTestId('AlarmSet')).toBeInTheDocument();
    expect(screen.getByTestId('KeysStolen')).toBeInTheDocument();
  });

  it('does not render optional sections when disabled', () => {
    render(<Page1 {...createProps()} />);

    expect(
      screen.queryByTestId('Occupancy'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('LastPropertyInspection'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('VacantDate'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('HouseLivable'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('AuthorityReportPolice'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('AuthorityReportFire'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('WitnessSection'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('OtherPeopleDetail'),
    ).not.toBeInTheDocument();
  });

  it('uses risk address when description is empty', () => {
    render(
      <Page1
        {...createProps({
          description: '',
          getHouseRiskAddress: '456 Risk Street',
        })}
      />,
    );

    expect(screen.getByTestId('PreStepsSummary')).toBeInTheDocument();
  });

  it('sets claim type on mount', () => {
    const setClaimTypeToHouse = jest.fn();

    render(
      <Page1
        {...createProps({
          setClaimTypeToHouse,
        })}
      />,
    );

    expect(setClaimTypeToHouse).toHaveBeenCalledWith(
      expect.any(String),
      'CLM123',
      'HOME',
    );
  });

  it('prevents navigating back when it has not already been prevented', () => {
    const setBackToPreStepsPrevented = jest.fn();

    render(
      <Page1
        {...createProps({
          backToPreStepsPrevented: false,
          setBackToPreStepsPrevented,
        })}
      />,
    );

    expect(setBackToPreStepsPrevented).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );
  });

  it('does not prevent navigating back when already prevented', () => {
    const setBackToPreStepsPrevented = jest.fn();

    render(
      <Page1
        {...createProps({
          backToPreStepsPrevented: true,
          setBackToPreStepsPrevented,
        })}
      />,
    );

    expect(
      setBackToPreStepsPrevented,
    ).not.toHaveBeenCalled();
  });

  it('raises GA event and navigates to page 2 when next is clicked', () => {
    render(<Page1 {...createProps()} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'claim:footer.nextButton.house.page1',
      }),
    );

    expect(mockRaiseClaimGAEvent).toHaveBeenCalledWith(
      'CLM123',
      'house',
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      '/claim/house/page2',
    );
  });
});