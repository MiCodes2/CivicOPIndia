"use client";

import { useState, useRef, useMemo } from "react";
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Underline,
  Strikethrough,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatContent } from '@/lib/formatContent';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showPreviewButton?: boolean;
  onPreview?: () => void;
}

type EditorMode = 'edit' | 'preview';

export default function RichTextEditor({ value, onChange, placeholder, showPreviewButton = false, onPreview }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [showHtml, setShowHtml] = useState(true);
  
  // Format content for preview using the same logic as feed display
  const formattedPreview = useMemo(() => {
    if (mode !== 'preview') return '';
    return formatContent(value || '');
  }, [mode, value]);

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (!url) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'link text';
    const linkText = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
    
    const newText = value.substring(0, start) + linkText + value.substring(end);
    onChange(newText);
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (!url) return;
    
    const alt = prompt('Enter image description (optional):') || '';
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imgText = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto;" />`;
    
    const newText = value.substring(0, start) + imgText + value.substring(end);
    onChange(newText);
  };

  const addHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || `Heading ${level}`;
    const headingText = `<h${level}>${selectedText}</h${level}>`;
    
    const newText = value.substring(0, start) + headingText + value.substring(end);
    onChange(newText);
  };

  const addAlignment = (align: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const alignedText = `<div style="text-align: ${align};">${selectedText}</div>`;
    
    const newText = value.substring(0, start) + alignedText + value.substring(end);
    onChange(newText);
  };



  const addParagraph = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const paragraphText = `\n\n${selectedText}\n\n`;
    
    const newText = value.substring(0, start) + paragraphText + value.substring(end);
    onChange(newText);
  };

  return (
    <div className="space-y-2">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'edit' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('edit')}
          className="flex-1"
        >
          <Edit3 className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          type="button"
          variant={mode === 'preview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('preview')}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </div>

      {/* Toolbar - Only show in edit mode */}
      {mode === 'edit' && (
      <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-2">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<strong>', '</strong>')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<em>', '</em>')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<u>', '</u>')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<s>', '</s>')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addHeading(1)}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addHeading(2)}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addHeading(3)}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addAlignment('left')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addAlignment('center')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addAlignment('right')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Links and Media */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<ul>\n<li>', '</li>\n</ul>')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<ol>\n<li>', '</li>\n</ol>')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Code and Quote */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<code>', '</code>')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('<blockquote>', '</blockquote>')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addParagraph}
          title="New Paragraph"
          className="text-xs"
        >
          ¶
        </Button>
      </div>
      )}

      {/* Editor/Preview Area */}
      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="min-h-[200px] max-h-[600px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-y overflow-auto"
          style={{ whiteSpace: 'pre-wrap' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          className="min-h-[200px] max-h-[600px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm overflow-auto"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          <div
            className="prose prose-sm max-w-none"
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: formattedPreview || '<p class="text-muted-foreground italic">No content to preview</p>' }}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {mode === 'edit'
          ? "Use the toolbar buttons to format text. You can also use HTML tags directly. To embed YouTube videos, simply paste the YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID) and it will automatically be converted to an embedded player."
          : "Preview mode - showing how your post will appear on the feed. Switch to Edit to make changes."
        }
      </p>
    </div>
  );
}
