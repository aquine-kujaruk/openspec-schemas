# Spike

A spike is a throwaway HTML page that shows the person what the change will build, so they can correct a screen before any code exists. It lives in the change, at `openspec/changes/<change>/spikes/<name>.html`, and is archived with it; the product never sees it.

## One file, one question

- Each spike answers one question ("how does the orders list let you cancel one?") and states it at the top of the page, in one visible line. A spike may hold several screens, navigable inside the file, so a journey that crosses them (list, then detail) can be walked; several screens may name the same spike.
- One self-contained file: plain HTML, CSS and JavaScript, everything inline, opened with a double click on `file://`. The person needs nothing installed and no server running.
- The spike emulates what the implementation will build: the screen's layout, its controls, its states (empty, loaded, after each action, an error), in the product's own words. Every label and every value is domain language, never code.
- The literal data it paints is the data the in-memory adapters of the `e2e` environment will be seeded with: pick values the implementation can reuse as they are.
- When the product already has a look, the spike wears it: copy its stylesheet or design tokens and its shell (header, navigation, the surrounding page) inline, so the screen is judged among its real neighbours. A product with no source yet gets a plain, restrained page: clean type, generous spacing, one accent colour.

## Variants

- A screen a convention or a standing screen settles gets one variant.
- A screen that is the person's decision gets 3 variants by default, at most 5, each structurally different: another layout, another information hierarchy, another primary control. Three slightly retouched card grids count as one variant.
- A small fixed bar at the bottom centre switches them: a previous arrow, the variant's key and name (`B · Sidebar`), a next arrow, cycling round. The current variant lives in the `?variant=` parameter or the URL's hash, so a reload or a shared link keeps it.
- Once the person approves one, the spike keeps only that variant, with the changes they asked for, and the bar goes; the screen block says which variant it was.

## Journeys

- Each journey through the spike is a tab: a short line saying what it sets up and what to watch for, then its steps in order, each a real control that performs the action on the page and moves to the next step. Opening a tab resets the page to the journey's known starting state, so it runs the same way every time.
- Cover the happy path and the awkward cases: an empty list, an action that is not allowed, what the screen shows after a write.
- The page also stays free to use outside the tabs, so the person can poke at it in any order.
- Write the same journeys under the screen's block in the plan, as a numbered list of plain-language steps, each ending with what the screen shows afterwards. The implementation turns each one into an end-to-end test.

## Done

The spike is done when it opens by double click, states its question, paints every state its journeys reach, and the screen's block names it with `@spike:spikes/<name>.html`.
