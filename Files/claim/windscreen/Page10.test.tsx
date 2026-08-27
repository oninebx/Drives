import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import {
  Page1Component,
  Page1Loader
} from './Page1';

import type { Page1Props } from './Page1';

import { routes } from '~/common/state';
import {
  formatPhoneNumberApiToUi,
  raiseClaimGAEvent
} from '~/feature/claim/utils';

/**
 * ---------------------------------------------------------
 * Mocks
 * ---------------------------------------------------------
 */

const mockNavigate = jest.fn();
const mockT = jest.fn((key: string) => key);
const mockFormFooter = jest.fn();

const mockSetDefaultContactPhoneNumber = jest.fn();
const mockSetDefaultCarRegistration = jest.fn();
const mockDeselctConfirmation = jest.fn();

const mockSubmitWindscreenClaim = jest.fn();

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
  ),

  actions: {
    change: jest.fn()
  }
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      SHARED: {
        CONFIRMATION: '/claim/shared/confirmation'
      }
    }
  },

  selectors: {
    getCustomer: jest.fn()
  }
}));

jest.mock('~/feature/claim/utils', () => ({
  formatPhoneNumberApiToUi: jest.fn(
    (phoneNumber: string) => `formatted-${phoneNumber}`
  ),

  raiseClaimGAEvent: jest.fn()
}));

jest.mock('~/feature/claim/state', () => ({
  actions: {
    submitWindscreenClaim: () =>
      mockSubmitWindscreenClaim()
  }
}));

/**
 * State selectors have their own unit tests.
 *
 * Page1 tests only need controllable selector
 * dependencies, so the complete state modules are mocked.
 */
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

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimSharedState: jest.fn()
  }
}));

/**
 * Base components are mocked because they have their
 * own unit tests.
 */
jest.mock('~/common/components/base', () => ({
  ErrorText: () => (
    <div data-testid="error-text" />
  ),

  FormMessage: () => (
    <div data-testid="form-message" />
  ),

  Html: () => (
    <div data-testid="html" />
  ),

  LicencePlateControl: () => (
    <div data-testid="licence-plate-control" />
  ),

  LicencePlateField: () => (
    <div data-testid="licence-plate-field" />
  )
}));

/**
 * Smart components are mocked because they have their
 * own unit tests.
 */
jest.mock('~/common/components/smart', () => ({
  MDCheckboxField: () => (
    <div data-testid="md-checkbox-field" />
  )
}));

/**
 * Windscreen child components are mocked because they
 * have their own unit tests.
 */
jest.mock('~/feature/claim/windscreen/components', () => ({
  CarLocationAddress: () => (
    <div data-testid="car-location-address" />
  ),

  ContactPhoneNumber: () => (
    <div data-testid="contact-phone-number" />
  ),

  DamageGlass: () => (
    <div data-testid="damage-glass" />
  ),

  DamageSize: () => (
    <div data-testid="damage-size" />
  ),

  DamageWindowSide: () => (
    <div data-testid="damage-window-side" />
  ),

  DamageWindscreenSide: () => (
    <div data-testid="damage-windscreen-side" />
  )
}));

/**
 * Shared components are mocked because they have their
 * own unit tests.
 */
jest.mock('~/feature/claim/shared/components', () => ({
  FloatingToolbar: () => (
    <div data-testid="floating-toolbar" />
  ),

  /**
   * FormFooter is intentionally a dumb mock.
   *
   * Page1 tests the props it provides and invokes
   * handleSubmit to test Page1's own submit behaviour.
   *
   * FormFooter's own behaviour is covered by its
   * dedicated unit tests.
   */
  FormFooter: (props: unknown) => {
    mockFormFooter(props);

    return (
      <div data-testid="form-footer" />
    );
  },

  Question: ({
    children,
    id
  }: {
    children: React.ReactNode;
    id: string;
  }) => (
    <div
      data-testid="question"
      data-question-id={id}>
      {children}
    </div>
  )
}));

/**
 * ---------------------------------------------------------
 * Test data
 * ---------------------------------------------------------
 */

const defaultTranslations: Record<string, string> = {
  'claim/windscreen:headings.page1':
    'Windscreen',

  'registrationNumber.title':
    'Registration number',

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

  'base:button.next':
    'Next',

  'claim:phone.defaultCountry':
    'NZ'
};

const windscreenState = {
  contactPhoneNumber: '',
  carRegistration: {
    registrationNumber: '',
    confirmation: false
  },

  carLocationAddress: undefined
} as Page1Props['windscreenState'];

const claimSharedState = {
  claimNumber: 'CLM123',

  policyDetails: {
    risk: {
      registrationNo: 'ABC123'
    }
  }
} as Page1Props['claimSharedState'];

const customer = {
  phones: [
    {
      phoneNumber: '0211234567'
    }
  ]
} as Page1Props['customer'];

