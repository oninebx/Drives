import { screen } from '@testing-library/dom';
import * as React from 'react';
import { getDefaultCommonAddressState } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { ClaimType } from '~/feature/claim/shared/state';
import type { ApplicationState } from '~/root/rootReducer';
import { OtherDrivers } from './OtherDrivers';

describe('OtherDrivers', () => {
  it('should render correctly with default values', () => {
    renderComponent(<OtherDrivers />);
    expect(screen.getByRole('heading', { level: 5, name: 'otherDrivers.title' })).toBeInTheDocument();
    expect(screen.getByText('otherDrivers.description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'addDetailsOrSkip.yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'addDetailsOrSkip.no' })).toBeInTheDocument();
  });

  it('should render with otherDrivers', () => {
    const initialState = {
      myForms: {
        carClaim: {
          vehicleMakes: [],
          otherDrivers: [
            {
              address: getDefaultCommonAddressState(),
              rego: 'PRN275',
              make: 'Toyota',
              model: 'Aqua'
            }
          ]
        },
        sharedClaim: {
          claimType: ClaimType.Car
        }
      }
    } as Partial<ApplicationState>;
    renderComponent(<OtherDrivers />, { initialState });
    expect(screen.getByText("I'd like to add another driver or vehicle")).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Other driver/vehicle 1' })).toBeInTheDocument();
    expect(screen.getByText('otherDrivers.name.title')).toBeInTheDocument();
    expect(screen.getByText('otherDrivers.name.description')).toBeInTheDocument();
  });
});
