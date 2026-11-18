# cambios

### Procedure: cambio-secuencial · Abrir, integrar y cerrar un cambio de este repositorio

@origin:2026-11-18-reparar-revision-semantica @env:local,prod @by:person

**When** Al recibir una intención nueva o retomar una integración interrumpida.

**Requires** Git, el acceso `github-personal` y las herramientas de OpenSpec del repositorio.

**Steps**

1. Antes de explorar, trae las referencias de `origin` y revisa los cambios OpenSpec activos, los worktrees, los PR a `main` y el último cierre. Si queda un cambio en curso, retómalo en su rama desde la primera operación pendiente. Mantén la intención nueva en espera, incluso si al cambio anterior solo le falta el tag o la actualización local. En la adopción se toma el `main` vigente como punto de partida. Lista también las decisiones de `openspec/adr` marcadas `@enforced:pending` (`grep -rl "@enforced:pending" openspec/adr`). Si no hay intención nueva, propón a la persona la primera pendiente como siguiente cambio.
2. Con el ciclo anterior cerrado, actualiza `main` local por fast-forward desde `origin/main`. Comprueba que sus SHA coinciden y que el árbol está limpio. Crea desde ese SHA una rama propia del cambio. Explora ahí y redacta su plan OpenSpec. Presenta el plan y espera aprobación para implementarlo.
3. Al recibir la aprobación, regístrala en el plan y valida el cambio. Cuando esté listo, haz el primer commit con el plan aprobado y sus artefactos OpenSpec. Comprueba que `git status --porcelain` devuelve una salida vacía antes de empezar la implementación. Si retomas el cambio en otra sesión, localiza su rama y el commit del plan aprobado.
4. Implementa el plan. Durante la ejecución, edita el plan solo para marcar tareas completadas o incorporar feedback registrado en el propio cambio. Verifica el resultado, archiva el cambio y revisa lo consolidado. Si el cambio aplica una decisión pendiente, cambia su `@enforced:pending` por la regla o el check que ahora la sostiene. Haz el segundo commit con la implementación, la evidencia, los artefactos archivados y las actualizaciones consolidadas.
5. Comprueba que la rama aporta esos dos commits a `main` y está limpia. Súbela, abre el PR y fusiónalo conservando ambos commits cuando se cumplan las comprobaciones y aprobaciones requeridas. Si ya existe el PR, continúa con él. Recupera de GitHub el SHA de integración del PR fusionado y confirma que pertenece a `origin/main`.
6. Trae los tags remotos. Si el SHA ya tiene su etiqueta `change-vX.Y.Z`, reutilízala. Si falta, incrementa el parche del mayor tag de cambio por versión numérica. Para el primer tag, usa como base el último `vX.Y.Z` alcanzable desde el merge. Crea la etiqueta en el **SHA de integración del PR** y súbela. Si el nombre ya pertenece a otro SHA, vuelve a leer las referencias y recalcula. Conserva los tags publicados.
7. Vuelve a `main`, actualízalo por fast-forward y verifica el cierre. Si falla un paso, reanuda ese mismo cambio. La siguiente exploración empieza después de verificar el cierre.

**Verification** El PR figura como fusionado y en el historial de `main` se pueden consultar por separado el plan aprobado y el cierre del cambio. El cambio está en `openspec/changes/archive/` y sus resultados consolidados están en `main`. El tag remoto apunta al SHA de integración. `git rev-parse main origin/main` devuelve dos SHA iguales, el árbol está limpio y no queda otro cambio activo. Las decisiones pendientes que quedan se listan en el paso 1 de la siguiente sesión.
