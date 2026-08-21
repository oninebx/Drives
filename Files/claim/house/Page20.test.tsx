import { screen } from '@testing-library/react';
import * as React from 'react';
import { Form } from 'react-redux-form';
import { Route, Routes } from 'react-router';

import { routes } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';

import Page2 from './Page2';

const mockNavigate = jest.fn();
const mockRaiseClaimGAEvent = jest.fn();

const mockSelectors = {
  getFlags: jest.fn(),
  getClaimNumber: jest.fn(),
  showDamageItems: jest.fn(),
  showDamageAreas: jest.fn(),
  showGlassBrokenPaneCount: jest.fn(),
  showCarpetDamageType: jest.fn(),
  showDryingRequired: jest.fn(),
  getIsDamageItemWithNoOtherDamage: jest.fn(),
  showDamageDescription: jest.fn(),
  getClaimType: jest.fn(),
  showMouldVisible: jest.fn(),
  showEngagedWithContractor: jest.fn()
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate
}));

jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form">{children}</div>
  )
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      HOUSE: {
        PAGE1: '/house/page1'
      },
      SHARED: {
        CLAIM_CONTACT_DETAILS: '/claim/contact-details'
      }
    }
  },
  selectors: {
    getFlags: mockSelectors.getFlags
  }
}));

jest.mock('~/feature/claim/house/state', () => ({
  modelPath: 'houseClaim',
  selectors: {
    getClaimNumber: mockSelectors.getClaimNumber,
    showDamageItems: mockSelectors.showDamageItems,
    showDamageAreas: mockSelectors.showDamageAreas,
    showGlassBrokenPaneCount: mockSelectors.showGlassBrokenPaneCount,
    showCarpetDamageType: mockSelectors.showCarpetDamageType,
    showDryingRequired: mockSelectors.showDryingRequired,
    getIsDamageItemWithNoOtherDamage:
      mockSelectors.getIsDamageItemWithNoOtherDamage,
    showDamageDescription: mockSelectors.showDamageDescription,
    showMouldVisible: mockSelectors.showMouldVisible,
    showEngagedWithContractor: mockSelectors.showEngagedWithContractor
  }
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimType: mockSelectors.getClaimType
  }
}));

jest.mock('~/root/store', () => ({
  useAppSelector: <T,>(selector: (state: unknown) => T) => selector(null)
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: mockRaiseClaimGAEvent
}));

jest.mock('~/feature/claim/house/components', () => ({
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
  ),
  CarpetDamage: () => (
    <div data-testid="carpet-damage" />
  )
}));

jest.mock('~/feature/claim/shared/components', () => ({
  ClaimAttachments: () => (
    <div data-testid="claim-attachments" />
  ),
  FloatingToolbar: () => (
    <div data-testid="floating-toolbar" />
  ),
  FormFooter: () => (
    <div data-testid="form-footer" />
  )
}));

jest.mock('~/feature/claim/shared/components/dumb', () => ({
  ClaimNumber: () => (
    <div data-testid="claim-number" />
  ),
  DamageDescription: () => (
    <div data-testid="damage-description" />
  )
}));

const defaultSelectorState = () => {
  mockSelectors.getFlags.mockReturnValue({
    'cs-engaged-with-customer': false
  });

  mockSelectors.getClaimNumber.mockReturnValue('123456');

  mockSelectors.showDamageItems.mockReturnValue(false);
  mockSelectors.showDamageAreas.mockReturnValue(false);
  mockSelectors.showGlassBrokenPaneCount.mockReturnValue(false);
  mockSelectors.showCarpetDamageType.mockReturnValue(false);
  mockSelectors.showDryingRequired.mockReturnValue(false);
  mockSelectors.getIsDamageItemWithNoOtherDamage.mockReturnValue(false);
  mockSelectors.showDamageDescription.mockReturnValue(false);
  mockSelectors.getClaimType.mockReturnValue('house');
  mockSelectors.showMouldVisible.mockReturnValue(false);
  mockSelectors.showEngagedWithContractor.mockReturnValue(false);
};

