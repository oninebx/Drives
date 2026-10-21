import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import ValidateInputField from "./ValidateInputField";
import { renderComponent } from "~/common/test-utilities/renderComponent";

type Props = React.ComponentProps<typeof ValidateInputField>;

const render = (overrideProps: Partial<Props> = {}) => {
  const props: Props = {
    label: "Membership number",
    supportingText: "Enter your membership number",
    value: "",
    onChange: jest.fn(),
    onValidate: jest.fn(),
    buttonText: "Validate",
    buttonEnabled: true,
    inputEnabled: true,
    ...overrideProps
  };

  const utils = renderComponent(<ValidateInputField {...props} />);
  const input = screen.getByRole("textbox") as HTMLInputElement;
  const button = screen.getByRole("button", { name: props.buttonText });

  return { ...utils, props, input, button };
};

describe("ValidateInputField", () => {
  it("renders label, supporting text, button text, and value", () => {
    const { input } = render({ value: "ABC123" });

    expect(screen.getByText("Membership number")).toBeInTheDocument();
    expect(screen.getByText("Enter your membership number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate" })).toBeInTheDocument();
    expect(input.value).toBe("ABC123");
  });

  it("does not render supporting text when it is empty", () => {
    render({ supportingText: "" });

    expect(screen.queryByText("Enter your membership number")).not.toBeInTheDocument();
  });

  it("disables input when inputEnabled is false", () => {
    const { input } = render({ inputEnabled: false });

    expect(input).toBeDisabled();
  });

  it("enables input when inputEnabled is true", () => {
    const { input } = render({ inputEnabled: true });

    expect(input).not.toBeDisabled();
  });

  it("enables validate button when value is valid and buttonEnabled is true", () => {
    const { button } = render({ value: "12345", buttonEnabled: true });

    expect(button).not.toBeDisabled();
  });

  it("disables validate button when value is whitespace-only", () => {
    const { button } = render({ value: "   ", buttonEnabled: true });

    expect(button).toBeDisabled();
  });

  it("disables validate button when buttonEnabled is false even if value is valid", () => {
    const { button } = render({ value: "12345", buttonEnabled: false });

    expect(button).toBeDisabled();
  });

  it("treats numeric values as valid (including 0)", () => {
    const { button } = render({ value: 0, buttonEnabled: true });

    expect(button).not.toBeDisabled();
  });

  it("calls onValidate when validate button is clicked and enabled", () => {
    const onValidate = jest.fn();
    const { button } = render({
      value: "VALID",
      buttonEnabled: true,
      onValidate
    });

    fireEvent.click(button);

    expect(onValidate).toHaveBeenCalledTimes(1);
  });

  it("does not call onValidate when button is disabled", () => {
    const onValidate = jest.fn();
    const { button } = render({
      value: "",
      buttonEnabled: true,
      onValidate
    });

    fireEvent.click(button);

    expect(onValidate).not.toHaveBeenCalled();
  });

  it("calls onChange when input value changes", () => {
    const onChange = jest.fn();
    const { input } = render({
      value: "",
      onChange
    });

    fireEvent.change(input, { target: { value: "NEW-VALUE" } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("forwards ref to the underlying input element", () => {
    const ref = React.createRef<HTMLInputElement>();

    const { input } = render(
      <ValidateInputField
        ref={ref}
        label="Membership number"
        supportingText="Enter your membership number"
        value="A1"
        buttonText="Validate"
        buttonEnabled={true}
        inputEnabled={true}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(input);
  });

  it("passes additional input props through to Input.Field", () => {
    const { input } = render({
      placeholder: "Enter member ID",
      name: "memberId",
      type: "text"
    });

    expect(input).toHaveAttribute("placeholder", "Enter member ID");
    expect(input).toHaveAttribute("name", "memberId");
    expect(input).toHaveAttribute("type", "text");
  });
});