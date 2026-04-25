import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders sbrep2 workspace header", () => {
  render(<App />);
  expect(screen.getByText(/sbrep2\./i)).toBeInTheDocument();
  expect(screen.getByText(/DOM Traversal/i)).toBeInTheDocument();
});
