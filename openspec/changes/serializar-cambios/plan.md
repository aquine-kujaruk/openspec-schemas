---
name: serializar-cambios
description: Incorporar al runbook de este repositorio el cierre de cada cambio antes de explorar el siguiente.
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Un cambio por vez desde main

## Goal

Cada exploración parte del resultado publicado de la anterior. En este repositorio, la rama de cada cambio conserva dos commits: el plan aprobado y el trabajo verificado y archivado. El agente se encarga de la integración, la etiqueta y la actualización local.

## Findings

- El 17 de noviembre de 2026, `main` local y remoto apuntaban a `0e27df9`. La etiqueta de código más reciente era `v0.13.1`, sobre un commit anterior. Comprobado con `git rev-parse main` y `git ls-remote --heads --tags origin`.
- El workflow `.github/workflows/release.yml` se activa al publicar `v*` y publica paquetes. El procedimiento `release` documenta ese uso en `openspec/runbooks/operate/release.md`. Revisados el 17 de noviembre de 2026.

## Decisions

- Aplicar el procedimiento a los cambios de este repositorio desde la adopción del runbook. El historial previo queda fuera del plan. @by:person
- El agente que cierra el PR crea la etiqueta automáticamente como paso del runbook. Usar `change-vX.Y.Z`, con incremento de parche. Ese prefijo permite etiquetar el merge sin disparar la publicación de paquetes. @by:agent

## Open questions

## Architecture decisions

## Procedures

### Procedure: cambio-secuencial · Abrir, integrar y cerrar un cambio de este repositorio

@adds @purpose:operate @topic:cambios @env:local,prod @by:person

**When** Al recibir una intención nueva o retomar una integración interrumpida.

**Requires** Git, el acceso `github-personal` y las herramientas de OpenSpec del repositorio.

**Steps**

1. Antes de explorar, trae las referencias de `origin` y revisa los cambios OpenSpec activos, los worktrees, los PR a `main` y el último cierre. Si queda un cambio en curso, retómalo en su rama desde la primera operación pendiente. Mantén la intención nueva en espera, incluso si al cambio anterior solo le falta el tag o la actualización local. En la adopción se toma el `main` vigente como punto de partida.
2. Con el ciclo anterior cerrado, actualiza `main` local por fast-forward desde `origin/main`. Comprueba que sus SHA coinciden y que el árbol está limpio. Crea desde ese SHA una rama propia del cambio. Explora ahí y redacta su plan OpenSpec. Presenta el plan y espera aprobación para implementarlo.
3. Al recibir la aprobación, regístrala en el plan y valida el cambio. Cuando esté listo, haz el primer commit con el plan aprobado y sus artefactos OpenSpec. Comprueba que `git status --porcelain` devuelve una salida vacía antes de empezar la implementación. Si retomas el cambio en otra sesión, localiza su rama y el commit del plan aprobado.
4. Implementa el plan. Durante la ejecución, edita el plan solo para marcar tareas completadas o incorporar feedback registrado en el propio cambio. Verifica el resultado, archiva el cambio y revisa lo consolidado. Haz el segundo commit con la implementación, la evidencia, los artefactos archivados y las actualizaciones consolidadas.
5. Comprueba que la rama aporta esos dos commits a `main` y está limpia. Súbela, abre el PR y fusiónalo conservando ambos commits cuando se cumplan las comprobaciones y aprobaciones requeridas. Si ya existe el PR, continúa con él. Recupera de GitHub el SHA de integración del PR fusionado y confirma que pertenece a `origin/main`.
6. Trae los tags remotos. Si el SHA ya tiene su etiqueta `change-vX.Y.Z`, reutilízala. Si falta, incrementa el parche del mayor tag de cambio por versión numérica. Para el primer tag, usa como base el último `vX.Y.Z` alcanzable desde el merge. Crea la etiqueta en el **SHA de integración del PR** y súbela. Si el nombre ya pertenece a otro SHA, vuelve a leer las referencias y recalcula. Conserva los tags publicados.
7. Vuelve a `main`, actualízalo por fast-forward y verifica el cierre. Si falla un paso, reanuda ese mismo cambio. La siguiente exploración empieza después de verificar el cierre.

**Verification** El PR figura como fusionado y en el historial de `main` se pueden consultar por separado el plan aprobado y el cierre del cambio. El cambio está en `openspec/changes/archive/` y sus resultados consolidados están en `main`. El tag remoto apunta al SHA de integración. `git rev-parse main origin/main` devuelve dos SHA iguales, el árbol está limpio y no queda otro cambio activo.

## Screens

## Phases

## Feedback

- La persona pide guardar el plan al aprobarlo y dejar limpia la rama. El segundo commit reúne la ejecución, la verificación y el archivo.

## Next step

Tras la aprobación, validar y guardar el plan en el primer commit. Ensayar el procedimiento con un remoto Git desechable: integración normal, reintento después del merge y reintento después de publicar el tag. Comprobar que se puede retomar desde el primer commit con la rama limpia y que, tras el cierre y sus reintentos, siguen existiendo dos commits de trabajo y una etiqueta por cambio. El siguiente cambio debe partir del SHA actualizado. Verificar y archivar para consolidar el procedimiento en `openspec/runbooks/operate/cambios.md`. Al archivar, enlazar el procedimiento desde las instrucciones locales del repositorio. Guardar el archivo y el enlace en el segundo commit y aplicar el cierre al PR de adopción.
