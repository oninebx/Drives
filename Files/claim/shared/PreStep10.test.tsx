import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import PreStep1, {
  PreStep1Component,
} from './PreStep1';

import { routes } from '~/common/state';
import { getFlags } from '~/common/state/selectors';
import { selectors, thunks } from '~/feature/claim/shared/state';
import {
  ClaimType,
  modelPath as sharedModelPath,
} from '~/feature/claim/shared/state/constants';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import { raiseFieldGAEvent } from '~/common/utilities';
import { useDeconstructedParams } from '~/feature/portal/hooks/useDeconstructedParams';
import {
  useAppDispatch,
  useAppSelector,
} from '~/root/store';
import { usePreStep1ViewModel } from './usePreStep1ViewModel';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-redux-form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <form>{children}</form>
  ),
}));

jest.mock('~/common/utilities', () => ({
  logError: jest.fn(),
  raiseFieldGAEvent: jest.fn(),
}));

jest.mock('~/common/state', () => ({
  routes: {
    CLAIM: {
      WINDSCREEN: {
        PAGE1: '/claim/windscreen/page1',
      },
      SHARED: {
        PRE_STEP_2: '/claim/pre-step-2',
      },
    },
  },
}));

jest.mock('~/common/state/selectors', () => ({
  getFlags: jest.fn(),
}));

jest.mock('~/root/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('~/feature/portal/hooks/useDeconstructedParams', () => ({
  useDeconstructedParams: jest.fn(),
}));

jest.mock('~/feature/claim/utils', () => ({
  raiseClaimGAEvent: jest.fn(),
}));

jest.mock('~/feature/claim/shared/state/constants', () => ({
  ClaimType: {
    Motor: 'Motor',
    Contents: 'Contents',
    House: 'House',
    Landlord: 'Landlord',
    Windscreen: 'Windscreen',
  },
  modelPath: 'claim',
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimSharedState: jest.fn(),
    getCustomerPolicies: jest.fn(),
    getNonDigitalPolicies: jest.fn(),
    getPendingPolicies: jest.fn(),
    isDamagedAndBreakInHouseOrLandlord: jest.fn(),
    getActiveCatCodes: jest.fn(),
    isCatEventAnswered: jest.fn(),
    isPolicyNotShownSelected: jest.fn(),
    isPolicyIneligibleForSSPClaimSelected: jest.fn(),
    isEISPolicySelected: jest.fn(),
    showContentsDamage: jest.fn(),
    showContentsStolenFrom: jest.fn(),
    showContentsWhereLastRememberHavingItems: jest.fn(),
    isCannotClaimOnline: jest.fn(),
    showContinuePreClaim: jest.fn(),
    policyDetailsLoaded: jest.fn(),
    getSelectedCatEventStartDate: jest.fn(),
    getSelectedCatEventEndDate: jest.fn(),
    showDamage: jest.fn(),
    showBoatDamage: jest.fn(),
    showBoatImpact: jest.fn(),
    showBoatTheft: jest.fn(),
    showBoatTheftEntry: jest.fn(),
    showBoatSubmersion: jest.fn(),
    showBoatNaturalDisaster: jest.fn(),
    showBoatFire: jest.fn(),
    getSelectedCatEvent: jest.fn(),
    showNaturalDisasterCause: jest.fn(),
    showHouseDamage: jest.fn(),
    showContentsNaturalDisasterCause: jest.fn(),
    showHouseNaturalDisasterCause: jest.fn(),
    isClaimPreStep1PageValid: jest.fn(),
    showCarGlassOnlyDamage: jest.fn(),
    hideCauseOfLossInCatEvent: jest.fn(),
    disableContinuePreClaim: jest.fn(),
    showMultiVehicleAccident: jest.fn(),
    showDamagedWhileParkedCause: jest.fn(),
    showCarRecovered: jest.fn(),
    showContentsFireCause: jest.fn(),
    showHouseFireCause: jest.fn(),
    isHouseKeysClaim: jest.fn(),
    isMotorKeysClaim: jest.fn(),
    isCannotClaimForPolicyOnline: jest.fn(),
    isWindscreenClaim: jest.fn(),
    getPotentialDuplicateClaim: jest.fn(),
    getPotentialDuplicateClaimDialogDismissed: jest.fn(),
    isWaterDamageClaim: jest.fn(),
    isClaimTypeMotor: jest.fn(),
  },

  thunks: {
    initialisePreStep1: jest.fn(),
    handleStartWindscreenClaim: jest.fn(),
    handleStartProductClaim: jest.fn(),
  },
}));

