import { buildDataset, computeAll, defaultKpiSettings, resolvePeriod } from "../src/lib/kpi-data";
const today=new Date();
const d=buildDataset(today);
const {from,to}=resolvePeriod("thisMonth",today);
const all=computeAll(d,from,to,defaultKpiSettings);
console.log(all.slice(0,5).map(k=>[k.name,k.total,...k.categories.map(c=>c.score+" ("+c.detail+")")]));
