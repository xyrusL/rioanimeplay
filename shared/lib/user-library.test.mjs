import assert from "node:assert/strict";
import test from "node:test";

import { normalizeLibraryPayload } from "../../worker.js";

test("user library payload keeps valid unique bookmarks and progress", () => {
  const result = normalizeLibraryPayload({
    bookmarks: [10, 10, -1, "20", 30],
    progress: [
      { animeId: 10, lastEpisode: 3, watchedEpisodes: [1, 2, 2] },
      { animeId: 10, lastEpisode: 4, watchedEpisodes: [4] },
      { animeId: 30, lastEpisode: 2, watchedEpisodes: [1] },
      { animeId: 40, lastEpisode: 0, watchedEpisodes: [] }
    ]
  });

  assert.deepEqual(result.bookmarks, [10, 30]);
  assert.deepEqual(result.progress, [
    { animeId: 10, lastEpisode: 3, watchedEpisodes: [1, 2, 3] },
    { animeId: 30, lastEpisode: 2, watchedEpisodes: [1, 2] }
  ]);
});
