// import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Button } from "@tower/tui";
// import { Typography } from "@tower/tui";

/*
 ${({ $mobileGap, $gap }) =>
    ($mobileGap ?? $gap) &&
    css`
      gap: ${$mobileGap ?? $gap};
    `};

  ${({ theme, $gap, $mobileGap }) =>
    $gap &&
    $mobileGap &&
    css`
      @media (${theme.viewport.min('sm')}) {
        gap: ${$gap};
      }
    `}
*/
const VerticalFlexbox = styled.div`
  display: flex;
  flex-direction: column;
`;

const FieldFlexbox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  ${({ theme }) => theme.viewport.min('sm')} {
    width: 78%;
    flex-direction: row;
  }
`;

const InputContainer = styled.div`
  width: 100%;
  ${({ theme }) => theme.viewport.min('sm')} {
    width: 58%;
  }
`;

const ValidateButton = styled(Button)`
  &:disable,
  &[disabled],
  &[aria-disabled="true"] {
    color: ${({ theme }) => theme.color.neutral500};
    border-color: ${({ theme }) => theme.color.neutral500};
  }
`;

// const Title = styled(Typography)`
//   font-weight: bold;
//   color: ${({ theme }) => theme.color.primary};
// `;

export {
  VerticalFlexbox,
  FieldFlexbox,
  InputContainer,
  ValidateButton,
  // Title
}