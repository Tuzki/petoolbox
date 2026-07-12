import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/rcSnubberFirstPass.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, strict: true } }).outputText;
const { calculateRCSnubber, defaultRCSnubberInputs, nearestE24, nearestStandardCapacitancePf } = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);

const calc = (overrides={}) => calculateRCSnubber({...defaultRCSnubberInputs,...overrides});
test('default TI-style example matches baseline',()=>{const r=calc();assert.equal(r.status,'review');assert.ok(Math.abs(r.ratio-1.6)<1e-12);assert.ok(Math.abs(r.cp*1e12-64.102564)<1e-5);assert.ok(Math.abs(r.lp*1e6-1.071)<.002);assert.ok(Math.abs(r.z0-129.3)<.2);assert.equal(r.cs*1e12,200);assert.equal(r.rs,130);assert.ok(Math.abs(r.averageLoss-.2)<1e-12);assert.ok(Math.abs(r.eventEnergy-1e-6)<1e-15)});
test('invalid frequency ordering and non-positive inputs fail',()=>{assert.equal(calc({f1MHz:19.2}).status,'fail');assert.equal(calc({f0MHz:0}).status,'fail');assert.equal(calc({cTestPf:-1}).status,'fail')});
test('equivalent inductance formulas agree',()=>{const r=calc();assert.ok(Math.abs(r.lp-r.lpAlternate)<1e-20)});
test('larger test capacitance remains finite',()=>{const r=calc({cTestPf:1000,f1MHz:8});for(const key of ['cp','lp','z0','cs','rs'])assert.ok(Number.isFinite(r[key])&&r[key]>0)});
test('loss scales with event count, recommended capacitance, voltage squared, and frequency',()=>{const one=calc({eventsPerCycle:1}),two=calc({eventsPerCycle:2});assert.ok(Math.abs(two.averageLoss/one.averageLoss-2)<1e-12);const c1=calc({capacitorMultiplier:3}),c2=calc({capacitorMultiplier:6});assert.ok(Math.abs((c2.averageLoss/c1.averageLoss)/(c2.cs/c1.cs)-1)<1e-12);assert.ok(Math.abs(calc({deltaVV:200}).averageLoss/calc({deltaVV:100}).averageLoss-4)<1e-12);assert.ok(Math.abs(calc({switchingFrequencyKhz:200}).averageLoss/calc({switchingFrequencyKhz:100}).averageLoss-2)<1e-12)});
test('standard value rounding is independently testable',()=>{assert.equal(nearestE24(129.3),130);assert.equal(nearestE24(74),75);assert.equal(nearestStandardCapacitancePf(192.3),200)});
test('ratings yield fail or review at correct boundaries',()=>{assert.equal(calc({resistorRatedPowerW:.1,capacitorVoltageRatingV:200}).status,'fail');const r=calc({resistorRatedPowerW:.25,capacitorVoltageRatingV:200});assert.equal(r.status,'review');assert.ok(r.warnings.includes('power-derating'))});
test('adequate shift, ratings, and settling can pass while retaining hardware cautions',()=>{const r=calc({resistorRatedPowerW:1,capacitorVoltageRatingV:200});assert.equal(r.status,'pass');assert.ok(r.warnings.includes('pulse-rating'));assert.ok(r.warnings.includes('measurement-parasitics'))});
test('settling conflict produces review',()=>{const r=calc({switchingFrequencyKhz:10000,eventsPerCycle:2});assert.equal(r.status,'review');assert.ok(r.warnings.includes('settling'))});
test('valid computed physical values never contain NaN, Infinity, or negatives',()=>{const r=calc();for(const key of ['ratio','cp','lp','z0','csRaw','rsRaw','cs','rs','eventEnergy','averageLoss','peakCurrent','rmsCurrent','peakPower','tau','eventInterval'])assert.ok(Number.isFinite(r[key])&&r[key]>0,key)});
