# AGENTS

## ROLES
Claude: plan,brief,verify,test,docs,git
Kimi: implement,files

Claude-only: requirements,design,decisions,acceptance
Kimi-only: codegen,file-ops,bulk-implementation
Neither does the other's job.

## KIMI CLI
```
kimi --quiet -w <dir> -p "<prompt>"
kimi --quiet -w <dir> --continue -p "<prompt>"
kimi --quiet --thinking -w <dir> -p "<prompt>"  # complex tasks
```
exit: 0=ok 1=fail 75=retry

## DIRS
frontend: D:/Taozhuowei/Project/BOYUAN OA/app/frontend
backend:  D:/Taozhuowei/Project/BOYUAN OA/app/backend
root:     D:/Taozhuowei/Project/BOYUAN OA

## PROTOCOL
Before any task (except continuation): verify TODO.md actual state against code.
Update TODO.md to match reality before writing briefs.

## BRIEF FORMAT
```
FILE: <path>
DO: <what>
REF: <DESIGN.md §x>, <existing-file>
CONSTRAINTS: <list>
FORBIDDEN: <list>
```
