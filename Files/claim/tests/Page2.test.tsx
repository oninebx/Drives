import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { routes } from '~/common/state';
import { selectors as commonSelectors } from '~/common/state/';
import {
  modelPath,
  selectors as houseSelectors
} from '~/feature/claim/house/state';
import {
  selectors as claimsSharedSelectors
} from '~/feature/claim/shared/state';
import { useAppSelector } from '~/root/store';

import Page2 from './Page2';
import { raiseClaimGAEvent } from '../../utils';

const mockNavigate = jest.fn();
const mockRaiseClaimGAEvent = raiseClaimGAEvent as jest.Mock;

/**
 * --------------------------------------------------------------------------
 * Module mocks
 * --------------------------------------------------------------------------
 */

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
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

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('~/root/store', () => ({
  useAppSelector: jest.fn()
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: jest.fn()
}));

/**
 * Mock the selector modules themselves.
 *
 * Do not reference variables declared outside the factory here.
 * This avoids Jest hoisting / TDZ issues.
 */
jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      HOUSE: {
        PAGE1: '/claim/house/page1'
      },
      SHARED: {
        CLAIM_CONTACT_DETAILS:
          '/claim/contact-details'
      }
    }
  },

  selectors: {
    getFlags: jest.fn()
  }
}));

jest.mock('~/feature/claim/house/state', () => ({
  modelPath: 'myForms.houseClaim',

  selectors: {
    getClaimNumber: jest.fn(),
    showDamageItems: jest.fn(),
    showDamageAreas: jest.fn(),
    showGlassBrokenPaneCount: jest.fn(),
    showCarpetDamageType: jest.fn(),
    showDryingRequired: jest.fn(),
    getIsDamageItemWithNoOtherDamage: jest.fn(),
    showDamageDescription: jest.fn(),
    showMouldVisible: jest.fn(),
    showEngagedWithContractor: jest.fn()
  }
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimType: jest.fn()
  }
}));

/**
 * --------------------------------------------------------------------------
 * Child component mocks
 * --------------------------------------------------------------------------
 */

jest.mock('~/feature/claim/house/components', () => ({
  CarpetDamage: ({
    modelPath: componentModelPath
  }: {
    modelPath: string;
  }) => (
    <div
      data-testid="carpet-damage"
      data-model-path={componentModelPath}
    />
  ),

  DamageAreaSelector: () => (
    <div data-testid="damage-area-selector" />
  ),

  DamageItemsSelector: () => (
    <div data-testid="damage-items-selector" />
  ),

  DryingRequired: () => (
    <div data-testid="drying-required" />
  ),

  EngagedWithContractor: () => (
    <div data-testid="engaged-with-contractor" />
  ),

  GlassBrokenPaneCount: ({
    modelPath: componentModelPath
  }: {
    modelPath: string;
  }) => (
    <div
      data-testid="glass-broken-pane-count"
      data-model-path={componentModelPath}
    />
  ),

  MouldVisible: () => (
    <div data-testid="mould-visible" />
  )
}));

jest.mock(
  '~/feature/claim/shared/components',
  () => ({
    ClaimAttachments: ({
      claimType
    }: {
      claimType: string;
    }) => (
      <div
        data-testid="claim-attachments"
        data-claim-type={claimType}
      />
    ),

    FloatingToolbar: ({
      saveClaimEnabled
    }: {
      saveClaimEnabled: boolean;
    }) => (
      <div
        data-testid="floating-toolbar"
        data-save-claim-enabled={
          saveClaimEnabled
        }
      />
    ),

    FormFooter: ({
      disabled,
      validating,
      submitButtonLabel,
      showBackButton,
      backUrl,
      handleSubmit
    }: {
      disabled: boolean;
      validating: boolean;
      submitButtonLabel: string;
      showBackButton: boolean;
      backUrl: string;
      handleSubmit: () => Promise<void>;
    }) => (
      <div data-testid="form-footer">
        <button
          type="button"
          data-testid="form-footer-submit"
          disabled={disabled}
          onClick={handleSubmit}
        >
          {submitButtonLabel}
        </button>

        <span data-testid="form-footer-validating">
          {String(validating)}
        </span>

        <span data-testid="form-footer-show-back">
          {String(showBackButton)}
        </span>

        <span data-testid="form-footer-back-url">
          {backUrl}
        </span>
      </div>
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
      <div
        data-testid="claim-number"
        data-claim-number={claimNumber}
      />
    ),

    DamageDescription: ({
      modelPath: componentModelPath,
      translation,
      placeholder
    }: {
      modelPath: string;
      translation: string;
      placeholder: string;
    }) => (
      <div data-testid="damage-description">
        <span data-testid="damage-description-model-path">
          {componentModelPath}
        </span>

        <span data-testid="damage-description-translation">
          {translation}
        </span>

        <span data-testid="damage-description-placeholder">
          {placeholder}
        </span>
      </div>
    )
  })
);

