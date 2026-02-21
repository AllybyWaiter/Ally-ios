import { useState, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Simple fallback for code blocks while loading
const CodeFallback = ({ children, className }: { children: string; className?: string }) => (
  <pre className={cn("bg-muted rounded-md p-4 overflow-auto text-sm my-2", className)}>
    <code className="font-mono">{children}</code>
  </pre>
);

interface LazySyntaxHighlighterProps {
  language: string;
  children: string;
  className?: string;
}

// Props interface for the dynamically loaded syntax highlighter
interface SyntaxHighlighterProps {
  style: Record<string, React.CSSProperties>;
  language: string;
  PreTag: string;
  className?: string;
  customStyle?: React.CSSProperties;
  children: string;
}

interface SyntaxHighlighterComponent extends React.ComponentType<SyntaxHighlighterProps> {
  registerLanguage?: (name: string, language: unknown) => void;
}

let syntaxLoaderPromise: Promise<{
  Highlighter: SyntaxHighlighterComponent;
  style: Record<string, React.CSSProperties>;
}> | null = null;

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  py: "python",
  yml: "yaml",
  md: "markdown",
};

function normalizeLanguage(language: string): string {
  const lower = language.toLowerCase().trim();
  return LANGUAGE_ALIASES[lower] ?? lower;
}

function loadSyntaxHighlighter() {
  if (!syntaxLoaderPromise) {
    syntaxLoaderPromise = Promise.all([
      import("react-syntax-highlighter/dist/esm/prism-light"),
      import("react-syntax-highlighter/dist/esm/styles/prism/one-dark"),
      import("react-syntax-highlighter/dist/esm/languages/prism/javascript"),
      import("react-syntax-highlighter/dist/esm/languages/prism/typescript"),
      import("react-syntax-highlighter/dist/esm/languages/prism/jsx"),
      import("react-syntax-highlighter/dist/esm/languages/prism/tsx"),
      import("react-syntax-highlighter/dist/esm/languages/prism/json"),
      import("react-syntax-highlighter/dist/esm/languages/prism/bash"),
      import("react-syntax-highlighter/dist/esm/languages/prism/python"),
      import("react-syntax-highlighter/dist/esm/languages/prism/sql"),
      import("react-syntax-highlighter/dist/esm/languages/prism/yaml"),
      import("react-syntax-highlighter/dist/esm/languages/prism/markdown"),
    ]).then(([
      prismLight,
      oneDark,
      javascript,
      typescript,
      jsx,
      tsx,
      json,
      bash,
      python,
      sql,
      yaml,
      markdown,
    ]) => {
      const Highlighter = prismLight.default as SyntaxHighlighterComponent;

      Highlighter.registerLanguage?.("javascript", javascript.default);
      Highlighter.registerLanguage?.("typescript", typescript.default);
      Highlighter.registerLanguage?.("jsx", jsx.default);
      Highlighter.registerLanguage?.("tsx", tsx.default);
      Highlighter.registerLanguage?.("json", json.default);
      Highlighter.registerLanguage?.("bash", bash.default);
      Highlighter.registerLanguage?.("python", python.default);
      Highlighter.registerLanguage?.("sql", sql.default);
      Highlighter.registerLanguage?.("yaml", yaml.default);
      Highlighter.registerLanguage?.("markdown", markdown.default);

      return {
        Highlighter,
        style: oneDark.default,
      };
    });
  }

  return syntaxLoaderPromise;
}

// Component that handles the lazy loading of syntax highlighter
export const LazySyntaxHighlighter = memo(({ language, children, className }: LazySyntaxHighlighterProps) => {
  const [Highlighter, setHighlighter] = useState<SyntaxHighlighterComponent | null>(null);
  const [style, setStyle] = useState<Record<string, React.CSSProperties> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadSyntaxHighlighter()
      .then(({ Highlighter: HighlighterComponent, style: styleObj }) => {
        if (mounted) {
          setHighlighter(() => HighlighterComponent);
          setStyle(styleObj);
        }
      })
      .catch((err) => {
        logger.error("Failed to load syntax highlighter:", err);
        if (mounted) {
          setLoadError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Show fallback on error or while loading
  if (loadError || !Highlighter || !style) {
    return <CodeFallback className={className}>{children}</CodeFallback>;
  }

  const normalizedLanguage = normalizeLanguage(language);

  return (
    <Highlighter
      style={style}
      language={normalizedLanguage}
      PreTag="div"
      className={cn("rounded-md my-2 text-sm", className)}
      customStyle={{
        margin: 0,
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
      }}
    >
      {children}
    </Highlighter>
  );
});

LazySyntaxHighlighter.displayName = "LazySyntaxHighlighter";
