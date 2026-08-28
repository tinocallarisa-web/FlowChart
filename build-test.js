/**
 * build-test.js
 * Genera un .pbiviz con isPro=true y guid_test para pruebas en Power BI Desktop.
 * USO: node build-test.js [--free]
 *   --free  Deja isPro sin forzar (prueba la experiencia Free real, con el limite de nodos).
 *
 * Reglas del skill pbiviz-appsource:
 * - Parchea -> empaqueta -> RESTAURA. El fuente siempre queda en estado produccion.
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT        = __dirname;
const VISUAL_TS   = path.join(ROOT, "src", "visual.ts");
const PBIVIZ_JSON = path.join(ROOT, "pbiviz.json");
const forceFree   = process.argv.includes("--free");

const originalTs      = fs.readFileSync(VISUAL_TS,   "utf8");
const originalPbiviz  = fs.readFileSync(PBIVIZ_JSON, "utf8");
const pbivizObj       = JSON.parse(originalPbiviz);

console.log("\nBuild TEST — " + pbivizObj.visual.displayName + " v" + pbivizObj.visual.version);
console.log("GUID real:  " + pbivizObj.visual.guid);
console.log("Tier:       " + (forceFree ? "Free (real license check)" : "Pro (forzado)"));

// Patch visual.ts — force isPro = true (unless --free)
const LICENSE_BLOCK = `            // Production license check via Microsoft AppSource
            try {
                const licenseResult = await this.licenseManager.getAvailableServicePlans();
                this.isPro = licenseResult.plans?.some(
                    plan => plan.spIdentifier === SP_IDENTIFIER &&
                            plan.state === ServicePlanState.Active
                ) ?? false;
            } catch (_) {
                this.isPro = false;
            }`;

const LICENSE_PATCH = `            // TEST BUILD — isPro forzado a true
            this.isPro = true;`;

let patchedTs = originalTs;
if (!forceFree) {
    if (!originalTs.includes(LICENSE_BLOCK)) {
        console.error("\nERROR: El bloque de licencia no coincide. Actualiza LICENSE_BLOCK en build-test.js.\n");
        process.exit(1);
    }
    patchedTs = originalTs.replace(LICENSE_BLOCK, LICENSE_PATCH);
}

// Patch pbiviz.json — add _test to guid
const realGuid       = pbivizObj.visual.guid;
const testGuid       = realGuid + "_test";
const patchedPbiviz  = originalPbiviz.replace('"' + realGuid + '"', '"' + testGuid + '"');

console.log("GUID test:  " + testGuid);

fs.writeFileSync(VISUAL_TS,   patchedTs,     "utf8");
fs.writeFileSync(PBIVIZ_JSON, patchedPbiviz, "utf8");

let buildOk = false;
try {
    console.log("\nEjecutando npx pbiviz package ...\n");
    execSync("npx pbiviz package", { cwd: ROOT, stdio: "inherit" });
    buildOk = true;
} catch (e) {
    console.error("\nEl build fallo. Revisa los errores arriba.");
} finally {
    fs.writeFileSync(VISUAL_TS,   originalTs,     "utf8");
    fs.writeFileSync(PBIVIZ_JSON, originalPbiviz, "utf8");
    console.log("\nFicheros restaurados a estado produccion.");
}

if (buildOk) {
    const distFiles = fs.readdirSync(path.join(ROOT, "dist")).filter(f => f.endsWith(".pbiviz"));
    const latest = distFiles.sort((a, b) =>
        fs.statSync(path.join(ROOT, "dist", b)).mtimeMs - fs.statSync(path.join(ROOT, "dist", a)).mtimeMs
    )[0];
    console.log("\nBuild TEST listo en dist/" + latest);
    console.log("Importa el .pbiviz en Power BI Desktop y prueba.\n");
} else {
    process.exit(1);
}
