import * as React from 'react';
import { render, screen } from '@testing-library/react';

import {
  PersonalDetailsComponent,
  type PersonalDetailsProps
} from './PersonalDetails';

import type { AddressState } from '~/common/state';

// ------------------------------------------------------------
// Mocks
// ------------------------------------------------------------

const defaultTranslations: Record<string, string | boolean> = {
  'claim:config.hidePartyAddress': false,

  'claim:personalDetails.contactDetails.firstNameLabel': 'First name',
  'claim:personalDetails.contactDetails.lastNameLabel': 'Last name',
  'claim:personalDetails.contactDetails.phoneLabel': 'Phone',
  'claim:personalDetails.contactDetails.emailLabel': 'Email',
  'claim:personalDetails.contactDetails.addressLabel': 'Address',

  'claim:phone.defaultCountry': 'NZ'
};

const mockT = jest.fn(
  (key: string): string | boolean =>
    defaultTranslations[key] ?? key
);

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

const addressState = {
  addressLine1: '123 Test Street',
  addressLine2: '',
  suburb: 'Auckland',
  city: 'Auckland',
  postcode: '1010',
  country: 'NZ'
} as AddressState;

const defaultProps: PersonalDetailsProps = {
  t: mockT,
  index: 1,
  modelPath: 'claim.personalDetails.1',
  formModelPath: 'forms.personalDetails.1',
  addressState,
  idPrefixString: 'personalDetails',
  translationPathString: 'claim:personalDetails',
  isOptional: false
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const renderComponent = (
  props: Partial<PersonalDetailsProps> = {}
) =>
  render(
    <PersonalDetailsComponent
      {...defaultProps}
      {...props}
    />
  );

// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('PersonalDetailsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockT.mockImplementation(
      (key: string): string | boolean =>
        defaultTranslations[key] ?? key
    );
  });

  describe('rendering', () => {
    it('renders name and contact detail questions', () => {
      renderComponent();

      expect(screen.getByTestId('Question')).toBeInTheDocument();

      expect(mockQuestion).toHaveBeenCalledTimes(2);

      expect(mockQuestion).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'personalDetailsName1',
          model: 'claim.personalDetails.1',
          translation: 'claim:personalDetails.nameTitle'
        })
      );

      expect(mockQuestion).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'personalDetailsContactFieldQuestions1',
          model: 'claim.personalDetails.1',
          translation: 'claim:personalDetails.contactDetails'
        })
      );
    });

    it('renders all personal detail fields', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenCalledTimes(4);
      expect(mockAddressManual).toHaveBeenCalledTimes(1);

      expect(
        screen.getByTestId('personalDetailsFirstNameField1')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('personalDetailsLastNameField1')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('personalDetailsPhoneField1')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('personalDetailsEmailField1')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('personalDetailsAddressField1')
      ).toBeInTheDocument();
    });
  });

  describe('MDTextField', () => {
    it('passes the correct props to name fields', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'personalDetailsFirstNameField1',
          model: 'claim.personalDetails.1.firstName',
          label: 'First name',
          ariaLabel: 'First name',
          maxLength: 255,
          validateOn: 'change'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'personalDetailsLastNameField1',
          model: 'claim.personalDetails.1.lastName',
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
          id: 'personalDetailsPhoneField1',
          model: 'claim.personalDetails.1.phone',
          label: 'Phone',
          ariaLabel: 'Phone',
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
          id: 'personalDetailsEmailField1',
          model: 'claim.personalDetails.1.email',
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
          id: 'personalDetailsAddressField1',
          fullPathModel: 'claim.personalDetails.1.address',
          fullPathFormModel: 'forms.personalDetails.1.address',
          addressState,
          label: 'Address',
          ariaLabel: 'Address',
          isOptional: false
        })
      );
    });

    it('does not render AddressManual when hidePartyAddress is true', () => {
      mockT.mockImplementation(
        (key: string): string | boolean => {
          if (key === 'claim:config.hidePartyAddress') {
            return true;
          }

          return defaultTranslations[key] ?? key;
        }
      );

      renderComponent();

      expect(mockAddressManual).not.toHaveBeenCalled();

      expect(
        screen.queryByTestId('personalDetailsAddressField1')
      ).not.toBeInTheDocument();
    });

    it('renders AddressManual when hidePartyAddress is false', () => {
      renderComponent();

      expect(mockAddressManual).toHaveBeenCalledTimes(1);

      expect(
        screen.getByTestId('personalDetailsAddressField1')
      ).toBeInTheDocument();
    });

    it('passes isOptional to AddressManual', () => {
      renderComponent({
        isOptional: true
      });

      expect(mockAddressManual).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'personalDetailsAddressField1',
          isOptional: true
        })
      );
    });
  });

  describe('index', () => {
    it('uses index in field ids and model paths', () => {
      renderComponent({
        index: 3,
        modelPath: 'claim.personalDetails.3',
        formModelPath: 'forms.personalDetails.3'
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'personalDetailsFirstNameField3',
          model: 'claim.personalDetails.3.firstName'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'personalDetailsLastNameField3',
          model: 'claim.personalDetails.3.lastName'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          id: 'personalDetailsPhoneField3',
          model: 'claim.personalDetails.3.phone'
        })
      );

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          id: 'personalDetailsEmailField3',
          model: 'claim.personalDetails.3.email'
        })
      );

      expect(mockAddressManual).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'personalDetailsAddressField3',
          fullPathModel: 'claim.personalDetails.3.address',
          fullPathFormModel: 'forms.personalDetails.3.address'
        })
      );
    });
  });
});
