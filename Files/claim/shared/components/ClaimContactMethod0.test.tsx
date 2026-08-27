import * as React from 'react';
import { render } from '@testing-library/react';

import {
  ClaimContactMethodComponent,
  ErrorMessage
} from './ClaimContactMethod';

const mockQuestion = jest.fn();
const mockMDRadioButton = jest.fn();
const mockMDTextField = jest.fn();
const mockErrors = jest.fn();

jest.mock('~/feature/claim/shared/components', () => ({
  Question: (props: unknown) => {
    mockQuestion(props);
    return <div data-testid="Question">{(props as { children?: React.ReactNode }).children}</div>;
  }
}));

jest.mock('~/common/components/smart', () => ({
  MDRadioButton: (props: unknown) => {
    mockMDRadioButton(props);
    return <div data-testid="MDRadioButton" />;
  },
  MDTextField: (props: unknown) => {
    mockMDTextField(props);
    return <div data-testid="MDTextField" />;
  }
}));

jest.mock('react-redux-form', () => ({
  Errors: (props: unknown) => {
    mockErrors(props);
    return <div data-testid="Errors" />;
  }
}));

jest.mock('~/common/utilities/translation', () => ({
  translate: () => (Component: React.ComponentType) => Component
}));

jest.mock('react-redux', () => ({
  connect: () => (Component: React.ComponentType) => Component
}));

jest.mock('~/feature/claim/shared/state', () => ({
  CLAIM_CONTACT_METHOD_EMAIL: 'email',
  CLAIM_CONTACT_METHOD_PHONE: 'phone',
  modelPath: 'claim',
  selectors: {
    isClaimContactMethodPhone: jest.fn(),
    isClaimContactMethodEmail: jest.fn()
  }
}));

describe('ClaimContactMethodComponent', () => {
  const t = jest.fn((key: string) => key);

  const renderComponent = ({
    phoneRequired = false,
    emailRequired = false
  }: {
    phoneRequired?: boolean;
    emailRequired?: boolean;
  } = {}) => {
    return render(
      <ClaimContactMethodComponent
        t={t}
        phoneRequired={phoneRequired}
        emailRequired={emailRequired}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Question', () => {
    it('renders contact method question with correct props', () => {
      renderComponent();

      expect(mockQuestion).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'questionContactMethod',
          model: 'claim.claimContact.contactMethod',
          translation: 'claim:claimContact.contactMethod'
        })
      );
    });

    it('renders contact details question with correct props', () => {
      renderComponent();

      expect(mockQuestion).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'questionContactDetails',
          model: 'claim',
          translation: 'claim:claimContact.contactDetails'
        })
      );
    });
  });

  describe('contact method radio button', () => {
    it('passes correct props to MDRadioButton', () => {
      renderComponent();

      expect(mockMDRadioButton).toHaveBeenCalledTimes(1);

      expect(mockMDRadioButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'contactMethod',
          model: 'claim.claimContact.contactMethod',
          options: [
            {
              value: 'email',
              label: 'claim:claimContact.contactMethod.email'
            },
            {
              value: 'phone',
              label: 'claim:claimContact.contactMethod.phone'
            }
          ]
        })
      );
    });
  });

  describe('phone field', () => {
    it('uses required phone label when phone is required', () => {
      renderComponent({
        phoneRequired: true
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'contactDetailsPhoneField',
          model: 'claim.claimContact.phone',
          placeholder: 'claim:claimContact.contactDetails.phoneLabel',
          label: 'claim:claimContact.contactDetails.phoneLabel',
          ariaLabel: 'claim:claimContact.contactDetails.phoneLabel',
          maxLength: 255,
          validateOn: 'change',
          isPhone: true,
          defaultCountry: 'claim:phone.defaultCountry'
        })
      );
    });

    it('uses optional phone label when phone is not required', () => {
      renderComponent({
        phoneRequired: false
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          placeholder: 'claim:claimContact.contactDetails.phoneOptionalLabel',
          label: 'claim:claimContact.contactDetails.phoneOptionalLabel',
          ariaLabel: 'claim:claimContact.contactDetails.phoneOptionalLabel'
        })
      );
    });

    it('passes phone validator to phone field', () => {
      renderComponent();

      const phoneFieldProps = mockMDTextField.mock.calls[0][0] as {
        otherValidators: {
          phoneValid: (value: string) => unknown;
        };
      };

      expect(phoneFieldProps.otherValidators.phoneValid('123456')).toBe(6);
      expect(phoneFieldProps.otherValidators.phoneValid('')).toBe('');
    });
  });

  describe('email field', () => {
    it('uses required email label when email is required', () => {
      renderComponent({
        emailRequired: true
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'contactDetailsEmailField',
          model: 'claim.claimContact.email',
          type: 'email',
          label: 'claim:claimContact.contactDetails.emailLabel',
          ariaLabel: 'claim:claimContact.contactDetails.emailLabel',
          maxLength: 255,
          validateOn: 'change',
          persist: true
        })
      );
    });

    it('uses optional email label when email is not required', () => {
      renderComponent({
        emailRequired: false
      });

      expect(mockMDTextField).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          label: 'claim:claimContact.contactDetails.emailOptionalLabel',
          ariaLabel: 'claim:claimContact.contactDetails.emailOptionalLabel'
        })
      );
    });

    it('passes email validator to email field', () => {
      renderComponent();

      const emailFieldProps = mockMDTextField.mock.calls[1][0] as {
        otherValidators: {
          emailValid: (value: string) => unknown;
        };
      };

      expect(emailFieldProps.otherValidators.emailValid('test@example.com')).toBe(16);
      expect(emailFieldProps.otherValidators.emailValid('')).toBe('');
    });
  });

  describe('validation errors', () => {
    it('renders phone error message when phone is required', () => {
      renderComponent({
        phoneRequired: true
      });

      expect(mockErrors).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claim.claimContact.phone'
        })
      );
    });

    it('does not render phone error message when phone is not required', () => {
      renderComponent({
        phoneRequired: false
      });

      expect(mockErrors).not.toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claim.claimContact.phone'
        })
      );
    });

    it('renders email error message when email is required', () => {
      renderComponent({
        emailRequired: true
      });

      expect(mockErrors).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claim.claimContact.email'
        })
      );
    });

    it('does not render email error message when email is not required', () => {
      renderComponent({
        emailRequired: false
      });

      expect(mockErrors).not.toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claim.claimContact.email'
        })
      );
    });

    it('renders both error messages when phone and email are required', () => {
      renderComponent({
        phoneRequired: true,
        emailRequired: true
      });

      expect(mockErrors).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ErrorMessage', () => {
  const t = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes correct props to Errors', () => {
    render(
      <ErrorMessage
        t={t}
        model="claim.claimContact.phone"
      />
    );

    expect(mockErrors).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'error-container',
        model: 'claim.claimContact.phone',
        messages: {
          phoneValid: 'errors.requiredField',
          emailValid: 'errors.requiredField'
        },
        show: 'touched'
      })
    );
  });
});