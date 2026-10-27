import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { useLocation } from 'react-router';
import { initialApplicationState } from '~/common/__mocks__/data/initialApplicationState';
import { getDefaultCommonState } from '~/common/state';
import type { GetActiveCampaignsResponse } from '~/common/state/autorest/Campaigns/src';
import type { GetAgencyCodeResponse } from '~/common/state/autorest/Partner/src';
import * as selectors from '~/common/state/selectors';
import { campaignsService, contentTestimonialsService, partnerService, productService } from '~/common/state/services';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { getDefaultQuoteSharedState } from '~/feature/quote/shared/state';
import { BundleBuilderLoginType } from '~/feature/quote/state';
import type { ApplicationState } from '~/root/rootReducer';
import { BundleBuilderContainer } from './BundleBuilder';

jest.mock('~/feature/quote/shared/components/dumb/PromoBanner/promoImages', () => ({
  promoImages: (path: string): string => path
}));

jest.mock('~/common/state/selectors.ts', () => {
  return {
    ...jest.requireActual('~/common/state/selectors.ts'),
    promoCodesEnabled: () => true,
    isBrand: jest.fn(),
    isCustomerStaff: jest.fn().mockReturnValue(false)
  };
});

const mockIsBrand = selectors.isBrand as jest.Mock;

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn()
}));

