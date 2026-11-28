---
name: controllers
description: Build the controllers workstream of the implementer: the optional delivery layer of a backend, one controller per module in framework/controllers that composes its use cases and translates what a transport brings into a call to the core and back. Read from the implement skill.
---

# controllers

**Owns:** `src/<module>/framework/controllers/<module>.controller.ts`, one controller per module that has a transport. A backend with no transport of its own has none, and this workstream then has nothing to build.

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots: `src` stands for the module root.

**Receives:** the use-case signatures of `app-domain`, signed as seams of the phase, and the transport's port (arguments, standard input, output, exit status) the entry fills.

Write the controller as a class that receives its use cases and the transport's port in its constructor. Each public method takes what the transport brings, calls one use case, and turns its result or its exception into output and a status. It decides nothing the domain decides, and it imports only application and domain (`controller-reaches-core-through-use-cases`): the entry builds adapters, repositories and use cases and hands them over. Keep every file of `framework` in `framework/controllers`, named `<name>.controller.ts` (`controllers-vocabulary`). Another transport, an HTTP route or a queue consumer, reaches the same use case through the same controller.
