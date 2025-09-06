"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

export default function RegexlyApp() {
  const [regexPattern, setRegexPattern] = useState("");
  const [testText, setTestText] = useState("");
  const [flags, setFlags] = useState({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [error, setError] = useState("");

  const flagString = useMemo(() => {
    return Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => flag)
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
      const escapedMatch = match.match
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      result += `<span class="bg-green-500 text-black rounded px-1 py-0.5 font-medium">${escapedMatch}</span>`;
      lastIndex = match.index + match.match.length;
    });

    result += testText.slice(lastIndex);
    return result;
  }, [testText, matches]);

  const handleFlagChange = (flag: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const flagDetails = [
    { flag: "g", label: "Global", desc: "(g)" },
    { flag: "i", label: "Ignore Case", desc: "(i)" },
    { flag: "m", label: "Multiline", desc: "(m)" },
    { flag: "s", label: "Dot All", desc: "(s)" },
    { flag: "u", label: "Unicode", desc: "(u)" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="py-16 text-center">
        <div className="mx-auto max-w-5xl px-8">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700">
              <span className="text-3xl font-mono text-green-400 font-bold">
                .*
              </span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Regexly</h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Test regex patterns with real-time highlighting. Built for
            developers who need instant feedback.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-8 shadow-2xl">
          <div className="mb-8">
            <h3 className="mb-3 text-xl font-semibold text-white">Pattern</h3>
            <p className="mb-6 text-neutral-400">
              Enter your regex pattern and see matches highlighted in real-time.
            </p>

            <div className="space-y-6">
              <Input
                placeholder="Enter regex pattern (e.g., \d+|[a-zA-Z]+)"
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                className="border-neutral-700 bg-neutral-800/50 font-mono text-white placeholder:text-neutral-500 h-12 text-lg rounded-xl"
              />

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-6 flex-wrap">
                <span className="text-sm font-medium text-neutral-300">
                  Flags:
                </span>
                {flagDetails.map(({ flag, label, desc }) => (
                  <label
                    key={flag}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={flags[flag as keyof typeof flags]}
                      onCheckedChange={() =>
                        handleFlagChange(flag as keyof typeof flags)
                      }
                      className="
                        w-5 h-5
                        border border-neutral-600
                        rounded-md
                        bg-neutral-800/50
                        data-[state=checked]:bg-green-500
                        data-[state=checked]:border-green-500
                        data-[state=checked]:text-white
                        transition-colors
                      "
                    />

                    <span className="font-mono text-neutral-300 font-medium">
                      {desc}
                    </span>
                    <span className="text-neutral-400">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Test Text</h3>
              {matches.length > 0 && (
                <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1">
                  {matches.length} matches
                </Badge>
              )}
            </div>

            <div className="relative">
              <Textarea
                placeholder="Paste your text here to test the regex pattern..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="min-h-[300px] border-neutral-700 bg-neutral-800/50 font-mono text-white placeholder:text-neutral-500 rounded-xl text-base leading-relaxed resize-none relative z-10 bg-transparent"
                style={{ color: matches.length > 0 ? "transparent" : "white" }}
              />
              {testText && matches.length > 0 && (
                <div className="absolute inset-0 p-3 font-mono text-base leading-relaxed whitespace-pre-wrap break-words overflow-hidden rounded-xl pointer-events-none z-20">
                  <div
                    className={
                      matches.length > 0 ? "text-white" : "text-transparent"
                    }
                    dangerouslySetInnerHTML={{ __html: highlightedText }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="pb-12">
        <div className="mx-auto max-w-5xl px-8">
          <div className="mt-12 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-600 to-transparent"></div>

          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="flex gap-1.5 items-center text-neutral-300">
              <p>Powered by</p>
              <a
                className="flex items-center gap-1.5 hover:underline hover:text-white transition-colors"
                href="https://appwrite.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/appwrite.svg" className="w-4 h-4" alt="Appwrite" />
                <p>Appwrite</p>
              </a>
            </div>

            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <p>Made with</p>
              <Heart className="w-4 h-4 text-red-500" />
              <p>by developers, for developers</p>
            </div>

            <a
              href="https://github.com/omar8345/regexly"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white text-sm transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
