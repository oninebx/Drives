import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { routes, selectors as commonSelectors } from '~/common/state';
import { selectors as houseSelectors } from '~/feature/claim/house/state';
import { selectors as claimsSharedSelectors } from '~/feature/claim/shared/state';
import { useAppSelector } from '~/root/store';

import Page2 from './Page2';

const mockNavigate = jest.fn();
const mockRaiseClaimGAEvent = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form">{children}</div>
  )
}));

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('~/root/store', () => ({
  useAppSelector: jest.fn()
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: mockRaiseClaimGAEvent
}));

jest.mock('~/feature/claim/house/components', () => ({
  CarpetDamage: () => (
    <div data-testid="carpet-damage" />
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

  GlassBrokenPaneCount: () => (
    <div data-testid="glass-broken-pane-count" />
  ),

  MouldVisible: () => (
    <div data-testid="mould-visible" />
  )
}));

jest.mock('~/feature/claim/shared/components', () => ({
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
      data-save-claim-enabled={saveClaimEnabled}
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
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
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
    modelPath,
    translation,
    placeholder
  }: {
    modelPath: string;
    translation: string;
    placeholder: string;
  }) => (
    <div data-testid="damage-description">
      <span data-testid="damage-description-model-path">
        {modelPath}
      </span>

      <span data-testid="damage-description-translation">
        {translation}
      </span>

      <span data-testid="damage-description-placeholder">
        {placeholder}
      </span>
    </div>
  )
}));

/**
 * Selector spies
 *
 * We spy on the real selector objects instead of creating a
 * separate mockSelectors object inside jest.mock().
 */
const getFlagsSpy = jest.spyOn(
  commonSelectors,
  'getFlags'
);

const getClaimNumberSpy = jest.spyOn(
  houseSelectors,
  'getClaimNumber'
);

const showDamageItemsSpy = jest.spyOn(
  houseSelectors,
  'showDamageItems'
);

const showDamageAreasSpy = jest.spyOn(
  houseSelectors,
  'showDamageAreas'
);

const showGlassBrokenPaneCountSpy = jest.spyOn(
  houseSelectors,
  'showGlassBrokenPaneCount'
);

const showCarpetDamageTypeSpy = jest.spyOn(
  houseSelectors,
  'showCarpetDamageType'
);

const showDryingRequiredSpy = jest.spyOn(
  houseSelectors,
  'showDryingRequired'
);

const getIsDamageItemWithNoOtherDamageSpy = jest.spyOn(
  houseSelectors,
  'getIsDamageItemWithNoOtherDamage'
);

const showDamageDescriptionSpy = jest.spyOn(
  houseSelectors,
  'showDamageDescription'
);

const showMouldVisibleSpy = jest.spyOn(
  houseSelectors,
  'showMouldVisible'
);

const showEngagedWithContractorSpy = jest.spyOn(
  houseSelectors,
  'showEngagedWithContractor'
);

const getClaimTypeSpy = jest.spyOn(
  claimsSharedSelectors,
  'getClaimType'
);

const mockUseAppSelector = jest.mocked(useAppSelector);

const defaultSelectorState = () => {
  getFlagsSpy.mockReturnValue({
    'cs-engaged-with-customer': false
  });

  getClaimNumberSpy.mockReturnValue('123456');

  showDamageItemsSpy.mockReturnValue(false);

  showDamageAreasSpy.mockReturnValue(false);

  showGlassBrokenPaneCountSpy.mockReturnValue(false);

  showCarpetDamageTypeSpy.mockReturnValue(false);

  showDryingRequiredSpy.mockReturnValue(false);

  getIsDamageItemWithNoOtherDamageSpy.mockReturnValue(false);

  showDamageDescriptionSpy.mockReturnValue(false);

  getClaimTypeSpy.mockReturnValue('house');

  showMouldVisibleSpy.mockReturnValue(false);

  showEngagedWithContractorSpy.mockReturnValue(false);
};

const renderPage = () => {
  return render(<Page2 />);
};

