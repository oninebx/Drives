import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  OtherDriverDetailsComponent,
} from './OtherDriverDetails';

import {
  AddressManual,
  CustomAutocomplete,
  MDTextField,
} from '~/common/components/smart';

import {
  InsuranceDetails,
  ThridPartyAtFault,
} from '~/feature/claim/car/components';

import { ClaimType } from '~/feature/claim/shared/state';

import { Question } from '~/feature/claim/shared/components';

jest.mock(
  '~/common/components/smart',
  () => ({
    AddressManual: jest.fn(
      ({
        id,
        fullPathModel,
        fullPathFormModel,
        addressState,
        isOptional,
        label,
      }) => (
        <div data-testid="address-manual">
          <span data-testid="address-id">{id}</span>
          <span data-testid="address-model">
            {fullPathModel}
          </span>
          <span data-testid="address-form-model">
            {fullPathFormModel}
          </span>
          <span data-testid="address-state">
            {JSON.stringify(addressState)}
          </span>
          <span data-testid="address-optional">
            {String(isOptional)}
          </span>
          <span data-testid="address-label">
            {label}
          </span>
        </div>
      )
    ),

    CustomAutocomplete: jest.fn(
      ({
        id,
        model,
        items,
        onChange,
        onAutocomplete,
      }) => (
        <div data-testid={id}>
          <span data-testid={`${id}-model`}>
            {model}
          </span>

          <span data-testid={`${id}-items`}>
            {JSON.stringify(items)}
          </span>

          <button
            data-testid={`${id}-change`}
            onClick={() => onChange('New Value')}
          >
            Change
          </button>

          <button
            data-testid={`${id}-autocomplete`}
            onClick={() =>
              onAutocomplete('Toyota')
            }
          >
            Autocomplete
          </button>
        </div>
      )
    ),

    MDTextField: jest.fn(
      ({
        id,
        model,
        label,
        type,
        maxLength,
        validateOn,
        showValidationTickIcon,
        placeholder,
        isPhone,
        defaultCountry,
      }) => (
        <div data-testid={id}>
          <span data-testid={`${id}-model`}>
            {model}
          </span>

          <span data-testid={`${id}-label`}>
            {label}
          </span>

          <span data-testid={`${id}-type`}>
            {type || ''}
          </span>

          <span data-testid={`${id}-max-length`}>
            {String(maxLength || '')}
          </span>

          <span data-testid={`${id}-validate-on`}>
            {JSON.stringify(validateOn)}
          </span>

          <span
            data-testid={`${id}-validation-tick`}
          >
            {String(
              showValidationTickIcon
            )}
          </span>

          <span data-testid={`${id}-placeholder`}>
            {placeholder || ''}
          </span>

          <span data-testid={`${id}-is-phone`}>
            {String(isPhone)}
          </span>

          <span data-testid={`${id}-default-country`}>
            {defaultCountry || ''}
          </span>
        </div>
      )
    ),
  })
);

jest.mock(
  '~/feature/claim/shared/components',
  () => ({
    Question: jest.fn(
      ({
        id,
        model,
        translation,
        subQuestion,
        noTick,
        children,
      }) => (
        <section data-testid={id}>
          <span data-testid={`${id}-model`}>
            {model}
          </span>

          <span
            data-testid={`${id}-translation`}
          >
            {translation}
          </span>

          <span
            data-testid={`${id}-sub-question`}
          >
            {String(subQuestion)}
          </span>

          <span data-testid={`${id}-no-tick`}>
            {String(noTick)}
          </span>

          {children}
        </section>
      )
    ),
  })
);

