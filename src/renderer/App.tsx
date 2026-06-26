import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AphorismEntry, AphorismTag } from "../shared/types";

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function App() {
  const [tags, setTags] = useState<AphorismTag[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [colorHex, setColorHex] = useState("#4F8EF7");
  const [tagError, setTagError] = useState<string | null>(null);
  const [entryText, setEntryText] = useState("");
  const [entryDate, setEntryDate] = useState(getLocalDate);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [createdEntry, setCreatedEntry] = useState<AphorismEntry | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);

  useEffect(() => {
    window.aphorisms.tags
      .list()
      .then(setTags)
      .catch((caughtError: unknown) => {
        setTagError(caughtError instanceof Error ? caughtError.message : "Failed to load tags.");
      });
  }, []);

  const handleTagSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTagError(null);

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
      setTagError(caughtError instanceof Error ? caughtError.message : "Failed to create tag.");
    }
  };

  const handleEntrySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntryError(null);

    try {
      const entry = await window.aphorisms.entries.create({
        text: entryText,
        entryDate,
        tagIds: selectedTagIds
      });

      setCreatedEntry(entry);
      setEntryText("");
      setSelectedTagIds([]);
    } catch (caughtError) {
      setEntryError(
        caughtError instanceof Error ? caughtError.message : "Failed to create entry."
      );
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((currentTagIds) =>
      currentTagIds.includes(tagId)
        ? currentTagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...currentTagIds, tagId]
    );
  };

  return (
    <main className="app-shell">
      <div className="test-workspace">
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
            <form className="tag-form" onSubmit={handleTagSubmit}>
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

          {tagError ? <p className="form-error">{tagError}</p> : null}
        </section>

        <section className="entry-tester" aria-labelledby="entry-tester-heading">
          <h2 id="entry-tester-heading">New entry</h2>

          <form className="entry-form" onSubmit={handleEntrySubmit}>
            <textarea
              aria-label="Entry text"
              onChange={(event) => setEntryText(event.target.value)}
              placeholder="Write an aphorism..."
              required
              rows={5}
              value={entryText}
            />

            <label className="date-field">
              <span>Date</span>
              <input
                onChange={(event) => setEntryDate(event.target.value)}
                required
                type="date"
                value={entryDate}
              />
            </label>

            {tags.length > 0 ? (
              <fieldset className="entry-tags">
                <legend>Tags</legend>
                <div className="tag-options">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);

                    return (
                      <label
                        className="tag-option"
                        key={tag.id}
                        style={{ backgroundColor: tag.colorHex ?? "#777777" }}
                      >
                        <input
                          checked={isSelected}
                          onChange={() => toggleTag(tag.id)}
                          type="checkbox"
                        />
                        <span>{tag.name}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <button className="save-entry-button" type="submit">
              Save entry
            </button>
          </form>

          {entryError ? <p className="form-error">{entryError}</p> : null}

          {createdEntry ? (
            <div className="saved-entry" aria-live="polite">
              <p className="saved-label">Saved entry #{createdEntry.id}</p>
              <p>{createdEntry.text}</p>
              <time dateTime={createdEntry.entryDate}>{createdEntry.entryDate}</time>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
