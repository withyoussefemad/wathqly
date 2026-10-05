"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Sparkles,
  Bookmark as BookmarkIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (data: { html: string; json: Record<string, unknown>; plainText: string }) => void;
  placeholder?: string;
  editable?: boolean;
  availableNotes?: { id: string; title: string }[];
}

export function TiptapEditor({
  initialContent = "",
  onChange,
  placeholder = "Write with markdown, format text, or link notes using [[Note Title]]...",
  editable = true,
  availableNotes = [],
}: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline font-medium cursor-pointer hover:text-primary/80",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[220px] focus:outline-none p-4 text-foreground selection:bg-primary/20",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      const plainText = editor.getText();
      onChange?.({ html, json, plainText });
    },
  });

  // Sync content if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== undefined && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [initialContent, editor]);

  if (!isMounted || !editor) {
    return (
      <div className="border border-border/70 rounded-lg p-4 min-h-[220px] animate-pulse bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
        Loading editor engine...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter external or internal URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertBacklink = (noteTitle: string) => {
    editor.chain().focus().insertContent(` [[${noteTitle}]] `).run();
  };

  const insertCallout = () => {
    editor
      .chain()
      .focus()
      .insertContent(
        `<blockquote class="border-l-4 border-primary pl-4 py-1 my-2 bg-primary/5 rounded-r text-sm">💡 <strong>Callout:</strong> Key operational insight or rule here.</blockquote><p></p>`
      )
      .run();
  };

  return (
    <div className="border border-border/80 rounded-lg overflow-hidden bg-card/60 backdrop-blur-sm transition-all focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 shadow-xs">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/40 border-b border-border/70 text-muted-foreground">
          {/* Text Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("bold") ? "bg-primary/20 text-primary font-bold" : ""}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("italic") ? "bg-primary/20 text-primary" : ""}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("strike") ? "bg-primary/20 text-primary" : ""}`}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("code") ? "bg-primary/20 text-primary" : ""}`}
            title="Inline Code"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`h-7 w-7 p-0 ${editor.isActive("heading", { level: 1 }) ? "bg-primary/20 text-primary" : ""}`}
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-7 w-7 p-0 ${editor.isActive("heading", { level: 2 }) ? "bg-primary/20 text-primary" : ""}`}
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`h-7 w-7 p-0 ${editor.isActive("heading", { level: 3 }) ? "bg-primary/20 text-primary" : ""}`}
            title="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Lists */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("bulletList") ? "bg-primary/20 text-primary" : ""}`}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("orderedList") ? "bg-primary/20 text-primary" : ""}`}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("taskList") ? "bg-primary/20 text-primary" : ""}`}
            title="Checklist / Task list"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Blocks & Extras */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-7 w-7 p-0 ${editor.isActive("blockquote") ? "bg-primary/20 text-primary" : ""}`}
            title="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={`h-7 w-7 p-0 ${editor.isActive("link") ? "bg-primary/20 text-primary" : ""}`}
            title="Add Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>

          {/* Table Insertion */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5 text-xs gap-1" title="Table tools">
                <TableIcon className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
              >
                Insert 3x3 Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                Add Row Below
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                Add Column Right
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-destructive"
              >
                Delete Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Backlink / Wiki-Link Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                title="Insert [[Backlink]] reference"
              >
                <BookmarkIcon className="h-3.5 w-3.5" />
                <span>[[Link]]</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-56 overflow-y-auto text-xs">
              <div className="p-1.5 font-medium text-muted-foreground border-b border-border/50 text-[11px]">
                Link to Note:
              </div>
              {availableNotes.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground text-xs">No other notes yet</div>
              ) : (
                availableNotes.map((note) => (
                  <DropdownMenuItem key={note.id} onClick={() => insertBacklink(note.title)}>
                    <span className="truncate">[[{note.title}]]</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Callout */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertCallout}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Insert Callout"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Callout</span>
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-7 w-7 p-0"
              title="Undo"
            >
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-7 w-7 p-0"
              title="Redo"
            >
              <Redo className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