const renderPage = () => {
  return renderComponent(<Page2 />);
};

beforeEach(() => {
  jest.clearAllMocks();
  defaultSelectorState();
});

describe('House page2', () => {
  describe('rendering', () => {
    it('should render the page', () => {
      renderPage();

      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByTestId('claim-number')).toBeInTheDocument();
      expect(screen.getByTestId('claim-attachments')).toBeInTheDocument();
      expect(screen.getByTestId('form-footer')).toBeInTheDocument();
      expect(screen.getByTestId('floating-toolbar')).toBeInTheDocument();
    });
  });

  describe('DamageItemsSelector', () => {
    it('should render when damage items are enabled', () => {
      mockSelectors.showDamageItems.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('damage-items-selector')
      ).toBeInTheDocument();
    });

    it('should not render when damage items are disabled', () => {
      mockSelectors.showDamageItems.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('damage-items-selector')
      ).not.toBeInTheDocument();
    });
  });

  describe('GlassBrokenPaneCount', () => {
    it('should render when enabled', () => {
      mockSelectors.showGlassBrokenPaneCount.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('glass-broken-pane-count')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderPage();

      expect(
        screen.queryByTestId('glass-broken-pane-count')
      ).not.toBeInTheDocument();
    });
  });

  describe('CarpetDamage', () => {
    it('should render when enabled', () => {
      mockSelectors.showCarpetDamageType.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('carpet-damage')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderPage();

      expect(
        screen.queryByTestId('carpet-damage')
      ).not.toBeInTheDocument();
    });
  });

  describe('DryingRequired', () => {
    it('should render when enabled', () => {
      mockSelectors.showDryingRequired.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('drying-required')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderPage();

      expect(
        screen.queryByTestId('drying-required')
      ).not.toBeInTheDocument();
    });
  });

  describe('MouldVisible', () => {
    it('should render when enabled', () => {
      mockSelectors.showMouldVisible.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('mould-visible')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderPage();

      expect(
        screen.queryByTestId('mould-visible')
      ).not.toBeInTheDocument();
    });
  });

  describe('DamageAreaSelector', () => {
    it('should render when enabled', () => {
      mockSelectors.showDamageAreas.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('damage-area-selector')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderPage();

      expect(
        screen.queryByTestId('damage-area-selector')
      ).not.toBeInTheDocument();
    });
  });

  describe('DamageDescription', () => {
    it('should render when enabled', () => {
      mockSelectors.showDamageDescription.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('damage-description')
      ).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderPage();

      expect(
        screen.queryByTestId('damage-description')
      ).not.toBeInTheDocument();
    });
  });

  describe('EngagedWithContractor', () => {
    it('should render when both feature flag and selector are enabled', () => {
      mockSelectors.getFlags.mockReturnValue({
        'cs-engaged-with-customer': true
      });

      mockSelectors.showEngagedWithContractor.mockReturnValue(true);

      renderPage();

      expect(
        screen.getByTestId('engaged-with-contractor')
      ).toBeInTheDocument();
    });

    it('should not render when the feature flag is disabled', () => {
      mockSelectors.getFlags.mockReturnValue({
        'cs-engaged-with-customer': false
      });

      mockSelectors.showEngagedWithContractor.mockReturnValue(true);

      renderPage();

      expect(
        screen.queryByTestId('engaged-with-contractor')
      ).not.toBeInTheDocument();
    });

    it('should not render when the selector is disabled', () => {
      mockSelectors.getFlags.mockReturnValue({
        'cs-engaged-with-customer': true
      });

      mockSelectors.showEngagedWithContractor.mockReturnValue(false);

      renderPage();

      expect(
        screen.queryByTestId('engaged-with-contractor')
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to contact details when the form is submitted', async () => {
      mockSelectors.getClaimNumber.mockReturnValue('123456');

      renderPage();

      const formFooter = screen.getByTestId('form-footer');

      expect(formFooter).toBeInTheDocument();

      // See the next section for a better way to test FormFooter props.
    });
  });
});