import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { PersonalDetailsComponent } from './PersonalDetails';

import type { AddressState } from '~/common/state';

jest.mock('~/common/components/smart', () => ({
  MDTextField: ({
    id,
    model,
    label,
    ariaLabel,
    maxLength,
    validateOn,
    isPhone,
    defaultCountry,
    persist
  }: {
    id: string;
    model: string;
    label: string;
    ariaLabel: string;
    maxLength: number;
    validateOn: string;
    isPhone?: boolean;
    defaultCountry?: string;
    persist?: boolean;
  }) => (
    <div
      data-testid={`MDTextField-${id}`}
      data-model={model}
      data-label={label}
      data-aria-label={ariaLabel}
      data-max-length={maxLength}
      data-validate-on={validateOn}
      data-is-phone={isPhone ? 'true' : 'false'}
      data-default-country={defaultCountry}
      data-persist={persist ? 'true' : 'false'}
    />
  ),

  AddressManual: ({
    id,
    fullPathModel,
    fullPathFormModel,
    addressState,
    label,
    ariaLabel,
    isOptional
  }: {
    id: string;
    fullPathModel: string;
    fullPathFormModel: string;
    addressState: AddressState;
    label: string;
    ariaLabel: string;
    isOptional?: boolean;
  }) => (
    <div
      data-testid={`AddressManual-${id}`}
      data-full-path-model={fullPathModel}
      data-full-path-form-model={fullPathFormModel}
      data-address-state={JSON.stringify(addressState)}
      data-label={label}
      data-aria-label={ariaLabel}
      data-is-optional={isOptional ? 'true' : 'false'}
    />
  )
}));

jest.mock('~/feature/claim/shared/components', () => ({
  Question: ({
    id,
    model,
    translation,
    children
  }: {
    id: string;
    model: string;
    translation: string;
    children: React.ReactNode;
  }) => (
    <div
      data-testid={`Question-${id}`}
      data-model={model}
      data-translation={translation}>
      {children}
    </div>
  )
}));

