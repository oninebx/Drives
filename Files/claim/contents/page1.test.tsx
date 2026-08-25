import { screen } from '@testing-library/dom';
import * as React from 'react';
import { KnownHomeCauseOfLoss, KnownHomeSecondaryCauseOfLoss } from '~/common/state/autorest/Claims/src';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationState } from '~/root/rootReducer';
import { testClaimContentsState } from '../../shared/state/claimTestData';
import { getDefaultClaimContentsState } from '../state';
import Page1 from './Page1';

describe('Page1 Content', () => {
  const initialState = {
    myForms: {
      contentsClaim: {
        ...getDefaultClaimContentsState(),
        eisClaim: {
          claimNumber: 'ABC123',
          lossDate: new Date('2025-01-15T02:45:00.000Z'),
          causeOfLoss: 'damaged',
          secondaryCauseOfLoss: 'accidentalDamage'
        },
        eventLocationType: 'riskAddress',
        eventLocationOid: 'sCj9Tv6dC3Sl9eRQVgVFlw'
      },
      sharedClaim: {
        homePolicyDetails: {
          risk: {
            oid: 'test1234'
          }
        }
      }
    }
  } as Partial<ApplicationState>;

  it('should render the claim number and status', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByText('Your claim number: ABC123')).toBeInTheDocument();
    expect(screen.getByText('Not submitted')).toBeInTheDocument();
  });

  it('should render the pre steps summary with the correct details', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 2, name: 'headings.page1' })).toBeInTheDocument();
    expect(screen.getByText('15/01/2025 at 3:45 pm')).toBeInTheDocument();
    expect(screen.getByText('preStepsSummary.causeLabels.damagedAccidentalDamage')).toBeInTheDocument();
  });

  it('should render the incident information questions', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 2, name: 'headings.incidentInformation' })).toBeInTheDocument();
  });

  it('should render the incident information questions', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 2, name: 'headings.otherPeople' })).toBeInTheDocument();
  });
  it('should render the event description', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 5, name: 'page1.eventDescription.title' })).toBeInTheDocument();
    expect(screen.getByText('page1.eventDescription.description')).toBeInTheDocument();
  });

  it('should render the witness questions', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 2, name: 'headings.witnesses' })).toBeInTheDocument();
  });

  it('should render the other people questions', () => {
    renderComponent(<Page1 />, { initialState });
    expect(screen.getByRole('heading', { level: 2, name: 'headings.otherPeople' })).toBeInTheDocument();
  });

  it('should not render address section if COL lost and SCOL is atHome', () => {
    const initialState = {
      myForms: {
        contentsClaim: {
          ...testClaimContentsState,
          eisClaim: {
            causeOfLoss: KnownHomeCauseOfLoss.Lost,
            secondaryCauseOfLoss: KnownHomeSecondaryCauseOfLoss.AtHome
          }
        },
        sharedClaim: {
          homePolicyDetails: {
            risk: {
              oid: 'test1234'
            }
          }
        }
      }
    } as Partial<ApplicationState>;

    renderComponent(<Page1 />, { initialState });

    expect(screen.queryByText('eventLocationType.general.title')).not.toBeInTheDocument();
    expect(screen.queryByText('eventLocationType.general.description')).not.toBeInTheDocument();
  });
});
