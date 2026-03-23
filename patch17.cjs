const fs = require('fs');
let file = 'src/lib/components/WaypointTable.svelte';
let code = fs.readFileSync(file, 'utf-8');

const target1 = `class={\`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium \${$selectedLineId === line.id ? "bg-green-50 dark:bg-green-900/20" : ""} \${$selectedPointId === endPointId || $multiSelectedPointIds.includes(endPointId) ? "bg-green-100 dark:bg-green-800/40" : ""} transition-colors duration-150 \${line.hidden ? "opacity-50 grayscale-[50%]" : ""}\`}`;
const replace1 = `class={\`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium \${$selectedLineId === line.id ? "bg-green-50 dark:bg-green-900/20" : ""} \${$multiSelectedPointIds.length > 1 && $multiSelectedPointIds.includes(endPointId) ? "bg-green-100 dark:bg-green-800/40" : ($selectedPointId === endPointId ? "bg-blue-50 dark:bg-blue-900/20" : "")} transition-colors duration-150 \${line.hidden ? "opacity-50 grayscale-[50%]" : ""}\`}`;

code = code.replace(target1, replace1);

const target2 = `class={\`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 \${$selectedLineId === line.id ? "bg-green-50 dark:bg-green-900/20" : ""} \${$selectedPointId === pointId || $multiSelectedPointIds.includes(pointId) ? "bg-green-100 dark:bg-green-800/40" : ""}\`}`;
const replace2 = `class={\`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 \${$selectedLineId === line.id ? "bg-green-50 dark:bg-green-900/20" : ""} \${$multiSelectedPointIds.length > 1 && $multiSelectedPointIds.includes(pointId) ? "bg-green-100 dark:bg-green-800/40" : ($selectedPointId === pointId ? "bg-blue-50 dark:bg-blue-900/20" : "")}\`}`;

code = code.replace(target2, replace2);

fs.writeFileSync(file, code);
