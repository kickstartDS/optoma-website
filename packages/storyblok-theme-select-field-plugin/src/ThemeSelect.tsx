import { useCallback, useEffect, useMemo, useState } from "react";

interface Theme {
  slug: string;
  name: string;
  primaryColor: string | null;
}

interface ThemeSelectProps {
  value: string | undefined;
  token: string;
  spaceId: number | null;
  onChange: (slug: string | null) => void;
}

const STORYBLOK_CDN = "https://api.storyblok.com/v2/cdn/stories";

/** Extract the primary brand color from the tokens JSON string. */
function extractPrimaryColor(tokensJson: string | undefined): string | null {
  if (!tokensJson) return null;
  try {
    const tokens = JSON.parse(tokensJson);
    // Navigate the branding token structure for the primary color
    return (
      tokens?.["ks-brand-color"]?.primary ||
      tokens?.["ks-brand-color-primary"] ||
      tokens?.color?.primary ||
      null
    );
  } catch {
    return null;
  }
}

export function ThemeSelect({
  value,
  token,
  spaceId,
  onChange,
}: ThemeSelectProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchThemes = useCallback(async () => {
    if (!token) {
      setError("No API token available");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        token,
        starts_with: "settings/themes/",
        content_type: "token-theme",
        per_page: "100",
        version: "published",
      });

      const res = await fetch(`${STORYBLOK_CDN}?${params}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const fetched: Theme[] = (data.stories ?? []).map(
        (story: Record<string, unknown>) => ({
          slug: (story as { slug: string }).slug,
          name:
            ((story as { content?: { name?: string } }).content
              ?.name as string) || (story as { name: string }).name,
          primaryColor: extractPrimaryColor(
            (story as { content?: { tokens?: string } }).content
              ?.tokens as string
          ),
        })
      );

      fetched.sort((a, b) => a.name.localeCompare(b.name));
      setThemes(fetched);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load themes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const filtered = useMemo(() => {
    if (!search) return themes;
    const q = search.toLowerCase();
    return themes.filter((t) => t.name.toLowerCase().includes(q));
  }, [themes, search]);

  const selectedTheme = themes.find((t) => t.slug === value);

  if (loading) {
    return <div style={styles.container}>Loading themes…</div>;
  }

  if (error) {
    return <div style={{ ...styles.container, color: "#b00020" }}>{error}</div>;
  }

  if (themes.length === 0) {
    return (
      <div style={styles.container}>
        <span style={styles.empty}>
          No themes found. Create token-theme stories under settings/themes/.
        </span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Current selection display */}
      <div style={styles.selectedRow}>
        {selectedTheme ? (
          <>
            <ColorDot color={selectedTheme.primaryColor} />
            <span style={styles.selectedName}>{selectedTheme.name}</span>
            <button
              type="button"
              style={styles.clearBtn}
              onClick={() => onChange(null)}
              title="Clear theme selection"
            >
              ✕
            </button>
          </>
        ) : (
          <span style={styles.placeholder}>No theme selected</span>
        )}
      </div>

      {/* Search input */}
      {themes.length > 5 && (
        <input
          type="text"
          placeholder="Search themes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      )}

      {/* Theme list */}
      <div style={styles.list}>
        {filtered.map((theme) => (
          <button
            key={theme.slug}
            type="button"
            style={{
              ...styles.option,
              ...(theme.slug === value ? styles.optionActive : {}),
            }}
            onClick={() => onChange(theme.slug)}
          >
            <ColorDot color={theme.primaryColor} />
            <span>{theme.name}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={styles.noResults}>No matching themes</div>
        )}
      </div>
    </div>
  );
}

function ColorDot({ color }: { color: string | null }) {
  return (
    <span
      style={{
        ...styles.dot,
        backgroundColor: color || "#ccc",
        borderColor: color ? "transparent" : "#999",
      }}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    lineHeight: 1.4,
  },
  selectedRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    marginBottom: 6,
  },
  selectedName: {
    fontWeight: 600,
    flex: 1,
  },
  placeholder: {
    color: "#999",
    fontStyle: "italic",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    fontSize: 14,
    padding: "2px 6px",
    borderRadius: 4,
  },
  searchInput: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 4,
    boxSizing: "border-box",
  },
  list: {
    maxHeight: 200,
    overflowY: "auto",
    border: "1px solid #eee",
    borderRadius: 4,
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    border: "none",
    background: "none",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    borderBottom: "1px solid #f5f5f5",
  },
  optionActive: {
    backgroundColor: "#e8f0fe",
    fontWeight: 600,
  },
  dot: {
    display: "inline-block",
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "1px solid transparent",
    flexShrink: 0,
  },
  noResults: {
    padding: "12px 10px",
    color: "#999",
    textAlign: "center",
    fontSize: 13,
  },
  empty: {
    color: "#999",
    fontSize: 13,
  },
};
