"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function fileName(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

export function describeToolInvocation(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation as { toolName: string; args: any };

  if (toolName === "str_replace_editor" && args?.path) {
    const name = fileName(args.path);
    switch (args.command) {
      case "create":
        return `Creating ${name}`;
      case "str_replace":
      case "insert":
        return `Editing ${name}`;
      case "view":
        return `Viewing ${name}`;
      case "undo_edit":
        return `Undoing edit in ${name}`;
    }
  }

  if (toolName === "file_manager" && args?.path) {
    const name = fileName(args.path);
    if (args.command === "rename" && args.new_path) {
      return `Renaming ${name} to ${fileName(args.new_path)}`;
    }
    if (args.command === "delete") {
      return `Deleting ${name}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const label = describeToolInvocation(toolInvocation);
  const isDone =
    toolInvocation.state === "result" &&
    "result" in toolInvocation &&
    !!toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
