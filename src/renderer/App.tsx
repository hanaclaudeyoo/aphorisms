import { FormEvent, useEffect, useState } from "react";
import type { AphorismTag } from "../shared/types";

export function App() {
  const [tags, setTags] = useState<AphorismTag[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [colorHex, setColorHex] = useState("#4F8EF7");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.aphorisms.tags
      .list()
      .then(setTags)
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : "Failed to load tags.");
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const tag = await window.aphorisms.tags.create({
        name,
        groupName,
        colorHex
      });

      setTags((currentTags) => [...currentTags, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setGroupName("");
      setColorHex("#4F8EF7");
      setIsAdding(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create tag.");
    }
  };

  return (
    <main className="app-shell">
      <section className="tag-tester" aria-labelledby="tag-tester-heading">
        <p className="eyebrow">Local-first notes</p>
        <h1 id="tag-tester-heading">Aphorisms</h1>

        <div className="tag-list" aria-label="Available tags">
          {tags.map((tag) => (
            <span
              className="tag-pill"
              key={tag.id}
              style={{ backgroundColor: tag.colorHex ?? "#777777" }}
            >
              {tag.name}
            </span>
          ))}

          <button
            aria-label="Add tag"
            className="add-tag-button"
            onClick={() => setIsAdding((current) => !current)}
            type="button"
          >
            +
          </button>
        </div>

        {isAdding ? (
          <form className="tag-form" onSubmit={handleSubmit}>
            <input
              aria-label="Tag name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Tag name"
              required
              type="text"
              value={name}
            />
            <input
              aria-label="Tag group"
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group"
              required
              type="text"
              value={groupName}
            />
            <input
              aria-label="Tag color"
              onChange={(event) => setColorHex(event.target.value)}
              type="color"
              value={colorHex}
            />
            <button type="submit">Add</button>
          </form>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </main>
  );
}
