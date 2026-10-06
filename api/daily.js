import products from "../data.json" with { type: "json" };

function indexForDate(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)%products.length}
export default function handler(req,res){const date=new Date().toISOString().slice(0,10);const p=products[indexForDate(date)];const {price,...publicProduct}=p;res.setHeader("Cache-Control","no-store");res.status(200).json({date,product:publicProduct});}
