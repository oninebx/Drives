import * as React from 'react';
import { render, screen } from '@testing-library/react';

import {
  WitnessDetailsComponent,
  type WitnessDetailsProps
} from './WitnessDetails';

import { ClaimType } from '~/feature/claim/shared/state';

// ------------------------------------------------------------
// Mocks
// ------------------------------------------------------------

const mockT = jest.fn((key: string) => {
  const translations: Record<string, string | boolean> = {
    'claim:config.hidePartyAddress': false,

    'claim:witness.witnessName.firstNameLabel': 'First name',
    'claim:witness.witnessName.lastNameLabel': 'Last name',

    'claim:witness.contactDetails.phoneLabel': 'Phone',
    'claim:witness.contactDetails.emailLabel': 'Email',
    'claim:witness.contactDetails.addressLabel': 'Address',

    'claim:phone.defaultCountry': 'NZ'
  };

  return translations[key] ?? key;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT
  })
}));

const mockQuestion = jest.fn(
  ({
    children,
    id
  }: {
    children: React.ReactNode;
    id: string;
  }) => (
    <div data-testid="Question" data-question-id={id}>
      {children}
    </div>
  )
);

jest.mock('~/feature/claim/shared/components', () => ({
  Question: (props: {
    children: React.ReactNode;
    id: string;
  }) => mockQuestion(props)
}));

const mockMDTextField = jest.fn(
  (props: {
    id: string;
  }) => <div data-testid={props.id} />
);

const mockAddressManual = jest.fn(
  (props: {
    id: string;
  }) => <div data-testid={props.id} />
);

jest.mock('~/common/components/smart', () => ({
  AddressManual: (props: { id: string }) => mockAddressManual(props),
  MDTextField: (props: { id: string }) => mockMDTextField(props)
}));

// ------------------------------------------------------------
// Test data
// ------------------------------------------------------------

const witnessAddress = {
  addressLine1: '123 Test Street',
  addressLine2: '',
  suburb: 'Auckland',
  city: 'Auckland',
  postcode: '1010',
  country: 'NZ'
} as any;

const defaultProps: WitnessDetailsProps = {
  witnessIndex: 1,
  witnessModelPath: 'claim.witnesses.1',
  witnessFormModelPath: 'forms.witnesses.1',
  witnessAddress,
  claimType: ClaimType.Car
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const renderComponent = (
  props: Partial<WitnessDetailsProps> = {}
) =>
  render(
    <WitnessDetailsComponent
      {...defaultProps}
      {...props}
    />
  );

// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('WitnessDetailsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders witness name and contact detail questions', () => {
      renderComponent();

      expect(screen.getByTestId('Question')).toBeInTheDocument();

      expect(mockQuestion).toHaveBeenCalledTimes(2);

      expect(mockQuestion).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'questionWitnessName1',
          model: 'claim.witnesses.1',
          translation: 'claim:witness.witnessName'
        })
      );

      expect(mockQuestion).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'questionContactDetails1',
          model: 'claim.witnesses.1',
          translation: 'claim:witness.contactDetails'
        })
      );
    });

    it('renders all witness fields', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenCalledTimes(4);
      expect(mockAddressManual).toHaveBeenCalledTimes(1);

      expect(screen.getByTestId('witnessFirstNameField1')).toBeInTheDocument();
      expect(screen.getByTestId('witnessLastNameField1')).toBeInTheDocument();
      expect(screen.getByTestId('witnessPhoneField1')).toBeInTheDocument();
      expect(screen.getByTestId('witnessEmailField1')).toBeInTheDocument();
      expect(screen.getByTestId('witnessAddressField1')).toBeInTheDocument();
    });
  });

  describe('MDTextField', () => {
    it('passes the correct props to witness name fields', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'witnessFirstNameField1',
          model: 'claim.witnesses.1.firstName',
          label: 'First name',
          ariaLabel: 'First name',
          maxLength: 255,
          validateOn: 'change'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'witnessLastNameField1',
          model: 'claim.witnesses.1.lastName',
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
          id: 'witnessPhoneField1',
          model: 'claim.witnesses.1.phone',
          label: 'Phone',
          ariaLabel: 'Phone',
          placeholder: 'Phone',
          maxLength: 255,
          validateOn: 'change',
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
          id: 'witnessEmailField1',
          model: 'claim.witnesses.1.email',
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
    it('passes the correct props to AddressManual', () => {
      renderComponent();

      expect(mockAddressManual).toHaveBeenCalledTimes(1);

      expect(mockAddressManual).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'witnessAddressField1',
          fullPathModel: 'claim.witnesses.1.address',
          fullPathFormModel: 'forms.witnesses.1.address',
          addressState: witnessAddress,
          label: 'Address',
          ariaLabel: 'Address'
        })
      );
    });

    it('does not render AddressManual for car claims when hidePartyAddress is true', () => {
      mockT.mockImplementation((key: string) => {
        if (key === 'claim:config.hidePartyAddress') {
          return true;
        }

        const translations: Record<string, string | boolean> = {
          'claim:witness.witnessName.firstNameLabel': 'First name',
          'claim:witness.witnessName.lastNameLabel': 'Last name',
          'claim:witness.contactDetails.phoneLabel': 'Phone',
          'claim:witness.contactDetails.emailLabel': 'Email',
          'claim:witness.contactDetails.addressLabel': 'Address',
          'claim:phone.defaultCountry': 'NZ'
        };

        return translations[key] ?? key;
      });

      renderComponent({
        claimType: ClaimType.Car
      });

      expect(mockAddressManual).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId('witnessAddressField1')
      ).not.toBeInTheDocument();
    });

    it('renders AddressManual for car claims when hidePartyAddress is false', () => {
      renderComponent({
        claimType: ClaimType.Car
      });

      expect(mockAddressManual).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('witnessAddressField1')
      ).toBeInTheDocument();
    });

    it('renders AddressManual for non-car claims even when hidePartyAddress is true', () => {
      mockT.mockImplementation((key: string) => {
        if (key === 'claim:config.hidePartyAddress') {
          return true;
        }

        const translations: Record<string, string | boolean> = {
          'claim:witness.witnessName.firstNameLabel': 'First name',
          'claim:witness.witnessName.lastNameLabel': 'Last name',
          'claim:witness.contactDetails.phoneLabel': 'Phone',
          'claim:witness.contactDetails.emailLabel': 'Email',
          'claim:witness.contactDetails.addressLabel': 'Address',
          'claim:phone.defaultCountry': 'NZ'
        };

        return translations[key] ?? key;
      });

      renderComponent({
        claimType: ClaimType.Car + 1 as ClaimType
      });

      expect(mockAddressManual).toHaveBeenCalledTimes(1);
    });
  });

  describe('witnessIndex', () => {
    it('uses witnessIndex in field ids and model paths', () => {
      renderComponent({
        witnessIndex: 3,
        witnessModelPath: 'claim.witnesses.3',
        witnessFormModelPath: 'forms.witnesses.3'
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'witnessFirstNameField3',
          model: 'claim.witnesses.3.firstName'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'witnessLastNameField3',
          model: 'claim.witnesses.3.lastName'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          id: 'witnessPhoneField3',
          model: 'claim.witnesses.3.phone'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          id: 'witnessEmailField3',
          model: 'claim.witnesses.3.email'
        })
      );

      expect(mockAddressManual).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'witnessAddressField3',
          fullPathModel: 'claim.witnesses.3.address',
          fullPathFormModel: 'forms.witnesses.3.address'
        })
      );
    });
  });
});