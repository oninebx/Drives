import * as React from 'react';
import { render } from '@testing-library/react';

import {
  AddressManual,
  CustomAutocomplete,
} from '~/common/components/smart';

import {
  OtherDriverDetailsComponent,
} from './OtherDriverDetails';

import type { OtherDriver } from '~/feature/claim/car/state';

import { ClaimType } from '~/feature/claim/shared/state';

jest.mock('~/common/components/smart', () => ({
  AddressManual: jest.fn(() => null),

  MDTextField: jest.fn(() => null),

  CustomAutocomplete: jest.fn(() => null),
}));

jest.mock('~/feature/claim/shared/components', () => ({
  Question: jest.fn(
    ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    )
  ),
}));

jest.mock('~/feature/claim/car/components', () => ({
  InsuranceDetails: jest.fn(() => null),

  ThridPartyAtFault: jest.fn(() => null),
}));

describe('OtherDriverDetailsComponent', () => {
  const clearVehicleModels = jest.fn();
  const getVehicleModels = jest.fn();

  const createProps = (
    overrides = {}
  ) => ({
    t: jest.fn((key: string) => key),

    index: 0,

    modelPath:
      'claim.car.otherDrivers[0]',

    formModelPath:
      'form.car.otherDrivers[0]',

    claimType: ClaimType.Motor,

    makes: ['Toyota', 'Mazda'],

    models: ['Corolla', 'Camry'],

    otherDriver: {
      address: {},
    } as OtherDriver,

    clearVehicleModels,

    getVehicleModels,

    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('address', () => {
    it('should render AddressManual when party address is not hidden', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps()}
        />
      );

      expect(AddressManual).toHaveBeenCalledTimes(1);
    });

    it('should not render AddressManual when party address is hidden', () => {
      const t = jest.fn((key: string) => {
        if (
          key ===
          'claim:config.hidePartyAddress'
        ) {
          return true;
        }

        return key;
      });

      render(
        <OtherDriverDetailsComponent
          {...createProps({ t })}
        />
      );

      expect(AddressManual).not.toHaveBeenCalled();
    });
  });

  describe('vehicle information', () => {
    it('should render vehicle information for non-Boat claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps({
            claimType: ClaimType.Motor,
            models: ['Corolla'],
          })}
        />
      );

      expect(
        CustomAutocomplete
      ).toHaveBeenCalledTimes(2);
    });

    it('should not render vehicle information for Boat claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps({
            claimType: ClaimType.Boat,
            models: ['Corolla'],
          })}
      );

      expect(
        CustomAutocomplete
      ).not.toHaveBeenCalled();
    });

    it('should render vehicle model when models are available', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps({
            claimType: ClaimType.Motor,
            models: ['Corolla'],
          })}
      );

      expect(
        CustomAutocomplete
      ).toHaveBeenCalledTimes(2);
    });

    it('should not render vehicle model when models are empty', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps({
            claimType: ClaimType.Motor,
            models: [],
          })}
      );

      expect(
        CustomAutocomplete
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('vehicle make change', () => {
    it('should clear vehicle models when make changes', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps()}
        />
      );

      const makeAutocompleteProps =
        (CustomAutocomplete as jest.Mock)
          .mock.calls[0][0];

      makeAutocompleteProps.onChange(
        'Mazda'
      );

      expect(
        clearVehicleModels
      ).toHaveBeenCalledTimes(1);

      expect(
        clearVehicleModels
      ).toHaveBeenCalledWith(0);
    });

    it('should not clear vehicle models when make does not change', () => {
      render(
        <OtherDriverDetailsComponent
          {...createProps()}
        />
      );

      const makeAutocompleteProps =
        (CustomAutocomplete as jest.Mock)
          .mock.calls[0][0];

      makeAutocompleteProps.onChange(
        'Toyota'
      );

      expect(
        clearVehicleModels
      ).not.toHaveBeenCalled();
    });
  });

  describe('vehicle autocomplete', () => {
    it('should clear existing models and load new models', async () => {
      getVehicleModels.mockResolvedValue(
        undefined
      );

      render(
        <OtherDriverDetailsComponent
          {...createProps()}
        />
      );

      const makeAutocompleteProps =
        (CustomAutocomplete as jest.Mock)
          .mock.calls[0][0];

      await makeAutocompleteProps.onAutocomplete(
        'Toyota'
      );

      expect(
        clearVehicleModels
      ).toHaveBeenCalledTimes(1);

      expect(
        clearVehicleModels
      ).toHaveBeenCalledWith(0);

      expect(
        getVehicleModels
      ).toHaveBeenCalledTimes(1);

      expect(
        getVehicleModels
      ).toHaveBeenCalledWith(
        0,
        'Toyota'
      );
    });
  });
});