import { screen } from '@testing-library/dom';
import * as React from 'react';
import { getDefaultCommonAddressState } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationState } from '~/root/rootReducer';
import { testPersonalDetails } from '../../../state/claimTestData';
import PersonalDetails from './PersonalDetails';

describe('PersonalDetails', () => {
  const props: React.ComponentProps<typeof PersonalDetails> = {
    index: 0,
    modelPath: 'myForms.carClaim.otherPeopleDetails[0]',
    formModelPath: 'myForms.carClaim.otherPeopleDetails[0]',
    addressState: getDefaultCommonAddressState(),
    idPrefixString: 'otherPeopleDetailsOptional',
    translationPathString: 'otherPeopleDetails'
  };

  const initialState = {
    myForms: {
      carClaim: {
        otherPeopleDetails: testPersonalDetails
      }
    }
  } as Partial<ApplicationState>;

  it('should render correctly with default values', () => {
    renderComponent(<PersonalDetails {...props} />, { initialState });
    expect(screen.getByRole('heading', { level: 5, name: 'otherPeopleDetails.nameTitle.title' })).toBeInTheDocument();
    expect(screen.getByText('otherPeopleDetails.nameTitle.description')).toBeInTheDocument();
    expect(screen.getByText('otherPeopleDetails.contactDetails.firstNameLabel')).toBeInTheDocument();
    expect(screen.getByText('otherPeopleDetails.contactDetails.lastNameLabel')).toBeInTheDocument();
    expect(screen.getByText('otherPeopleDetails.contactDetails.emailLabel')).toBeInTheDocument();
    expect(screen.getByText('otherPeopleDetails.contactDetails.addressLabel')).toBeInTheDocument();
  });

  it('should hide address if hidePartyAddress is true', () => {
    const translationData = {
      'claim:config': {
        hidePartyAddress: true
      }
    };
    renderComponent(<PersonalDetails {...props} />, { initialState, translationData });
    expect(
      screen.queryByRole('textbox', { name: 'otherPeopleDetails.contactDetails.addressLabel' })
    ).not.toBeInTheDocument();
  });

  it('should show address if hidePartyAddress is false', () => {
    const translationData = {
      'base:config': {
        useAddressSearch: true
      },
      'claim:config': {
        hidePartyAddress: false
      }
    };
    renderComponent(<PersonalDetails {...props} />, { initialState, translationData });
    expect(screen.getByRole('textbox', { name: 'otherPeopleDetails.contactDetails.addressLabel' })).toBeInTheDocument();
  });
});
