'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

type Item = { description: string; amount: number };
type Cat = { nameEn: string; type: 'ASSET' | 'LIABILITY'; items: Item[] };

export default function NewRecordPage({ params }: { params: { locale: string } }) {
  const [yearLabel, setYearLabel] = useState(String(new Date().getFullYear()));
  const [calendarType, setCalendarType] = useState<'ISLAMIC' | 'GREGORIAN'>('ISLAMIC');
  const [categories, setCategories] = useState<Cat[]>([
    { nameEn: 'Gold', type: 'ASSET', items: [{ description: '24k', amount: 0 }] },
    { nameEn: 'Payable loans', type: 'LIABILITY', items: [{ description: 'Loan', amount: 0 }] }
  ]);

  function addCategory(type: 'ASSET' | 'LIABILITY') {
    setCategories((c) => [...c, { nameEn: 'Custom', type, items: [{ description: '', amount: 0 }] }]);
  }

  return <main className="p-4"><motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} method="post" action="/api/records" className="space-y-3">
    <input type="hidden" name="locale" value={params.locale} />
    <input type="hidden" name="payload" value={JSON.stringify({ yearLabel, calendarType, categories })} />
    <div className="card space-y-2"><input className="w-full border rounded p-2" value={yearLabel} onChange={(e)=>setYearLabel(e.target.value)} /><select className="w-full border rounded p-2" value={calendarType} onChange={(e)=>setCalendarType(e.target.value as any)}><option value="ISLAMIC">Islamic</option><option value="GREGORIAN">Gregorian</option></select></div>
    {categories.map((cat, ci)=><div key={ci} className="card"><input className="border rounded p-2 w-full" value={cat.nameEn} onChange={(e)=>setCategories((arr)=>arr.map((x,i)=>i===ci?{...x,nameEn:e.target.value}:x))} />{cat.items.map((it,ii)=><div key={ii} className="mt-2 grid grid-cols-2 gap-2"><input className="border rounded p-2" value={it.description} onChange={(e)=>setCategories((arr)=>arr.map((x,i)=>i===ci?{...x,items:x.items.map((y,j)=>j===ii?{...y,description:e.target.value}:y)}:x))}/><input type="number" className="border rounded p-2" value={it.amount} onChange={(e)=>setCategories((arr)=>arr.map((x,i)=>i===ci?{...x,items:x.items.map((y,j)=>j===ii?{...y,amount:Number(e.target.value)}:y)}:x))}/></div>)}<button type="button" className="mt-2 border rounded p-2" onClick={()=>setCategories((arr)=>arr.map((x,i)=>i===ci?{...x,items:[...x.items,{description:'',amount:0}]}:x))}>Add item</button></div>)}
    <div className="sticky bottom-0 bg-slate-50 py-3 flex gap-2"><button type="button" className="rounded border p-2" onClick={()=>addCategory('ASSET')}>Add asset category</button><button type="button" className="rounded border p-2" onClick={()=>addCategory('LIABILITY')}>Add liability category</button><button className="rounded bg-brand text-white p-2">Save</button></div>
  </motion.form></main>;
}
