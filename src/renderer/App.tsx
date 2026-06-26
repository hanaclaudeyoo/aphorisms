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
  const [entries, setEntries] = useState<AphorismEntry[]>([]);
  const [listPage, setListPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [listError, setListError] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  useEffect(() => {
    window.aphorisms.tags
      .list()
      .then(setTags)
      .catch((caughtError: unknown) => {
        setTagError(caughtError instanceof Error ? caughtError.message : "Failed to load tags.");
      });
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    setListError(null);

    window.aphorisms.entries
      .list({
        page: listPage,
        pageSize: 5,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        tagId: tagFilter || undefined,
        sortDirection
      })
      .then((result) => {
        if (!isCurrentRequest) {
          return;
        }

        setEntries(result.entries);
        setTotalEntries(result.totalEntries);
        setTotalPages(result.totalPages);
      })
      .catch((caughtError: unknown) => {
        if (isCurrentRequest) {
          setListError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to load entries."
          );
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [
    endDateFilter,
    listPage,
    listRefreshKey,
    sortDirection,
    startDateFilter,
    tagFilter
  ]);

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
      setListPage(1);
      setListRefreshKey((currentKey) => currentKey + 1);
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

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));

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

        <section className="entries-browser" aria-labelledby="entries-heading">
          <div className="entries-heading-row">
            <h2 id="entries-heading">Entries</h2>
            <span>{totalEntries} total</span>
          </div>

          <div className="entry-filters">
            <label>
              <span>From</span>
              <input
                onChange={(event) => {
                  setStartDateFilter(event.target.value);
                  setListPage(1);
                }}
                type="date"
                value={startDateFilter}
              />
            </label>

            <label>
              <span>To</span>
              <input
                onChange={(event) => {
                  setEndDateFilter(event.target.value);
                  setListPage(1);
                }}
                type="date"
                value={endDateFilter}
              />
            </label>

            <label>
              <span>Tag</span>
              <select
                onChange={(event) => {
                  setTagFilter(event.target.value);
                  setListPage(1);
                }}
                value={tagFilter}
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort</span>
              <select
                onChange={(event) => {
                  setSortDirection(event.target.value as "asc" | "desc");
                  setListPage(1);
                }}
                value={sortDirection}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </label>
          </div>

          {listError ? <p className="form-error">{listError}</p> : null}

          <div className="entry-list">
            {entries.map((entry) => (
              <article className="entry-list-item" key={entry.id}>
                <div className="entry-list-meta">
                  <time dateTime={entry.entryDate}>{entry.entryDate}</time>
                  <span>#{entry.id}</span>
                </div>
                <p>{entry.text}</p>
                {entry.tagIds.length > 0 ? (
                  <div className="entry-list-tags">
                    {entry.tagIds.map((tagId) => {
                      const tag = tagsById.get(tagId);

                      return tag ? (
                        <span
                          key={tag.id}
                          style={{ backgroundColor: tag.colorHex ?? "#777777" }}
                        >
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : null}
              </article>
            ))}

            {!listError && entries.length === 0 ? (
              <p className="empty-entries">No entries match these filters.</p>
            ) : null}
          </div>

          <nav className="pagination" aria-label="Entry pages">
            <button
              disabled={listPage <= 1}
              onClick={() => setListPage((currentPage) => currentPage - 1)}
              type="button"
            >
              Previous
            </button>
            <span>
              Page {listPage} of {Math.max(totalPages, 1)}
            </span>
            <button
              disabled={totalPages === 0 || listPage >= totalPages}
              onClick={() => setListPage((currentPage) => currentPage + 1)}
              type="button"
            >
              Next
            </button>
          </nav>
        </section>
      </div>
    </main>
  );
}
