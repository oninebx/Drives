import { screen } from '@testing-library/dom';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { WitnessDetails } from './WitnessDetails';
import { ClaimType } from '../../../state';
import { getDefaultCommonAddressState } from '~/common/state';
import type { ApplicationState } from '~/root/rootReducer';
import { getDefaultWitnessState } from '~/feature/claim/car/state';

describe('WitnessDetails', () => {
  const props: React.ComponentProps<typeof WitnessDetails> = {
    witnessIndex: 0,
    witnessModelPath: 'myForms.carClaim.witnesses[0]',
    witnessFormModelPath: 'myForms.carClaim.witnesses[0]',
    witnessAddress: getDefaultCommonAddressState(),
    claimType: ClaimType.Car
  };

  const initialState = {
    myForms: {
      carClaim: {
        witnesses: [
          {
            ...getDefaultWitnessState()
          }
        ]
      }
    }
  } as Partial<ApplicationState>;

  it('should render correctly with default values', () => {
    renderComponent(<WitnessDetails {...props} />, { initialState });
    expect(screen.getByRole('heading', { level: 5, name: 'witness.witnessName.title' })).toBeInTheDocument();
    expect(screen.getByText('witness.witnessName.description')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'witness.witnessName.firstNameLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'witness.witnessName.lastNameLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'witness.contactDetails.addressLabel' })).toBeInTheDocument();
  });

  it('should hide address if claimType is car and hidePartyAddress is true', () => {
    const translationData = {
      'claim:config': {
        hidePartyAddress: true
      }
    };
    renderComponent(<WitnessDetails {...props} />, { translationData, initialState });
    expect(screen.queryByRole('textbox', { name: 'witness.contactDetails.addressLabel' })).not.toBeInTheDocument();
  });

  it('should show address if claimType is not car and hidePartyAddress is true', () => {
    const newProps = { ...props, claimType: ClaimType.House };
    const translationData = {
      'claim:config': {
        hidePartyAddress: true
      }
    };
    renderComponent(<WitnessDetails {...newProps} />, { translationData, initialState });
    expect(screen.getByRole('textbox', { name: 'witness.contactDetails.addressLabel' })).toBeInTheDocument();
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
    renderComponent(<WitnessDetails {...props} />, { translationData, initialState });
    expect(screen.getByRole('textbox', { name: 'witness.contactDetails.addressLabel' })).toBeInTheDocument();
  });
});
