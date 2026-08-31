import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Page2Component } from './Page2';
import type { Page2Props } from './Page2';
import { routes } from '~/common/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import type { ClaimType } from '../../shared/state';

const mockNavigate = jest.fn();
const mockT = jest.fn((key: string) => key);
const mockLoadRepairers = jest.fn();
const mockClearRepairers = jest.fn();
const mockUpdateDefaultLiabilityOnly = jest.fn();
const mockFormFooter = jest.fn();

jest.mock('react-router', () => ({ useNavigate: () => mockNavigate }));
jest.mock('~/common/utilities/translation', () => ({ translate: () => (Component: React.ComponentType) => Component }));

jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div data-testid="form">{children}</div>
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      CAR: { PAGE1: '/claim/car/page1', PAGE2: '/claim/car/page2' },
      SHARED: { CLAIM_CONTACT_DETAILS: '/claim/contact-details' }
    }
  }
}));

jest.mock('~/feature/claim/utils', () => ({ raiseClaimGAEvent: jest.fn() }));
jest.mock('~/feature/claim/car/state', () => ({
  modelPath: 'carClaim',
  YES: 'yes',
  NO: 'no',
  UNSURE: 'unsure',
  thunks: {
    loadPreferredRepairers: jest.fn(),
    clearPreferredRepairers: jest.fn(),
    clearPreferredRepairerSelection: jest.fn(),
    updateDefaultLiabilityOnlyValue: jest.fn()
  },
  selectors: {
    getClaim: jest.fn(),
    getClaimNumber: jest.fn(),
    getClaimCauseOfLoss: jest.fn(),
    getClaimSecondaryCauseOfLoss: jest.fn(),
    showYourVehicleQuestions: jest.fn(),
    showOtherPeoplePropertyQuestions: jest.fn(),
    showOtherVehiclesDamageQuestions: jest.fn(),
    hideRepairerQuestions: jest.fn(),
    showHailRepairer: jest.fn(),
    isDamageToClaim: jest.fn(),
    hideVehicleDrivableQuestion: jest.fn(),
    drivableUnsure: jest.fn(),
    askVehicleLocation: jest.fn(),
    isDamageClaimableCauseOfLoss: jest.fn(),
    showClaimDamageQuestions: jest.fn()
  }
}));

jest.mock('~/feature/claim/shared/state', () => ({ selectors: { getClaimType: jest.fn() } }));
jest.mock('~/common/components/base', () => ({
  FormMessage: ({ id }: { id: string }) => <div data-testid={`form-message-${id}`} />
}));

jest.mock('~/common/components/dumb', () => ({
  Question: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`question-${id}`}>{children}</div>
  ),
  SystemIconVariant: { ErrorOutline: 'ErrorOutline' }
}));

jest.mock('~/common/components/smart', () => ({
  MDRadioButton: () => <div data-testid="md-radio-button" />,
  MDTextField: () => <div data-testid="md-text-field" />
}));

jest.mock('~/feature/claim/car/components', () => ({
  OtherDriverDamages: () => <div data-testid="other-driver-damages" />,
  OtherPropertyDamages: () => <div data-testid="other-property-damages" />,
  RegionRepairers: () => <div data-testid="region-repairers" />,
  VehicleUse: () => <div data-testid="vehicle-use" />,
  YourVehicleDetails: () => <div data-testid="your-vehicle-details" />
}));

jest.mock('../components/dumb/HailRepairer/HailRepairer', () => ({
  __esModule: true,
  default: () => <div data-testid="hail-repairer" />
}));

jest.mock('~/feature/claim/shared/components', () => ({
  ClaimAttachments: () => <div data-testid="claim-attachments" />,
  FloatingToolbar: () => <div data-testid="floating-toolbar" />,
  FormFooter: (props: unknown) => {
    mockFormFooter(props);
    return <div data-testid="form-footer" />;
  }
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
  ClaimNumber: ({ claimNumber }: { claimNumber: string }) => <div data-testid="claim-number">{claimNumber}</div>
}));

