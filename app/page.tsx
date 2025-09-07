"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Heart, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

interface RegexFlags {
  g: boolean;
  i: boolean;
  m: boolean;
  s: boolean;
  u: boolean;
}

const FLAG_DETAILS = [
  { flag: "g", label: "Global", desc: "(g)" },
  { flag: "i", label: "Ignore Case", desc: "(i)" },
  { flag: "m", label: "Multiline", desc: "(m)" },
  { flag: "s", label: "Dot All", desc: "(s)" },
  { flag: "u", label: "Unicode", desc: "(u)" },
] as const;

const DEFAULT_TEXT = `Welcome to Regexly! Test regex patterns with real-time highlighting.

Email: user@example.com
Phone: +1 (555) 123-4567
Date: 2024-01-15
URL: https://regexly.dev

Numbers: 42, 123, 2024
Words: Hello, World, Testing
Special: #hashtag, @mention, $price`;

const SAMPLE_PATTERNS = [
  {
    name: "Emails",
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
  },
  {
    name: "Phone Numbers",
    pattern: "\\+?1?[-. ]?\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}",
  },
  {
    name: "URLs",
    pattern: "https?://[\\w\\.-]+\\.[a-z]{2,}[\\w\\./\\?\\=\\&\\%]*",
  },
  { name: "Dates", pattern: "\\d{4}-\\d{2}-\\d{2}" },
];

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export default function RegexlyApp() {
  const [regexPattern, setRegexPattern] = useState(
    "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
  );
  const [testText, setTestText] = useState(DEFAULT_TEXT);
  const [flags, setFlags] = useState<RegexFlags>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  const flagString = useMemo(() => {
    return Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([flag]) => flag)
      .join("");
  }, [flags]);

  useEffect(() => {
    if (!regexPattern || !testText) {
      setMatches([]);
      setError("");
      return;
    }

    try {
      const regex = new RegExp(regexPattern, flagString);
      const foundMatches: RegexMatch[] = [];

      if (flags.g) {
        let match;
        while ((match = regex.exec(testText)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (match.index === regex.lastIndex) break;
        }
      } else {
        const match = regex.exec(testText);
        if (match) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regex pattern");
      setMatches([]);
    }
  }, [regexPattern, testText, flagString, flags.g]);

  const highlightedText = useMemo(() => {
    if (!testText || matches.length === 0) return testText;

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    let result = "";
    let lastIndex = 0;

    sortedMatches.forEach((match) => {
      result += testText.slice(lastIndex, match.index);
      const escapedMatch = escapeHtml(match.match);
      result += `<span class="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md px-2 py-1 font-semibold shadow-sm">${escapedMatch}</span>`;
      lastIndex = match.index + match.match.length;
    });

    result += testText.slice(lastIndex);
    return result;
  }, [testText, matches]);

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorPosition = range?.startOffset;
    const parentNode = range?.startContainer;

    const text = e.currentTarget.textContent || "";
    setTestText(text);

    setTimeout(() => {
      if (contentEditableRef.current && selection && parentNode) {
        try {
          const newRange = document.createRange();
          const textNodes = getTextNodesIn(contentEditableRef.current);
          let charCount = 0;

          for (const textNode of textNodes) {
            const nextCharCount = charCount + textNode.textContent!.length;
            if (cursorPosition! <= nextCharCount) {
              newRange.setStart(textNode, cursorPosition! - charCount);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              break;
            }
            charCount = nextCharCount;
          }
        } catch (error) {
          const newRange = document.createRange();
          newRange.selectNodeContents(contentEditableRef.current);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }, 0);
  };

  const getTextNodesIn = (node: Node): Text[] => {
    const textNodes: Text[] = [];
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text);
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        textNodes.push(...getTextNodesIn(node.childNodes[i]));
      }
    }
    return textNodes;
  };

  const handleFlagChange = (flag: keyof RegexFlags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const copyPattern = async () => {
    await navigator.clipboard.writeText(regexPattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="relative">
        <header className="relative py-16 text-center">
          <div className="mx-auto max-w-6xl px-8">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
                  <span className="text-2xl font-mono font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    .*
                  </span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">Regexly</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              Test regex patterns with real-time highlighting and instant
              feedback.
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-400">
              <span className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                ⚡ Real-time matching
              </span>
              <span className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                🎨 Syntax highlighting
              </span>
              <span className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                🚀 Instant feedback
              </span>
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-8 pb-20">
        <div className="rounded-3xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-10 shadow-2xl">
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
              Quick Start
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SAMPLE_PATTERNS.map((sample) => (
                <Button
                  key={sample.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setRegexPattern(sample.pattern)}
                  className="h-auto p-3 text-left flex-col items-start gap-1 border-slate-600/50 hover:border-emerald-400/50 hover:bg-emerald-400/5"
                >
                  <span className="font-medium">{sample.name}</span>
                  <span className="text-xs text-gray-400 font-mono truncate w-full">
                    {sample.pattern.slice(0, 20)}...
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Pattern</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyPattern}
                className="border-slate-600/50 hover:border-emerald-400/50"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  placeholder="Enter your regex pattern..."
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="border-slate-600/50 bg-slate-800/50 backdrop-blur-sm font-mono placeholder:text-gray-500 h-14 !text-lg rounded-xl focus-visible:!border-emerald-400/50 focus-visible:!ring-emerald-400/20 transition-all duration-200"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  /{flagString}
                </div>
              </div>

              {error && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-sm" />
                  <div className="relative text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-8 flex-wrap">
                <span className="text-sm font-semibold text-gray-300">
                  Flags:
                </span>
                {FLAG_DETAILS.map(({ flag, label, desc }) => (
                  <label
                    key={flag}
                    className="flex items-center gap-3 text-sm cursor-pointer group"
                  >
                    <Checkbox
                      checked={flags[flag as keyof RegexFlags]}
                      onCheckedChange={() =>
                        handleFlagChange(flag as keyof RegexFlags)
                      }
                      className="w-5 h-5 border-slate-500 bg-slate-800/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all duration-200"
                    />
                    <span className="font-mono text-emerald-400 font-semibold group-hover:text-emerald-300 transition-colors">
                      {desc}
                    </span>
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Test Text</h3>
              {matches.length > 0 && (
                <Badge className="bg-slate-700/50 text-slate-200 border-slate-600/50 px-4 py-2 font-semibold">
                  {matches.length} {matches.length === 1 ? "match" : "matches"}
                </Badge>
              )}
            </div>

            <div className="relative">
              {matches.length > 0 ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-xl blur-sm" />
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    suppressContentEditableWarning={true}
                    onInput={handleTextChange}
                    className="relative min-h-[350px] w-full border border-slate-600/50 bg-slate-800/30 backdrop-blur-sm p-6 font-mono text-lg leading-relaxed rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/50 transition-all duration-200"
                    dangerouslySetInnerHTML={{ __html: highlightedText }}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  />
                </div>
              ) : (
                <Textarea
                  placeholder="Paste your text here to test the regex pattern..."
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="min-h-[350px] border-slate-600/50 bg-slate-800/30 backdrop-blur-sm p-6 font-mono !text-lg leading-relaxed placeholder:text-gray-500 rounded-xl focus-visible:!border-emerald-400/50 focus-visible:!ring-emerald-400/20 transition-all duration-200"
                />
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-8 py-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex gap-2 items-center text-gray-300">
              <span>Powered by</span>
              <a
                className="flex items-center gap-2 hover:text-emerald-400 transition-colors font-medium"
                href="https://appwrite.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/appwrite.svg" className="w-5 h-5" alt="Appwrite" />
                Appwrite
              </a>
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span>by developers, for developers</span>
            </div>

            <a
              href="https://github.com/omar8345/regexly"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-emerald-400 text-sm transition-colors font-medium"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
