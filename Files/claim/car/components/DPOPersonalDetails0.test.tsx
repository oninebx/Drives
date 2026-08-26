import * as React from 'react';
import { render } from '@testing-library/react';

import {
  DPOPersonalDetailsComponent,
  type DPOPersonalDetailsProps
} from './DPOPersonalDetails';

import type { AddressState } from '~/common/state';

// ------------------------------------------------------------
// Mocks
// ------------------------------------------------------------

const mockQuestion = jest.fn(
  ({ children }: { children: React.ReactNode }) => <>{children}</>
);

const mockMDTextField = jest.fn(() => null);
const mockAddressManual = jest.fn(() => null);

jest.mock('~/feature/claim/shared/components', () => ({
  Question: (props: {
    children: React.ReactNode;
  }) => mockQuestion(props)
}));

jest.mock('~/common/components/smart', () => ({
  AddressManual: (props: unknown) => mockAddressManual(props),
  MDTextField: (props: unknown) => mockMDTextField(props)
}));

jest.mock('~/common/utilities/translation', () => ({
  translate: jest.fn(() => (Component: React.ComponentType) => Component)
}));

// ------------------------------------------------------------
// Test data
// ------------------------------------------------------------

const mockT = jest.fn((key: string) => {
  const translations: Record<string, string | boolean> = {
    'claim:config.hidePartyAddress': false,

    'claim:otherPropertyDamage.ownerName.firstNameLabel':
      'First name',
    'claim:otherPropertyDamage.ownerName.lastNameLabel':
      'Last name',

    'claim:otherPropertyDamage.contactDetails.phoneLabel':
      'Phone',
    'claim:otherPropertyDamage.contactDetails.emailLabel':
      'Email',
    'claim:otherPropertyDamage.contactDetails.addressLabel':
      'Address',

    'claim:phone.defaultCountry': 'NZ'
  };

  return translations[key] ?? key;
});

const addressState = {
  addressLine1: '123 Test Street',
  suburb: 'Auckland',
  city: 'Auckland',
  postcode: '1010',
  country: 'NZ'
} as AddressState;

const defaultProps: DPOPersonalDetailsProps = {
  t: mockT,
  index: 1,
  modelPath: 'claim.damagePropertyOwner',
  formModelPath: 'forms.damagePropertyOwner',
  addressState,
  isBusiness: false
};

// ------------------------------------------------------------
// Helper
// ------------------------------------------------------------

const renderComponent = (
  props: Partial<DPOPersonalDetailsProps> = {}
) =>
  render(
    <DPOPersonalDetailsComponent
      {...defaultProps}
      {...props}
    />
  );

// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('DPOPersonalDetailsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string | boolean> = {
        'claim:config.hidePartyAddress': false,

        'claim:otherPropertyDamage.ownerName.firstNameLabel':
          'First name',
        'claim:otherPropertyDamage.ownerName.lastNameLabel':
          'Last name',

        'claim:otherPropertyDamage.contactDetails.phoneLabel':
          'Phone',
        'claim:otherPropertyDamage.contactDetails.emailLabel':
          'Email',
        'claim:otherPropertyDamage.contactDetails.addressLabel':
          'Address',

        'claim:phone.defaultCountry': 'NZ'
      };

      return translations[key] ?? key;
    });
  });

  describe('Question', () => {
    it('renders the owner name question for a private owner', () => {
      renderComponent({
        isBusiness: false
      });

      expect(mockQuestion).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'questionDamagePropertyOwnerName1',
          model: 'claim.damagePropertyOwner',
          translation:
            'claim:otherPropertyDamage.privateOwnerName'
        })
      );
    });

    it('renders the owner name question for a business', () => {
      renderComponent({
        isBusiness: true
      });

      expect(mockQuestion).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'questionDamagePropertyOwnerName1',
          model: 'claim.damagePropertyOwner',
          translation:
            'claim:otherPropertyDamage.businessName'
        })
      );
    });

    it('renders the contact details question', () => {
      renderComponent();

      expect(mockQuestion).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'questionDamagePropertyOwnerContactDetails1',
          model: 'claim.damagePropertyOwner',
          translation:
            'claim:otherPropertyDamage.contactDetails'
        })
      );
    });
  });

  describe('MDTextField', () => {
    it('passes the correct props to first name field', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'damagePropertyOwnerFirstNameField1',
          model:
            'claim.damagePropertyOwner.firstName',
          label: 'First name',
          ariaLabel: 'First name',
          maxLength: 255,
          validateOn: 'change'
        })
      );
    });

    it('passes the correct props to last name field', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'damagePropertyOwnerLastNameField1',
          model:
            'claim.damagePropertyOwner.lastName',
          label: 'Last name',
          ariaLabel: 'Last name',
          maxLength: 255,
          validateOn: 'change'
        })
      );
    });

    it('passes the correct props to phone field', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          id: 'damagePropertyOwnerPhoneField1',
          model:
            'claim.damagePropertyOwner.phone',
          label: 'Phone',
          ariaLabel: 'Phone',
          maxLength: 255,
          validateOn: 'change',
          placeholder: 'Phone (optional)',
          isPhone: true,
          defaultCountry: 'NZ'
        })
      );
    });

    it('passes the correct props to email field', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          id: 'damagePropertyOwnerEmailField1',
          model:
            'claim.damagePropertyOwner.email',
          type: 'email',
          label: 'Email',
          ariaLabel: 'Email',
          maxLength: 255,
          validateOn: 'change',
          persist: true
        })
      );
    });
  });

  describe('AddressManual', () => {
    it('renders AddressManual when hidePartyAddress is false', () => {
      renderComponent();

      expect(mockAddressManual).toHaveBeenCalledTimes(1);

      expect(mockAddressManual).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'damagePropertyOwnerAddressField1',
          fullPathModel:
            'claim.damagePropertyOwner.address',
          fullPathFormModel:
            'forms.damagePropertyOwner.address',
          addressState,
          label: 'Address',
          ariaLabel: 'Address',
          isOptional: true
        })
      );
    });

    it('does not render AddressManual when hidePartyAddress is true', () => {
      mockT.mockImplementation((key: string) => {
        if (key === 'claim:config.hidePartyAddress') {
          return true;
        }

        const translations: Record<string, string> = {
          'claim:otherPropertyDamage.ownerName.firstNameLabel':
            'First name',
          'claim:otherPropertyDamage.ownerName.lastNameLabel':
            'Last name',
          'claim:otherPropertyDamage.contactDetails.phoneLabel':
            'Phone',
          'claim:otherPropertyDamage.contactDetails.emailLabel':
            'Email',
          'claim:otherPropertyDamage.contactDetails.addressLabel':
            'Address',
          'claim:phone.defaultCountry': 'NZ'
        };

        return translations[key] ?? key;
      });

      renderComponent();

      expect(mockAddressManual).not.toHaveBeenCalled();
    });

    it('renders AddressManual when hidePartyAddress is not true', () => {
      mockT.mockImplementation((key: string) => {
        if (key === 'claim:config.hidePartyAddress') {
          return 'false';
        }

        return key;
      });

      renderComponent();

      expect(mockAddressManual).toHaveBeenCalledTimes(1);
    });
  });

  describe('index', () => {
    it('uses index in field ids and model paths', () => {
      renderComponent({
        index: 3,
        modelPath: 'claim.damagePropertyOwners.3',
        formModelPath: 'forms.damagePropertyOwners.3'
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'damagePropertyOwnerFirstNameField3',
          model:
            'claim.damagePropertyOwners.3.firstName'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          id: 'damagePropertyOwnerPhoneField3',
          model:
            'claim.damagePropertyOwners.3.phone'
        })
      );

      expect(mockAddressManual).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'damagePropertyOwnerAddressField3',
          fullPathModel:
            'claim.damagePropertyOwners.3.address',
          fullPathFormModel:
            'forms.damagePropertyOwners.3.address'
        })
      );
    });
  });
});