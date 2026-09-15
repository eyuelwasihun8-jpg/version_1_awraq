'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Minus,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<Props> = ({
  content,
  onChange,
  placeholder = 'Start writing your lesson content...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#ddb049] underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[300px] p-4 focus:outline-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:font-medium prose-a:text-[#ddb049] prose-strong:text-slate-900 prose-strong:font-black',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) {
    return (
      <div className="min-h-[300px] rounded-xl border border-[#e8e0d2] bg-[#fbfaf7] flex items-center justify-center text-sm text-slate-400 font-medium">
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rounded-xl border border-[#e8e0d2] bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-[#f0ebe2] bg-[#fbfaf7]">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          icon={Bold}
          label="Bold"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          icon={Italic}
          label="Italic"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          icon={UnderlineIcon}
          label="Underline"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          icon={Strikethrough}
          label="Strikethrough"
        />

        <Divider />

        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Heading 1"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          label="Heading 3"
        />

        <Divider />

        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          icon={List}
          label="Bullet list"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Numbered list"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          icon={Quote}
          label="Quote"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          icon={Code}
          label="Code block"
        />

        <Divider />

        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          label="Align left"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          label="Align center"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          label="Align right"
        />

        <Divider />

        <ToolBtn
          onClick={setLink}
          active={editor.isActive('link')}
          icon={LinkIcon}
          label="Link"
        />
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          label="Divider"
        />

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} icon={Undo} label="Undo" />
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} icon={Redo} label="Redo" />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

const ToolBtn = ({ onClick, active, icon: Icon, label }: any) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`p-2 rounded-lg cursor-pointer transition-all ${
      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);

const Divider = () => <div className="w-px h-6 bg-slate-200 mx-1 my-auto" />;