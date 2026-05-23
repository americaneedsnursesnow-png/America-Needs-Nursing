"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  /** Tailwind min-height class for the editing area, e.g. min-h-48 */
  contentMinClass?: string;
  /**
   * When set, toolbar includes “Insert image” (uploads via your callback, e.g.
   * `uploadBlogPostImage` → `/files/blog-images/…`).
   */
  bodyImageUpload?: (file: File) => Promise<string>;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-2 text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-gray-200 text-gray-900" : ""
      }`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({
  editor,
  disabled,
  showImageUpload,
  imageFileInputRef,
  bodyImageUploadRef,
}: {
  editor: Editor | null;
  disabled?: boolean;
  showImageUpload: boolean;
  imageFileInputRef: React.RefObject<HTMLInputElement | null>;
  bodyImageUploadRef: React.MutableRefObject<
    ((file: File) => Promise<string>) | undefined
  >;
}) {
  if (!editor) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton
        title="Bold"
        disabled={disabled}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        disabled={disabled}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        disabled={disabled}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <span className="mx-1 hidden h-5 w-px bg-gray-300 sm:inline" aria-hidden />
      <ToolbarButton
        title="Heading 2"
        disabled={disabled}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        disabled={disabled}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        disabled={disabled}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      {showImageUpload ? (
        <>
          <span
            className="mx-1 hidden h-5 w-px bg-gray-300 sm:inline"
            aria-hidden
          />
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              const upload = bodyImageUploadRef.current;
              if (!file || !upload) return;
              void (async () => {
                try {
                  const url = await upload(file);
                  const normalized = url.startsWith("/") ? url : `/${url}`;
                  editor.chain().focus().setImage({ src: normalized }).run();
                } catch {
                  // Caller can surface errors via toasts; editor stays usable
                }
              })();
            }}
          />
          <ToolbarButton
            title="Insert image in article"
            disabled={disabled}
            active={editor.isActive("image")}
            onClick={() => imageFileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" strokeWidth={2.5} />
          </ToolbarButton>
        </>
      ) : null}
      <span className="mx-1 hidden h-5 w-px bg-gray-300 sm:inline" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        disabled={disabled}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        disabled={disabled}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <span className="mx-1 hidden h-5 w-px bg-gray-300 sm:inline" aria-hidden />
      <ToolbarButton
        title="Undo"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  contentMinClass = "min-h-48",
  bodyImageUpload,
}: RichTextEditorProps) {
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const bodyImageUploadRef = useRef(bodyImageUpload);
  bodyImageUploadRef.current = bodyImageUpload;

  const enableBodyImages = Boolean(bodyImageUpload);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
        emptyEditorClass: "is-editor-empty",
      }),
      ...(enableBodyImages
        ? [
            Image.configure({
              allowBase64: false,
              inline: false,
              HTMLAttributes: {
                class:
                  "blog-inline-image max-w-full h-auto rounded-lg border border-gray-200 my-4 block",
              },
            }),
          ]
        : []),
    ],
    [enableBodyImages, placeholder],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: value || "", 
      editable: !disabled,
      editorProps: {
        attributes: {
          class: "submit-job-rich-editor-focus",
          "aria-label": ariaLabel ?? "Rich text",
        },
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        const text = ed.getText({ blockSeparator: "\n" });

        // Preserve rich HTML for blog/newsletter content, but save empty strings for whitespace-only input.
        onChange(text.trim().length === 0 ? "" : html);
      },
    },
    [extensions],
  );

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={`submit-job-rich-editor overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-button)]/30 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        showImageUpload={enableBodyImages}
        imageFileInputRef={imageFileInputRef}
        bodyImageUploadRef={bodyImageUploadRef}
      />
      <EditorContent
        editor={editor}
        className={`submit-job-rich-editor-content bg-white text-gray-900 ${contentMinClass}`}
      />
    </div>
  );
}