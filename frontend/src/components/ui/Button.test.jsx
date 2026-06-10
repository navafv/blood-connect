import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./Button";

describe("Button UI Component", () => {
  it("renders correctly with children text", () => {
    render(<Button>Click Me</Button>);

    // Asserts that the button is in the document and displays the right text
    const buttonElement = screen.getByText("Click Me");
    expect(buttonElement).toBeInTheDocument();
  });

  it("applies the disabled attribute when passed", () => {
    render(<Button disabled>Processing</Button>);

    const buttonElement = screen.getByText("Processing");
    expect(buttonElement).toBeDisabled();
  });
});