/**
 * --------------------------------------------------------------------------
 * Mock references
 * --------------------------------------------------------------------------
 *
 * This project does not support jest.mocked(), so use `as jest.Mock`.
 */

const mockUseAppSelector =
  useAppSelector as jest.Mock;

// const getFlagsMock =
//   commonSelectors.getFlags as jest.Mock;

// const getClaimNumberMock =
//   houseSelectors.getClaimNumber as jest.Mock;

// const showDamageItemsMock =
//   houseSelectors.showDamageItems as jest.Mock;

// const showDamageAreasMock =
//   houseSelectors.showDamageAreas as jest.Mock;

// const showGlassBrokenPaneCountMock =
//   houseSelectors.showGlassBrokenPaneCount as jest.Mock;

// const showCarpetDamageTypeMock =
//   houseSelectors.showCarpetDamageType as jest.Mock;

// const showDryingRequiredMock =
//   houseSelectors.showDryingRequired as jest.Mock;

// const getIsDamageItemWithNoOtherDamageMock =
//   houseSelectors.getIsDamageItemWithNoOtherDamage as jest.Mock;

// const showDamageDescriptionMock =
//   houseSelectors.showDamageDescription as jest.Mock;

// const showMouldVisibleMock =
//   houseSelectors.showMouldVisible as jest.Mock;

// const showEngagedWithContractorMock =
//   houseSelectors.showEngagedWithContractor as jest.Mock;

// const getClaimTypeMock =
//   claimsSharedSelectors.getClaimType as jest.Mock;

/**
 * --------------------------------------------------------------------------
 * Selector state
 * --------------------------------------------------------------------------
 *
 * Page2 calls:
 *
 *   useAppSelector(selector)
 *
 * Instead of creating a Redux store, map each selector to a value.
 */

const selectorValues = new Map<
  unknown,
  unknown
>();

const defaultSelectorState = () => {
  selectorValues.clear();

  selectorValues.set(
    commonSelectors.getFlags,
    {
      'cs-engaged-with-customer': false
    }
  );

  selectorValues.set(
    houseSelectors.getClaimNumber,
    '123456'
  );

  selectorValues.set(
    houseSelectors.showDamageItems,
    false
  );

  selectorValues.set(
    houseSelectors.showDamageAreas,
    false
  );

  selectorValues.set(
    houseSelectors.showGlassBrokenPaneCount,
    false
  );

  selectorValues.set(
    houseSelectors.showCarpetDamageType,
    false
  );

  selectorValues.set(
    houseSelectors.showDryingRequired,
    false
  );

  selectorValues.set(
    houseSelectors.getIsDamageItemWithNoOtherDamage,
    false
  );

  selectorValues.set(
    houseSelectors.showDamageDescription,
    false
  );

  selectorValues.set(
    claimsSharedSelectors.getClaimType,
    'house'
  );

  selectorValues.set(
    houseSelectors.showMouldVisible,
    false
  );

  selectorValues.set(
    houseSelectors.showEngagedWithContractor,
    false
  );
};

const renderPage = () => render(<Page2 />);

beforeEach(() => {
  jest.clearAllMocks();

  defaultSelectorState();

  mockUseAppSelector.mockImplementation(
    selector => selectorValues.get(selector)
  );
});

