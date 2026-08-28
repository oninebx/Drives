import { screen } from '@testing-library/dom';
import * as React from 'react';
import { getDefaultCommonAddressState } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { getDefaultOtherPropertyState } from '~/feature/claim/car/state';
import type { ApplicationState } from '~/root/rootReducer';
import type { PropertyDamageDetailsProps } from './PropertyDamageDetails';
import PropertyDamageDetails from './PropertyDamageDetails';

describe('PropertyDamageDetails', () => {
  const props: PropertyDamageDetailsProps = {
    t: jest.fn(),
    modelPath: 'myForms.carClaim.otherPropertyDamages[0]',
    formModelPath: 'myForms.carClaim.otherPropertyDamages[0]',
    addressState: getDefaultCommonAddressState(),
    index: 0
  };

  const initialState = {
    myForms: {
      carClaim: {
        otherPropertyDamages: [getDefaultOtherPropertyState()]
      }
    }
  } as Partial<ApplicationState>;
  it('should render correctly with default values when the propertyType is not a vehicle', () => {
    renderComponent(<PropertyDamageDetails {...props} />, { initialState });
    expect(
      screen.getByRole('heading', { level: 3, name: 'otherPropertyDamage.damageSubType.title' })
    ).toBeInTheDocument();
    expect(screen.getByText('otherPropertyDamage.damageSubType.description')).toBeInTheDocument();
    expect(screen.getByText('otherPropertyDamage.damageSubType.labels.property')).toBeInTheDocument();
    expect(screen.getByText('otherPropertyDamage.damageSubType.labels.contents')).toBeInTheDocument();
  });

  it('should not have DPOPersonalDetails if know owner is not true', () => {
    renderComponent(<PropertyDamageDetails {...props} />, { initialState });
    expect(
      screen.queryByRole('textbox', { name: 'otherPropertyDamage.ownerName.firstNameLabel' })
    ).not.toBeInTheDocument();
  });

  it('should have DPOPersonalDetails if know owner is true', () => {
    const newState = {
      myForms: {
        carClaim: {
          otherPropertyDamages: [
            {
              ...getDefaultOtherPropertyState(),
              knowPropertyOwner: true,
              address: getDefaultCommonAddressState(),
              driverDetails: {
                address: getDefaultCommonAddressState()
              }
            }
          ]
        }
      }
    } as Partial<ApplicationState>;
    renderComponent(<PropertyDamageDetails {...props} />, { initialState: newState });
    expect(screen.getByRole('textbox', { name: 'otherPropertyDamage.ownerName.firstNameLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'otherPropertyDamage.ownerName.lastNameLabel' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'otherPropertyDamage.contactDetails.phoneLabel' })).toBeInTheDocument();
  });
});
