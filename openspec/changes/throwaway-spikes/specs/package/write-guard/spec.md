## REMOVED Requirements

### Requirement: A change being planned opens the paths of its spike workstream

**Reason**: The plan no longer builds the spike in the product: it writes throwaway HTML under the change's `spikes/` folder, which is neither harness nor product and was never guarded. Product code opens only to a change in implementation, as for any other schema.

**Migration**: None. A change of a schema with a spike workstream builds that workstream's files once it is in implementation, like every other workstream.