/**
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

const createComponentProps = (
  overrides: Partial<Page1Props> = {}
): Page1Props => ({
  t: mockT,

  windscreenState,

  showDamageWindscreenSide: false,

  showDamageWindowSide: false,

  areWindscreenFieldsIncomplete: false,

  customer,

  claimSharedState,

  hasCarRegistration: true,

  hasConfirmedTheRegistration: false,

  ...overrides
});

const createLoaderProps = (
  overrides: Partial<Page1Props> = {}
): Page1Props => ({
  ...createComponentProps(),

  setDefaultContactPhoneNumber:
    mockSetDefaultContactPhoneNumber,

  setDefaultCarRegistration:
    mockSetDefaultCarRegistration,

  deselctConfirmation:
    mockDeselctConfirmation,

  ...overrides
});

const renderPage = (
  overrides: Partial<Page1Props> = {}
) => {
  render(
    <Page1Component
      {...createComponentProps(overrides)}
    />
  );
};

const renderLoader = (
  overrides: Partial<Page1Props> = {}
) => {
  render(
    <Page1Loader
      {...createLoaderProps(overrides)}
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

/**
 * ---------------------------------------------------------
 * Page1Component
 * ---------------------------------------------------------
 */

describe('Page1Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockT.mockImplementation(
      (key: string) =>
        defaultTranslations[key] ?? key
    );

    mockSubmitWindscreenClaim.mockResolvedValue(
      undefined
    );
  });

  describe('basic rendering', () => {
    it('renders the basic page content', () => {
      renderPage();

      expectRendered('form');
      expectRendered('damage-glass');
    });

    it('renders the page heading', () => {
      renderPage();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Windscreen'
        })
      ).toBeInTheDocument();
    });

    it('does not render the damage sections by default', () => {
      renderPage();

      expectNotRendered(
        'damage-windscreen-side'
      );

      expectNotRendered(
        'damage-window-side'
      );

      expectNotRendered('damage-size');
      expectNotRendered(
        'car-location-address'
      );

      expectNotRendered(
        'contact-phone-number'
      );

      expectNotRendered('form-footer');
      expectNotRendered(
        'floating-toolbar'
      );
    });
  });

  describe('conditional sections', () => {
    it('renders windscreen damage section when enabled', () => {
      renderPage({
        showDamageWindscreenSide: true
      });

      expectRendered(
        'damage-windscreen-side'
      );

      expectRendered('damage-size');
      expectRendered(
        'car-location-address'
      );

      expectRendered(
        'contact-phone-number'
      );

      expectRendered('form-footer');
      expectRendered(
        'floating-toolbar'
      );
    });

    it('renders window damage section when enabled', () => {
      renderPage({
        showDamageWindowSide: true
      });

      expectRendered(
        'damage-window-side'
      );

      expectRendered('damage-size');
      expectRendered(
        'car-location-address'
      );

      expectRendered(
        'contact-phone-number'
      );

      expectRendered('form-footer');
      expectRendered(
        'floating-toolbar'
      );
    });

    it('renders both damage sections when both are enabled', () => {
      renderPage({
        showDamageWindscreenSide: true,
        showDamageWindowSide: true
      });

      expectRendered(
        'damage-windscreen-side'
      );

      expectRendered(
        'damage-window-side'
      );

      expectRendered('damage-size');
      expectRendered(
        'car-location-address'
      );
    });
  });

  describe('licence plate section', () => {
    it('renders licence plate controls when a damage side is shown', () => {
      renderPage({
        showDamageWindscreenSide: true
      });

      expectRendered('question');

      expectRendered(
        'licence-plate-control'
      );

      expectRendered(
        'md-checkbox-field'
      );
    });

    it('enables registration confirmation when car registration exists', () => {
      renderPage({
        showDamageWindscreenSide: true,
        hasCarRegistration: true,
        hasConfirmedTheRegistration: false
      });

      /**
       * The actual MDCheckboxField behaviour is tested
       * by its own unit tests.
       *
       * Here we only verify the prop Page1 provides.
       */
      const checkboxProps =
        mockMDCheckboxField.mock.calls[0]?.[0];

      expect(checkboxProps).toEqual(
        expect.objectContaining({
          disabled: false
        })
      );
    });

    it('enables registration confirmation when registration has been confirmed', () => {
      renderPage({
        showDamageWindscreenSide: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: true
      });

      const checkboxProps =
        mockMDCheckboxField.mock.calls[0]?.[0];

      expect(checkboxProps).toEqual(
        expect.objectContaining({
          disabled: false
        })
      );
    });

    it('disables registration confirmation when registration is missing and has not been confirmed', () => {
      renderPage({
        showDamageWindscreenSide: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: false
      });

      const checkboxProps =
        mockMDCheckboxField.mock.calls[0]?.[0];

      expect(checkboxProps).toEqual(
        expect.objectContaining({
          disabled: true
        })
      );
    });
  });

  describe('validation messages', () => {
    it('does not render validation messages before submit is attempted', () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: false
      });

      expectNotRendered('error-text');
      expectNotRendered('form-message');
    });

    it('renders validation messages after an incomplete submit', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: false
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      await waitFor(() => {
        expect(
          screen.getAllByTestId('error-text')
        ).toHaveLength(2);

        expectRendered('form-message');
      });
    });

    it('renders registration error when registration is missing after submit', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true,
        hasCarRegistration: false,
        hasConfirmedTheRegistration: true
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      await waitFor(() => {
        expect(
          screen.getAllByTestId('error-text')
        ).toHaveLength(1);
      });
    });

    it('renders confirmation error when registration has not been confirmed after submit', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true,
        hasCarRegistration: true,
        hasConfirmedTheRegistration: false
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      await waitFor(() => {
        expect(
          screen.getAllByTestId('error-text')
        ).toHaveLength(1);
      });
    });
  });

  describe('FormFooter', () => {
    it('renders FormFooter when a damage side is shown', () => {
      renderPage({
        showDamageWindscreenSide: true
      });

      expectRendered('form-footer');

      expect(
        mockFormFooter
      ).toHaveBeenCalledTimes(1);
    });

    it('passes the expected props to FormFooter', () => {
      renderPage({
        showDamageWindscreenSide: true
      });

      expect(
        mockFormFooter
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: false,
          validating: false,
          submitButtonLabel: 'Next',
          handleSubmit: expect.any(Function)
        })
      );
    });
  });

  describe('submit', () => {
    it('does not submit the claim when fields are incomplete', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: true
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      expect(
        mockSubmitWindscreenClaim
      ).not.toHaveBeenCalled();

      expect(
        mockNavigate
      ).not.toHaveBeenCalled();

      expect(
        raiseClaimGAEvent
      ).not.toHaveBeenCalled();
    });

    it('submits the claim when fields are complete', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: false
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      await waitFor(() => {
        expect(
          mockSubmitWindscreenClaim
        ).toHaveBeenCalledTimes(1);
      });
    });

    it('raises the GA event after submitting the claim', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: false
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      await waitFor(() => {
        expect(
          raiseClaimGAEvent
        ).toHaveBeenCalledWith(
          'CLM123',
          'windscreen'
        );
      });
    });

    it('navigates to the confirmation page after submitting the claim', async () => {
      renderPage({
        showDamageWindscreenSide: true,
        areWindscreenFieldsIncomplete: false
      });

      const formFooterProps =
        mockFormFooter.mock.calls[0][0] as {
          handleSubmit: () => Promise<void>;
        };

      await formFooterProps.handleSubmit();

      await waitFor(() => {
        expect(
          mockNavigate
        ).toHaveBeenCalledWith(
          routes.CLAIM.SHARED.CONFIRMATION
        );
      });
    });
  });

  describe('FloatingToolbar', () => {
    it('renders FloatingToolbar when a damage side is shown', () => {
      renderPage({
        showDamageWindscreenSide: true
      });

      expectRendered(
        'floating-toolbar'
      );
    });
  });
});

