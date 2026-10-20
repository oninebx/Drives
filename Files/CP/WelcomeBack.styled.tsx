import styled from "@emotion/styled";
import { QuickQuoteIcon, Typography } from "@tower/tui";

const StyledWelcomeBack = styled.div`
  border-radius: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.color.success100};
`;

const StyledWelcomeBackHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const StyledQuickQuoteIcon = styled(QuickQuoteIcon)`
  width: ${({ theme }) => theme.spacing.lg};
  height: ${({ theme }) => theme.spacing.lg};

  & path {
    fill: ${({ theme }) => theme.color.success600};
    color: ${({ theme }) => theme.color.success600};
  }
`;

const StyledTypography = styled(Typography)`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StyledDescription = styled(Typography)`
  padding-left: ${({ theme }) => theme.spacing.xl};
`;

export { StyledWelcomeBack, StyledWelcomeBackHeader, StyledQuickQuoteIcon, StyledTypography, StyledDescription };