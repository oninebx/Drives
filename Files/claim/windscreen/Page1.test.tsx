import { screen } from '@testing-library/react';
import * as React from 'react';
import type { Customer } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import * as localeUtils from '~/common/utilities/localeUtils';
import type { ApplicationState } from '~/root/rootReducer';
import { testClaimWindscreen } from '../../shared/state/claimTestData';
import { Page1 } from './Page1';

describe('Page 1', () => {
  jest.spyOn(localeUtils, 'getPhoneNumberRules').mockReturnValue({
    nz: {
      dialingCode: '0064',
      maxLength: 10,
      minLength: 8
    }
  });
  const props: React.ComponentProps<typeof Page1> = {};

  const initialState = {
    common: {
      customer: {
        firstName: 'Al',
        lastName: 'M',
        dateOfBirth: '1990-01-13',
        gender: 'male',
        emails: [
          {
            emailAddress: 'alex.mckerrow17@tower.co.nz',
            isPreferred: true,
            isLogin: true
          }
        ],
        phones: [
          {
            id: '11010858991',
            phoneNumber: '0064123456789',
            phoneCountryCd: 'NZ',
            isPreferred: false
          }
        ]
      } as Partial<Customer>
    },
    myForms: {
      windscreenClaim: testClaimWindscreen
    }
  } as ApplicationState;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show damage glass question only at default', () => {
    const damageGlassTranslation = {
      'claim/windscreen:damageGlass': {
        title: 'What window is cracked or broken?',
        labels: {
          windscreen: 'Windscreen',
          window: 'Window glass'
        }
      }
    };

    renderComponent(<Page1 {...props} />, { translationData: damageGlassTranslation });

    expect(screen.queryByText('What window is cracked or broken?')).toBeInTheDocument();
    expect(screen.queryByText('Windscreen')).toBeInTheDocument();
    expect(screen.queryByText('Window glass')).toBeInTheDocument();
  });

  it('should show damage windscreen side question if damage glass is in windscreen', () => {
    const damageGlassTranslation = {
      'claim/windscreen:damageGlass': {
        title: 'What window is cracked or broken?',
        labels: {
          windscreen: 'Windscreen',
          window: 'Window glass'
        }
      },
      'claim/windscreen:damageWindscreenSide': {
        title: 'Which windscreen is cracked or broken?',
        labels: {
          front: 'Front',
          rear: 'Rear'
        }
      },
      'claim/windscreen:damageSize': {
        title:
          "How big is the chip or crack? If you're claiming for more than one, let us know the size of the biggest.",
        values: {
          largerThan20c: 'Larger than 20 cents/20mm',
          smallerThan20c: 'Smaller than 20 cents/20mm'
        }
      }
    };

    renderComponent(<Page1 {...props} />, {
      initialState: initialState,
      translationData: damageGlassTranslation
    });

    const checkBoxWindscreen = screen.getByLabelText('Windscreen');
    checkBoxWindscreen.click();

    expect(screen.queryByText('Which windscreen is cracked or broken?')).toBeInTheDocument();
    expect(screen.queryByText('Front')).toBeInTheDocument();
    expect(screen.queryByText('Rear')).toBeInTheDocument();
    expect(
      screen.queryByText(
        "How big is the chip or crack? If you're claiming for more than one, let us know the size of the biggest."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Larger than 20 cents/20mm')).toBeInTheDocument();
    expect(screen.queryByText('Smaller than 20 cents/20mm')).toBeInTheDocument();
  });

  it('should show damage window side question if damage glass is in window', () => {
    const damageGlassTranslation = {
      'claim/windscreen:damageGlass': {
        title: 'What window is cracked or broken?',
        labels: {
          windscreen: 'Windscreen',
          window: 'Window glass'
        }
      },
      'claim/windscreen:damageWindowSide': {
        title: 'Which side of your car is the damage on?',
        labels: {
          driver: 'Driver side',
          passenger: 'Passenger side'
        }
      }
    };

    renderComponent(<Page1 {...props} />, {
      initialState: initialState,
      translationData: damageGlassTranslation
    });

    const checkBoxWindow = screen.getByLabelText('Window glass');
    checkBoxWindow.click();

    expect(screen.queryByText('Which side of your car is the damage on?')).toBeInTheDocument();
    expect(screen.queryByText('Driver side')).toBeInTheDocument();
    expect(screen.queryByText('Passenger side')).toBeInTheDocument();
  });
});
