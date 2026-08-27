import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import {
  Page1Component,
  Page1Loader,
  type Page1Props
} from './Page1';

import { ClaimType } from '~/feature/claim/shared/state';
import { routes } from '~/common/state';

// ------------------------------------------------------------
// Mocks
// ------------------------------------------------------------

const mockNavigate = jest.fn();
const mockSubmitWindscreenClaim = jest.fn();

const mockSetDefaultContactPhoneNumber = jest.fn();
const mockSetDefaultCarRegistration = jest.fn();
const mockDeselctConfirmation = jest.fn();

const mockDamageGlass = jest.fn(() => (
  <div data-testid="DamageGlass" />
));

const mockDamageWindscreenSide = jest.fn(() => (
  <div data-testid="DamageWindscreenSide" />
));

const mockDamageWindowSide = jest.fn(() => (
  <div data-testid="DamageWindowSide" />
));

const mockDamageSize = jest.fn(() => (
  <div data-testid="DamageSize" />
));

const mockCarLocationAddress = jest.fn(() => (
  <div data-testid="CarLocationAddress" />
));

const mockContactPhoneNumber = jest.fn(() => (
  <div data-testid="ContactPhoneNumber" />
));

const mockLicencePlateControl = jest.fn(() => (
  <div data-testid="LicencePlateControl" />
));

const mockMDCheckboxField = jest.fn(() => (
  <div data-testid="MDCheckboxField" />
));

const mockErrorText = jest.fn(() => (
  <div data-testid="ErrorText" />
));

const mockFormMessage = jest.fn(() => (
  <div data-testid="FormMessage" />
));

const mockHtml = jest.fn(() => (
  <div data-testid="Html" />
));

const mockQuestion = jest.fn(
  ({
    children,
    id
  }: {
    children: React.ReactNode;
    id: string;
  }) => (
    <div
      data-testid="Question"
      data-question-id={id}>
      {children}
    </div>
  )
);

const mockFormFooter = jest.fn(
  () => <div data-testid="FormFooter" />
);

const mockFloatingToolbar = jest.fn(() => (
  <div data-testid="FloatingToolbar" />
));

const mockForm = jest.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="Form">{children}</div>
  )
);

const defaultTranslations: Record<string, string> = {
  'claim/windscreen:headings.page1': 'Windscreen',
  'registrationNumber.title': 'Registration number',
  'claim/windscreen:carRegistration.confirmationText':
    'I confirm this registration',
  'claim/windscreen:carRegistration.registrationErrorText':
    'Registration number is required',
  'claim/windscreen:carRegistration.confirmationErrorText':
    'Please confirm the registration',
  'claim/windscreen:mandatoryFields.title':
    'Mandatory fields',
  'claim/windscreen:mandatoryFields.description':
    'Please complete all mandatory fields',
  'base:button.next': 'Next'
};

const mockT = jest.fn(
  (key: string): string => defaultTranslations[key] ?? key
);

// ------------------------------------------------------------
// Module mocks
// ------------------------------------------------------------

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('react-redux-form', () => ({
  Form: (props: {
    children: React.ReactNode;
  }) => mockForm(props),
  actions: {
    change: jest.fn()
  }
}));

jest.mock('~/common/components/base', () => ({
  ErrorText: (props: unknown) => mockErrorText(props),
  FormMessage: (props: unknown) => mockFormMessage(props),
  Html: (props: unknown) => mockHtml(props),
  LicencePlateControl: (props: unknown) =>
    mockLicencePlateControl(props),
  LicencePlateField: () => <div data-testid="LicencePlateField" />
}));

jest.mock('~/common/components/smart', () => ({
  MDCheckboxField: (props: unknown) =>
    mockMDCheckboxField(props)
}));

jest.mock('~/feature/claim/shared/components', () => ({
  FloatingToolbar: (props: unknown) =>
    mockFloatingToolbar(props),
  FormFooter: (props: unknown) =>
    mockFormFooter(props),
  Question: (props: {
    children: React.ReactNode;
    id: string;
  }) => mockQuestion(props)
}));

jest.mock('~/feature/claim/windscreen/components', () => ({
  CarLocationAddress: (props: unknown) =>
    mockCarLocationAddress(props),
  ContactPhoneNumber: () => mockContactPhoneNumber(),
  DamageGlass: () => mockDamageGlass(),
  DamageSize: () => mockDamageSize(),
  DamageWindowSide: () => mockDamageWindowSide(),
  DamageWindscreenSide: () =>
    mockDamageWindscreenSide()
}));

jest.mock('~/feature/claim/windscreen/state', () => ({
  modelPath: 'claim.windscreen',
  selectors: {
    getBaseState: jest.fn(),
    showDamageWindscreenSide: jest.fn(),
    showDamageWindowSide: jest.fn(),
    areWindscreenFieldsIncomplete: jest.fn(),
    hasCarRegistration: jest.fn(),
    hasConfirmedTheRegistration: jest.fn()
  }
}));

