import products from "../data.json" with { type: "json" };

function indexForDate(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0)%products.length
}

function productForGame(date){
  if(String(date).startsWith("random-")) {
    const index=Number(String(date).slice(7));
    if(Number.isInteger(index) && index>=0 && index<products.length) return products[index];
  }
  return products[indexForDate(date)];
}

function acceptedRange(answer){
  const lower = Math.floor(answer / 5) * 5;
  const upper = Math.ceil(answer / 5) * 5;
  return { lower, upper };
}

function feedback(guess, answer, mode){
  const { lower, upper } = acceptedRange(answer);

  if(mode === "hard" && guess === answer) {
    return { type:"correct", label:"Exact price!", ratio:0, lower:answer, upper:answer };
  }

  if(mode !== "hard" && guess >= lower && guess <= upper) {
    const distance = Math.min(Math.abs(guess - answer) / Math.max(answer, 100), 1);
    return { type:"correct", label:"Correct!", ratio:distance, lower, upper };
  }

  const ratio = Math.min(Math.abs(guess-answer)/Math.max(answer,100),1);

  if(guess < lower)
    return {
      type:"low",
      label: ratio <= .12 ? "Very close — go higher" : "Too low — go higher",
      ratio, lower, upper
    };

  return {
    type:"high",
    label: ratio <= .12 ? "Very close — go lower" : "Too high — go lower",
    ratio, lower, upper
  };
}

export default function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});

  const {date,source_product_id,guess,attempt,mode}=req.body||{};
  if(!date||!source_product_id||!Number.isFinite(Number(guess)))
    return res.status(400).json({error:"Invalid guess"});

  const expected=productForGame(date);

  if(String(expected.source_product_id)!==String(source_product_id))
    return res.status(400).json({error:"Game expired"});

  const answer=Number(expected.price);
  const result=feedback(Number(guess), answer, mode === "hard" ? "hard" : "normal");
  const reveal=result.type==="correct"||Number(attempt)>=5;

  res.setHeader("Cache-Control","no-store");
  res.status(200).json({
    result,
    answer:reveal?answer:null
  });
}
