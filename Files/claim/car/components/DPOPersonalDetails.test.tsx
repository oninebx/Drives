import { screen } from '@testing-library/dom';
import * as React from 'react';
import { getDefaultCommonAddressState } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { getDefaultOtherPropertyState } from '~/feature/claim/car/state';
import type { ApplicationState } from '~/root/rootReducer';
import DPOPersonalDetails from './DPOPersonalDetails';

describe('DPOPersonalDetails', () => {
  const props: React.ComponentProps<typeof DPOPersonalDetails> = {
    index: 0,
    modelPath: `myForms.carClaim.otherPropertyDamages[0]`,
    formModelPath: `myForms.carClaim.otherPropertyDamages[0]`,
    isBusiness: false,
    addressState: getDefaultCommonAddressState()
  };

  const initialState = {
    myForms: {
      carClaim: {
        otherPropertyDamages: [
          {
            ...getDefaultOtherPropertyState()
          }
        ]
      }
    }
  } as Partial<ApplicationState>;
  it('should render correctly with default values', () => {
    renderComponent(<DPOPersonalDetails {...props} />, { initialState });
    expect(screen.getByRole('textbox', { name: 'otherPropertyDamage.ownerName.firstNameLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'otherPropertyDamage.ownerName.lastNameLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'otherPropertyDamage.contactDetails.phoneLabel' })).toBeInTheDocument();
  });

  it('should have private owner specific translation for owner name if not business', () => {
    renderComponent(<DPOPersonalDetails {...props} />, { initialState });
    expect(
      screen.getByRole('heading', { level: 5, name: 'otherPropertyDamage.privateOwnerName.title' })
    ).toBeInTheDocument();
    expect(screen.getByText('otherPropertyDamage.privateOwnerName.description')).toBeInTheDocument();
  });

  it('should have business specific translation for owner name if business', () => {
    const newProps = {
      ...props,
      isBusiness: true
    };
    renderComponent(<DPOPersonalDetails {...newProps} />, { initialState });
    expect(
      screen.getByRole('heading', { level: 5, name: 'otherPropertyDamage.businessName.title' })
    ).toBeInTheDocument();
    expect(screen.getByText('otherPropertyDamage.businessName.description')).toBeInTheDocument();
  });

  it('should hide address if hidePartyAddress is true', () => {
    const translationData = {
      'claim:config': {
        hidePartyAddress: true
      }
    };
    renderComponent(<DPOPersonalDetails {...props} />, { initialState, translationData });
    expect(screen.queryByText('Street number')).not.toBeInTheDocument();
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
    renderComponent(<DPOPersonalDetails {...props} />, { initialState, translationData });
    expect(screen.getByText('Having trouble finding your address?')).toBeInTheDocument();
  });
});
