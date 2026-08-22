import { screen } from '@testing-library/react';
import * as React from 'react';
import { actions as formActions } from 'react-redux-form';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { testClaimCarState, testClaimState } from '~/feature/claim/shared/state/claimTestData';
import type { ApplicationState } from '~/root/rootReducer';
import { OtherPeopleDetail } from './OtherPeopleDetails';

describe('OtherPeopleDetails', () => {
  const initialState = {
    myForms: {
      carClaim: { ...testClaimCarState, otherPeopleDetails: [] },
      sharedClaim: testClaimState
    }
  } as Partial<ApplicationState>;

  it('should render correctly without other people', () => {
    renderComponent(<OtherPeopleDetail />, { initialState });

    expect(screen.queryByText('otherPeopleDetails.otherDetails.title')).toBeInTheDocument();
    expect(screen.queryByText('otherPeopleDetails.otherDetails.description')).toBeInTheDocument();
    expect(screen.queryByText('addDetailsOrSkip.yes')).toBeInTheDocument();
    expect(screen.queryByText('addDetailsOrSkip.no')).toBeInTheDocument();
  });

  it('should render correctly with other people', () => {
    renderComponent(<OtherPeopleDetail />, {
      initialState,
      onBeforeRender({ store }) {
        store.dispatch(formActions.change('myForms.carClaim.otherPeopleDetails', testClaimCarState.otherPeopleDetails));
      }
    });

    expect(screen.getByLabelText('otherPeopleDetails.contactDetails.firstNameLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('otherPeopleDetails.contactDetails.lastNameLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('otherPeopleDetails.contactDetails.phoneLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('otherPeopleDetails.contactDetails.emailLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('otherPeopleDetails.contactDetails.addressLabel')).toBeInTheDocument();
    expect(screen.queryByText('Having trouble finding your address?')).toBeInTheDocument();
    expect(screen.queryByText('Enter it manually')).toBeInTheDocument();
  });
});
