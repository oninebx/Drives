import { act, renderHook } from '@testing-library/react';
import React from 'react';

import { logError } from '~/common/utilities';
import { loadSpecifiedItems } from '~/feature/claim/contents/state/thunks';
import { loadSpecialFeatures } from '~/feature/claim/house/state/thunks';
import { selectors, thunks } from '~/feature/claim/shared/state';
import {
  ClaimType,
  modelPath as sharedModelPath,
} from '~/feature/claim/shared/state/constants';
import {
  useAppDispatch,
  useAppSelector,
} from '~/root/store';

import { usePreStep1ViewModel } from './usePreStep1ViewModel';

jest.mock('~/common/utilities', () => ({
  logError: jest.fn(),
}));

jest.mock('~/feature/claim/contents/state/thunks', () => ({
  loadSpecifiedItems: jest.fn(),
}));

jest.mock('~/feature/claim/house/state/thunks', () => ({
  loadSpecialFeatures: jest.fn(),
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getContentsSpecifiedItems: jest.fn(),
    getHouseSpecialFeatures: jest.fn(),
    getClaimSharedState: jest.fn(),
  },
  thunks: {
    resetProductSharedState: jest.fn(),
    loadPolicyDetails: jest.fn(),
  },
}));

jest.mock('~/root/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

describe('usePreStep1ViewModel', () => {
  const dispatch = jest.fn();

  const contentsSpecifiedItems = [
    {
      itemId: 'item-1',
    },
  ];

  const houseSpecialFeatures = [
    {
      featureId: 'feature-1',
    },
  ];

  const claimSharedState = {
    policyNumber: 'POLICY-123',
    eventDate: '2026-08-20',
    eventTime: '10:30',
    eventTimeAmPm: 'AM',
    claimType: ClaimType.Contents,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAppDispatch as jest.Mock).mockReturnValue(dispatch);

    (selectors.getContentsSpecifiedItems as jest.Mock).mockReturnValue(
      contentsSpecifiedItems
    );

    (selectors.getHouseSpecialFeatures as jest.Mock).mockReturnValue(
      houseSpecialFeatures
    );

    (selectors.getClaimSharedState as jest.Mock).mockReturnValue(
      claimSharedState
    );

    (
      thunks.resetProductSharedState as jest.Mock
    ).mockReturnValue({
      type: 'reset-product-shared-state',
    });

    (
      thunks.loadPolicyDetails as jest.Mock
    ).mockReturnValue({
      type: 'load-policy-details',
    });

    (
      loadSpecialFeatures as jest.Mock
    ).mockReturnValue({
      type: 'load-special-features',
    });

    (
      loadSpecifiedItems as jest.Mock
    ).mockReturnValue({
      type: 'load-specified-items',
    });

    dispatch.mockResolvedValue({});
  });

  describe('initial state', () => {
    it('should return the expected initial state', () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      expect(result.current.policyDetailsLoading).toBe(false);
      expect(result.current.nextLoading).toBe(false);
      expect(result.current.waterDamageInfoAcknowledged).toBe(false);

      expect(result.current.setPolicyDetailsLoading).toEqual(
        expect.any(Function)
      );
      expect(result.current.setNextLoading).toEqual(expect.any(Function));
      expect(result.current.setWaterDamageInfoAcknowledged).toEqual(
        expect.any(Function)
      );

      expect(result.current.getSpecifiedItems).toEqual(
        expect.any(Function)
      );
      expect(result.current.getSpecialFeatures).toEqual(
        expect.any(Function)
      );
      expect(result.current.handleContinue).toEqual(
        expect.any(Function)
      );
    });
  });

  describe('setters', () => {
    it('should update policyDetailsLoading', () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.setPolicyDetailsLoading(true);
      });

      expect(result.current.policyDetailsLoading).toBe(true);

      act(() => {
        result.current.setPolicyDetailsLoading(false);
      });

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should update nextLoading', () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.setNextLoading(true);
      });

      expect(result.current.nextLoading).toBe(true);

      act(() => {
        result.current.setNextLoading(false);
      });

      expect(result.current.nextLoading).toBe(false);
    });

    it('should update waterDamageInfoAcknowledged', () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.setWaterDamageInfoAcknowledged(true);
      });

      expect(result.current.waterDamageInfoAcknowledged).toBe(true);

      act(() => {
        result.current.setWaterDamageInfoAcknowledged(false);
      });

      expect(result.current.waterDamageInfoAcknowledged).toBe(false);
    });
  });

  describe('getSpecifiedItems', () => {
    it('should load specified items when contentsSpecifiedItems exists', () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.getSpecifiedItems();
      });

      expect(loadSpecifiedItems).toHaveBeenCalledTimes(1);
      expect(loadSpecifiedItems).toHaveBeenCalledWith(
        `${sharedModelPath}.contents`,
        contentsSpecifiedItems
      );
    });

    it('should not load specified items when contentsSpecifiedItems is undefined', () => {
      (
        selectors.getContentsSpecifiedItems as jest.Mock
      ).mockReturnValue(undefined);

      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.getSpecifiedItems();
      });

      expect(loadSpecifiedItems).not.toHaveBeenCalled();
    });

    it('should not load specified items when contentsSpecifiedItems is null', () => {
      (
        selectors.getContentsSpecifiedItems as jest.Mock
      ).mockReturnValue(null);

      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.getSpecifiedItems();
      });

      expect(loadSpecifiedItems).not.toHaveBeenCalled();
    });
  });

  describe('getSpecialFeatures', () => {
    it('should dispatch loadSpecialFeatures when houseSpecialFeatures exists', () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.getSpecialFeatures();
      });

      expect(loadSpecialFeatures).toHaveBeenCalledTimes(1);

      expect(loadSpecialFeatures).toHaveBeenCalledWith(
        `${sharedModelPath}.house`,
        houseSpecialFeatures
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'load-special-features',
      });
    });

    it('should not dispatch loadSpecialFeatures when houseSpecialFeatures is undefined', () => {
      (
        selectors.getHouseSpecialFeatures as jest.Mock
      ).mockReturnValue(undefined);

      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.getSpecialFeatures();
      });

      expect(loadSpecialFeatures).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch loadSpecialFeatures when houseSpecialFeatures is null', () => {
      (
        selectors.getHouseSpecialFeatures as jest.Mock
      ).mockReturnValue(null);

      const { result } = renderHook(() => usePreStep1ViewModel());

      act(() => {
        result.current.getSpecialFeatures();
      });

      expect(loadSpecialFeatures).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('handleContinue', () => {
    it('should load policy details for a contents claim', async () => {
      const { result } = renderHook(() => usePreStep1ViewModel());

      await act(async () => {
        await result.current.handleContinue();
      });

      expect(
        thunks.resetProductSharedState
      ).toHaveBeenCalledTimes(1);

      expect(
        thunks.resetProductSharedState
      ).toHaveBeenCalledWith(sharedModelPath);

      expect(thunks.loadPolicyDetails).toHaveBeenCalledTimes(1);

      expect(thunks.loadPolicyDetails).toHaveBeenCalledWith(
        claimSharedState.policyNumber,
        claimSharedState.eventDate,
        claimSharedState.eventTime,
        claimSharedState.eventTimeAmPm,
        claimSharedState.claimType
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'reset-product-shared-state',
      });

      expect(dispatch).toHaveBeenCalledWith({
        type: 'load-policy-details',
      });

      expect(loadSpecifiedItems).toHaveBeenCalledWith(
        `${sharedModelPath}.contents`,
        contentsSpecifiedItems
      );

      expect(loadSpecialFeatures).not.toHaveBeenCalled();

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should load special features for a House claim', async () => {
      (
        selectors.getClaimSharedState as jest.Mock
      ).mockReturnValue({
        ...claimSharedState,
        claimType: ClaimType.House,
      });

      const { result } = renderHook(() => usePreStep1ViewModel());

      await act(async () => {
        await result.current.handleContinue();
      });

      expect(loadSpecialFeatures).toHaveBeenCalledTimes(1);

      expect(loadSpecialFeatures).toHaveBeenCalledWith(
        `${sharedModelPath}.house`,
        houseSpecialFeatures
      );

      expect(loadSpecifiedItems).not.toHaveBeenCalled();

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should load special features for a Landlord claim', async () => {
      (
        selectors.getClaimSharedState as jest.Mock
      ).mockReturnValue({
        ...claimSharedState,
        claimType: ClaimType.Landlord,
      });

      const { result } = renderHook(() => usePreStep1ViewModel());

      await act(async () => {
        await result.current.handleContinue();
      });

      expect(loadSpecialFeatures).toHaveBeenCalledTimes(1);

      expect(loadSpecialFeatures).toHaveBeenCalledWith(
        `${sharedModelPath}.house`,
        houseSpecialFeatures
      );

      expect(loadSpecifiedItems).not.toHaveBeenCalled();

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should not load specified items or special features for other claim types', async () => {
      (
        selectors.getClaimSharedState as jest.Mock
      ).mockReturnValue({
        ...claimSharedState,
        claimType: 'OtherClaimType',
      });

      const { result } = renderHook(() => usePreStep1ViewModel());

      await act(async () => {
        await result.current.handleContinue();
      });

      expect(loadSpecifiedItems).not.toHaveBeenCalled();
      expect(loadSpecialFeatures).not.toHaveBeenCalled();

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should set policyDetailsLoading to true while loading policy details', async () => {
      let resolvePolicyDetails: (() => void) | undefined;

      dispatch.mockImplementationOnce(() => ({
        type: 'reset-product-shared-state',
      }));

      dispatch.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolvePolicyDetails = resolve;
          })
      );

      const { result } = renderHook(() => usePreStep1ViewModel());

      let continuePromise: Promise<void>;

      act(() => {
        continuePromise = result.current.handleContinue();
      });

      expect(result.current.policyDetailsLoading).toBe(true);

      await act(async () => {
        resolvePolicyDetails?.();
        await continuePromise;
      });

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should log the error when loading policy details fails', async () => {
      const error = new Error('Failed to load policy details');

      dispatch
        .mockImplementationOnce(() => ({
          type: 'reset-product-shared-state',
        }))
        .mockImplementationOnce(() => Promise.reject(error));

      const { result } = renderHook(() => usePreStep1ViewModel());

      await act(async () => {
        await result.current.handleContinue();
      });

      expect(logError).toHaveBeenCalledTimes(1);

      expect(logError).toHaveBeenCalledWith(
        error,
        'load-policy-claim-error'
      );

      expect(result.current.policyDetailsLoading).toBe(false);
    });

    it('should reset product shared state before loading policy details', async () => {
      const calls: unknown[] = [];

      dispatch.mockImplementation((action) => {
        calls.push(action);
        return Promise.resolve(action);
      });

      const { result } = renderHook(() => usePreStep1ViewModel());

      await act(async () => {
        await result.current.handleContinue();
      });

      expect(calls).toEqual([
        {
          type: 'reset-product-shared-state',
        },
        {
          type: 'load-policy-details',
        },
      ]);
    });
  });
});