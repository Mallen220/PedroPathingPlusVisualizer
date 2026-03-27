1. **Consolidate Icons**: There are many standard SVG shapes being inlined into multiple Svelte files, especially in `src/lib/components/sections/`. The plan is to replace these inline occurrences with components from `src/lib/components/icons`. Since there are multiple files containing common SVGs (like `EyeIcon`, `LockIcon`, `ChevronDownIcon`, etc.), we'll target a few common paths that repeatedly show up.

Target SVG paths:
- `M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5...` -> `ArrowUpSolidIcon`
- `M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25...` -> `ArrowDownSolidIcon`
- `M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75...` -> `UnlockIcon`
- `M10 3a1.5 1.5 0 100-3...` -> `EllipsisVerticalIcon`
- `M10 18a8 8 0 1 0 0-16...` -> `ClockSolidIcon`
- `m19.5 8.25-7.5 7.5-7.5-7.5` -> `ChevronDownIcon`
- `m8.25 4.5 7.5 7.5-7.5 7.5` -> `ChevronRightBoldIcon`
- `M12 4.5v15m7.5-7.5h-15` -> `PlusIcon`
- `M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51...` -> `EyeIcon`
- `M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226...` -> `EyeSlashIcon`
- `M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5...` -> `PlusSmallSolidIcon`

2. **Files to update**:
- `src/lib/components/sections/WaitSection.svelte`
- `src/lib/components/sections/RotateSection.svelte`
- `src/lib/components/sections/PathLineSection.svelte`
- `src/lib/components/sections/MacroSection.svelte`

These 4 sections contain multiple embedded SVGs. Replacing them will be a great start and fulfills the user request.

3. **Pre-commit checks**: After modifying the files, run `pre_commit_instructions` tool to ensure everything is correct, then commit.
