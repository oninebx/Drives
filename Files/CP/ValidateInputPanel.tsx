import React from "react";
import { VerticalFlexbox } from "./ValidateInputPanel.styled";
import ValidateInputField from "./ValidateInputField";

import { Typography } from "@tower/tui";

interface ValidateInputPanelProps {
  title: string;
  label: string;
  supportingText: string;
  value: string | number | readonly string[] | undefined;
  onBlur?: () => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const ValidateInputPanel = (({ title, label, supportingText, value, onBlur, onChange }: ValidateInputPanelProps) => {
  return (
    <VerticalFlexbox>
      <Typography variant="title" color="primary" bold>
        {title}
      </Typography>
      <ValidateInputField
        label={label}
        supportingText={supportingText}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
      />
    </VerticalFlexbox>
  );
});

export default ValidateInputPanel;