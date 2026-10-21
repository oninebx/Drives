// import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Button, Input } from "@tower/tui";
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
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FieldFlexbox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  input {
    border-radius: ${({ theme }) => theme.spacing.xs};
    ${({ theme }) => theme.viewport.min('md')} {
      width: 340px;
      min-width: 200px;
      max-width: 480px;
    }
  }
`;

const InputContainer = styled.div`
  width: 100%;
  ${({ theme }) => theme.viewport.min('md')} {
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
  ValidateButton
}