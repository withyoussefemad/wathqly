"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { getInitials } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace, setIsCreateOpen } = useWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between px-2 h-9 border border-border/50 bg-secondary/50 hover:bg-secondary text-left font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary/20 text-primary text-[10px] font-semibold">
              {currentWorkspace ? getInitials(currentWorkspace.name) : "W"}
            </div>
            <span className="truncate text-xs font-medium text-foreground">
              {currentWorkspace?.name ?? "Select Workspace"}
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => {
          const isSelected = currentWorkspace?.id === ws.id;
          return (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => setCurrentWorkspace(ws)}
              className="flex items-center justify-between text-xs py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-secondary text-[10px] font-semibold text-foreground">
                  {getInitials(ws.name)}
                </div>
                <span className="truncate">{ws.name}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 text-xs py-2 text-primary focus:text-primary font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