/**
 * --------------------------------------------------------------------------
 * Tests
 * --------------------------------------------------------------------------
 */

describe('House Page2', () => {
  describe('basic rendering', () => {
    it('should render the page', () => {
      renderPage();

      expect(
        screen.getByTestId('form')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('claim-number')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('claim-attachments')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('form-footer')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('floating-toolbar')
      ).toBeInTheDocument();
    });

    it('should pass the claim number to ClaimNumber', () => {
      selectorValues.set(
        houseSelectors.getClaimNumber,
        'ABC123'
      );

      renderPage();

      expect(
        screen.getByTestId('claim-number')
      ).toHaveAttribute(
        'data-claim-number',
        'ABC123'
      );
    });

    it('should pass the claim type to ClaimAttachments', () => {
      selectorValues.set(
        claimsSharedSelectors.getClaimType,
        'house'
      );

      renderPage();

      expect(
        screen.getByTestId('claim-attachments')
      ).toHaveAttribute(
        'data-claim-type',
        'house'
      );
    });
  });

  describe('DamageItemsSelector', () => {
    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showDamageItems,
        true
      );

      renderPage();

      expect(
        screen.getByTestId(
          'damage-items-selector'
        )
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showDamageItems,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId(
          'damage-items-selector'
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('GlassBrokenPaneCount', () => {
    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showGlassBrokenPaneCount,
        true
      );

      renderPage();

      const component = screen.getByTestId(
        'glass-broken-pane-count'
      );

      expect(component).toBeInTheDocument();

      expect(component).toHaveAttribute(
        'data-model-path',
        modelPath
      );
    });

    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showGlassBrokenPaneCount,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId(
          'glass-broken-pane-count'
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('CarpetDamage', () => {
    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showCarpetDamageType,
        true
      );

      renderPage();

      const component = screen.getByTestId(
        'carpet-damage'
      );

      expect(component).toBeInTheDocument();

      expect(component).toHaveAttribute(
        'data-model-path',
        modelPath
      );
    });

    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showCarpetDamageType,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId('carpet-damage')
      ).not.toBeInTheDocument();
    });
  });

  describe('DryingRequired', () => {
    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showDryingRequired,
        true
      );

      renderPage();

      expect(
        screen.getByTestId('drying-required')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showDryingRequired,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId('drying-required')
      ).not.toBeInTheDocument();
    });
  });

  describe('MouldVisible', () => {
    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showMouldVisible,
        true
      );

      renderPage();

      expect(
        screen.getByTestId('mould-visible')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showMouldVisible,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId('mould-visible')
      ).not.toBeInTheDocument();
    });
  });

  describe('DamageAreaSelector', () => {
    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showDamageAreas,
        true
      );

      renderPage();

      expect(
        screen.getByTestId(
          'damage-area-selector'
        )
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showDamageAreas,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId(
          'damage-area-selector'
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('DamageDescription', () => {
    it('should not render when disabled', () => {
      selectorValues.set(
        houseSelectors.showDamageDescription,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId(
          'damage-description'
        )
      ).not.toBeInTheDocument();
    });

    it('should render when enabled', () => {
      selectorValues.set(
        houseSelectors.showDamageDescription,
        true
      );

      renderPage();

      expect(
        screen.getByTestId(
          'damage-description'
        )
      ).toBeInTheDocument();
    });

    it('should use the claim type in the translation key', () => {
      selectorValues.set(
        houseSelectors.showDamageDescription,
        true
      );

      selectorValues.set(
        claimsSharedSelectors.getClaimType,
        'house'
      );

      selectorValues.set(
        houseSelectors.getIsDamageItemWithNoOtherDamage,
        false
      );

      renderPage();

      expect(
        screen.getByTestId(
          'damage-description-translation'
        )
      ).toHaveTextContent(
        'claim:page2.damages.damageDescription.house'
      );

      expect(
        screen.getByTestId(
          'damage-description-placeholder'
        )
      ).toHaveTextContent(
        'claim:page2.damages.damageDescription.house.placeholder'
      );
    });

    it('should use the DamageItemsWithNoOtherDamage translation key when applicable', () => {
      selectorValues.set(
        houseSelectors.showDamageDescription,
        true
      );

      selectorValues.set(
        claimsSharedSelectors.getClaimType,
        'house'
      );

      selectorValues.set(
        houseSelectors.getIsDamageItemWithNoOtherDamage,
        true
      );

      renderPage();

      expect(
        screen.getByTestId(
          'damage-description-translation'
        )
      ).toHaveTextContent(
        'claim:page2.damages.damageDescription.houseDamageItemsWithNoOtherDamage'
      );

      expect(
        screen.getByTestId(
          'damage-description-placeholder'
        )
      ).toHaveTextContent(
        'claim:page2.damages.damageDescription.houseDamageItemsWithNoOtherDamage.placeholder'
      );
    });
  });

  describe('EngagedWithContractor', () => {
    it('should render when both the feature flag and selector are enabled', () => {
      selectorValues.set(
        commonSelectors.getFlags,
        {
          'cs-engaged-with-customer': true
        }
      );

      selectorValues.set(
        houseSelectors.showEngagedWithContractor,
        true
      );

      renderPage();

      expect(
        screen.getByTestId(
          'engaged-with-contractor'
        )
      ).toBeInTheDocument();
    });

    it('should not render when the feature flag is disabled', () => {
      selectorValues.set(
        commonSelectors.getFlags,
        {
          'cs-engaged-with-customer': false
        }
      );

      selectorValues.set(
        houseSelectors.showEngagedWithContractor,
        true
      );

      renderPage();

      expect(
        screen.queryByTestId(
          'engaged-with-contractor'
        )
      ).not.toBeInTheDocument();
    });

    it('should not render when the selector is disabled', () => {
      selectorValues.set(
        commonSelectors.getFlags,
        {
          'cs-engaged-with-customer': true
        }
      );

      selectorValues.set(
        houseSelectors.showEngagedWithContractor,
        false
      );

      renderPage();

      expect(
        screen.queryByTestId(
          'engaged-with-contractor'
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('ClaimAttachments', () => {
    it('should always render', () => {
      renderPage();

      expect(
        screen.getByTestId(
          'claim-attachments'
        )
      ).toBeInTheDocument();
    });

    it('should receive the claim type', () => {
      selectorValues.set(
        claimsSharedSelectors.getClaimType,
        'house'
      );

      renderPage();

      expect(
        screen.getByTestId(
          'claim-attachments'
        )
      ).toHaveAttribute(
        'data-claim-type',
        'house'
      );
    });
  });

  describe('FormFooter', () => {
    it('should render the expected configuration', () => {
      renderPage();

      expect(
        screen.getByTestId('form-footer-submit')
      ).toHaveTextContent(
        'claim:footer.nextButton.shared.contactDetails'
      );

      expect(
        screen.getByTestId(
          'form-footer-validating'
        )
      ).toHaveTextContent('false');

      expect(
        screen.getByTestId(
          'form-footer-show-back'
        )
      ).toHaveTextContent('true');

      expect(
        screen.getByTestId(
          'form-footer-back-url'
        )
      ).toHaveTextContent(
        routes.CLAIM.HOUSE.PAGE1
      );
    });

    it('should raise GA event and navigate when submitted', async () => {
      // const user = userEvent.setup();
      selectorValues.set(
        houseSelectors.getClaimNumber,
        '123456'
      );

      renderPage();

      userEvent.click(
        screen.getByTestId(
          'form-footer-submit'
        )
      );

      expect(
        mockRaiseClaimGAEvent
      ).toHaveBeenCalledWith(
        '123456',
        'house'
      );

      expect(
        mockNavigate
      ).toHaveBeenCalledWith(
        routes.CLAIM.SHARED
          .CLAIM_CONTACT_DETAILS
      );
    });
  });

  describe('FloatingToolbar', () => {
    it('should render with save claim enabled', () => {
      renderPage();

      expect(
        screen.getByTestId(
          'floating-toolbar'
        )
      ).toHaveAttribute(
        'data-save-claim-enabled',
        'true'
      );
    });
  });
});