jest.mock('~/common/state', () => ({
  selectors: {
    getCustomer: jest.fn()
  },
  routes: {
    CLAIM: {
      SHARED: {
        CONFIRMATION: '/claim/confirmation'
      }
    }
  }
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimSharedState: jest.fn()
  }
}));

jest.mock('~/feature/claim/state', () => ({
  actions: {
    submitWindscreenClaim: () => mockSubmitWindscreenClaim()
  }
}));

jest.mock('~/feature/claim/utils', () => ({
  formatPhoneNumberApiToUi: jest.fn(
    (phoneNumber: string) => `formatted-${phoneNumber}`
  ),
  raiseClaimGAEvent: jest.fn()
}));

// ------------------------------------------------------------
// Test data
// ------------------------------------------------------------

const windscreenState = {
  contactPhoneNumber: '',
  carRegistration: {
    registrationNumber: '',
    confirmation: false
  },
  carLocationAddress: {}
};

const claimSharedState = {
  claimNumber: 'CLAIM-123',
  policyDetails: {
    risk: {
      registrationNo: 'ABC123'
    }
  }
};

const defaultComponentProps: Page1Props = {
  t: mockT,
  windscreenState,
  areWindscreenFieldsIncomplete: false,
  claimSharedState,
  showDamageWindowSide: false,
  showDamageWindscreenSide: false,
  hasCarRegistration: true,
  hasConfirmedTheRegistration: false
};

const defaultLoaderProps: Page1Props = {
  ...defaultComponentProps,
  customer: {
    phones: [
      {
        phoneNumber: '0211234567'
      }
    ]
  },
  setDefaultContactPhoneNumber:
    mockSetDefaultContactPhoneNumber,
  setDefaultCarRegistration:
    mockSetDefaultCarRegistration,
  deselctConfirmation: mockDeselctConfirmation
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const renderComponent = (
  props: Partial<Page1Props> = {}
) =>
  render(
    <Page1Component
      {...defaultComponentProps}
      {...props}
    />
  );

const renderLoader = (
  props: Partial<Page1Props> = {}
) =>
  render(
    <Page1Loader
      {...defaultLoaderProps}
      {...props}
    />
  );

// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('Page1Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockT.mockImplementation(
      (key: string): string =>
        defaultTranslations[key] ?? key
    );

    mockSubmitWindscreenClaim.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders the page heading and DamageGlass', () => {
      renderComponent();

      expect(
        screen.getByText('Windscreen')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('DamageGlass')
      ).toBeInTheDocument();
    });

    it('does not render optional damage sections when neither side is shown', () => {
      renderComponent({
        showDamageWindscreenSide: false,
        showDamageWindowSide: false
      });

      expect(
        screen.queryByTestId('DamageWindscreenSide')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('DamageWindowSide')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('DamageSize')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('CarLocationAddress')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('Question')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('ContactPhoneNumber')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('FormFooter')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('FloatingToolbar')
      ).not.toBeInTheDocument();
    });

    it('renders windscreen damage section when showDamageWindscreenSide is true', () => {
      renderComponent({
        showDamageWindscreenSide: true,
        showDamageWindowSide: false
      });

      expect(
        screen.getByTestId('DamageWindscreenSide')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('DamageSize')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('CarLocationAddress')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('Question')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('ContactPhoneNumber')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('FormFooter')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('FloatingToolbar')
      ).toBeInTheDocument();
    });

    it('renders window damage section when showDamageWindowSide is true', () => {
      renderComponent({
        showDamageWindscreenSide: false,
        showDamageWindowSide: true
      });

      expect(
        screen.getByTestId('DamageWindowSide')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('DamageSize')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('CarLocationAddress')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('ContactPhoneNumber')
      ).toBeInTheDocument();
    });

    it('renders both damage sections when both flags are true', () => {
      renderComponent({
        showDamageWindscreenSide: true,
        showDamageWindowSide: true
      });

      expect(
        screen.getByTestId('DamageWindscreenSide')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('DamageWindowSide')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('DamageSize')
      ).toBeInTheDocument();
    });
  });

  describe('licence plate confirmation', () => {
    it('renders licence plate question and fields when a damage side is shown', () => {
      renderComponent({
        showDamageWindscreenSide: true
      });

      expect(mockQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'licencePlate',
          model: 'claim.windscreen.carRegistration',
          translation:
            'claim/windscreen:carRegistration'
        })
      );

      expect(
        screen.getByTestId('LicencePlateControl')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('MDCheckboxField')
      ).toBeInTheDocument();
    });

    it('enables confirmation when the car registration already exists', () => {
      renderComponent({
        showDamageWindscreenSide: true,
        hasCarRegistration: true,
        hasConfirmedTheRegistration: false
      });

      expect(mockMDCheckboxField).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: false
        })
      );
    });

    it('enables confirmation when the registration has been confirmed', () => {
      renderComponent({
        showDamageWindscreenSide: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: true
      });

      expect(mockMDCheckboxField).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: false
        })
      );
    });

    it('disables confirmation when there is no car registration and it has not been confirmed', () => {
      renderComponent({
        showDamageWindscreenSide: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: false
      });

      expect(mockMDCheckboxField).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: true
        })
      );
    });
  });

  describe('validation messages', () => {
    it('does not render registration error before submit is attempted', () => {
      renderComponent({
        showDamageWindscreenSide: true,
        hasCarRegistration: false
      });

      expect(
        screen.queryByTestId('ErrorText')
      ).not.toBeInTheDocument();
    });

    it('renders validation errors after an incomplete submit', async () => {
      renderComponent({
        showDamageWindscreenSide: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: false,
        areWindscreenFieldsIncomplete: true
      });

      const footerProps = mockFormFooter.mock.calls[0][0];

      await footerProps.handleSubmit();

      expect(
        screen.getAllByTestId('ErrorText')
      ).toHaveLength(2);

      expect(
        screen.getByTestId('FormMessage')
      ).toBeInTheDocument();
    });

    it('renders mandatory fields message after an incomplete submit', async () => {
      renderComponent({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true
      });

      const footerProps = mockFormFooter.mock.calls[0][0];

      await footerProps.handleSubmit();

      expect(
        screen.getByTestId('FormMessage')
      ).toBeInTheDocument();
    });
  });

  describe('submit', () => {
    it('does not submit the claim when windscreen fields are incomplete', async () => {
      renderComponent({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true
      });

      const footerProps = mockFormFooter.mock.calls[0][0];

      await footerProps.handleSubmit();

      expect(
        mockSubmitWindscreenClaim
      ).not.toHaveBeenCalled();

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('submits the claim and navigates to confirmation when fields are complete', async () => {
      renderComponent({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: false
      });

      const footerProps = mockFormFooter.mock.calls[0][0];

      await footerProps.handleSubmit();

      await waitFor(() => {
        expect(
          mockSubmitWindscreenClaim
        ).toHaveBeenCalledTimes(1);
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        routes.CLAIM.SHARED.CONFIRMATION
      );
    });
  });

  describe('FormFooter', () => {
    it('renders FormFooter when a damage side is shown', () => {
      renderComponent({
        showDamageWindscreenSide: true
      });

      expect(mockFormFooter).toHaveBeenCalledTimes(1);

      expect(mockFormFooter).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: false,
          validating: false,
          submitButtonLabel: 'Next'
        })
      );
    });
  });

  describe('FloatingToolbar', () => {
    it('renders FloatingToolbar when a damage side is shown', () => {
      renderComponent({
        showDamageWindscreenSide: true
      });

      expect(
        screen.getByTestId('FloatingToolbar')
      ).toBeInTheDocument();

      expect(mockFloatingToolbar).toHaveBeenCalledWith(
        expect.objectContaining({
          saveClaimEnabled: false
        })
      );
    });
  });
});

