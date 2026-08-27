import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { PersonalDetailsComponent } from './PersonalDetails';

jest.mock('~/common/components/smart', () => ({
  MDTextField: ({ id }: { id: string }) => (
    <div data-testid={`MDTextField-${id}`} />
  ),
  AddressManual: ({ id }: { id: string }) => (
    <div data-testid={`AddressManual-${id}`} />
  )
}));

jest.mock('~/feature/claim/shared/components', () => ({
  Question: ({
    id,
    children
  }: {
    id: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`Question-${id}`}>
      {children}
    </div>
  )
}));

describe('PersonalDetailsComponent', () => {
  const defaultProps = {
    t: jest.fn((key: string) => {
      if (key === 'claim:config.hidePartyAddress') {
        return false;
      }

      return key;
    }),
    index: 1,
    modelPath: 'claim.personalDetails[1]',
    formModelPath: 'form.claim.personalDetails[1]',
    addressState: {} as never,
    idPrefixString: 'personalDetails',
    translationPathString: 'claim:personalDetails',
    isOptional: false
  };

  const renderComponent = (
    props: Partial<typeof defaultProps> = {}
  ) => {
    return render(
      <PersonalDetailsComponent
        {...defaultProps}
        {...props}
      />
    );
  };

  it('renders the name Question', () => {
    renderComponent();

    expect(
      screen.getByTestId('Question-personalDetailsName1')
    ).toBeInTheDocument();
  });

  it('renders the contact details Question', () => {
    renderComponent();

    expect(
      screen.getByTestId(
        'Question-personalDetailsContactFieldQuestions1'
      )
    ).toBeInTheDocument();
  });

  it('renders the first name field', () => {
    renderComponent();

    expect(
      screen.getByTestId(
        'MDTextField-personalDetailsFirstNameField1'
      )
    ).toBeInTheDocument();
  });

  it('renders the last name field', () => {
    renderComponent();

    expect(
      screen.getByTestId(
        'MDTextField-personalDetailsLastNameField1'
      )
    ).toBeInTheDocument();
  });

  it('renders the phone field', () => {
    renderComponent();

    expect(
      screen.getByTestId(
        'MDTextField-personalDetailsPhoneField1'
      )
    ).toBeInTheDocument();
  });

  it('renders the email field', () => {
    renderComponent();

    expect(
      screen.getByTestId(
        'MDTextField-personalDetailsEmailField1'
      )
    ).toBeInTheDocument();
  });

  it('renders AddressManual when hidePartyAddress is false', () => {
    renderComponent();

    expect(
      screen.getByTestId(
        'AddressManual-personalDetailsAddressField1'
      )
    ).toBeInTheDocument();
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
        'AddressManual-personalDetailsAddressField1'
      )
    ).not.toBeInTheDocument();
  });
});