// .claude/hooks/post-archive.js
// Hook PostToolUse que gatilla una valoración automática del proyecto
// cada vez que se archiva un change de OpenSpec.
//
// Detecta `mv` sobre rutas dentro de openspec/changes/archive/
// y pide a Claude releer project.md + improvement-plan.md y recomendar
// los próximos pasos concretos.
//
// Configurado vía .claude/settings.local.json

const chunks = [];
process.stdin.on("data", (d) => chunks.push(d));
process.stdin.on("end", () => {
  try {
    const inp = JSON.parse(Buffer.concat(chunks).toString());
    const cmd = inp?.tool_input?.command ?? "";
    const isArchiveMove =
      /\bmv\b/.test(cmd) && cmd.includes("openspec/changes/archive");

    if (isArchiveMove) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext:
              "INSTRUCCION AUTOMATICA POST-ARCHIVE: Lee openspec/project.md. " +
              "Si existe openspec/improvement-plan.md, léelo también. " +
              "Haz una valoración completa del estado actual del proyecto " +
              "y recomienda los próximos pasos concretos a seguir.",
          },
        }),
      );
    }
  } catch (_) {
    // Silencioso: no queremos bloquear al usuario si el hook falla.
  }
});