describe('PersonalDetailsComponent', () => {
  const addressState = {} as AddressState;

  const defaultProps = {
    t: jest.fn((key: string) => key),
    index: 1,
    modelPath: 'claim.personalDetails[1]',
    formModelPath: 'form.claim.personalDetails[1]',
    addressState,
    idPrefixString: 'damagePropertyOwner',
    translationPathString: 'claim:personalDetails',
    isOptional: false
  };

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof PersonalDetailsComponent>> = {}
  ) => {
    return render(
      <PersonalDetailsComponent {...defaultProps} {...props} />
    );
  };

  describe('Question', () => {
    it('renders the name Question with the correct props', () => {
      renderComponent();

      const question = screen.getByTestId(
        'Question-damagePropertyOwnerName1'
      );

      expect(question).toHaveAttribute(
        'data-model',
        'claim.personalDetails[1]'
      );

      expect(question).toHaveAttribute(
        'data-translation',
        'claim:personalDetails.nameTitle'
      );
    });

    it('renders the contact details Question with the correct props', () => {
      renderComponent();

      const question = screen.getByTestId(
        'Question-damagePropertyOwnerContactFieldQuestions1'
      );

      expect(question).toHaveAttribute(
        'data-model',
        'claim.personalDetails[1]'
      );

      expect(question).toHaveAttribute(
        'data-translation',
        'claim:personalDetails.contactDetails'
      );
    });
  });

  describe('MDTextField', () => {
    it('passes the correct props to the first name field', () => {
      renderComponent();

      const field = screen.getByTestId(
        'MDTextField-damagePropertyOwnerFirstNameField1'
      );

      expect(field).toHaveAttribute(
        'data-model',
        'claim.personalDetails[1].firstName'
      );
      expect(field).toHaveAttribute(
        'data-label',
        'claim:personalDetails.contactDetails.firstNameLabel'
      );
      expect(field).toHaveAttribute(
        'data-aria-label',
        'claim:personalDetails.contactDetails.firstNameLabel'
      );
      expect(field).toHaveAttribute('data-max-length', '255');
      expect(field).toHaveAttribute('data-validate-on', 'change');
      expect(field).toHaveAttribute('data-is-phone', 'false');
    });

    it('passes the correct props to the last name field', () => {
      renderComponent();

      const field = screen.getByTestId(
        'MDTextField-damagePropertyOwnerLastNameField1'
      );

      expect(field).toHaveAttribute(
        'data-model',
        'claim.personalDetails[1].lastName'
      );
      expect(field).toHaveAttribute(
        'data-label',
        'claim:personalDetails.contactDetails.lastNameLabel'
      );
      expect(field).toHaveAttribute(
        'data-aria-label',
        'claim:personalDetails.contactDetails.lastNameLabel'
      );
      expect(field).toHaveAttribute('data-max-length', '255');
      expect(field).toHaveAttribute('data-validate-on', 'change');
    });

    it('passes the correct props to the phone field', () => {
      renderComponent();

      const field = screen.getByTestId(
        'MDTextField-damagePropertyOwnerPhoneField1'
      );

      expect(field).toHaveAttribute(
        'data-model',
        'claim.personalDetails[1].phone'
      );
      expect(field).toHaveAttribute(
        'data-label',
        'claim:personalDetails.contactDetails.phoneLabel'
      );
      expect(field).toHaveAttribute(
        'data-aria-label',
        'claim:personalDetails.contactDetails.phoneLabel'
      );
      expect(field).toHaveAttribute('data-max-length', '255');
      expect(field).toHaveAttribute('data-validate-on', 'change');
      expect(field).toHaveAttribute('data-is-phone', 'true');
      expect(field).toHaveAttribute(
        'data-default-country',
        'claim:phone.defaultCountry'
      );
    });

    it('passes the correct props to the email field', () => {
      renderComponent();

      const field = screen.getByTestId(
        'MDTextField-damagePropertyOwnerEmailField1'
      );

      expect(field).toHaveAttribute(
        'data-model',
        'claim.personalDetails[1].email'
      );
      expect(field).toHaveAttribute(
        'data-label',
        'claim:personalDetails.contactDetails.emailLabel'
      );
      expect(field).toHaveAttribute(
        'data-aria-label',
        'claim:personalDetails.contactDetails.emailLabel'
      );
      expect(field).toHaveAttribute('data-max-length', '255');
      expect(field).toHaveAttribute('data-validate-on', 'change');
      expect(field).toHaveAttribute('data-persist', 'true');
    });
  });

  describe('AddressManual', () => {
    it('renders AddressManual when hidePartyAddress is not true', () => {
      renderComponent({
        t: jest.fn((key: string) => {
          if (key === 'claim:config.hidePartyAddress') {
            return false;
          }

          return key;
        })
      });

      const address = screen.getByTestId(
        'AddressManual-damagePropertyOwnerAddressField1'
      );

      expect(address).toHaveAttribute(
        'data-full-path-model',
        'claim.personalDetails[1].address'
      );

      expect(address).toHaveAttribute(
        'data-full-path-form-model',
        'form.claim.personalDetails[1].address'
      );

      expect(address).toHaveAttribute(
        'data-label',
        'claim:personalDetails.contactDetails.addressLabel'
      );

      expect(address).toHaveAttribute(
        'data-aria-label',
        'claim:personalDetails.contactDetails.addressLabel'
      );
    });

    it('passes addressState to AddressManual', () => {
      const customAddressState = {
        value: 'test'
      } as unknown as AddressState;

      renderComponent({
        addressState: customAddressState
      });

      const address = screen.getByTestId(
        'AddressManual-damagePropertyOwnerAddressField1'
      );

      expect(address).toHaveAttribute(
        'data-address-state',
        JSON.stringify(customAddressState)
      );
    });

    it('passes isOptional to AddressManual', () => {
      renderComponent({
        isOptional: true
      });

      const address = screen.getByTestId(
        'AddressManual-damagePropertyOwnerAddressField1'
      );

      expect(address).toHaveAttribute(
        'data-is-optional',
        'true'
      );
    });

    it('does not render AddressManual when hidePartyAddress is true', () => {
      renderComponent({
        t: jest.fn((key: string) => {
          if (key === 'claim:config.hidePartyAddress') {
            return true;
          }

          return key;
        })
      });

      expect(
        screen.queryByTestId(
          'AddressManual-damagePropertyOwnerAddressField1'
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('dynamic props', () => {
    it('uses index and idPrefixString to generate component ids', () => {
      renderComponent({
        index: 3,
        idPrefixString: 'otherDriver'
      });

      expect(
        screen.getByTestId('Question-otherDriverName3')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId(
          'Question-otherDriverContactFieldQuestions3'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('MDTextField-otherDriverFirstNameField3')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('MDTextField-otherDriverLastNameField3')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('MDTextField-otherDriverPhoneField3')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('MDTextField-otherDriverEmailField3')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('AddressManual-otherDriverAddressField3')
      ).toBeInTheDocument();
    });

    it('uses modelPath and formModelPath to generate child component paths', () => {
      renderComponent({
        modelPath: 'claim.otherDrivers[2]',
        formModelPath: 'form.claim.otherDrivers[2]'
      });

      expect(
        screen.getByTestId(
          'MDTextField-damagePropertyOwnerFirstNameField1'
        )
      ).toHaveAttribute(
        'data-model',
        'claim.otherDrivers[2].firstName'
      );

      expect(
        screen.getByTestId(
          'AddressManual-damagePropertyOwnerAddressField1'
        )
      ).toHaveAttribute(
        'data-full-path-model',
        'claim.otherDrivers[2].address'
      );

      expect(
        screen.getByTestId(
          'AddressManual-damagePropertyOwnerAddressField1'
        )
      ).toHaveAttribute(
        'data-full-path-form-model',
        'form.claim.otherDrivers[2].address'
      );
    });
  });
});