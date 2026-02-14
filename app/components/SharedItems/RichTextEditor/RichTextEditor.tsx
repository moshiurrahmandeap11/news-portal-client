import {
  ChangeEvent,
  ClipboardEvent,
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface RichTextEditorProps {
  value?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list: boolean;
  orderedList: boolean;
  alignLeft?: boolean;
  alignCenter?: boolean;
  alignRight?: boolean;
  alignJustify?: boolean;
}

const RichTextEditor: FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  minHeight = "200px",
  maxHeight = "400px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkText, setLinkText] = useState<string>("");
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    orderedList: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
  });
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  // Common emojis for quick access
  const commonEmojis = [
    "😊",
    "👍",
    "❤️",
    "😂",
    "🎉",
    "✅",
    "⭐",
    "🔥",
    "👏",
    "💡",
  ];

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      updateCounts();
    }
  }, [value]);

  // Check active formats on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const parentElement = range.commonAncestorContainer.parentElement;

      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        list: !!(
          parentElement?.tagName === "UL" || parentElement?.closest("ul")
        ),
        orderedList: !!(
          parentElement?.tagName === "OL" || parentElement?.closest("ol")
        ),
        alignLeft: document.queryCommandState("justifyLeft"),
        alignCenter: document.queryCommandState("justifyCenter"),
        alignRight: document.queryCommandState("justifyRight"),
        alignJustify: document.queryCommandState("justifyFull"),
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const updateCounts = useCallback((): void => {
    if (!editorRef.current) return;

    const text = editorRef.current.innerText || "";
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
    setCharCount(text.length);
  }, []);

  const updateContent = useCallback((): void => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateCounts();
    }
  }, [onChange, updateCounts]);

  const handleFormat = (command: string, value: string | null = null): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateContent();
  };

  const handleHeading = (level: number): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("formatBlock", false, `h${level}`);
    updateContent();
  };

  const handleAlign = (alignment: string): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(
      `justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`,
    );
    updateContent();
  };

  const handleAddLink = (): void => {
    if (!linkUrl.trim()) {
      alert("Please enter a URL");
      return;
    }

    try {
      const url = new URL(linkUrl);
      if (!url.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString();
    const displayText = selectedText || linkText || linkUrl;

    // Create link with proper styling
    const link = document.createElement("a");
    link.href = linkUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = displayText;
    link.className = "rich-text-link";

    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(link);

      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.setEndAfter(link);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Add space after link
      const space = document.createTextNode(" ");
      newRange.insertNode(space);
    } else {
      // Insert at cursor position
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="rich-text-link">${displayText}</a>&nbsp;`,
      );
    }

    updateContent();
    setShowLinkInput(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault();

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      // Strip unwanted formatting but preserve basic structure
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Remove scripts, styles, and other unwanted tags
      const scripts = tempDiv.querySelectorAll("script, style, meta, link");
      scripts.forEach((el) => el.remove());

      // Keep only allowed tags
      const allowedTags = [
        "p",
        "br",
        "b",
        "strong",
        "i",
        "em",
        "u",
        "a",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "pre",
        "code",
      ];
      tempDiv.querySelectorAll("*").forEach((el) => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
          el.replaceWith(...el.childNodes);
        }
      });

      const cleanHtml = tempDiv.innerHTML;

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const tempDiv2 = document.createElement("div");
        tempDiv2.innerHTML = cleanHtml;
        const fragment = document.createDocumentFragment();
        while (tempDiv2.firstChild) {
          fragment.appendChild(tempDiv2.firstChild);
        }

        range.insertNode(fragment);

        // Move cursor to end
        range.setStartAfter(fragment.lastChild || fragment);
        range.setEndAfter(fragment.lastChild || fragment);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // Plain text fallback
      document.execCommand("insertText", false, text);
    }

    updateContent();
  };

  const handleClearFormatting = (): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat", false, null);
    document.execCommand("unlink", false, null);

    // Also remove any inline styles
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentElement;
      if (parent && parent.style) {
        parent.removeAttribute("style");
      }
    }

    updateContent();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    // Handle Enter key in lists
    if (e.key === "Enter") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const listItem = range.startContainer.parentElement?.closest("li");

        if (listItem && listItem.textContent?.trim() === "") {
          e.preventDefault();
          document.execCommand("outdent", false, null);
        }
      }
    }

    // Ctrl+B for bold
    if (e.ctrlKey && e.key === "b") {
      e.preventDefault();
      handleFormat("bold");
    }

    // Ctrl+I for italic
    if (e.ctrlKey && e.key === "i") {
      e.preventDefault();
      handleFormat("italic");
    }

    // Ctrl+U for underline
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      handleFormat("underline");
    }

    // Ctrl+K for link
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      setShowLinkInput(true);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.alt = "Uploaded image";
      img.className = "rich-text-image";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "4px";
      img.style.margin = "8px 0";

      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand("insertHTML", false, img.outerHTML);
      updateContent();
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertHorizontalRule = (): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHorizontalRule", false, null);
    updateContent();
  };

  const insertEmoji = (emoji: string): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertText", false, emoji);
    updateContent();
    setShowEmojiPicker(false);
  };

  const insertTable = (rows: number = 2, cols: number = 2): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHTML =
      '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    for (let i = 0; i < rows; i++) {
      tableHTML += "<tr>";
      for (let j = 0; j < cols; j++) {
        tableHTML +=
          '<td style="border: 1px solid #ddd; padding: 8px;">Cell</td>';
      }
      tableHTML += "</tr>";
    }
    tableHTML += "</table><br>";

    document.execCommand("insertHTML", false, tableHTML);
    updateContent();
  };

  const handleUndo = (): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("undo", false, null);
    updateContent();
  };

  const handleRedo = (): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("redo", false, null);
    updateContent();
  };

  const insertCodeBlock = (): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(
      "insertHTML",
      false,
      "<pre><code>// Your code here</code></pre><br>",
    );
    updateContent();
  };

  const insertQuote = (): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(
      "insertHTML",
      false,
      "<blockquote>Quote text here</blockquote><br>",
    );
    updateContent();
  };

  const handleColorChange = (color: string): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("foreColor", false, color);
    updateContent();
  };

  const handleFontSize = (size: string): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("fontSize", false, size);
    updateContent();
  };

  const handleHighlight = (color: string = "#ffff00"): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("backColor", false, color);
    updateContent();
  };

  return (
    <div className="rich-text-editor w-full">
      {/* Main Toolbar */}
      <div className="toolbar flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-t-lg shadow-md">
        {/* History */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
          <button
            type="button"
            onClick={handleUndo}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 hover:text-blue-600"
            title="Undo (Ctrl+Z)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 hover:text-blue-600"
            title="Redo (Ctrl+Y)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Text Formatting Group */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
          <button
            type="button"
            onClick={() => handleFormat("bold")}
            className={`p-2 rounded transition-colors ${activeFormats.bold ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            title="Bold (Ctrl+B)"
          >
            <strong className="font-bold">B</strong>
          </button>

          <button
            type="button"
            onClick={() => handleFormat("italic")}
            className={`p-2 rounded transition-colors ${activeFormats.italic ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            title="Italic (Ctrl+I)"
          >
            <em className="italic">I</em>
          </button>

          <button
            type="button"
            onClick={() => handleFormat("underline")}
            className={`p-2 rounded transition-colors ${activeFormats.underline ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            title="Underline (Ctrl+U)"
          >
            <u className="underline">U</u>
          </button>

          <button
            type="button"
            onClick={() => handleFormat("strikethrough")}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Strikethrough"
          >
            <span className="line-through">S</span>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Font Size & Color Group */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
          <select
            onChange={(e) => handleFontSize(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Font Size"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>

          <input
            type="color"
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 p-1 border border-gray-300 rounded cursor-pointer"
            title="Text Color"
          />

          <button
            type="button"
            onClick={() => handleHighlight()}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Highlight"
          >
            <span className="bg-yellow-200 px-1">H</span>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Headings Dropdown */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 shadow-sm"
            title="Headings"
          >
            <span className="font-semibold">H</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div className="absolute hidden group-hover:block min-w-[120px] bg-white border border-gray-300 rounded-lg shadow-lg z-20 mt-1">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleHeading(level)}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 first:rounded-t-lg last:rounded-b-lg"
              >
                Heading {level}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment Dropdown */}
        <div className="relative group">
          <button
            type="button"
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 shadow-sm"
            title="Text Alignment"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="absolute hidden group-hover:flex flex-col bg-white border border-gray-300 rounded-lg shadow-lg z-20 mt-1 min-w-[100px]">
            {[
              { align: "left", icon: "M4 6h16M4 12h16M4 18h7" },
              { align: "center", icon: "M4 6h16M8 12h8M4 18h16" },
              { align: "right", icon: "M4 6h16M4 12h16M11 18h9" },
              { align: "justify", icon: "M4 6h16M4 12h16M4 18h16" },
            ].map(({ align, icon }) => (
              <button
                key={align}
                type="button"
                onClick={() => handleAlign(align)}
                className={`p-2 hover:bg-gray-100 flex items-center gap-2 px-4 ${activeFormats[`align${align.charAt(0).toUpperCase() + align.slice(1)}` as keyof ActiveFormats] ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                title={`Align ${align}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={icon}
                  />
                </svg>
                <span className="capitalize">{align}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Lists Group */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
          <button
            type="button"
            onClick={() => handleFormat("insertUnorderedList")}
            className={`p-2 rounded transition-colors ${activeFormats.list ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            title="Bullet List"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleFormat("insertOrderedList")}
            className={`p-2 rounded transition-colors ${activeFormats.orderedList ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            title="Numbered List"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleFormat("indent")}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Increase Indent"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5-5 5M6 7l5 5-5 5"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleFormat("outdent")}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Decrease Indent"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 7l-5 5 5 5M18 7l-5 5 5 5"
              />
            </svg>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Insert Elements Group */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
          {/* Link Button */}
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={`p-2 rounded transition-colors ${showLinkInput ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            title="Add Link (Ctrl+K)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>

          {/* Image Upload */}
          <label className="p-2 hover:bg-gray-100 rounded transition-colors cursor-pointer text-gray-700">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              title="Insert Image"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </label>

          {/* Table Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
              title="Insert Table"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <div className="absolute hidden group-hover:block bg-white border border-gray-300 rounded-lg shadow-lg z-20 mt-1 p-2 min-w-[150px]">
              <div className="text-xs text-gray-500 mb-1">Insert Table</div>
              <button
                onClick={() => insertTable(2, 2)}
                className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-gray-700 rounded text-sm"
              >
                2x2 Table
              </button>
              <button
                onClick={() => insertTable(3, 3)}
                className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-gray-700 rounded text-sm"
              >
                3x3 Table
              </button>
              <button
                onClick={() => insertTable(4, 3)}
                className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-gray-700 rounded text-sm"
              >
                4x3 Table
              </button>
            </div>
          </div>

          {/* Code Block */}
          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Insert Code Block"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </button>

          {/* Quote */}
          <button
            type="button"
            onClick={insertQuote}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Insert Quote"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>

          {/* Horizontal Rule */}
          <button
            type="button"
            onClick={insertHorizontalRule}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
            title="Insert Horizontal Line"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 12H5"
              />
            </svg>
          </button>

          {/* Emoji Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
              title="Insert Emoji"
            >
              <span className="text-lg">😊</span>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-30 min-w-[200px]">
                <div className="grid grid-cols-5 gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={handleClearFormatting}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors text-gray-700 shadow-sm"
          title="Clear All Formatting"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Link Input Panel */}
      {showLinkInput && (
        <div className="link-input p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-300 border-t-0 shadow-inner">
          <div className="space-y-3 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Display Text (Optional)
              </label>
              <input
                type="text"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
              <p className="text-xs text-gray-600 mt-1">
                Leave empty to use selected text or URL
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddLink}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
              >
                Insert Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl("");
                  setLinkText("");
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all font-medium shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={updateContent}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className={`editor p-4 sm:p-5 border border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto bg-white text-gray-800 ${
          readOnly ? "bg-gray-50 cursor-not-allowed" : ""
        }`}
        style={{
          minHeight,
          maxHeight,
        }}
        data-placeholder={placeholder}
      />

      {/* Enhanced Stats Bar */}
      <div className="stats-bar flex flex-wrap justify-between items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 border-t-0 rounded-b-lg text-xs text-gray-600">
        <div className="flex gap-4 flex-wrap">
          <span className="bg-white px-2 py-1 rounded shadow-sm">
            <span className="font-semibold">Words:</span> {wordCount}
          </span>
          <span className="bg-white px-2 py-1 rounded shadow-sm">
            <span className="font-semibold">Characters:</span> {charCount}
          </span>
          {wordCount > 0 && (
            <span className="bg-white px-2 py-1 rounded shadow-sm">
              <span className="font-semibold">Reading time:</span> ~
              {Math.max(1, Math.ceil(wordCount / 200))} min
            </span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <span className="hidden sm:inline-flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
            <span className="font-semibold">🔑</span> Ctrl+B, I, U, K
          </span>
          {!readOnly && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded shadow-sm">
              Edit mode
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Styles */}
      <style>{`
                .rich-text-editor {
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
                
                .editor:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                    font-style: italic;
                }
                
                .editor {
                    line-height: 1.7;
                    text-align: left;
                    direction: ltr;
                    font-size: 15px;
                }
                
                .editor:focus {
                    outline: none;
                }
                
                /* Typography Styles */
                .editor p {
                    margin: 0 0 14px 0;
                    min-height: 1.4em;
                    color: #1f2937;
                }
                
                .editor h1 {
                    font-size: 2.2em;
                    margin: 20px 0 10px 0;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1.3;
                }
                
                .editor h2 {
                    font-size: 1.8em;
                    margin: 18px 0 8px 0;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .editor h3 {
                    font-size: 1.5em;
                    margin: 16px 0 8px 0;
                    font-weight: 600;
                    color: #374151;
                }
                
                .editor h4 {
                    font-size: 1.25em;
                    margin: 14px 0 6px 0;
                    font-weight: 600;
                    color: #374151;
                }
                
                .editor h5, .editor h6 {
                    font-size: 1.1em;
                    margin: 12px 0 6px 0;
                    font-weight: 600;
                    color: #4b5563;
                }
                
                /* List Styles */
                .editor ul,
                .editor ol {
                    margin: 12px 0;
                    padding-left: 32px;
                    color: #1f2937;
                }
                
                .editor li {
                    margin: 6px 0;
                    padding-left: 6px;
                }
                
                .editor li::marker {
                    color: #4b5563;
                }
                
                .editor ul {
                    list-style-type: disc;
                }
                
                .editor ol {
                    list-style-type: decimal;
                }
                
                /* Link Styles */
                .editor a.rich-text-link {
                    color: #2563eb;
                    text-decoration: none;
                    border-bottom: 1px solid #2563eb;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                
                .editor a.rich-text-link:hover {
                    color: #1d4ed8;
                    border-bottom: 2px solid #1d4ed8;
                }
                
                /* Image Styles */
                .editor img.rich-text-image {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 16px 0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #e5e7eb;
                }
                
                /* Horizontal Rule */
                .editor hr {
                    border: none;
                    border-top: 2px solid #e5e7eb;
                    margin: 20px 0;
                }
                
                /* Blockquote */
                .editor blockquote {
                    border-left: 4px solid #3b82f6;
                    margin: 16px 0;
                    padding: 8px 0 8px 20px;
                    color: #4b5563;
                    font-style: italic;
                    background: linear-gradient(to right, #f9fafb, transparent);
                    border-radius: 0 8px 8px 0;
                }
                
                /* Code Blocks */
                .editor pre {
                    background: #1f2937;
                    color: #e5e7eb;
                    padding: 16px;
                    border-radius: 8px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    overflow-x: auto;
                    margin: 16px 0;
                    border: 1px solid #374151;
                }
                
                .editor code {
                    background: #f3f4f6;
                    color: #dc2626;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.9em;
                    border: 1px solid #e5e7eb;
                }
                
                .editor pre code {
                    background: transparent;
                    color: inherit;
                    padding: 0;
                    border: none;
                }
                
                /* Table Styles */
                .editor table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 16px 0;
                    border: 1px solid #e5e7eb;
                }
                
                .editor td {
                    border: 1px solid #d1d5db;
                    padding: 10px;
                    color: #1f2937;
                }
                
                .editor tr:nth-child(even) {
                    background-color: #f9fafb;
                }
                
                /* Text Formatting */
                .editor strong {
                    font-weight: 700;
                    color: #111827;
                }
                
                .editor em {
                    font-style: italic;
                    color: #1f2937;
                }
                
                .editor u {
                    text-decoration: underline;
                    text-decoration-color: #9ca3af;
                }
                
                .editor s {
                    text-decoration: line-through;
                    color: #6b7280;
                }
                
                .editor mark {
                    background-color: #fef3c7;
                    color: #92400e;
                    padding: 0 2px;
                }
                
                /* Toolbar Button Hover Effects */
                .toolbar button {
                    transition: all 0.2s ease;
                }
                
                .toolbar button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .toolbar button:active {
                    transform: translateY(0);
                }
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .toolbar {
                        padding: 8px;
                        gap: 4px;
                    }
                    
                    .toolbar button, .toolbar label {
                        padding: 6px;
                    }
                    
                    .editor {
                        padding: 12px;
                        min-height: 150px;
                        font-size: 14px;
                    }
                    
                    .stats-bar {
                        flex-direction: column;
                        gap: 8px;
                        align-items: flex-start;
                    }
                    
                    .editor h1 { font-size: 1.8em; }
                    .editor h2 { font-size: 1.5em; }
                    .editor h3 { font-size: 1.3em; }
                }
                
                @media (max-width: 480px) {
                    .toolbar {
                        overflow-x: auto;
                        flex-wrap: nowrap;
                        justify-content: flex-start;
                    }
                    
                    .toolbar > * {
                        flex-shrink: 0;
                    }
                    
                    .toolbar::-webkit-scrollbar {
                        height: 3px;
                    }
                    
                    .toolbar::-webkit-scrollbar-thumb {
                        background: #9ca3af;
                        border-radius: 3px;
                    }
                    
                    .stats-bar {
                        font-size: 11px;
                    }
                    
                    .stats-bar .flex {
                        gap: 8px;
                    }
                }
                
                /* Selection Styles */
                .editor ::selection {
                    background: #93c5fd;
                    color: #1e3a8a;
                }
                
                /* Focus Styles */
                .editor:focus {
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
            `}</style>
    </div>
  );
};

export default RichTextEditor;