jest.mock(
  '~/feature/claim/car/components',
  () => ({
    InsuranceDetails: jest.fn(
      ({
        modelPath,
        translation,
        placeholder,
      }) => (
        <div data-testid="insurance-details">
          <span data-testid="insurance-model-path">
            {modelPath}
          </span>

          <span data-testid="insurance-translation">
            {translation}
          </span>

          <span data-testid="insurance-placeholder">
            {placeholder}
          </span>
        </div>
      )
    ),

    ThridPartyAtFault: jest.fn(
      ({
        modelPath,
        translation,
        index,
      }) => (
        <div data-testid="third-party-at-fault">
          <span data-testid="third-party-model-path">
            {modelPath}
          </span>

          <span data-testid="third-party-translation">
            {translation}
          </span>

          <span data-testid="third-party-index">
            {String(index)}
          </span>
        </div>
      )
    ),
  })
);

jest.mock(
  '~/common/utilities/translation',
  () => ({
    translate: () => (
      Component: React.ComponentType<any>
    ) => Component,
  })
);

describe('OtherDriverDetailsComponent', () => {
  const defaultProps = {
    t: jest.fn((key: string) => key),

    index: 0,

    modelPath: 'claim.car.otherDrivers[0]',

    formModelPath:
      'form.car.otherDrivers[0]',

    claimType: ClaimType.Motor,

    makes: ['Toyota', 'Mazda', 'Ford'],

    models: ['Corolla', 'Camry'],

    otherDriver: {
      firstName: 'John',
      lastName: 'Smith',
      phone: '0211234567',
      email: 'john@example.com',
      make: 'Toyota',
      model: 'Corolla',
      rego: 'ABC123',
      address: {
        addressLine1: '1 Test Street',
        suburb: 'Auckland',
      },
    },

    clearVehicleModels: jest.fn(),

    getVehicleModels: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render the driver container', () => {
      const { container } = render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        container.querySelector(
          '.other-driver-container'
        )
      ).toBeInTheDocument();

      expect(
        container.querySelector(
          '.other-driver-0'
        )
      ).toBeInTheDocument();
    });

    it('should use the driver index in the container class', () => {
      const { container } = render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          index={2}
        />
      );

      expect(
        container.querySelector(
          '.other-driver-2'
        )
      ).toBeInTheDocument();
    });
  });

  describe('name', () => {
    it('should render first name field', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-firstName'
        )
      ).toBeInTheDocument();
    });

    it('should render last name field', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-lastName'
        )
      ).toBeInTheDocument();
    });

    it('should use the correct first name model', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-firstName-model'
        )
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].firstName'
      );
    });

    it('should use the correct last name model', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-lastName-model'
        )
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].lastName'
      );
    });

    it('should use the correct name labels', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        defaultProps.t
      ).toHaveBeenCalledWith(
        'claim/car:otherDrivers.name.firstNameLabel'
      );

      expect(
        defaultProps.t
      ).toHaveBeenCalledWith(
        'claim/car:otherDrivers.name.lastNameLabel'
      );
    });

    it('should configure name fields to validate on blur and change', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-firstName-validate-on'
        )
      ).toHaveTextContent(
        '["blur","change"]'
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-lastName-validate-on'
        )
      ).toHaveTextContent(
        '["blur","change"]'
      );
    });
  });

  describe('contact details', () => {
    it('should render phone field', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-phone'
        )
      ).toBeInTheDocument();
    });

    it('should render email field', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-email'
        )
      ).toBeInTheDocument();
    });

    it('should configure phone as number input', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-phone-type'
        )
      ).toHaveTextContent('number');
    });

    it('should configure phone as a phone field', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-phone-is-phone'
        )
      ).toHaveTextContent('true');
    });

    it('should use the default phone country from translation', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        defaultProps.t
      ).toHaveBeenCalledWith(
        'claim:phone.defaultCountry'
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-phone-default-country'
        )
      ).toHaveTextContent(
        'claim:phone.defaultCountry'
      );
    });

    it('should configure email as an email input', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-email-type'
        )
      ).toHaveTextContent('email');
    });

    it('should configure email max length to 60', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-email-max-length'
        )
      ).toHaveTextContent('60');
    });
  });

  describe('address', () => {
    it('should render address when hidePartyAddress is not true', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId('address-manual')
      ).toBeInTheDocument();
    });

    it('should pass the driver address to AddressManual', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId('address-state')
      ).toHaveTextContent(
        JSON.stringify(
          defaultProps.otherDriver.address
        )
      );
    });

    it('should pass the correct address model paths', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId('address-model')
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].address'
      );

      expect(
        screen.getByTestId(
          'address-form-model'
        )
      ).toHaveTextContent(
        'form.car.otherDrivers[0].address'
      );
    });

    it('should mark address as optional', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId('address-optional')
      ).toHaveTextContent('true');
    });
  });

  describe('vehicle registration', () => {
    it('should render registration number for motor claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          claimType={ClaimType.Motor}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-rego'
        )
      ).toBeInTheDocument();
    });

    it('should not render registration number for boat claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          claimType={ClaimType.Boat}
        />
      );

      expect(
        screen.queryByTestId(
          'otherDriver-0-rego'
        )
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId(
          'questionOtherDriverRegistrationNumber-0'
        )
      ).not.toBeInTheDocument();
    });

    it('should use the correct registration model', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-rego-model'
        )
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].rego'
      );
    });

    it('should set registration max length to 6', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'otherDriver-0-rego-max-length'
        )
      ).toHaveTextContent('6');
    });
  });

  describe('vehicle make', () => {
    it('should render vehicle make for motor claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          claimType={ClaimType.Motor}
        />
      );

      expect(
        screen.getByTestId('carMakes-0')
      ).toBeInTheDocument();
    });

    it('should not render vehicle make for boat claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          claimType={ClaimType.Boat}
        />
      );

      expect(
        screen.queryByTestId('carMakes-0')
      ).not.toBeInTheDocument();
    });

    it('should map makes into autocomplete items', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'carMakes-0-items'
        )
      ).toHaveTextContent(
        JSON.stringify([
          {
            label: 'Toyota',
            value: 'Toyota',
          },
          {
            label: 'Mazda',
            value: 'Mazda',
          },
          {
            label: 'Ford',
            value: 'Ford',
          },
        ])
      );
    });

    it('should use the correct make model', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'carMakes-0-model'
        )
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].make'
      );
    });
  });

  describe('vehicle make change', () => {
    it('should clear vehicle models when make changes', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      fireEvent.click(
        screen.getByTestId(
          'carMakes-0-change'
        )
      );

      expect(
        defaultProps.clearVehicleModels
      ).toHaveBeenCalledTimes(1);

      expect(
        defaultProps.clearVehicleModels
      ).toHaveBeenCalledWith(0);
    });

    it('should not clear vehicle models when make does not change', () => {
      /*
       * The mock normally sends "New Value".
       * Here we replace it with a mock implementation
       * that sends the current make.
       */
      (CustomAutocomplete as jest.Mock).mockImplementation(
        ({
          id,
          onChange,
        }: {
          id: string;
          onChange: (value: string) => void;
        }) => (
          <button
            data-testid={id}
            onClick={() =>
              onChange(
                defaultProps.otherDriver.make
              )
            }
          >
            Change
          </button>
        )
      );

      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      fireEvent.click(
        screen.getByTestId('carMakes-0')
      );

      expect(
        defaultProps.clearVehicleModels
      ).not.toHaveBeenCalled();
    });
  });

  describe('vehicle autocomplete', () => {
    it('should clear models before getting new vehicle models', async () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      fireEvent.click(
        screen.getByTestId(
          'carMakes-0-autocomplete'
        )
      );

      expect(
        defaultProps.clearVehicleModels
      ).toHaveBeenCalledWith(0);

      expect(
        defaultProps.getVehicleModels
      ).toHaveBeenCalledWith(
        0,
        'Toyota'
      );

      expect(
        defaultProps.clearVehicleModels.mock
          .invocationCallOrder[0]
      ).toBeLessThan(
        defaultProps.getVehicleModels.mock
          .invocationCallOrder[0]
      );
    });

    it('should await getVehicleModels', async () => {
      const getVehicleModels =
        jest.fn().mockResolvedValue(undefined);

      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          getVehicleModels={getVehicleModels}
        />
      );

      fireEvent.click(
        screen.getByTestId(
          'carMakes-0-autocomplete'
        )
      );

      expect(
        getVehicleModels
      ).toHaveBeenCalledWith(
        0,
        'Toyota'
      );
    });
  });

  describe('vehicle model', () => {
    it('should render vehicle model when models are available', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          models={['Corolla']}
        />
      );

      expect(
        screen.getByTestId('carModels-0')
      ).toBeInTheDocument();
    });

    it('should not render vehicle model when models are empty', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          models={[]}
        />
      );

      expect(
        screen.queryByTestId('carModels-0')
      ).not.toBeInTheDocument();
    });

    it('should not render vehicle model when models are undefined', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          models={undefined as any}
        />
      );

      expect(
        screen.queryByTestId('carModels-0')
      ).not.toBeInTheDocument();
    });

    it('should not render vehicle model for boat claim', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          claimType={ClaimType.Boat}
          models={['Corolla']}
        />
      );

      expect(
        screen.queryByTestId('carModels-0')
      ).not.toBeInTheDocument();
    });

    it('should map models into autocomplete items', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          models={['Corolla', 'Camry']}
        />
      );

      expect(
        screen.getByTestId(
          'carModels-0-items'
        )
      ).toHaveTextContent(
        JSON.stringify([
          {
            label: 'Corolla',
            value: 'Corolla',
          },
          {
            label: 'Camry',
            value: 'Camry',
          },
        ])
      );
    });

    it('should use the correct vehicle model path', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'carModels-0-model'
        )
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].model'
      );
    });
  });

  describe('third party at fault', () => {
    it('should render ThridPartyAtFault', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'third-party-at-fault'
        )
      ).toBeInTheDocument();
    });

    it('should pass the correct model path', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'third-party-model-path'
        )
      ).toHaveTextContent(
        'claim.car.otherDrivers[0].thirdPartyAtFault'
      );
    });

    it('should pass the correct index', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
          index={3}
        />
      );

      expect(
        screen.getByTestId(
          'third-party-index'
        )
      ).toHaveTextContent('3');
    });

    it('should use the correct translation', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'third-party-translation'
        )
      ).toHaveTextContent(
        'claim/car:otherDrivers.thirdPartyAtFault'
      );
    });
  });

  describe('insurance details', () => {
    it('should render InsuranceDetails', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'insurance-details'
        )
      ).toBeInTheDocument();
    });

    it('should pass the correct model path', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'insurance-model-path'
        )
      ).toHaveTextContent(
        defaultProps.modelPath
      );
    });

    it('should pass the correct translation', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'insurance-translation'
        )
      ).toHaveTextContent(
        'claim/car:otherDrivers.insuranceDetails'
      );
    });

    it('should pass the translated placeholder', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        defaultProps.t
      ).toHaveBeenCalledWith(
        'claim/car:otherDrivers.insuranceDetails.placeholder'
      );

      expect(
        screen.getByTestId(
          'insurance-placeholder'
        )
      ).toHaveTextContent(
        'claim/car:otherDrivers.insuranceDetails.placeholder'
      );
    });
  });

  describe('Question configuration', () => {
    it('should configure questions as sub questions', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'questionOtherDriverName-0-sub-question'
        )
      ).toHaveTextContent('true');

      expect(
        screen.getByTestId(
          'questionOtherDriverContactDetails-0-sub-question'
        )
      ).toHaveTextContent('true');
    });

    it('should disable ticks on questions', () => {
      render(
        <OtherDriverDetailsComponent
          {...defaultProps}
        />
      );

      expect(
        screen.getByTestId(
          'questionOtherDriverName-0-no-tick'
        )
      ).toHaveTextContent('true');

      expect(
        screen.getByTestId(
          'questionOtherDriverContactDetails-0-no-tick'
        )
      ).toHaveTextContent('true');
    });
  });
});