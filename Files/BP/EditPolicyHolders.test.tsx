import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { testCustomerState } from '~/feature/claim/shared/state/claimTestData';
import type { ApplicationState } from '~/root/rootReducer';
import EditPolicyHolders from './EditPolicyHolders';
import userEvent from '@testing-library/user-event';
import { raiseFieldGAEvent } from '~/common/utilities';

jest.mock('~/common/utilities', () => {
  return {
    ...jest.requireActual('~/common/utilities'),
    raiseFieldGAEvent: jest.fn()
  };
});

describe('EditPolicyHolder', () => {
  const translationData = {
    'portal:editCurrentPolicyHolder': {
      dropDownComponent: {
        reasonTitle: 'Reason for the change(Optional)',
        pleaseSelect: 'Please Select',
        reasons: [
          'Marriage',
          'Divorce',
          'Legal name change',
          'Correction of spelling or typo',
          'Gender affirmation',
          "I don't want to mention",
          'Other, please specify'
        ]
      },
      otherSpecify: 'Other, please specify',
      button: {
        next: 'Next',
        cancel: 'Cancel'
      },
      updateAccount: {
        message: 'To update your contact details please go to ',
        linkText: 'Account details'
      },
      policyHolderMessage: {
        message1:
          "Your name will update across all your Tower policies. If you need to change a policy holder to a business or trust account, you can't do this online. Give us a call on ",
        message2: " and we'll help.",
        message3:
          "We'll review your update within three working days.If we need to get in touch, it might take a little longer to make changes."
      },
      dateOfBirth: {
        errors: {
          dobTouched:
            "If the change to your date of birth impacts your cover, add-ons or premium, we'll get in touch to chat about what it means for you."
        }
      },
      descriptionbox: {
        label: 'Your Message',
        placeHolder: 'Your Message here'
      }
    }
  };
  const initialState = {
    common: {
      customer: testCustomerState
    }
  } as Partial<ApplicationState>;
  const onBackAction = jest.fn();
  const onNext = jest.fn();
  const isCurrentDOBEmpty = jest.fn().mockReturnValue(false);
  const isFieldEdited = jest.fn().mockReturnValue(false);
  const initialProps = {
    base: 'myForms.change',
    current: {
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1975-01-01',
      reasonForChange: 'Marriage'
    },
    isDirty: false,
    onChange: jest.fn(),
    onNext: onNext,
    onCancel: jest.fn(),
    isFieldEdited: isFieldEdited,
    isCurrentDOBEmpty: isCurrentDOBEmpty,
    onBackAction: onBackAction,
    reasonForChangeValue: 'Marriage'
  };

  it('should enable the edit button when first name got changed', async () => {
    renderComponent(<EditPolicyHolders {...initialProps} />, { initialState, translationData });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
    const firstNameInput = screen.getByRole('textbox', { name: 'changes.policyholder.current.firstName' });
    userEvent.clear(firstNameInput);
    userEvent.type(firstNameInput, 'Johnny');
    expect(nextButton).toBeEnabled();
  });

  it('should show warning when dob is changed', async () => {
    const props = {
      ...initialProps,
      isDirty: true,
      isFieldEdited: jest.fn().mockReturnValue(false),
      isCurrentDOBEmpty: jest.fn().mockReturnValue(false)
    };
    renderComponent(<EditPolicyHolders {...props} />, { initialState, translationData });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
    const dobInput = screen.getByLabelText('DD');
    userEvent.clear(dobInput);
    userEvent.type(dobInput, '05');
    const dobInputMonth = screen.getByLabelText('MM');
    userEvent.clear(dobInputMonth);
    userEvent.type(dobInputMonth, '05');
    const dobInputYear = screen.getByLabelText('YYYY');
    userEvent.clear(dobInputYear);
    userEvent.type(dobInputYear, '1989');
    const warningText = translationData['portal:editCurrentPolicyHolder'].dateOfBirth.errors.dobTouched;
    expect(await screen.findByText(warningText)).toBeInTheDocument();
  });

  it('should show textarea when drop down value is changed', async () => {
    const state = {
      ...initialState,
      myForms: {
        change: {
          policyHolders: {
            editPolicyHolder: {
              reasonForChange: 'Other, please specify'
            }
          }
        }
      }
    };
    renderComponent(<EditPolicyHolders {...initialProps} />, { initialState: state, translationData });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
    const dropDownInput = screen.getByRole('button', { name: /Please Select/i });
    await userEvent.click(dropDownInput);

    screen.debug(undefined, Infinity);
    const option = await screen.findByLabelText(/Other, please specify/i);
    await fireEvent.click(option);
    const placeHolder = translationData['portal:editCurrentPolicyHolder'].descriptionbox.placeHolder;
    expect(await screen.findByPlaceholderText(placeHolder)).toBeInTheDocument();
  });

  it('should have Cancel Button and go back to policy page', async () => {
    renderComponent(<EditPolicyHolders {...initialProps} />, { initialState, translationData });
    const backButton = screen.getByRole('button', { name: /cancel/i });
    expect(backButton).toBeInTheDocument();
    userEvent.click(backButton);
    waitFor(() => {
      expect(onBackAction).toBeCalledWith('/portal/policy/123');
      expect(raiseFieldGAEvent).toHaveBeenCalledWith('last_field_interacted', 'button', 'editPolicyHolderCancel');
    });
  });
});