jest.mock('./Page2.styles', () => ({
  StyledFormMessage: ({ id }: { id: string }) => <div data-testid={`styled-form-message-${id}`} />
}));

describe('Page2Component', () => {
  const claim = {
    claimNumber: 'CLM123',
    causeOfLoss: 'accidentWhileDriving',
    secondaryCauseOfLoss: 'animal'
  } as Page2Props['claim'];

  const createProps = (overrides: Partial<Page2Props> = {}): Page2Props => ({
    claim,
    claimNumber: 'CLM123',
    claimType: 'car' as ClaimType,
    causeOfLoss: 'accidentWhileDriving' as Page2Props['causeOfLoss'],
    secondaryCauseOfLoss: 'animal' as Page2Props['secondaryCauseOfLoss'],
    showYourVehicle: false,
    showOtherPeopleProperty: false,
    showOtherVehiclesDamage: false,
    showRepairer: false,
    showHailRepairer: false,
    isDamageToClaim: false,
    hideVehicleDrivableQuestion: false,
    drivableUnsure: false,
    askVehicleLocation: false,
    isDamageClaimableCauseOfLoss: false,
    showClaimDamageQuestions: true,
    loadRepairers: mockLoadRepairers,
    clearRepairers: mockClearRepairers,
    updateDefaultLiabilityOnly: mockUpdateDefaultLiabilityOnly,
    t: mockT,
    ...overrides
  });

  const renderPage = (overrides: Partial<Page2Props> = {}) => {
    render(<Page2Component {...createProps(overrides)} />);
  };

  const expectRendered = (testId: string) => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  };

  const expectNotRendered = (testId: string) => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  };

  const expectHeadingRendered = (text: string) => {
    expect(screen.getByRole('heading', { level: 2, name: text })).toBeInTheDocument();
  };

  const expectHeadingNotRendered = (text: string) => {
    expect(screen.queryByRole('heading', { level: 2, name: text })).not.toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'scrollTo', { writable: true, value: jest.fn() });
  });

  describe('basic rendering', () => {
    it('renders the basic page content', () => {
      renderPage();

      expectRendered('form');
      expectRendered('claim-number');
      expectRendered('vehicle-use');
      expectRendered('claim-attachments');
      expectRendered('form-footer');
      expectRendered('floating-toolbar');
    });

    it('renders the claim number', () => {
      renderPage();

      expect(screen.getByTestId('claim-number')).toHaveTextContent('CLM123');
    });

    it('renders the page heading', () => {
      renderPage();

      expectHeadingRendered('claim/car:headings.page2');
    });

    it('renders the vehicle use section', () => {
      renderPage();

      expectHeadingRendered('claim/car:headings.vehicleUse');
      expectRendered('vehicle-use');
    });

    it('renders attachments section', () => {
      renderPage();

      expectHeadingRendered('claim/car:headings.addAttachments');
      expectRendered('claim-attachments');
    });
  });

  describe('scroll behaviour', () => {
    it('scrolls to the top on mount', () => {
      renderPage();

      expect(window.scrollTo).toHaveBeenCalledTimes(1);
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('claim damage questions', () => {
    it('does not render damage-specific questions when disabled', () => {
      renderPage({ showClaimDamageQuestions: false });

      expectNotRendered('question-questionDrivable');
      expectNotRendered('question-questionVehicleLocation');
      expectNotRendered('region-repairers');
      expectNotRendered('hail-repairer');
      expectRendered('styled-form-message-showThirdPartyMessage');
    });

    it('renders your vehicle details when enabled', () => {
      renderPage({ showYourVehicle: true, showClaimDamageQuestions: true });

      expectHeadingRendered('claim/car:headings.yourVehicle');
      expectRendered('your-vehicle-details');
    });

    it('does not render your vehicle details when claim damage questions are disabled', () => {
      renderPage({ showYourVehicle: true, showClaimDamageQuestions: false });

      expectHeadingRendered('claim/car:headings.yourVehicle');
      expectNotRendered('your-vehicle-details');
    });
  });

  describe('drivable question', () => {
    it('renders the drivable question for a damage claim', () => {
      renderPage({
        showClaimDamageQuestions: true,
        hideVehicleDrivableQuestion: false,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: true
      });

      expectRendered('question-questionDrivable');
      expectRendered('md-radio-button');
    });

    it('does not render the drivable question when the vehicle drivable question is hidden', () => {
      renderPage({
        showClaimDamageQuestions: true,
        hideVehicleDrivableQuestion: true,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: true
      });

      expectNotRendered('question-questionDrivable');
    });

    it('does not render the drivable question when the claim is not damage claimable', () => {
      renderPage({
        showClaimDamageQuestions: true,
        hideVehicleDrivableQuestion: false,
        isDamageClaimableCauseOfLoss: false,
        isDamageToClaim: true
      });

      expectNotRendered('question-questionDrivable');
    });

    it('does not render the drivable question when there is no damage to claim', () => {
      renderPage({
        showClaimDamageQuestions: true,
        hideVehicleDrivableQuestion: false,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: false
      });

      expectNotRendered('question-questionDrivable');
    });

    it('renders the drivable question for a stolen recovered vehicle', () => {
      renderPage({
        showClaimDamageQuestions: true,
        causeOfLoss: 'stolen' as Page2Props['causeOfLoss'],
        secondaryCauseOfLoss: 'vehicleRecovered' as Page2Props['secondaryCauseOfLoss'],
        hideVehicleDrivableQuestion: true,
        isDamageClaimableCauseOfLoss: false,
        isDamageToClaim: false
      });

      expectRendered('question-questionDrivable');
      expectRendered('md-radio-button');
    });

    it('does not render the drivable question when claim damage questions are disabled', () => {
      renderPage({
        showClaimDamageQuestions: false,
        causeOfLoss: 'stolen' as Page2Props['causeOfLoss'],
        secondaryCauseOfLoss: 'vehicleRecovered' as Page2Props['secondaryCauseOfLoss']
      });

      expectNotRendered('question-questionDrivable');
    });
  });

  describe('drivable unsure message', () => {
    it('renders the safety message when drivable is unsure', () => {
      renderPage({ drivableUnsure: true, showClaimDamageQuestions: true });

      expectRendered('form-message-safetyFirstMessage');
    });

    it('does not render the safety message when drivable is not unsure', () => {
      renderPage({ drivableUnsure: false, showClaimDamageQuestions: true });

      expectNotRendered('form-message-safetyFirstMessage');
    });

    it('does not render the safety message when damage questions are disabled', () => {
      renderPage({ drivableUnsure: true, showClaimDamageQuestions: false });

      expectNotRendered('form-message-safetyFirstMessage');
    });
  });

  describe('vehicle location', () => {
    it('renders vehicle location when enabled', () => {
      renderPage({ askVehicleLocation: true, showClaimDamageQuestions: true });

      expectRendered('question-questionVehicleLocation');
      expectRendered('md-text-field');
    });

    it('does not render vehicle location when disabled', () => {
      renderPage({ askVehicleLocation: false, showClaimDamageQuestions: true });

      expectNotRendered('question-questionVehicleLocation');
    });

    it('does not render vehicle location when damage questions are disabled', () => {
      renderPage({ askVehicleLocation: true, showClaimDamageQuestions: false });

      expectNotRendered('question-questionVehicleLocation');
    });
  });

  describe('repairer', () => {
    it('renders repairers when repairer conditions are met', () => {
      renderPage({
        showRepairer: true,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: true,
        showClaimDamageQuestions: true
      });

      expectHeadingRendered('claim/car:headings.repairer');
      expectRendered('region-repairers');
    });

    it('does not render repairers when repairer is disabled', () => {
      renderPage({
        showRepairer: false,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: true,
        showClaimDamageQuestions: true
      });

      expectNotRendered('region-repairers');
    });

    it('does not render repairers when damage is not claimable', () => {
      renderPage({
        showRepairer: true,
        isDamageClaimableCauseOfLoss: false,
        isDamageToClaim: true,
        showClaimDamageQuestions: true
      });

      expectNotRendered('region-repairers');
    });

    it('does not render repairers when there is no damage to claim', () => {
      renderPage({
        showRepairer: true,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: false,
        showClaimDamageQuestions: true
      });

      expectNotRendered('region-repairers');
    });

    it('does not render repairers when damage questions are disabled', () => {
      renderPage({
        showRepairer: true,
        isDamageClaimableCauseOfLoss: true,
        isDamageToClaim: true,
        showClaimDamageQuestions: false
      });

      expectNotRendered('region-repairers');
    });
  });

  describe('hail repairer', () => {
    it('renders hail repairer when enabled', () => {
      renderPage({ showHailRepairer: true, showClaimDamageQuestions: true });

      expectHeadingRendered('claim/car:headings.repairer');
      expectRendered('hail-repairer');
    });

    it('does not render hail repairer when disabled', () => {
      renderPage({ showHailRepairer: false, showClaimDamageQuestions: true });

      expectNotRendered('hail-repairer');
    });

    it('does not render hail repairer when damage questions are disabled', () => {
      renderPage({ showHailRepairer: true, showClaimDamageQuestions: false });

      expectNotRendered('hail-repairer');
    });
  });

  describe('third party message', () => {
    it('renders the third party message when damage questions are disabled', () => {
      renderPage({ showClaimDamageQuestions: false });

      expectRendered('styled-form-message-showThirdPartyMessage');
    });

    it('does not render the third party message when damage questions are enabled', () => {
      renderPage({ showClaimDamageQuestions: true });

      expectNotRendered('styled-form-message-showThirdPartyMessage');
    });
  });

  describe('other vehicles damage', () => {
    it('renders other vehicle damages when enabled', () => {
      renderPage({ showOtherVehiclesDamage: true });

      expectHeadingRendered('claim/car:headings.otherVehicles');
      expectRendered('other-driver-damages');
    });

    it('does not render other vehicle damages when disabled', () => {
      renderPage({ showOtherVehiclesDamage: false });

      expectHeadingNotRendered('claim/car:headings.otherVehicles');
      expectNotRendered('other-driver-damages');
    });
  });

  describe('other people property', () => {
    it('renders other property damages when enabled', () => {
      renderPage({ showOtherPeopleProperty: true });

      expectHeadingRendered('claim/car:headings.otherPeopleProperty');
      expectRendered('other-property-damages');
    });

    it('does not render other property damages when disabled', () => {
      renderPage({ showOtherPeopleProperty: false });

      expectHeadingNotRendered('claim/car:headings.otherPeopleProperty');
      expectNotRendered('other-property-damages');
    });
  });

  describe('claim damage initialisation', () => {
    it('updates default liability only when damage questions are disabled', async () => {
      renderPage({ showClaimDamageQuestions: false });

      await waitFor(() => {
        expect(mockUpdateDefaultLiabilityOnly).toHaveBeenCalledTimes(1);
      });
    });

    it('does not update default liability only when damage questions are enabled', async () => {
      renderPage({ showClaimDamageQuestions: true });

      await waitFor(() => {
        expect(mockUpdateDefaultLiabilityOnly).not.toHaveBeenCalled();
      });
    });
  });

  describe('FormFooter', () => {
    it('renders FormFooter', () => {
      renderPage();

      expectRendered('form-footer');
      expect(mockFormFooter).toHaveBeenCalledTimes(1);
    });
  });

  describe('next action', () => {
    it('raises the GA event when submit handler is invoked', async () => {
      renderPage();

      const formFooterProps = mockFormFooter.mock.calls[0][0] as {
        handleSubmit: () => Promise<void>;
      };

      await formFooterProps.handleSubmit();

      expect(raiseClaimGAEvent).toHaveBeenCalledTimes(1);
      expect(raiseClaimGAEvent).toHaveBeenCalledWith('CLM123', 'car');
    });

    it('navigates to claim contact details after submit', async () => {
      renderPage();

      const formFooterProps = mockFormFooter.mock.calls[0][0] as {
        handleSubmit: () => Promise<void>;
      };

      await formFooterProps.handleSubmit();

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(routes.CLAIM.SHARED.CLAIM_CONTACT_DETAILS);
    });
  });
});