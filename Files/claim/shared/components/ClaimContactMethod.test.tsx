import { screen } from '@testing-library/dom';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ClaimContactMethodProps } from '~/feature/claim/shared/components/dumb';
import { ClaimContactMethod } from '~/feature/claim/shared/components/dumb';
import type { ApplicationState } from '~/root/rootReducer';
import { testClaimContact } from '../../../state/claimTestData';

describe('ClaimContactMethodComponent', () => {
  const props: ClaimContactMethodProps = {
    t: jest.fn()
  };

  const setInitialStateRequiredField = (requiredField: string) => {
    const initialState = {
      myForms: {
        sharedClaim: {
          claimContact: {
            ...testClaimContact,
            phone: null,
            email: null,
            contactMethod: requiredField
          }
        }
      }
    } as Partial<ApplicationState>;
    return initialState;
  };

  it('should render correctly with default values', () => {
    renderComponent(<ClaimContactMethod {...props} />);
    expect(screen.getByRole('heading', { level: 5, name: 'claimContact.contactMethod.title' })).toBeInTheDocument();
    expect(screen.getByText('claimContact.contactMethod.description')).toBeInTheDocument();
    expect(screen.getByText('claimContact.contactMethod.email')).toBeInTheDocument();
    expect(screen.getByText('claimContact.contactMethod.phone')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: 'claimContact.contactDetails.title' })).toBeInTheDocument();
    expect(screen.getByText('claimContact.contactDetails.description')).toBeInTheDocument();
  });

  it('should render the two input fields if they are not required', () => {
    renderComponent(<ClaimContactMethod {...props} />);
    expect(screen.getByRole('textbox', { name: 'claimContact.contactDetails.phoneOptionalLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'claimContact.contactDetails.emailOptionalLabel' })).toBeInTheDocument();
  });

  it('should have the required email if emailRequired is true', () => {
    renderComponent(<ClaimContactMethod {...props} />, { initialState: setInitialStateRequiredField('email') });
    expect(screen.getByRole('textbox', { name: 'claimContact.contactDetails.emailLabel' })).toBeInTheDocument();
  });

  it('should have the required phone if phoneRequired is true', () => {
    renderComponent(<ClaimContactMethod {...props} />, { initialState: setInitialStateRequiredField('phone') });
    expect(screen.getByRole('textbox', { name: 'claimContact.contactDetails.phoneLabel' })).toBeInTheDocument();
  });
});
