# vera-markdown Domain Schema Reference

**Version:** 2.0.0
**Total Definitions:** 109

## Table of Contents

- [Entity Blocks](#entity-blocks) (54)
- [Vocabulary Enums](#vocabulary-enums) (23)
- [Atomic Types](#atomic-types) (3)
- [Supporting Types](#supporting-types) (8)
- [Provenance Types](#provenance-types) (2)
- [Shared Definitions](#shared-definitions) (19)

---

## Entity Blocks

### Abstract

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for abstract_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: abstract_block |

### Admonition

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for admonition_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: admonition_block |

### Annotation

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for annotation_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: annotation_block |

### ArgumentBlock

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for argument_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: argument_block |

### AxiomDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for axiom_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: axiom_def |

### Claim

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for claim_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: claim_block |

### Code

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for code_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: code_block |

### Comparison

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for comparison_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: comparison_block |

### Correction

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for correction_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: correction_block |

### Counterpoint

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for counterpoint_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: counterpoint_block |

### Decision

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for decision_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: decision_block |

### Definition

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for definition |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: definition |

### Diagram

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for diagram_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: diagram_block |

### Dialogue

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for dialogue_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: dialogue_block |

### Disputed

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for disputed_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: disputed_block |

### EnumDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for enum_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: enum_def |

### Example

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for example_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: example_block |

### Exercise

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for exercise_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: exercise_block |

### Fact

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for fact_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: fact_block |

### Figure

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for figure_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: figure_block |

### Formula

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for formula_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: formula_block |

### FunctionDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for function_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: function_def |

### Gap

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for gap_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: gap_block |

### GrammarDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for grammar_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: grammar_def |

### Guarantee

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for guarantee_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: guarantee_block |

### Hypothesis

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for hypothesis_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: hypothesis_block |

### Interpolation

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for interpolation_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: interpolation_block |

### Interpretation

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for interpretation |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Element type: interpretation |

### JudgmentDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for judgment_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: judgment_def |

### Letter

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for letter_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: letter_block |

### NamedEntity

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for entity_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: entity_block |

### NotationDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for notation_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: notation_def |

### Operation

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for operation_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: operation_block |

### Para

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for para |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: para |

### PredicateDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for predicate_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: predicate_def |

### Procedure

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for procedure_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: procedure_block |

### Profile

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for profile_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: profile_block |

### Proof

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for proof_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: proof_block |

### Quote

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for quote_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: quote_block |

### Redaction

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for redaction_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: redaction_block |

### ReferenceDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for reference_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: reference_def |

### Result

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for result_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: result_block |

### RuleDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for rule_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: rule_def |

### Section

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for section_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: section_block |

### Summary

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for summary_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: summary_block |

### Table

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for table_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: table_block |

### TermDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for term_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: term_def |

### Testimony

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for testimony_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: testimony_block |

### Theorem

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for theorem_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: theorem_block |

### Timeline

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for timeline_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: timeline_block |

### Transcript

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for transcript_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: transcript_block |

### Translation

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for translation_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: translation_block |

### TypeDef

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for type_def |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: type_def |

### Verse

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for verse_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: verse_block |

## Vocabulary Enums

### AdmonitionVariantKind

**Type:** Enum

| Value |
|-------|
| `note` |
| `warning` |
| `tip` |
| `important` |
| `caution` |

### AnnotationKind

**Type:** Enum

| Value |
|-------|
| `translator` |
| `editor` |
| `ai` |
| `archivist` |
| `reviewer` |

### ArgumentFormKind

**Type:** Enum

| Value |
|-------|
| `deductive` |
| `inductive` |
| `abductive` |
| `analogical` |

### ClaimStrengthKind

**Type:** Enum

| Value |
|-------|
| `certain` |
| `probable` |
| `speculative` |
| `contested` |

### CorrectionSeverityKind

**Type:** Enum

| Value |
|-------|
| `minor` |
| `major` |
| `critical` |

### DecisionStatus

**Type:** Enum

| Value |
|-------|
| `pending` |
| `decided` |
| `deferred` |
| `superseded` |

### DifficultyLevel

**Type:** Enum

| Value |
|-------|
| `beginner` |
| `intermediate` |
| `advanced` |

### EvidenceKind

**Type:** Enum

| Value |
|-------|
| `empirical` |
| `testimonial` |
| `documentary` |
| `statistical` |
| `circumstantial` |

### EvidenceStrengthKind

**Type:** Enum

| Value |
|-------|
| `strong` |
| `moderate` |
| `weak` |
| `disputed` |

### ExtractionMethodKind

**Type:** Enum

| Value |
|-------|
| `manual` |
| `ocr` |
| `llm` |
| `transcription` |
| `hybrid` |

### GapKind

**Type:** Enum

| Value |
|-------|
| `illegible` |
| `damaged` |
| `omitted` |
| `corrupted` |

### GapUnitKind

**Type:** Enum

| Value |
|-------|
| `chars` |
| `words` |
| `lines` |
| `paragraphs` |
| `pages` |

### HypothesisStatus

**Type:** Enum

| Value |
|-------|
| `proposed` |
| `testing` |
| `supported` |
| `refuted` |
| `inconclusive` |

### NamedEntityKind

**Type:** Enum

| Value |
|-------|
| `person` |
| `organization` |
| `location` |
| `event` |
| `concept` |
| `artifact` |
| `work` |

### NumberingStyleKind

**Type:** Enum

| Value |
|-------|
| `numeric` |
| `alpha` |
| `ALPHA` |
| `roman` |
| `ROMAN` |
| `none` |

### ProofMethodKind

**Type:** Enum

| Value |
|-------|
| `direct` |
| `contradiction` |
| `induction` |
| `construction` |
| `cases` |
| `contrapositive` |

### ProvenanceSourceKind

**Type:** Enum

| Value |
|-------|
| `pdf` |
| `url` |
| `book` |
| `video` |
| `audio` |
| `manual` |

### RedactionBasisKind

**Type:** Enum

| Value |
|-------|
| `privacy` |
| `security` |
| `legal` |
| `commercial` |
| `unspecified` |

### ReferenceKind

**Type:** Enum

| Value |
|-------|
| `article` |
| `book` |
| `inproceedings` |
| `thesis` |
| `misc` |
| `online` |

### ReviewStatus

**Type:** Enum

| Value |
|-------|
| `none` |
| `partial` |
| `complete` |

### TheoremVariantKind

**Type:** Enum

| Value |
|-------|
| `theorem` |
| `lemma` |
| `corollary` |
| `proposition` |

### TotalityKind

**Type:** Enum

| Value |
|-------|
| `total` |
| `partial` |

### TranslationMethodKind

**Type:** Enum

| Value |
|-------|
| `human` |
| `mt` |
| `hybrid` |
| `unknown` |

## Atomic Types

### Evidence

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for evidence_block |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Entity type: evidence_block |

### OptionalConfidence

### UlidId

## Supporting Types

### Extent

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `unit` | [GapUnitKind](#gapunitkind) | Yes | Unit of measurement |
| `min` | integer | No | Minimum estimated size |
| `max` | integer | No | Maximum estimated size |
| `estimate` | integer | No | Best estimate of size |

### ExtractionInfo

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `method` | [ExtractionMethodKind](#extractionmethodkind) | Yes | Method used to extract content |
| `pipeline` | string | No | Name of extraction pipeline |
| `model` | string | No | Model used for LLM extraction |
| `confidence` | number | No | Overall extraction confidence (0-1) |
| `extractedAt` | [IsoDateTime](#isodatetime) | No | ISO datetime of extraction |

### OptionalPosition

**Type:** Reference to [Position](#position)

### Position

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `start` | [Point](#point) | Yes |  |
| `end` | [Point](#point) | Yes |  |

### ReviewInfo

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `status` | [ReviewStatus](#reviewstatus) | Yes | Review completion status |
| `reviewer` | string | No | Reviewer identifier |
| `reviewedAt` | [IsoDateTime](#isodatetime) | No | ISO datetime of review |

### SourceInfo

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ProvenanceSourceKind](#provenancesourcekind) | Yes | Type of source material |
| `path` | string | No | Path or URL to source |
| `sha256` | [Sha256Hash](#sha256hash) | No | SHA-256 hash of source file |
| `accessedAt` | [IsoDateTime](#isodatetime) | No | ISO datetime when source was accessed |
| `bibliographicRef` | string | No | Bibliographic reference key |

### TimestampMarker

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | [ContainerDirectiveType](#containerdirectivetype) | Yes |  |
| `localId` | [UlidId](#ulidid) | Yes |  |
| `attributes` | object | Yes | Attributes for timestamp_marker |
| `children` | [Children](#children) | Yes |  |
| `position` | [OptionalPosition](#optionalposition) | No |  |
| `data` | [OptionalDataRecord](#optionaldatarecord) | No |  |
| `name` | string | Yes | Element type: timestamp_marker |

### TimestampMarkers

## Provenance Types

### DocumentProvenance

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `source` | [SourceInfo](#sourceinfo) | No | Original source information |
| `extraction` | [ExtractionInfo](#extractioninfo) | No | Extraction process information |
| `review` | [ReviewInfo](#reviewinfo) | No | Review status information |

### OptionalSourceLoc

## Shared Definitions

### Children

### ContainerDirectiveType

### DataRecord

### Entity

**Type:** Discriminated Union

One of the following types:

- [Para](#para)
- [Section](#section)
- [Abstract](#abstract)
- [Figure](#figure)
- [Table](#table)
- [Diagram](#diagram)
- [Code](#code)
- [Theorem](#theorem)
- [Proof](#proof)
- [Definition](#definition)
- [AxiomDef](#axiomdef)
- [Guarantee](#guarantee)
- [TypeDef](#typedef)
- [EnumDef](#enumdef)
- [FunctionDef](#functiondef)
- [PredicateDef](#predicatedef)
- [NotationDef](#notationdef)
- [TermDef](#termdef)
- [RuleDef](#ruledef)
- [GrammarDef](#grammardef)
- [JudgmentDef](#judgmentdef)
- [ReferenceDef](#referencedef)
- [Example](#example)
- [Exercise](#exercise)
- [Result](#result)
- [Comparison](#comparison)
- [Admonition](#admonition)
- [Quote](#quote)
- [Dialogue](#dialogue)
- [Verse](#verse)
- [Letter](#letter)
- [Profile](#profile)
- [Timeline](#timeline)
- [Operation](#operation)
- [Claim](#claim)
- [Evidence](#evidence)
- [ArgumentBlock](#argumentblock)
- [Hypothesis](#hypothesis)
- [Counterpoint](#counterpoint)
- [Gap](#gap)
- [Redaction](#redaction)
- [Disputed](#disputed)
- [Interpolation](#interpolation)
- [Annotation](#annotation)
- [Correction](#correction)
- [Translation](#translation)
- [Summary](#summary)
- [NamedEntity](#namedentity)
- [Fact](#fact)
- [Transcript](#transcript)
- [Testimony](#testimony)
- [Procedure](#procedure)
- [Decision](#decision)
- [Formula](#formula)

### Frontmatter

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `documentId` | [UlidId](#ulidid) | Yes | Document ID (must match document's documentId) |
| `title` | string | No | Document title |
| `author` | string | No | Document author |
| `createdAt` | [IsoDateTime](#isodatetime) | No | Creation datetime (ISO format) |
| `updatedAt` | [IsoDateTime](#isodatetime) | No | Last modified datetime (ISO format) |
| `provenance` | [DocumentProvenance](#documentprovenance) | No | Document provenance information |

### Interpretations

### IsoDateTime

### OptionalAlias

**Type:** Reference to [UlidId](#ulidid)

### OptionalDataRecord

**Type:** Reference to [DataRecord](#datarecord)

### OptionalDerivedFrom

### OptionalNote

### OptionalPlaceholder

### OptionalRefs

### OptionalTags

### OptionalVerified

### Point

**Type:** Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `line` | integer | Yes | 1-indexed line number |
| `column` | integer | Yes | 1-indexed column number |
| `offset` | integer | No | 0-indexed character offset |

### Sha256Hash

### UnknownType

### VeraDocument
