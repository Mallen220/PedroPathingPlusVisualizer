2026-01-17 - Validation Logic Separation
Learning: The `PathOptimizer` class encapsulates geometric collision logic but not basic path integrity checks like zero-length segments. Validation logic often needs to span multiple layers (physics, geometry, basic data integrity).
Action: When extracting validation logic, review the original implementation carefully to ensure all checks (even "trivial" ones) are migrated, as helper classes might be more specialized than assumed.