describe('BundleBuilder', () => {
  jest.spyOn(productService, 'getTypes').mockImplementation(async () => []);

  const mockGetAgencyResponse: GetAgencyCodeResponse = {
    agencyCode: 'westpac_main'
  };
  jest.spyOn(partnerService, 'getAgencyCode').mockImplementation(async () => mockGetAgencyResponse);

  it('should test query string containing house and contents preselects the form appropriately', () => {
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });

    const { store } = renderComponent(<BundleBuilderContainer />);

    expect(store.getState().quote.houses.length).toEqual(1);
    expect(store.getState().quote.contents.length).toEqual(1);
  });

  it('should keep memberDiscount null if values not provided', () => {
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });
    const { store } = renderComponent(<BundleBuilderContainer />, {
      translationData: {
        'quote:memberDiscount': {
          title: '',
          description: '',
          tooltip: ''
        }
      }
    });

    expect(store.getState().myForms.sharedQuote.memberDiscount).toBe(null);
  });

  it('should return active promo code', async () => {
    const mockResponse: GetActiveCampaignsResponse = {
      body: 'SAVE100'
    };
    jest
      .spyOn(campaignsService, 'getActiveCampaigns')
      .mockImplementationOnce((_XBrandId, { onResponse }): Promise<GetActiveCampaignsResponse> => {
        onResponse(
          {
            status: 200,
            bodyAsText: 'SAVE100',
            request: undefined,
            headers: undefined
          },
          null
        );
        return Promise.resolve(mockResponse);
      });
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });
    const initialState = {
      common: {
        agency: {
          promotionVisibility: {
            campaigns: true
          }
        },
        customer: {
          promotionVisibility: {
            campaigns: true
          }
        }
      },
      myForms: {
        sharedQuote: {
          ...getDefaultQuoteSharedState()
        }
      }
    } as ApplicationState;

    renderComponent(<BundleBuilderContainer />, {
      initialState,
      translationData: {
        'quote:config': {
          showBundleBuilderBanner: true
        },
        'base:config': {
          CampaignsAllowed: true
        },
        'promo:promoCodeCampaign_save100': 'SAVE100'
      }
    });

    await waitFor(async () => {
      expect(screen.getByText('bundleBuilderBannerCampaign_save100.heading1')).toBeInTheDocument();
    });
  });

  it('should return active no promocode campaign', async () => {
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });
    const initialState = {
      flags: {
        'campaign-nopromocode': true
      },
      common: {
        agency: {
          promotionVisibility: {
            campaigns: true
          }
        },
        customer: {
          promotionVisibility: {
            campaigns: true
          }
        }
      },
      myForms: {
        sharedQuote: {
          ...getDefaultQuoteSharedState()
        }
      }
    } as ApplicationState;

    const translationData = {
      'quote:config': {
        showBundleBuilderBanner: true
      },
      'base:config': {
        CampaignsAllowed: true
      }
    };

    renderComponent(<BundleBuilderContainer />, {
      initialState,
      translationData
    });

    await waitFor(async () => {
      expect(screen.getByText('bundleBuilderBannerCampaign_nopromocode.heading1')).toBeInTheDocument();
    });
  });

  it('should render Westpac campaign bundle builder banner when westpac config is enabled', async () => {
    const mockResponse: GetActiveCampaignsResponse = {
      body: 'WEGOTYOU'
    };

    jest
      .spyOn(campaignsService, 'getActiveCampaigns')
      .mockImplementationOnce((_XBrandId, { onResponse }): Promise<GetActiveCampaignsResponse> => {
        onResponse(
          {
            status: 200,
            bodyAsText: 'WEGOTYOU',
            request: undefined,
            headers: undefined
          },
          null
        );
        return Promise.resolve(mockResponse);
      });

    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });

    const initialState = {
      common: {
        agency: {
          promotionVisibility: {
            campaigns: true
          }
        },
        customer: {
          promotionVisibility: {
            campaigns: true
          }
        }
      },
      myForms: {
        sharedQuote: {
          ...getDefaultQuoteSharedState()
        }
      }
    } as ApplicationState;

    renderComponent(<BundleBuilderContainer />, {
      initialState,
      translationData: {
        'quote:config': {
          showBundleBuilderBanner: true
        },
        'base:config': {
          CampaignsAllowed: true
        },
        'promo:promoCodeCampaign_wegotyou': 'WEGOTYOU',
        'promo:bundleBuilderBannerCampaign_wegotyou': {
          heading2: 'westpac heading 2',
          linkAltText: 'westpac link',
          linkUrl: 'https://www.tower.co.nz'
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByText('westpac heading 2')).toBeInTheDocument();
    });
  });

  it('should set memberDiscount true if values provided', () => {
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });
    const { store } = renderComponent(<BundleBuilderContainer />, {
      translationData: {
        'quote:memberDiscount': {
          title: 'Title',
          description: 'Description',
          tooltip: 'Tooltip'
        }
      }
    });

    expect(store.getState().myForms.sharedQuote.memberDiscount).toBe(true);
  });

  it('should render title', () => {
    renderComponent(<BundleBuilderContainer />, {
      translationData: {
        'quote:chooseProducts': {
          title: 'Bundle and save'
        }
      }
    });

    expect(screen.getByText(/Bundle and save/)).toBeInTheDocument();
  });

  it('should render description', () => {
    renderComponent(<BundleBuilderContainer />, {
      translationData: {
        'quote:chooseProducts': {
          description: 'Product description'
        }
      }
    });

    expect(screen.getByText(/Product description/)).toBeInTheDocument();
  });

  describe('Bundle builder testimonals', () => {
    jest.spyOn(contentTestimonialsService, 'getTestimonials').mockImplementation(async () => [
      {
        title: 'Effortlessly quick',
        content: 'Quick and easy. I think this has taken less than 10 minutes. Nice.',
        date: 'July 2025',
        icon: 'male'
      },
      {
        title: 'Save and return - perfect!',
        content: 'I could do it all online and have my quote saved to return to later! Good price!',
        date: 'July 2025',
        icon: 'female'
      }
    ]);

    it('should render testimonails', async () => {
      renderComponent(<BundleBuilderContainer />, {
        translationData: {
          'quote:config': {
            showTestimonials: true
          }
        }
      });

      // flush testimonials promise
      await waitFor(() => {
        // check length as this renders for both desktop and mobile
        expect(screen.getAllByText(/Effortlessly quick/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Save and return - perfect!/).length).toBeGreaterThan(0);
      });
    });

    it('should not render testimonials if config is false', async () => {
      renderComponent(<BundleBuilderContainer />, {
        translationData: {
          'quote:config': {
            showTestimonials: false
          }
        }
      });

      expect(screen.queryByText(/Effortlessly quick/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Save and return - perfect!/)).not.toBeInTheDocument();
    });
  });

  describe('Bundle builder trustpilot', () => {
    afterEach(() => {
      // @ts-expect-error this object is injected by the trustpilot script
      delete window.Trustpilot;
    });

    it('should render Trustpilot when flag is ON', async () => {
      // @ts-expect-error this object is injected by the trustpilot scripts
      window.Trustpilot = { loadFromElement: jest.fn() };

      renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialApplicationState,
          flags: {
            ...initialApplicationState.flags,
            'q2b-trustpilot-widget': true
          }
        }
      });

      expect(screen.getByText(/How our customers rate us/)).toBeInTheDocument();
      const widget = screen.getByTestId('trustpilot-widget');
      expect(widget).toBeInTheDocument();

      // @ts-expect-error this object is injected by the trustpilot script
      expect(window.Trustpilot.loadFromElement).toHaveBeenCalledWith(widget, true);
    });

    it('should render Testimonials when config is true and Trustpilot flag is OFF', async () => {
      jest.spyOn(contentTestimonialsService, 'getTestimonials').mockResolvedValue([
        {
          title: 'Effortlessly quick',
          content: 'Quick and easy. I think this has taken less than 10 minutes. Nice.',
          date: 'July 2025',
          icon: 'male'
        },
        {
          title: 'Save and return - perfect!',
          content: 'I could do it all online and have my quote saved to return to later! Good price!',
          date: 'July 2025',
          icon: 'female'
        }
      ]);

      renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialApplicationState,
          flags: {
            ...initialApplicationState.flags,
            'q2b-trustpilot-widget': false
          }
        },
        translationData: {
          'quote:config': {
            showTestimonials: true
          }
        }
      });

      expect(screen.queryByText(/How our customers rate us/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('trustpilot-widget')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('testimonials-wrapper')).toBeInTheDocument();
        expect(screen.getAllByText(/Effortlessly quick/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Save and return - perfect!/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Bundle builder log in', () => {
    const initialState: ApplicationState = {
      ...initialApplicationState,
      flags: { 'bundle-builder-login': true },
      quote: {
        ...initialApplicationState.quote,
        bundleBuilderLogin: BundleBuilderLoginType.LOGIN
      }
    };
    const translationData = {
      auth: {
        email: 'Enter email',
        password: 'Enter password'
      },
      'base:config': {
        sspQuote: true
      },
      'quote:existingCustomer': {
        yesButton: 'Yes'
      },
      'quote:myTowerBundleBuilderLogin': {
        btnText: 'Log in',
        skipText: 'skip for now',
        noMyTowerAccountText: "Don't have a My Tower account?",
        loginSuccessMessage: 'You successfully logged in'
      }
    };

    const successKey = 'isLoginSuccessVisible';

    beforeEach(() => {
      sessionStorage.clear();
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
    });

    it('should render if bundle-builder-login flag enabled', () => {
      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData
      });

      // click existing customer to render login option
      act(() => {
        screen.getByRole('button', { name: 'Yes' }).click();
      });

      expect(screen.getByText(/Log in/)).toBeInTheDocument();
      expect(screen.getByText(/Don't have a My Tower account?/)).toBeInTheDocument();
      expect(screen.getByText(/skip for now/)).toBeInTheDocument();
    });

    it('should show dialog on log in click', async () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData
      });

      expect(screen.queryByLabelText(/Enter email/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Enter password/)).not.toBeInTheDocument();

      // click existing customer to render login option
      act(() => {
        screen.getByRole('button', { name: 'Yes' }).click();
      });

      // show dialog
      act(() => {
        screen.getByText(/Log in/).click();
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Enter email/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter password/)).toBeInTheDocument();
      });
    });

    it('should hide My Tower login section for WSP brand', () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
      // WSP brand → isBrand(state, Brand.Wsp) === true
      mockIsBrand.mockReturnValue(true);

      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData
      });
      // question
      expect(screen.queryByText(/Are you already a Tower Customer\?/i)).not.toBeInTheDocument();
      // login CTA text
      expect(screen.queryByText(/Log in/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/skip for now/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Don.?t have a my tower account/i)).not.toBeInTheDocument();
      // login dialog fields
      expect(screen.queryByLabelText(/Enter email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Enter password/i)).not.toBeInTheDocument();
      // policy count question
      expect(screen.queryByText(/How many Tower policies/i)).not.toBeInTheDocument();
    });
    it('should hide policy count question when hidePolicyCountQuestion is enabled', async () => {
      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData: {
          ...translationData,
          'base:config': {
            hidePolicyCountQuestion: true
          }
        }
      });

      act(() => {
        screen.getByRole('button', { name: 'Yes' }).click();
      });

      await waitFor(() => {
        expect(screen.queryByText(/How many Tower policies/i)).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', {
          name: /button.beginQuote/i
        })
      ).toBeInTheDocument();
    });
    it('should show Begin your quote CTA directly for WSP when a product is selected', () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
      // WSP brand → isBrand(state, Brand.Wsp) === true
      mockIsBrand.mockReturnValue(true);

      renderComponent(<BundleBuilderContainer />, { initialState });

      const beginCta = screen.getByRole('button', { name: /button\.beginQuote/i });
      expect(beginCta).toBeInTheDocument();
      expect(screen.queryByText(/Are you already a Tower Customer/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/How many Tower policies do you currently have/i)).not.toBeInTheDocument();
    });

    it('shows login success message on first authenticated render and sets sessionStorage key', async () => {
      renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialState,
          common: {
            ...initialState.common,
            authenticated: true
          }
        },
        translationData
      });

      expect(await screen.findByText('You successfully logged in')).toBeInTheDocument();
      expect(sessionStorage.getItem(successKey)).toBe('yes');
    });

    it('does not show login success message again when key present; clears on logout; shows again on next login', async () => {
      // First login shows success message and sets key in session storage
      let { unmount } = renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialState,
          common: {
            ...initialState.common,
            authenticated: true
          }
        },
        translationData
      });

      expect(await screen.findByText('You successfully logged in')).toBeInTheDocument();
      expect(sessionStorage.getItem(successKey)).toBe('yes');

      // Re-render logged in and should not show success message
      unmount();
      ({ unmount } = renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialState,
          common: {
            ...initialState.common,
            authenticated: true
          }
        },
        translationData
      }));

      await waitFor(() => {
        expect(screen.queryByText('You successfully logged in')).not.toBeInTheDocument();
      });

      // Logout and successKey should clear
      unmount();
      ({ unmount } = renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialState,
          common: {
            ...initialState.common,
            authenticated: false
          }
        },
        translationData
      }));

      await waitFor(() => {
        expect(screen.queryByText('You successfully logged in')).not.toBeInTheDocument();
      });
      expect(sessionStorage.getItem(successKey)).toBeNull();

      // Login again and success message will show again and set key in session storage
      unmount();
      ({ unmount } = renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialState,
          common: {
            ...initialState.common,
            authenticated: true
          }
        },
        translationData
      }));

      expect(await screen.findByText('You successfully logged in')).toBeInTheDocument();
      expect(sessionStorage.getItem(successKey)).toBe('yes');

      unmount();
    });
  });

  it('should update state when handleSkipLogin is called', () => {
    const { result } = renderHook(() => {
      const [showWelcomeBackMessage, setShowWelcomeBackMessage] = React.useState(true);
      const [hasSkippedLogin, setHasSkippedLogin] = React.useState(false);

      const handleSkipLogin = () => {
        setHasSkippedLogin(true);
        setShowWelcomeBackMessage(false);
      };

      return { showWelcomeBackMessage, hasSkippedLogin, handleSkipLogin };
    });

    act(() => {
      result.current.handleSkipLogin();
    });

    expect(result.current.hasSkippedLogin).toBe(true);
    expect(result.current.showWelcomeBackMessage).toBe(false);
  });

  describe('Disclaimer for Westpac', () => {
    it('should show Disclaimer section for WSP brand', () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
      mockIsBrand.mockReturnValue(true);
      const translationData = {
        'quote:config': {
          showDisclosure: true
        },
        'quote:chooseProducts': {
          title: 'Bundle your policies with ease',
          description: 'Keep things simple by having all your policies in one place.'
        },
        'quote:disclosure': {
          title: 'Duty of Disclosure',
          description:
            "To help you get a quote, we’re going to ask you a few questions. It’s important to answer these questions honestly, as your answers will impact our decision to insure you and the terms of your policy. If we insure you and you didn't answer honestly, it may impact your ability to make a valid claim, or your cover and policy may be cancelled."
        }
      };
      const initialState = {
        common: {
          ...getDefaultCommonState()
        },
        myForms: {
          sharedQuote: {
            ...getDefaultQuoteSharedState()
          }
        }
      } as ApplicationState;

      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData
      });
      expect(screen.getByText(/Bundle your policies with ease/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep things simple by having all your policies in one place./i)).toBeInTheDocument();
      expect(screen.getByText(/Duty of Disclosure/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /To help you get a quote, we’re going to ask you a few questions. It’s important to answer these questions honestly, as your answers will impact our decision to insure you and the terms of your policy. If we insure you and you didn't answer honestly, it may impact your ability to make a valid claim, or your cover and policy may be cancelled./i
        )
      ).toBeInTheDocument();
    });

    it('should show not show Disclaimer section for WSP brand if showDisclosure is false', () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
      mockIsBrand.mockReturnValue(true);
      const translationData = {
        'quote:config': {
          showDisclosure: false
        },
        'quote:chooseProducts': {
          title: 'Bundle your policies with ease',
          description: 'Keep things simple by having all your policies in one place.'
        },
        'quote:disclosure': {
          title: 'Duty of Disclosure',
          description:
            "To help you get a quote, we’re going to ask you a few questions. It’s important to answer these questions honestly, as your answers will impact our decision to insure you and the terms of your policy. If we insure you and you didn't answer honestly, it may impact your ability to make a valid claim, or your cover and policy may be cancelled."
        }
      };
      const initialState = {
        common: {
          ...getDefaultCommonState()
        },
        myForms: {
          sharedQuote: {
            ...getDefaultQuoteSharedState()
          }
        }
      } as ApplicationState;

      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData
      });
      expect(screen.getByText(/Bundle your policies with ease/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep things simple by having all your policies in one place./i)).toBeInTheDocument();
      expect(screen.queryByText(/Duty of Disclosure/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          /To help you get a quote, we’re going to ask you a few questions. It’s important to answer these questions honestly, as your answers will impact our decision to insure you and the terms of your policy. If we insure you and you didn't answer honestly, it may impact your ability to make a valid claim, or your cover and policy may be cancelled./i
        )
      ).not.toBeInTheDocument();
    });

    it('should show not show Disclaimer section for non WSP brand if showDisclosure is false', () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house-contents'
      });
      mockIsBrand.mockReturnValue(false);
      const translationData = {
        'quote:config': {
          showDisclosure: false
        },
        'quote:disclosure': {
          title: 'Duty of Disclosure',
          description:
            "To help you get a quote, we’re going to ask you a few questions. It’s important to answer these questions honestly, as your answers will impact our decision to insure you and the terms of your policy. If we insure you and you didn't answer honestly, it may impact your ability to make a valid claim, or your cover and policy may be cancelled."
        }
      };
      const initialState = {
        common: {
          ...getDefaultCommonState()
        },
        myForms: {
          sharedQuote: {
            ...getDefaultQuoteSharedState()
          }
        }
      } as ApplicationState;

      renderComponent(<BundleBuilderContainer />, {
        initialState,
        translationData
      });
      expect(screen.queryByText(/Duty of Disclosure/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          /To help you get a quote, we’re going to ask you a few questions. It’s important to answer these questions honestly, as your answers will impact our decision to insure you and the terms of your policy. If we insure you and you didn't answer honestly, it may impact your ability to make a valid claim, or your cover and policy may be cancelled./i
        )
      ).not.toBeInTheDocument();
    });
  });

  it('renders the campaign banner when a multi-offer campaign is active', async () => {
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });

    const mockResponse: GetActiveCampaignsResponse = {
      body: 'SAVE100'
    };

    jest
      .spyOn(campaignsService, 'getActiveCampaigns')
      .mockImplementationOnce((_XBrandId, { onResponse }): Promise<GetActiveCampaignsResponse> => {
        onResponse(
          {
            status: 200,
            bodyAsText: 'SAVE100',
            request: undefined,
            headers: undefined
          },
          null
        );

        return Promise.resolve(mockResponse);
      });

    renderComponent(<BundleBuilderContainer />, {
      initialState: {
        ...initialApplicationState,
        common: {
          ...initialApplicationState.common,
          agency: {
            ...initialApplicationState.common.agency,
            promotionVisibility: {
              campaigns: true
            }
          },
          customer: {
            ...initialApplicationState.common.customer,
            promotionVisibility: {
              campaigns: true
            }
          }
        }
      },
      translationData: {
        'quote:config': {
          showBundleBuilderBanner: true
        },
        'base:config': {
          CampaignsAllowed: true,
          campaignBannerRedesign: true
        },
        'promo:promoCodeCampaign_save100': 'SAVE100',
        'promo:campaignBanner_save100': {
          header: 'Bundle and save',
          offers: [
            {
              header: '15% off home cover',
              description: 'When you bundle with contents',
              icon: 'house'
            },
            {
              header: 'Free roadside assistance',
              description: 'When you add a car quote',
              icon: 'car'
            }
          ],
          disclaimer: {
            text: 'T&Cs apply',
            link: {
              text: 'See details',
              url: 'https://example.com'
            }
          }
        }
      }
    });

    expect(await screen.findByText('Bundle and save')).toBeInTheDocument();
    expect(screen.getByText('15% off home cover')).toBeInTheDocument();
    expect(screen.getByText('Free roadside assistance')).toBeInTheDocument();
  });

  it('does not render the default redesigned banner while the active campaign is loading', async () => {
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });

    let resolveActiveCampaign: () => void;

    jest
      .spyOn(campaignsService, 'getActiveCampaigns')
      .mockImplementationOnce((_XBrandId, { onResponse }): Promise<GetActiveCampaignsResponse> => {
        return new Promise((resolve) => {
          resolveActiveCampaign = () => {
            onResponse(
              {
                status: 200,
                bodyAsText: 'SAVE100',
                request: undefined,
                headers: undefined
              },
              null
            );

            resolve({ body: 'SAVE100' });
          };
        });
      });

    renderComponent(<BundleBuilderContainer />, {
      initialState: {
        ...initialApplicationState,
        common: {
          ...initialApplicationState.common,
          agency: {
            ...initialApplicationState.common.agency,
            promotionVisibility: {
              campaigns: true
            }
          },
          customer: {
            ...initialApplicationState.common.customer,
            promotionVisibility: {
              campaigns: true
            }
          }
        }
      },
      translationData: {
        'quote:config': {
          showBundleBuilderBanner: true
        },
        'base:config': {
          CampaignsAllowed: true,
          campaignBannerRedesign: true
        },
        'promo:promoCodeCampaign_save100': 'SAVE100',
        'promo:campaignBanner_default': {
          header: 'Default Banner Should Wait',
          description: 'Default banner description',
          image: {
            alt: '',
            lg: './default-lg.jpg'
          }
        },
        'promo:campaignBanner_save100': {
          header: 'Campaign Banner After Load',
          description: 'Campaign banner description',
          image: {
            alt: '',
            lg: './campaign-lg.jpg'
          }
        }
      }
    });

    expect(screen.queryByText('Default Banner Should Wait')).not.toBeInTheDocument();
    expect(screen.queryByText('Campaign Banner After Load')).not.toBeInTheDocument();

    await act(async () => {
      resolveActiveCampaign();
    });

    expect(await screen.findByText('Campaign Banner After Load')).toBeInTheDocument();
    expect(screen.queryByText('Default Banner Should Wait')).not.toBeInTheDocument();
  });

  it('should render the membership validation component when membershipId is enabled', async () => {

    // Arrange
    (useLocation as jest.Mock).mockReturnValue({
      search: '?pt=house-contents'
    });
    const membershipIdFeature = {
      membershipId: {
        enabled: true,
        title: 'test title',
        label: 'test label',
        helperText: 'test helper'
      }
    };

    // Act
    renderComponent(<BundleBuilderContainer />, {
      initialState: {
        ...initialApplicationState,
        common: {
          ...initialApplicationState.common,
          agency: {
            features: {
              membershipId: membershipIdFeature.membershipId
            }
          }
        }
      }
    });

    // Assert
    expect(await screen.findByText('test title')).toBeInTheDocument();
    expect(screen.getByText('test label')).toBeInTheDocument();
    expect(screen.getByText('test helper')).toBeInTheDocument();
  });

  describe('membership validation scenarios', () => {
    const membershipIdFeature = {
      membershipId: {
        enabled: true,
        title: 'Membership validation',
        label: 'Membership number',
        helperText: 'Enter your membership number'
      }
    };

    it('should block Begin Quote until membership validation succeeds when preventUnauthenticated is enabled', async () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house'
      });

      jest.spyOn(partnerService, 'validateMembership').mockResolvedValue({ valid: true } as never);

      renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialApplicationState,
          common: {
            ...initialApplicationState.common,
            agency: {
              ...initialApplicationState.common.agency,
              features: {
                membershipId: membershipIdFeature.membershipId
              }
            }
          }
        },
        translationData: {
          'quote:config': {
            preventUnauthenticated: true
          }
        }
      });

      expect(screen.queryByRole('button', { name: /button\.beginQuote/i })).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Membership number'), { target: { value: 'ABC123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /button\.beginQuote/i })).toBeInTheDocument();
      });
    });

    it('should hide existing customer prompt until membership validation succeeds', async () => {
      (useLocation as jest.Mock).mockReturnValue({
        search: '?pt=house'
      });

      jest.spyOn(partnerService, 'validateMembership').mockResolvedValue({ valid: true } as never);


      renderComponent(<BundleBuilderContainer />, {
        initialState: {
          ...initialApplicationState,
          common: {
            ...initialApplicationState.common,
            agency: {
              ...initialApplicationState.common.agency,
              features: {
                membershipId: membershipIdFeature.membershipId
              }
            }
          },
          flags: {
            'bundle-builder-login': true
          },
          quote: {
            ...initialApplicationState.quote,
            bundleBuilderLogin: BundleBuilderLoginType.LOGIN,
            houses: [{
              policyNumber: 'ABC123'
            }]
          }
        },
        translationData: {
          'quote:existingCustomer': {
            yesButton: 'Yes'
          }
        }
      });

      expect(screen.queryByRole('button', { name: 'Yes' })).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Membership number'), { target: { value: 'ABC123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

      await waitFor(() => {
        screen.debug();
        expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      });
    });
  });

});
