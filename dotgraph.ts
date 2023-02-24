import { python } from "https://deno.land/x/python/mod.ts";
import {graphviz} from "npm:node-graphviz";

const gprof2dot = python.runModule(Deno.readTextFileSync("gprof2dot.py"), "gprof2dot");

function initialCommand(command: string, freq = 997) {
    const args: string[] = ["-x", "ustackframes=100", "-n", `profile-${freq} /pid == $target/ { @[ustack(100)] = count(); }`, "-o", "dotgraph.stacks", "-c", command];
    const process = new Deno.Command("dtrace", {
        args,
        stdout: "piped",
        stderr: "piped",
    });
    const { code, stderr } = process.outputSync();
    if (code !== 0) {
        console.error("Failed to sample program");
        console.error(new TextDecoder().decode(stderr));
        Deno.exit(code);
    }
}

const { open } = python.builtins;

function output() {
    const input = open("dotgraph.stacks", 'rt')
    let profile = gprof2dot.formats.dtrace(input)
    profile = profile.parse();

    profile.prune(0.5/100.0, 0.1/100.0, false, false);

    const output = open("dotgraph.dot", 'wt')
    const dot = gprof2dot.DotWriter(output);
    dot.strip = false;
    dot.wrap = false;
    dot.show_function_events = [gprof2dot.TOTAL_TIME_RATIO, gprof2dot.TIME_RATIO]
    dot.graph(profile,  gprof2dot.themes.color);
    // Bug in gpof2dot, it doesn't flush.
    dot.fp.flush();
}

async function createSvg() {
    const svg = await graphviz.dot(Deno.readTextFileSync("dotgraph.dot"));
    Deno.writeTextFileSync("dotgraph.svg", svg);
}

const command = Deno.args[0];
initialCommand(command);
output();
createSvg();