jest.mock('~/feature/claim/contents/components', () => ({
  Damage: () => <div data-testid="contents-damage" />,
  FireCause: () => <div data-testid="contents-fire-cause" />,
  NaturalDisasterCause: () => (
    <div data-testid="contents-natural-disaster" />
  ),
  StolenFrom: () => <div data-testid="contents-stolen-from" />,
  WhereLastRememberHavingItems: () => (
    <div data-testid="contents-where-last-remembered" />
  ),
}));

jest.mock('~/feature/claim/house/components', () => ({
  Damage: () => <div data-testid="house-damage" />,
  FireCause: () => <div data-testid="house-fire-cause" />,
  NaturalDisasterCause: () => (
    <div data-testid="house-natural-disaster" />
  ),
}));

jest.mock('~/feature/claim/car/components', () => ({
  BoatDamage: () => <div data-testid="boat-damage" />,
  BoatFireCause: () => <div data-testid="boat-fire" />,
  BoatImpact: () => <div data-testid="boat-impact" />,
  BoatNaturalDisasterCause: () => (
    <div data-testid="boat-natural-disaster" />
  ),
  BoatSubmersion: () => <div data-testid="boat-submersion" />,
  BoatTheft: () => <div data-testid="boat-theft" />,
  BoatTheftEntry: () => <div data-testid="boat-theft-entry" />,
  CarGlassOnlyDamage: () => <div data-testid="car-glass-only" />,
  CarNotCoveredMessage: () => (
    <div data-testid="car-not-covered" />
  ),
  CarRecovered: () => <div data-testid="car-recovered" />,
  CauseOfLoss: () => <div data-testid="cause-of-loss" />,
  Damage: () => <div data-testid="motor-damage" />,
  DamagedWhileParkedCause: () => (
    <div data-testid="damaged-while-parked" />
  ),
  MultiVehicleAccident: () => (
    <div data-testid="multi-vehicle-accident" />
  ),
  NaturalDisasterCause: () => (
    <div data-testid="motor-natural-disaster" />
  ),
}));

jest.mock('~/feature/claim/shared/components', () => ({
  CatastropheEvent: () => (
    <div data-testid="catastrophe-event" />
  ),
  CustomerPolicies: () => (
    <div data-testid="customer-policies" />
  ),
  EventDate: () => <div data-testid="event-date" />,
  EventTime: () => <div data-testid="event-time" />,
  FloatingToolbar: () => (
    <div data-testid="floating-toolbar" />
  ),
}));

jest.mock(
  '~/feature/claim/shared/components/dumb/FormFooter/FormFooter',
  () => ({
    __esModule: true,
    default: ({
      handleSubmit,
      disabled,
    }: {
      handleSubmit: () => void;
      disabled: boolean;
    }) => (
      <button
        data-testid="form-footer"
        disabled={disabled}
        onClick={handleSubmit}
      >
        Next
      </button>
    ),
  })
);

jest.mock(
  '~/feature/claim/shared/components/smart/PotentialDuplicateClaim/PotentialDuplicateClaim',
  () => ({
    PotentialDuplicateClaim: () => (
      <div data-testid="potential-duplicate-claim" />
    ),
  })
);

