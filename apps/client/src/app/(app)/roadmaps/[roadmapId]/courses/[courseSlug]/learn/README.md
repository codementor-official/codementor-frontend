# Lesson player — currently unreachable

`learn/[lessonId]` renders the course lesson player (video, article, exercise panes) from
`data/roadmaps.ts`. Nothing links to it any more: course detail moved to `/courses/[courseId]`,
which is keyed by the backend's UUID, and the learning service has no lesson-content route the
client consumes yet.

Kept rather than deleted because the player is real work and the gap is a backend one — it
needs `GET /courses/:id/lessons/:lessonId/content`, which exists, wired to a route under
`/courses/[courseId]/`. Delete this directory if that never happens.