/**
 * ---------------------------------------------------------
 * Page1Loader
 * ---------------------------------------------------------
 */

describe('Page1Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockT.mockImplementation(
      (key: string) =>
        defaultTranslations[key] ?? key
    );

    (
      formatPhoneNumberApiToUi as jest.Mock
    ).mockImplementation(
      (phoneNumber: string) =>
        `formatted-${phoneNumber}`
    );
  });

  describe('initialisation', () => {
    it('sets the default contact phone number when no phone number exists', async () => {
      renderLoader({
        windscreenState: {
          ...windscreenState,
          contactPhoneNumber: ''
        },

        customer
      });

      await waitFor(() => {
        expect(
          mockSetDefaultContactPhoneNumber
        ).toHaveBeenCalledTimes(1);

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
          contactPhoneNumber:
            '0219999999'
        },

        customer
      });

      await waitFor(() => {
        expect(
          mockSetDefaultContactPhoneNumber
        ).not.toHaveBeenCalled();
      });
    });

    it('does not set the default contact phone number when the customer has no phones', async () => {
      renderLoader({
        windscreenState: {
          ...windscreenState,
          contactPhoneNumber: ''
        },

        customer: {
          phones: []
        } as Page1Props['customer']
      });

      await waitFor(() => {
        expect(
          mockSetDefaultContactPhoneNumber
        ).not.toHaveBeenCalled();
      });
    });

    it('sets the default car registration when there is no existing registration', async () => {
      renderLoader({
        hasCarRegistration: false
      });

      await waitFor(() => {
        expect(
          mockSetDefaultCarRegistration
        ).toHaveBeenCalledTimes(1);

        expect(
          mockSetDefaultCarRegistration
        ).toHaveBeenCalledWith(
          'ABC123'
        );
      });
    });

    it('does not set the default car registration when registration already exists', async () => {
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

  describe('multiple initialisation conditions', () => {
    it('initialises both contact phone and car registration when both are missing', async () => {
      renderLoader({
        windscreenState: {
          ...windscreenState,
          contactPhoneNumber: ''
        },

        hasCarRegistration: false
      });

      await waitFor(() => {
        expect(
          mockSetDefaultContactPhoneNumber
        ).toHaveBeenCalledWith(
          'formatted-0211234567'
        );

        expect(
          mockSetDefaultCarRegistration
        ).toHaveBeenCalledWith(
          'ABC123'
        );

        expect(
          mockDeselctConfirmation
        ).toHaveBeenCalledTimes(1);
      });
    });
  });
});
