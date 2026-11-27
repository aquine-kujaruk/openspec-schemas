# Which decisions reach the person: ask on commitment

A decision is a commitment when undoing it later costs the person something: behaviour users will meet, a rule future changes inherit, a standing rule withdrawn. Commitments reach the person; everything else is yours to decide.

Ask, as an item under Open questions, when the decision is:

- **Behaviour the consolidated specs leave open.** What a user will notice and no spec under `openspec/specs` settles.
- **An architecture decision that forks on intent.** One of its options changes what the product can do or for whom: where the person's data lives, whether it works locally or online, on which devices or for how many people, which outside services it needs, what it costs. Storing a product's data is the usual case: files on one machine close the door to reaching it from a phone. If you are unsure whether it forks, it does.
- **Reviewer repair outside an approval.** Ask when a reproduced reviewer defect has an ambiguous standing rule or falls outside the approved repair’s reviewer, rule or scope. Follow the feedback skill for a bounded repair.
- **The end of a standing decision.** Every `@replaces` and every `@removes` on an architecture decision.

Decide alone, in the artifact its scope picks, naming the alternative you discarded, when the decision is:

- **Change-local.** It matters only while this change is built.
- **An architecture decision with a basis.** A consolidated decision already settled the same kind of choice: follow it and tag the decision `@basis:precedent:<slug>`. Or no option it weighs changes what the product can do or for whom: say why under **Alternatives** and tag it `@basis:no-fork`. When the project configures its decision model, validation asks it whether the basis holds; when it doubts, ask the person.
- **Behaviour the consolidated specs settle.** Follow the spec; quote the requirement if the choice could surprise.

An open question states the decision in one line, the options, and the option you would pick with its reason. Write the rest of the change as if that option had been chosen, so one answer confirms the change or redirects it. When the person answers, record the decision in its artifact, tagged `@by:person`, and remove the question in the same update. Every decision you take alone is tagged `@by:agent`.

The last open question is always the person's approval of the plan, with links to the plan, each delta spec and each spike.