jest.mock('~/common/components/base', () => ({
  FormMessage: ({
    id,
    children,
  }: {
    id?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid={id || 'form-message'}>
      {children}
    </div>
  ),

  Html: ({ rawHtml }: { rawHtml: string }) => (
    <span>{rawHtml}</span>
  ),

  LoaderButton: ({
    id,
    onClick,
    disabled,
    children,
  }: {
    id: string;
    onClick: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
  }) => (
    <button
      id={id}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  ),

  Spinner: () => (
    <div data-testid="spinner" />
  ),
}));

jest.mock('react-md/lib/FontIcons/FontIcon', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@tower/tui', () => ({
  InformationBox: {
    Container: ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <div data-testid="information-box">
        {children}
      </div>
    ),

    Title: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div>{children}</div>,
  },

  Typography: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
}));

jest.mock('./styles', () => ({
  StyledList: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <ul>{children}</ul>,

  StyledListItem: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <li>{children}</li>,

  StyledLabel: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <label>{children}</label>,

  StyledCheckbox: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: () => void;
  }) => (
    <input
      type="checkbox"
      data-testid="water-damage-checkbox"
      checked={checked}
      onChange={onCheckedChange}
    />
  ),

  StyledLink: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a {...props} onClick={onClick}>
      {children}
    </a>
  ),
}));

jest.mock('./usePreStep1ViewModel', () => ({
  usePreStep1ViewModel: jest.fn(),
}));