// ------------------------------------------------------------
// Page1Loader
// ------------------------------------------------------------

describe('Page1Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockT.mockImplementation(
      (key: string): string =>
        defaultTranslations[key] ?? key
    );
  });

  it('renders Page1Component', () => {
    renderLoader();

    expect(
      screen.getByTestId('DamageGlass')
    ).toBeInTheDocument();
  });

  it('sets the default contact phone number when no contact phone number exists', async () => {
    renderLoader({
      windscreenState: {
        ...windscreenState,
        contactPhoneNumber: ''
      }
    });

    await waitFor(() => {
      expect(
        mockSetDefaultContactPhoneNumber
      ).toHaveBeenCalledWith(
        'formatted-0211234567'
      );
    });
  });

  it('does not set the default contact phone number when one already exists', async () => {
    renderLoader({
      windscreenState: {
        ...windscreenState,
        contactPhoneNumber: '0219999999'
      }
    });

    await waitFor(() => {
      expect(
        mockSetDefaultContactPhoneNumber
      ).not.toHaveBeenCalled();
    });
  });

  it('does not set the default contact phone number when customer has no phones', async () => {
    renderLoader({
      customer: {
        phones: []
      }
    });

    await waitFor(() => {
      expect(
        mockSetDefaultContactPhoneNumber
      ).not.toHaveBeenCalled();
    });
  });

  it('sets the default car registration when the customer does not already have a registration', async () => {
    renderLoader({
      hasCarRegistration: false
    });

    await waitFor(() => {
      expect(
        mockSetDefaultCarRegistration
      ).toHaveBeenCalledWith('ABC123');
    });
  });

  it('does not set the default car registration when the customer already has one', async () => {
    renderLoader({
      hasCarRegistration: true
    });

    await waitFor(() => {
      expect(
        mockSetDefaultCarRegistration
      ).not.toHaveBeenCalled();
    });
  });

  it('clears registration confirmation on mount', async () => {
    renderLoader();

    await waitFor(() => {
      expect(
        mockDeselctConfirmation
      ).toHaveBeenCalledTimes(1);
    });
  });
});
