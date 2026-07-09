import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  ToolInvocationBadge,
  describeToolInvocation,
} from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(overrides: Partial<ToolInvocation>): ToolInvocation {
  return {
    toolCallId: "call-1",
    toolName: "str_replace_editor",
    args: {},
    state: "call",
    ...overrides,
  } as ToolInvocation;
}

test("describeToolInvocation returns 'Creating <file>' for str_replace_editor create", () => {
  const invocation = makeInvocation({
    args: { command: "create", path: "/App.jsx" },
  });

  expect(describeToolInvocation(invocation)).toBe("Creating App.jsx");
});

test("describeToolInvocation returns 'Editing <file>' for str_replace_editor str_replace", () => {
  const invocation = makeInvocation({
    args: { command: "str_replace", path: "/components/Card.jsx" },
  });

  expect(describeToolInvocation(invocation)).toBe("Editing Card.jsx");
});

test("describeToolInvocation returns 'Editing <file>' for str_replace_editor insert", () => {
  const invocation = makeInvocation({
    args: { command: "insert", path: "/App.jsx" },
  });

  expect(describeToolInvocation(invocation)).toBe("Editing App.jsx");
});

test("describeToolInvocation returns 'Viewing <file>' for str_replace_editor view", () => {
  const invocation = makeInvocation({
    args: { command: "view", path: "/App.jsx" },
  });

  expect(describeToolInvocation(invocation)).toBe("Viewing App.jsx");
});

test("describeToolInvocation returns 'Undoing edit in <file>' for str_replace_editor undo_edit", () => {
  const invocation = makeInvocation({
    args: { command: "undo_edit", path: "/App.jsx" },
  });

  expect(describeToolInvocation(invocation)).toBe("Undoing edit in App.jsx");
});

test("describeToolInvocation returns rename message for file_manager rename", () => {
  const invocation = makeInvocation({
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/Card.jsx",
      new_path: "/components/StyledCard.jsx",
    },
  });

  expect(describeToolInvocation(invocation)).toBe(
    "Renaming Card.jsx to StyledCard.jsx"
  );
});

test("describeToolInvocation returns delete message for file_manager delete", () => {
  const invocation = makeInvocation({
    toolName: "file_manager",
    args: { command: "delete", path: "/utils.js" },
  });

  expect(describeToolInvocation(invocation)).toBe("Deleting utils.js");
});

test("describeToolInvocation falls back to raw tool name when args are missing", () => {
  const invocation = makeInvocation({
    toolName: "str_replace_editor",
    args: {},
  });

  expect(describeToolInvocation(invocation)).toBe("str_replace_editor");
});

test("describeToolInvocation falls back to raw tool name for unknown tools", () => {
  const invocation = makeInvocation({
    toolName: "some_unknown_tool",
    args: { command: "create", path: "/App.jsx" },
  });

  expect(describeToolInvocation(invocation)).toBe("some_unknown_tool");
});

test("ToolInvocationBadge renders friendly label and green dot when done", () => {
  const invocation = makeInvocation({
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "Success",
  });

  const { container } = render(
    <ToolInvocationBadge toolInvocation={invocation} />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge renders spinner while in progress", () => {
  const invocation = makeInvocation({
    args: { command: "str_replace", path: "/App.jsx" },
    state: "call",
  });

  const { container } = render(
    <ToolInvocationBadge toolInvocation={invocation} />
  );

  expect(screen.getByText("Editing App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge shows spinner when result state has falsy result", () => {
  const invocation = makeInvocation({
    args: { command: "view", path: "/App.jsx" },
    state: "result",
    result: "",
  });

  const { container } = render(
    <ToolInvocationBadge toolInvocation={invocation} />
  );

  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