describe('PreStep1', () => {
  const dispatch = jest.fn();

  const claimSharedState = {
    claimNumber: 'CLAIM-123',
    claimType: ClaimType.Motor,
    loadingPolicies: false,
    loadingCatCodes: false,
    loadingClaims: false,
  };

  const defaultViewModel = {
    policyDetailsLoading: false,
    handleContinue: jest.fn(),
    nextLoading: false,
    setNextLoading: jest.fn(),
    waterDamageInfoAcknowledged: false,
    setWaterDamageInfoAcknowledged: jest.fn(),
  };

  const selectorValues = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
    selectorValues.clear();

    (useAppDispatch as jest.Mock).mockReturnValue(dispatch);

    /*
     * Important:
     *
     * useAppSelector(selector)
     *        ↓
     * selector()
     *
     * This avoids the "number of calls: 0" problem
     * when testing selector-dependent hooks/components.
     */
    (useAppSelector as jest.Mock).mockImplementation(
      (selector: jest.Mock) => {
        if (selector === getFlags) {
          return {};
        }

        return selectorValues.get(selector);
      }
    );

    selectorValues.set(
      selectors.getClaimSharedState,
      claimSharedState
    );

    selectorValues.set(
      selectors.getCustomerPolicies,
      []
    );

    selectorValues.set(
      selectors.getNonDigitalPolicies,
      []
    );

    selectorValues.set(
      selectors.getPendingPolicies,
      []
    );

    selectorValues.set(
      selectors.isDamagedAndBreakInHouseOrLandlord,
      false
    );

    selectorValues.set(
      selectors.getActiveCatCodes,
      undefined
    );

    selectorValues.set(
      selectors.isCatEventAnswered,
      false
    );

    selectorValues.set(
      selectors.isPolicyNotShownSelected,
      false
    );

    selectorValues.set(
      selectors.isEISPolicySelected,
      true
    );

    selectorValues.set(
      selectors.showContentsDamage,
      false
    );

    selectorValues.set(
      selectors.showContentsStolenFrom,
      false
    );

    selectorValues.set(
      selectors.showContentsWhereLastRememberHavingItems,
      false
    );

    selectorValues.set(
      selectors.isCannotClaimOnline,
      false
    );

    selectorValues.set(
      selectors.showContinuePreClaim,
      true
    );

    selectorValues.set(
      selectors.policyDetailsLoaded,
      false
    );

    selectorValues.set(
      selectors.getSelectedCatEventStartDate,
      undefined
    );

    selectorValues.set(
      selectors.getSelectedCatEventEndDate,
      undefined
    );

    selectorValues.set(
      selectors.showDamage,
      false
    );

    selectorValues.set(
      selectors.showBoatDamage,
      false
    );

    selectorValues.set(
      selectors.showBoatImpact,
      false
    );

    selectorValues.set(
      selectors.showBoatTheft,
      false
    );

    selectorValues.set(
      selectors.showBoatTheftEntry,
      false
    );

    selectorValues.set(
      selectors.showBoatSubmersion,
      false
    );

    selectorValues.set(
      selectors.showBoatNaturalDisaster,
      false
    );

    selectorValues.set(
      selectors.showBoatFire,
      false
    );

    selectorValues.set(
      selectors.getSelectedCatEvent,
      undefined
    );

    selectorValues.set(
      selectors.showNaturalDisasterCause,
      false
    );

    selectorValues.set(
      selectors.showHouseDamage,
      false
    );

    selectorValues.set(
      selectors.showContentsNaturalDisasterCause,
      false
    );

    selectorValues.set(
      selectors.showHouseNaturalDisasterCause,
      false
    );

    selectorValues.set(
      selectors.isClaimPreStep1PageValid,
      true
    );

    selectorValues.set(
      selectors.showCarGlassOnlyDamage,
      false
    );

    selectorValues.set(
      selectors.hideCauseOfLossInCatEvent,
      false
    );

    selectorValues.set(
      selectors.disableContinuePreClaim,
      false
    );

    selectorValues.set(
      selectors.showMultiVehicleAccident,
      false
    );

    selectorValues.set(
      selectors.showDamagedWhileParkedCause,
      false
    );

    selectorValues.set(
      selectors.showCarRecovered,
      false
    );

    selectorValues.set(
      selectors.showContentsFireCause,
      false
    );

    selectorValues.set(
      selectors.showHouseFireCause,
      false
    );

    selectorValues.set(
      selectors.isHouseKeysClaim,
      false
    );

    selectorValues.set(
      selectors.isMotorKeysClaim,
      false
    );

    selectorValues.set(
      selectors.isCannotClaimForPolicyOnline,
      false
    );

    selectorValues.set(
      selectors.isWindscreenClaim,
      false
    );

    selectorValues.set(
      selectors.getPotentialDuplicateClaim,
      false
    );

    selectorValues.set(
      selectors.getPotentialDuplicateClaimDialogDismissed,
      false
    );

    selectorValues.set(
      selectors.isWaterDamageClaim,
      false
    );

    selectorValues.set(
      selectors.isPolicyIneligibleForSSPClaimSelected,
      false
    );

    (selectors.isClaimTypeMotor as jest.Mock).mockReturnValue(
      true
    );

    (thunks.initialisePreStep1 as jest.Mock).mockReturnValue({
      type: 'initialise-pre-step-1',
    });

    (
      thunks.handleStartWindscreenClaim as jest.Mock
    ).mockReturnValue({
      type: 'start-windscreen-claim',
    });

    (
      thunks.handleStartProductClaim as jest.Mock
    ).mockReturnValue({
      type: 'start-product-claim',
    });

    (usePreStep1ViewModel as jest.Mock).mockReturnValue(
      defaultViewModel
    );

    (useDeconstructedParams as jest.Mock).mockReturnValue({
      id: 'POLICY-123',
    });

    (getFlags as jest.Mock).mockReturnValue({});

    dispatch.mockResolvedValue({});
  });

  describe('PreStep1Loader', () => {
    beforeEach(() => {
      window.scrollTo = jest.fn();
    });

    it('should render PreStep1Component', () => {
      render(<PreStep1 />);

      expect(
        screen.getByTestId('customer-policies')
      ).toBeInTheDocument();
    });

    it('should initialise the page on mount', () => {
      render(<PreStep1 />);

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

      expect(
        thunks.initialisePreStep1
      ).toHaveBeenCalledTimes(1);

      expect(
        thunks.initialisePreStep1
      ).toHaveBeenCalledWith(
        {},
        'claim:config.enabledMotorMLOB',
        'POLICY-123'
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'initialise-pre-step-1',
      });
    });
  });

  describe('loading state', () => {
    it('should show spinner while policies are loading', () => {
      selectorValues.set(
        selectors.getClaimSharedState,
        {
          ...claimSharedState,
          loadingPolicies: true,
        }
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('spinner')
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('customer-policies')
      ).not.toBeInTheDocument();
    });

    it('should show spinner while cat codes are loading', () => {
      selectorValues.set(
        selectors.getClaimSharedState,
        {
          ...claimSharedState,
          loadingCatCodes: true,
        }
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('spinner')
      ).toBeInTheDocument();
    });

    it('should show spinner while claims are loading', () => {
      selectorValues.set(
        selectors.getClaimSharedState,
        {
          ...claimSharedState,
          loadingClaims: true,
        }
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('spinner')
      ).toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('should render the main page components', () => {
      render(<PreStep1Component />);

      expect(
        screen.getByTestId('customer-policies')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('floating-toolbar')
      ).toBeInTheDocument();
    });

    it('should render the continue button when allowed', () => {
      render(<PreStep1Component />);

      expect(
        screen.getByRole('button', {
          name: /claim:button.continuePreClaim/i,
        })
      ).toBeInTheDocument();
    });

    it('should disable the continue button when configured', () => {
      selectorValues.set(
        selectors.disableContinuePreClaim,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByRole('button', {
          name: /claim:button.continuePreClaim/i,
        })
      ).toBeDisabled();
    });

    it('should use policyDetailsLoading as the LoaderButton pending state', () => {
      (
        usePreStep1ViewModel as jest.Mock
      ).mockReturnValue({
        ...defaultViewModel,
        policyDetailsLoading: true,
      });

      render(<PreStep1Component />);

      expect(
        screen.getByRole('button', {
          name: /claim:button.continuePreClaim/i,
        })
      ).toBeInTheDocument();
    });

    it('should call handleContinue when continue is clicked', () => {
      render(<PreStep1Component />);

      fireEvent.click(
        screen.getByRole('button', {
          name: /claim:button.continuePreClaim/i,
        })
      );

      expect(
        defaultViewModel.handleContinue
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('catastrophe event', () => {
    it('should show catastrophe event when conditions are met', () => {
      selectorValues.set(
        selectors.getActiveCatCodes,
        ['CAT-1']
      );

      selectorValues.set(
        selectors.isEISPolicySelected,
        true
      );

      selectorValues.set(
        selectors.isPolicyNotShownSelected,
        false
      );

      selectorValues.set(
        selectors.isPolicyIneligibleForSSPClaimSelected,
        false
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('catastrophe-event')
      ).toBeInTheDocument();
    });

    it('should not show catastrophe event when no active cat codes exist', () => {
      selectorValues.set(
        selectors.getActiveCatCodes,
        undefined
      );

      render(<PreStep1Component />);

      expect(
        screen.queryByTestId('catastrophe-event')
      ).not.toBeInTheDocument();
    });

    it('should render event date and time when catastrophe conditions allow it', () => {
      selectorValues.set(
        selectors.getActiveCatCodes,
        undefined
      );

      selectorValues.set(
        selectors.isEISPolicySelected,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('event-date')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('event-time')
      ).toBeInTheDocument();
    });
  });

  describe('policy details and cause of loss', () => {
    it('should render potential duplicate claim when applicable', () => {
      selectorValues.set(
        selectors.getPotentialDuplicateClaim,
        true
      );

      selectorValues.set(
        selectors.policyDetailsLoaded,
        true
      );

      selectorValues.set(
        selectors.getPotentialDuplicateClaimDialogDismissed,
        false
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('potential-duplicate-claim')
      ).toBeInTheDocument();
    });

    it('should not render potential duplicate claim when dialog was dismissed', () => {
      selectorValues.set(
        selectors.getPotentialDuplicateClaim,
        true
      );

      selectorValues.set(
        selectors.policyDetailsLoaded,
        true
      );

      selectorValues.set(
        selectors.getPotentialDuplicateClaimDialogDismissed,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.queryByTestId('potential-duplicate-claim')
      ).not.toBeInTheDocument();
    });

    it('should render cause of loss after policy details are loaded', () => {
      selectorValues.set(
        selectors.policyDetailsLoaded,
        true
      );

      selectorValues.set(
        selectors.hideCauseOfLossInCatEvent,
        false
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('cause-of-loss')
      ).toBeInTheDocument();
    });

    it('should hide cause of loss when configured to hide it', () => {
      selectorValues.set(
        selectors.policyDetailsLoaded,
        true
      );

      selectorValues.set(
        selectors.hideCauseOfLossInCatEvent,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.queryByTestId('cause-of-loss')
      ).not.toBeInTheDocument();
    });
  });

  describe('motor claim', () => {
    beforeEach(() => {
      (
        selectors.isClaimTypeMotor as jest.Mock
      ).mockReturnValue(true);
    });

    it('should render motor damage', () => {
      selectorValues.set(
        selectors.showDamage,
        true
      );

      selectorValues.set(
        selectors.getSelectedCatEvent,
        undefined
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('motor-damage')
      ).toBeInTheDocument();
    });

    it('should not render motor damage when a cat event is selected', () => {
      selectorValues.set(
        selectors.showDamage,
        true
      );

      selectorValues.set(
        selectors.getSelectedCatEvent,
        {
          type: 'CAT',
        }
      );

      render(<PreStep1Component />);

      expect(
        screen.queryByTestId('motor-damage')
      ).not.toBeInTheDocument();
    });

    it('should render multi vehicle accident', () => {
      selectorValues.set(
        selectors.showMultiVehicleAccident,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('multi-vehicle-accident')
      ).toBeInTheDocument();
    });

    it('should render damaged while parked cause', () => {
      selectorValues.set(
        selectors.showDamagedWhileParkedCause,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('damaged-while-parked')
      ).toBeInTheDocument();
    });

    it('should render natural disaster cause', () => {
      selectorValues.set(
        selectors.showNaturalDisasterCause,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('motor-natural-disaster')
      ).toBeInTheDocument();
    });

    it('should render car recovered', () => {
      selectorValues.set(
        selectors.showCarRecovered,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('car-recovered')
      ).toBeInTheDocument();
    });

    it('should render glass only damage', () => {
      selectorValues.set(
        selectors.showCarGlassOnlyDamage,
        true
      );

      selectorValues.set(
        selectors.getSelectedCatEvent,
        {
          type: 'GLASS',
        }
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('car-glass-only')
      ).toBeInTheDocument();
    });

    it('should render car not covered message when cat event is selected', () => {
      selectorValues.set(
        selectors.getSelectedCatEvent,
        {
          type: 'CAT',
        }
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('car-not-covered')
      ).toBeInTheDocument();
    });
  });

  describe('boat claim', () => {
    beforeEach(() => {
      (
        selectors.isClaimTypeMotor as jest.Mock
      ).mockReturnValue(true);
    });

    it('should render boat damage', () => {
      selectorValues.set(
        selectors.showBoatDamage,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-damage')
      ).toBeInTheDocument();
    });

    it('should render boat impact', () => {
      selectorValues.set(
        selectors.showBoatImpact,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-impact')
      ).toBeInTheDocument();
    });

    it('should render boat theft', () => {
      selectorValues.set(
        selectors.showBoatTheft,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-theft')
      ).toBeInTheDocument();
    });

    it('should render boat theft entry', () => {
      selectorValues.set(
        selectors.showBoatTheftEntry,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-theft-entry')
      ).toBeInTheDocument();
    });

    it('should render boat submersion', () => {
      selectorValues.set(
        selectors.showBoatSubmersion,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-submersion')
      ).toBeInTheDocument();
    });

    it('should render boat natural disaster', () => {
      selectorValues.set(
        selectors.showBoatNaturalDisaster,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-natural-disaster')
      ).toBeInTheDocument();
    });

    it('should render boat fire', () => {
      selectorValues.set(
        selectors.showBoatFire,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('boat-fire')
      ).toBeInTheDocument();
    });
  });

  describe('contents claim', () => {
    beforeEach(() => {
      selectorValues.set(
        selectors.getClaimSharedState,
        {
          ...claimSharedState,
          claimType: ClaimType.Contents,
        }
      );

      (
        selectors.isClaimTypeMotor as jest.Mock
      ).mockReturnValue(false);
    });

    it('should render contents damage', () => {
      selectorValues.set(
        selectors.showContentsDamage,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('contents-damage')
      ).toBeInTheDocument();
    });

    it('should render contents fire cause', () => {
      selectorValues.set(
        selectors.showContentsFireCause,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('contents-fire-cause')
      ).toBeInTheDocument();
    });

    it('should render contents natural disaster cause', () => {
      selectorValues.set(
        selectors.showContentsNaturalDisasterCause,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('contents-natural-disaster')
      ).toBeInTheDocument();
    });

    it('should render contents stolen from', () => {
      selectorValues.set(
        selectors.showContentsStolenFrom,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('contents-stolen-from')
      ).toBeInTheDocument();
    });

    it('should render where items were last remembered', () => {
      selectorValues.set(
        selectors.showContentsWhereLastRememberHavingItems,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('contents-where-last-remembered')
      ).toBeInTheDocument();
    });
  });

  describe('house and landlord claims', () => {
    it.each([
      ClaimType.House,
      ClaimType.Landlord,
    ])(
      'should render house components for %s claim',
      (claimType) => {
        selectorValues.set(
          selectors.getClaimSharedState,
          {
            ...claimSharedState,
            claimType,
          }
        );

        selectorValues.set(
          selectors.showHouseDamage,
          true
        );

        selectorValues.set(
          selectors.showHouseFireCause,
          true
        );

        selectorValues.set(
          selectors.showHouseNaturalDisasterCause,
          true
        );

        (
          selectors.isClaimTypeMotor as jest.Mock
        ).mockReturnValue(false);

        render(<PreStep1Component />);

        expect(
          screen.getByTestId('house-damage')
        ).toBeInTheDocument();

        expect(
          screen.getByTestId('house-fire-cause')
        ).toBeInTheDocument();

        expect(
          screen.getByTestId('house-natural-disaster')
        ).toBeInTheDocument();
      }
    );
  });

  describe('messages', () => {
    it('should show already replaced keys message', () => {
      selectorValues.set(
        selectors.isHouseKeysClaim,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('already-replaced-keys-message')
      ).toBeInTheDocument();
    });

    it('should show motor keys message', () => {
      selectorValues.set(
        selectors.isMotorKeysClaim,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('already-replaced-keys-message')
      ).toBeInTheDocument();
    });

    it('should show cannot claim for policy online message', () => {
      selectorValues.set(
        selectors.isCannotClaimForPolicyOnline,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId(
          'incorrect-claim-details-message-cannot-claim-for-policy'
        )
      ).toBeInTheDocument();
    });

    it('should show cannot process claim online message', () => {
      selectorValues.set(
        selectors.isCannotClaimOnline,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId(
          'incorrect-claim-details-message-cannot-claim-online'
        )
      ).toBeInTheDocument();
    });

    it('should show damaged and break-in message', () => {
      selectorValues.set(
        selectors.isDamagedAndBreakInHouseOrLandlord,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('any-contents-stolen')
      ).toBeInTheDocument();
    });
  });

  describe('water damage information', () => {
    beforeEach(() => {
      selectorValues.set(
        selectors.isWaterDamageClaim,
        true
      );
    });

    it('should render water damage information box', () => {
      render(<PreStep1Component />);

      expect(
        screen.getByTestId('information-box')
      ).toBeInTheDocument();
    });

    it('should render water damage link when enabled', () => {
      render(<PreStep1Component />);

      expect(
        screen.getByText(
          'learn more about this benefit here'
        )
      ).toBeInTheDocument();
    });

    it('should raise field GA event when water information link is clicked', () => {
      render(<PreStep1Component />);

      fireEvent.click(
        screen.getByText(
          'learn more about this benefit here'
        )
      );

      expect(
        raiseFieldGAEvent
      ).toHaveBeenCalledWith(
        'last_field_interacted',
        'link',
        'waterDamageInfoLink'
      );
    });

    it('should call setWaterDamageInfoAcknowledged when checkbox changes', () => {
      const setWaterDamageInfoAcknowledged =
        jest.fn();

      (
        usePreStep1ViewModel as jest.Mock
      ).mockReturnValue({
        ...defaultViewModel,
        setWaterDamageInfoAcknowledged,
      });

      render(<PreStep1Component />);

      fireEvent.click(
        screen.getByTestId('water-damage-checkbox')
      );

      expect(
        setWaterDamageInfoAcknowledged
      ).toHaveBeenCalledTimes(1);

      expect(
        setWaterDamageInfoAcknowledged
      ).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('form footer', () => {
    it('should render footer when page is valid', () => {
      selectorValues.set(
        selectors.isClaimPreStep1PageValid,
        true
      );

      selectorValues.set(
        selectors.isCannotClaimOnline,
        false
      );

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('form-footer')
      ).toBeInTheDocument();
    });

    it('should not render footer when page is invalid', () => {
      selectorValues.set(
        selectors.isClaimPreStep1PageValid,
        false
      );

      render(<PreStep1Component />);

      expect(
        screen.queryByTestId('form-footer')
      ).not.toBeInTheDocument();
    });

    it('should not render footer when claim cannot be processed online', () => {
      selectorValues.set(
        selectors.isCannotClaimOnline,
        true
      );

      render(<PreStep1Component />);

      expect(
        screen.queryByTestId('form-footer')
      ).not.toBeInTheDocument();
    });

    it('should disable footer when nextLoading is true', () => {
      (
        usePreStep1ViewModel as jest.Mock
      ).mockReturnValue({
        ...defaultViewModel,
        nextLoading: true,
      });

      render(<PreStep1Component />);

      expect(
        screen.getByTestId('form-footer')
      ).toBeDisabled();
    });

    it('should start product claim when footer is submitted', () => {
      render(<PreStep1Component />);

      fireEvent.click(
        screen.getByTestId('form-footer')
      );

      expect(
        defaultViewModel.setNextLoading
      ).toHaveBeenCalledWith(true);

      expect(
        raiseClaimGAEvent
      ).toHaveBeenCalledWith(
        claimSharedState.claimNumber,
        claimSharedState.claimType
      );

      expect(
        thunks.handleStartProductClaim
      ).toHaveBeenCalledWith(
        routes.CLAIM.SHARED.PRE_STEP_2
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'start-product-claim',
      });
    });

    it('should start windscreen claim when it is a windscreen claim', () => {
      selectorValues.set(
        selectors.isWindscreenClaim,
        true
      );

      render(<PreStep1Component />);

      fireEvent.click(
        screen.getByTestId('form-footer')
      );

      expect(
        thunks.handleStartWindscreenClaim
      ).toHaveBeenCalledWith(
        expect.any(String),
        routes.CLAIM.WINDSCREEN.PAGE1
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'start-windscreen-claim',
      });
    });
  });
});