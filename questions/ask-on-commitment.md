# Which decisions reach the person: ask on commitment

A decision is a commitment when undoing it later costs the person something: behaviour users will meet, a rule future changes inherit, a standing rule withdrawn. Commitments reach the person; everything else is yours to decide.

Ask, as an item under Open questions, when the decision is:

- **Behaviour the consolidated specs leave open.** What a user will notice and no spec under `openspec/specs` settles.
- **A decision that binds future changes.** Every architecture decision the plan writes.
- **The end of a standing decision.** Every `@replaces` and every `@removes` on an architecture decision.

Decide alone, in the artifact its scope picks, naming the alternative you discarded, when the decision is:

- **Change-local.** It matters only while this change is built.
- **Behaviour the consolidated specs settle.** Follow the spec; quote the requirement if the choice could surprise.

An open question states the decision in one line, the options, and the option you would pick with its reason. Write the rest of the change as if that option had been chosen, so one answer confirms the change or redirects it. When the person answers, record the decision in its artifact and remove the question in the same update.