beforeEach(() => {
  jest.clearAllMocks();

  /**
   * Page2 calls:
   *
   * useAppSelector(commonSelectors.getFlags)
   * useAppSelector(houseSelectors.getClaimNumber)
   * ...
   *
   * Executing the selector here means the Page2 component
   * still uses its normal selector wiring while Redux itself
   * is completely removed from this unit test.
   */
  mockUseAppSelector.mockImplementation(
    selector => selector(undefined as never)
  );

  defaultSelectorState();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('House page2', () => {
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
      getClaimNumberSpy.mockReturnValue('ABC123');

      renderPage();

      expect(
        screen.getByTestId('claim-number')
      ).toHaveAttribute(
        'data-claim-number',
        'ABC123'
      );
    });

    it('should pass the claim type to ClaimAttachments', () => {
      getClaimTypeSpy.mockReturnValue('house');

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
    it('should render when showDamageItems is true', () => {
      showDamageItemsSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('damage-items-selector')
      ).toBeInTheDocument();
    });

    it('should not render when showDamageItems is false', () => {
      showDamageItemsSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('damage-items-selector')
      ).not.toBeInTheDocument();
    });
  });

  describe('GlassBrokenPaneCount', () => {
    it('should render when showGlassBrokenPaneCount is true', () => {
      showGlassBrokenPaneCountSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('glass-broken-pane-count')
      ).toBeInTheDocument();
    });

    it('should not render when showGlassBrokenPaneCount is false', () => {
      showGlassBrokenPaneCountSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('glass-broken-pane-count')
      ).not.toBeInTheDocument();
    });
  });

  describe('CarpetDamage', () => {
    it('should render when showCarpetDamageType is true', () => {
      showCarpetDamageTypeSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('carpet-damage')
      ).toBeInTheDocument();
    });

    it('should not render when showCarpetDamageType is false', () => {
      showCarpetDamageTypeSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('carpet-damage')
      ).not.toBeInTheDocument();
    });
  });

  describe('DryingRequired', () => {
    it('should render when showDryingRequired is true', () => {
      showDryingRequiredSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('drying-required')
      ).toBeInTheDocument();
    });

    it('should not render when showDryingRequired is false', () => {
      showDryingRequiredSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('drying-required')
      ).not.toBeInTheDocument();
    });
  });

  describe('MouldVisible', () => {
    it('should render when showMouldVisible is true', () => {
      showMouldVisibleSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('mould-visible')
      ).toBeInTheDocument();
    });

    it('should not render when showMouldVisible is false', () => {
      showMouldVisibleSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('mould-visible')
      ).not.toBeInTheDocument();
    });
  });

  describe('DamageAreaSelector', () => {
    it('should render when showDamageAreas is true', () => {
      showDamageAreasSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('damage-area-selector')
      ).toBeInTheDocument();
    });

    it('should not render when showDamageAreas is false', () => {
      showDamageAreasSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('damage-area-selector')
      ).not.toBeInTheDocument();
    });
  });

  describe('DamageDescription', () => {
    it('should not render when showDamageDescription is false', () => {
      showDamageDescriptionSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('damage-description')
      ).not.toBeInTheDocument();
    });

    it('should render when showDamageDescription is true', () => {
      showDamageDescriptionSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('damage-description')
      ).toBeInTheDocument();
    });

    it('should use the claim type as the translation key by default', () => {
      showDamageDescriptionSpy.mockReturnValue(true);
      getClaimTypeSpy.mockReturnValue('house');
      getIsDamageItemWithNoOtherDamageSpy.mockReturnValue(false);

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
      showDamageDescriptionSpy.mockReturnValue(true);
      getClaimTypeSpy.mockReturnValue('house');
      getIsDamageItemWithNoOtherDamageSpy.mockReturnValue(true);

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
      getFlagsSpy.mockReturnValue({
        'cs-engaged-with-customer': true
      });

      showEngagedWithContractorSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('engaged-with-contractor')
      ).toBeInTheDocument();
    });

    it('should not render when the feature flag is disabled', () => {
      getFlagsSpy.mockReturnValue({
        'cs-engaged-with-customer': false
      });

      showEngagedWithContractorSpy.mockReturnValue(true);

      renderPage();

      expect(
        screen.queryByTestId('engaged-with-contractor')
      ).not.toBeInTheDocument();
    });

    it('should not render when the selector is disabled', () => {
      getFlagsSpy.mockReturnValue({
        'cs-engaged-with-customer': true
      });

      showEngagedWithContractorSpy.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('engaged-with-contractor')
      ).not.toBeInTheDocument();
    });
  });

  describe('FormFooter', () => {
    it('should render with the expected configuration', () => {
      renderPage();

      expect(
        screen.getByTestId('form-footer')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('form-footer-submit')
      ).toHaveTextContent(
        'claim:footer.nextButton.shared.contactDetails'
      );

      expect(
        screen.getByTestId('form-footer-show-back')
      ).toHaveTextContent('true');

      expect(
        screen.getByTestId('form-footer-back-url')
      ).toHaveTextContent(
        routes.CLAIM.HOUSE.PAGE1
      );

      expect(
        screen.getByTestId('form-footer-validating')
      ).toHaveTextContent('false');
    });

    it('should raise GA event and navigate when submitted', async () => {
      const user = userEvent.setup();

      getClaimNumberSpy.mockReturnValue('123456');

      renderPage();

      await user.click(
        screen.getByTestId('form-footer-submit')
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
        routes.CLAIM.SHARED.CLAIM_CONTACT_DETAILS
      );
    });
  });

  describe('FloatingToolbar', () => {
    it('should render with saveClaimEnabled enabled', () => {
      renderPage();

      expect(
        screen.getByTestId('floating-toolbar')
      ).toHaveAttribute(
        'data-save-claim-enabled',
        'true'
      );
    });
  });

  describe('Page2 selector integration', () => {
    it('should use the expected selectors', () => {
      renderPage();

      expect(getFlagsSpy).toHaveBeenCalled();

      expect(
        getClaimNumberSpy
      ).toHaveBeenCalled();

      expect(
        showDamageItemsSpy
      ).toHaveBeenCalled();

      expect(
        showDamageAreasSpy
      ).toHaveBeenCalled();

      expect(
        showGlassBrokenPaneCountSpy
      ).toHaveBeenCalled();

      expect(
        showCarpetDamageTypeSpy
      ).toHaveBeenCalled();

      expect(
        showDryingRequiredSpy
      ).toHaveBeenCalled();

      expect(
        getIsDamageItemWithNoOtherDamageSpy
      ).toHaveBeenCalled();

      expect(
        showDamageDescriptionSpy
      ).toHaveBeenCalled();

      expect(
        getClaimTypeSpy
      ).toHaveBeenCalled();

      expect(
        showMouldVisibleSpy
      ).toHaveBeenCalled();

      expect(
        showEngagedWithContractorSpy
      ).toHaveBeenCalled();
    });
  });
});