import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Route, Routes } from 'react-router';
import { routes } from '~/common/state';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { ClaimType } from '../../shared/state';
import { CarpetDamageType, DAMAGE_AREA_CARPET, DAMAGE_AREA_GLASS, getDefaultClaimHouseState } from '../state';
import Page2 from './Page2';

describe('House page2', () => {
  const initialState = {
    myForms: {
      houseClaim: {
        ...getDefaultClaimHouseState(),
        eisClaim: {
          claimNumber: '123456',
          reportedPolicyNumber: 'P0001234',
          causeOfLoss: 'fire',
          lossDate: '2025-09-18T22:59:00.000Z'
        }
      },
      sharedClaim: {
        claimType: ClaimType.House,
        homePolicyDetails: {
          typeOfPolicy: 'house'
        },
        eventDate: '19 September 2025',
        eventTime: '10:59',
        eventTimeAmPm: 'am',
        policyDetails: {
          description: '123 Fake street Howick Manukau'
        }
      }
    }
  };

  const translationData = {
    'claim:documentUpload.suggestions': {
      house: [
        {
          suggestion:
            'Details of anyone else involved, e.g. other property owners. Please provide names, emails, addresses and phone numbers'
        },
        { suggestion: 'Police reports for illegal acts (e.g. theft)' }
      ]
    },
    'claim/house:damageItems': {
      title: 'DamageItems title',
      description: 'DamageItems description'
    },
    'claim/house:glassBrokenPaneCount': {
      title: 'GlassBrokenPaneCount title'
    },
    'claim/house:carpetDamage': {
      title: 'CarpetDamage title'
    },
    'claim/house:dryingRequired': {
      title: 'DryingRequired title'
    },
    'claim/house:mouldVisible': {
      title: 'MouldVisible title'
    },
    'claim/house:damageAreas': {
      title: 'DamageAreas title'
    }
  };

  const baseDamageAreas = Array.from({ length: 22 }, () => ({}));
  it('should render the page2 component with the correct details', () => {
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.getByText('Your claim number: 123456')).toBeInTheDocument();
  });

  describe('DamageItemsSelector', () => {
    it('should render the damage items if the col is not lost or stolen', () => {
      renderComponent(<Page2 />, { initialState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'DamageItems title' })).toBeInTheDocument();
      expect(screen.getByText('DamageItems description')).toBeInTheDocument();
    });

    it('should not render the damaged items it col is lost or stolen', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'lostOrStolen',
              lossDate: '2025-09-18T22:59:00.000Z'
            }
          }
        }
      };

      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'DamageItems title' })).not.toBeInTheDocument();
      expect(screen.queryByText('DamageItems description')).not.toBeInTheDocument();
    });
  });

  describe('GlassBrokenPaneCount', () => {
    it('should render the GlassBrokenPaneCount question if glass is selected', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...initialState.myForms.houseClaim,
            damageAreas: [
              ...baseDamageAreas,
              { selected: true, description: DAMAGE_AREA_GLASS },
              {
                selected: false,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };

      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.getByRole('heading', { level: 3, name: 'GlassBrokenPaneCount title' })).toBeInTheDocument();
    });

    it('should not render the GlassBrokenPaneCount question if glass is not selected', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...initialState.myForms.houseClaim,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: false,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };

      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByRole('heading', { level: 3, name: 'GlassBrokenPaneCount title' })).not.toBeInTheDocument();
    });
  });

  describe('CarpetDamage', () => {
    it('should render the CarpetDamage question if carpet is selected', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...initialState.myForms.houseClaim,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: true,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };

      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'CarpetDamage title' })).toBeInTheDocument();
    });

    it('should not render the CarpetDamage question if carpet is not selected', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...initialState.myForms.houseClaim,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: false,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };

      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'CarpetDamage title' })).not.toBeInTheDocument();
    });
  });

  describe('DryingRequired', () => {
    it('should render the DryingRequired question if the carpet damage is wet', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'fire',
              secondaryCauseOfLoss: 'escapeOfWater',
              lossDate: '2025-09-18T22:59:00.000Z'
            },
            carpetDamage: CarpetDamageType.Wet,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: true,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'DryingRequired title' })).toBeInTheDocument();
    });

    it('should not render the DryingRequired question if the carpet damage is not wet', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'fire',
              secondaryCauseOfLoss: 'notWet',
              lossDate: '2025-09-18T22:59:00.000Z'
            },
            carpetDamage: CarpetDamageType.Burnt,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: true,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'DryingRequired title' })).not.toBeInTheDocument();
    });
  });

  describe('MouldVisible', () => {
    it('should render the MouldVisible question if the carpet damage is wet', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'fire',
              secondaryCauseOfLoss: 'escapeOfWater',
              lossDate: '2025-09-18T22:59:00.000Z'
            },
            carpetDamage: CarpetDamageType.Wet,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: true,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'MouldVisible title' })).toBeInTheDocument();
    });

    it('should not render the MouldVisible question if the carpet damage is not wet', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'fire',
              secondaryCauseOfLoss: 'notWet',
              lossDate: '2025-09-18T22:59:00.000Z'
            },
            carpetDamage: CarpetDamageType.Burnt,
            damageAreas: [
              ...baseDamageAreas,
              { selected: false, description: DAMAGE_AREA_GLASS },
              {
                selected: true,
                description: DAMAGE_AREA_CARPET
              }
            ]
          }
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'MouldVisible title' })).not.toBeInTheDocument();
    });
  });

  describe('DamageAreaSelector', () => {
    it('should render the DamageAreaSelector question if there is other damage', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'fire',
              secondaryCauseOfLoss: 'escapeOfWater',
              lossDate: '2025-09-18T22:59:00.000Z'
            },
            otherDamage: true
          }
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'DamageAreas title' })).toBeInTheDocument();
    });

    it('should not render the DamageAreaSelector question if there is no other damage', () => {
      const newState = {
        ...initialState,
        myForms: {
          ...initialState.myForms,
          houseClaim: {
            ...getDefaultClaimHouseState(),
            eisClaim: {
              claimNumber: '123456',
              reportedPolicyNumber: 'P0001234',
              causeOfLoss: 'fire',
              secondaryCauseOfLoss: 'escapeOfWater',
              lossDate: '2025-09-18T22:59:00.000Z'
            }
          }
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'DamageAreas title' })).not.toBeInTheDocument();
    });
  });

  describe('ClaimAttachments', () => {
    it('should render the ClaimAttachments file upload component with the correct suggestions', () => {
      renderComponent(<Page2 />, { initialState, translationData });

      expect(
        screen.getByText(
          'Details of anyone else involved, e.g. other property owners. Please provide names, emails, addresses and phone numbers'
        )
      ).toBeInTheDocument();
    });
  });

  it('should render the FormFooter', () => {
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.getByRole('link', { name: 'button.back' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'footer.nextButton.shared.contactDetails arrow_forward' })
    ).toBeInTheDocument();
  });

  it('should navigate to the correct page when the nextButton is clicked', () => {
    const RoutedComponent = () => (
      <Routes>
        <Route path={routes.CLAIM.SHARED.CLAIM_CONTACT_DETAILS} element={<p>I routed</p>} />
        <Route path="*" element={<Page2 />} />
      </Routes>
    );
    renderComponent(<RoutedComponent />, { initialState, translationData });

    userEvent.click(screen.getByRole('button', { name: 'footer.nextButton.shared.contactDetails arrow_forward' }));

    expect(screen.getByText('I routed')).toBeInTheDocument();
  });

  it('should render the FloatingToolbar', () => {
    renderComponent(<Page2 />, { initialState, translationData });

    expect(screen.getByRole('button', { name: 'save button.finishLater' })).toBeInTheDocument();
  });

  describe('EngagedWithContractor', () => {
    it('should render the EngagedWithContractor if the feature flag is TRUE ', () => {
      const newState = {
        ...initialState,
        flags: {
          'cs-engaged-with-customer': true
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });
      expect(screen.queryByText('engagedWithContractorAnswer.title')).toBeInTheDocument();
    });

    it('should NOT render the EngagedWithContractor if the feature flag is FALSE ', () => {
      const newState = {
        ...initialState,
        flags: {
          'cs-engaged-with-customer': false
        }
      };
      renderComponent(<Page2 />, { initialState: newState, translationData });

      expect(screen.queryByText('engagedWithContractorAnswer.title')).not.toBeInTheDocument();
    });
  });
});
