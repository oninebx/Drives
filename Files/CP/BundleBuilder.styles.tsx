import styled from '@emotion/styled';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const DisclaimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const CampaignBannerContainer = styled.div`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => theme.viewport.min('xl')} {
    margin-bottom: 0;
    margin-inline: 60px;
  }
`;

export const Description = styled.p<{ $isPacific: boolean }>`
  color: ${({ theme, $isPacific }) => ($isPacific ? theme.color.primary : theme.color.neutral900Default)};
`;
