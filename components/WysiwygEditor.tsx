"use client";

import { useRef, useEffect, useCallback, useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Helper to decode HTML entities from contentEditable innerHTML
function decodeEntities(html: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  let decoded = textarea.value;
  
  // Extra aggressive decode for stubborn entities
  decoded = decoded.replace(/&#0*39;/g, "'");
  decoded = decoded.replace(/&#x0*27;/gi, "'");
  decoded = decoded.replace(/&apos;/g, "'");
  decoded = decoded.replace(/&amp;#0*39;/gi, "'");
  decoded = decoded.replace(/&amp;#x0*27;/gi, "'");
  
  return decoded;
}

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onPreviewInTab?: () => void;
}

export default function WysiwygEditor({ value, onChange, placeholder, onPreviewInTab }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value || '';
      setInitialized(true);
    }
  }, [value, initialized]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setIsUpdating(true);
      let html = editorRef.current.innerHTML;
      // Decode entities to prevent storing &#039; etc
      html = decodeEntities(html);
      onChange(html);
      setTimeout(() => setIsUpdating(false), 0);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const addLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (!url) return;
    execCommand('createLink', url);
  }, [execCommand]);

  const addImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (!url) return;
    execCommand('insertImage', url);
  }, [execCommand]);

  const setHeading = useCallback((level: number) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  const addBlockquote = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();
    const blockquote = document.createElement('blockquote');
    blockquote.appendChild(selectedContent);
    range.insertNode(blockquote);
    
    // Move cursor after blockquote
    range.setStartAfter(blockquote);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);
  const removeBlockquote = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Find if cursor is inside a blockquote
    let node = selection.anchorNode;
    let blockquote: HTMLElement | null = null;
    
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'BLOCKQUOTE') {
        blockquote = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (blockquote) {
      // Unwrap the blockquote
      const parent = blockquote.parentNode;
      while (blockquote.firstChild) {
        parent?.insertBefore(blockquote.firstChild, blockquote);
      }
      parent?.removeChild(blockquote);
      handleInput();
    }
  }, [handleInput]);

  const applyFontSize = useCallback((sizePx: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // nothing selected

    // Extract selected content and wrap it in a span with inline font-size
    const selectedContent = range.extractContents();
    const span = document.createElement('span');
    span.style.fontSize = sizePx;
    span.appendChild(selectedContent);
    range.insertNode(span);

    // Move cursor after inserted span
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current?.contains(e.target as Node)) return;

      // Ctrl/Cmd + B = Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        execCommand('bold');
      }
      // Ctrl/Cmd + I = Italic
      else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        execCommand('italic');
      }
      // Ctrl/Cmd + U = Underline
      else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        execCommand('underline');
      }
      // Ctrl/Cmd + K = Link
      else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        addLink();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [execCommand, addLink]);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-2">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('strikeThrough')}
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
          onClick={() => setHeading(1)}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setHeading(2)}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setHeading(3)}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Quote */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            // Check if cursor is in a blockquote to toggle
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              let node = selection.anchorNode;
              let inBlockquote = false;
              while (node && node !== editorRef.current) {
                if (node.nodeName === 'BLOCKQUOTE') {
                  inBlockquote = true;
                  break;
                }
                node = node.parentNode;
              }
              if (inBlockquote) {
                removeBlockquote();
              } else {
                addBlockquote();
              }
            } else {
              addBlockquote();
            }
          }}
          title="Blockquote (Toggle)"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
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
          title="Add Link (Ctrl+K)"
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
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Font Size */}
        <div className="mx-2 flex items-center">
          <label htmlFor="font-size-select" className="sr-only">Font size</label>
          <select
            id="font-size-select"
            className="text-sm bg-transparent border border-transparent focus:border-input rounded px-2 py-1"
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const mapping: Record<string, string> = { small: '12px', normal: '14px', large: '18px', huge: '24px' };
              const size = mapping[val];
              if (size) {
                applyFontSize(size);
              }
              // reset select back to placeholder
              e.currentTarget.value = '';
            }}
            title="Font size"
          >
            <option value="">Font</option>
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
          </select>
        </div>

        {/* Clear formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            // remove inline formatting
            execCommand('removeFormat');
            // normalize block to paragraph
            execCommand('formatBlock', 'p');
            // also remove blockquote if inside one
            removeBlockquote();
            handleInput();
          }}
          title="Clear formatting"
        >
          {/* Use simple text for clarity */}
          Clear
        </Button>
        
        <div className="flex-1" />
        
        {/* Preview in New Tab */}
        {onPreviewInTab && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onPreviewInTab}
            title="Preview in New Tab"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Preview
          </Button>
        )}
      </div>

      {/* WYSIWYG Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[300px] max-h-[600px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-auto prose prose-sm max-w-none"
        style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contentEditable=true] p {
          margin: 0.5em 0;
        }
        [contentEditable=true] p:first-child {
          margin-top: 0;
        }
        [contentEditable=true] p:last-child {
          margin-bottom: 0;
        }
        [contentEditable=true] blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1em;
          margin: 1em 0;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        [contentEditable=true] br {
          display: block;
          content: '';
          margin: 0.25em 0;
        }
      `}</style>

      <style jsx>{`
        [contentEditable=true]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>

      <p className="text-xs text-muted-foreground">
        Use the toolbar buttons or keyboard shortcuts: <strong>Ctrl+B</strong> (Bold), <strong>Ctrl+I</strong> (Italic), <strong>Ctrl+U</strong> (Underline), <strong>Ctrl+K</strong> (Link). 
        To embed YouTube videos, paste the URL and it will automatically convert to an embedded player.
      </p>
    </div>
  );
}
