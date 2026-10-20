import React from "react";
import { StyledWelcomeBack, StyledWelcomeBackHeader, StyledQuickQuoteIcon, StyledTypography, StyledDescription } from "./WelcomeBack.styled";

interface WelcomeBackProps {
  title: string;
  description: string;
}

const WelcomeBack = ({ title, description }: WelcomeBackProps) => {
  return (
    <StyledWelcomeBack>
      <StyledWelcomeBackHeader>
        <StyledQuickQuoteIcon data-testid="quickquote-icon" aria-hidden />
        <StyledTypography variant="body" bold element="h4" color="neutral900Default">
          {title}
        </StyledTypography>
      </StyledWelcomeBackHeader>
      <StyledDescription variant="body">
        {description}
      </StyledDescription>
    </StyledWelcomeBack>
  );
};

export default WelcomeBack;