// Used via `runScript` to generate a fresh, collision-free account for flows
// that need a guaranteed-empty account (signup.yaml, empty_states.yaml).
// Referenced elsewhere in a flow as ${output.username} / ${output.name}.
output.username = "maestro_" + Date.now();
output.name = "Maestro Tester";
