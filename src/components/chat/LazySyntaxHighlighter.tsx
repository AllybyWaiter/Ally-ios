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

// Component that handles the lazy loading of syntax highlighter
export const LazySyntaxHighlighter = memo(({ language, children, className }: LazySyntaxHighlighterProps) => {
  const [Highlighter, setHighlighter] = useState<React.ComponentType<SyntaxHighlighterProps> | null>(null);
  const [style, setStyle] = useState<Record<string, React.CSSProperties> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    Promise.all([
      import("react-syntax-highlighter").then((mod) => mod.Prism),
      import("react-syntax-highlighter/dist/esm/styles/prism").then((mod) => mod.oneDark),
    ])
      .then(([HighlighterComponent, styleObj]) => {
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

  return (
    <Highlighter
      style={style}
      language={language}
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
