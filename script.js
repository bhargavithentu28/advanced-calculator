const exprEl = document.getElementById("expr");
const resEl  = document.getElementById("resVal");
const historyList = document.getElementById("historyList");

let expr = "";
let ans = 0;
let memory = 0;
let useDegrees = true;

let history = JSON.parse(localStorage.getItem("calc_history") || "[]");

function render(){
  exprEl.textContent = expr || "0";
  resEl.textContent = isNaN(ans) ? "Error" : ans;
  document.getElementById("degRad").textContent = useDegrees ? "DEG" : "RAD";
  document.getElementById("memStatus").textContent = "M: " + memory;
  renderHistory();
}

function renderHistory(){
  historyList.innerHTML = "";
  if(history.length === 0){
    historyList.innerHTML = `<div style="color:#94a3b8">No history</div>`;
    return;
  }

  history.forEach(h=>{
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<div>${h.expr}</div><div>${h.result}</div>`;
    div.onclick = ()=>{ expr = h.expr; ans = h.result; render(); };
    historyList.appendChild(div);
  });
}

function pushHistory(exp, res){
  history.unshift({expr:exp, result:res});
  if(history.length > 50) history.pop();
  localStorage.setItem("calc_history", JSON.stringify(history));
}


// =====================================================
//                🔥 FIXED SAFE EVAL 🔥
// =====================================================
function safeEval(input){

  if(typeof Math.log10 !== "function"){
    Math.log10 = x => Math.log(x)/Math.LN10;
  }

  let s = String(input);

  // sin 30 → sin(30)
  s = s.replace(/(sin|cos|tan)\s+([0-9\.]+)/gi, "$1($2)");

  // sin30 → sin(30)
  s = s.replace(/(sin|cos|tan)([0-9\.]+)/gi, "$1($2)");

  // sin(30)
  s = s.replace(/(sin|cos|tan)\(/gi, (m,fn)=>{
    return useDegrees
      ? `Math.${fn}((Math.PI/180)*(`
      : `Math.${fn}(`;
  });

  // Safe power (only a^b)
  s = s.replace(/(\d+)\s*\^\s*(\d+)/g, "Math.pow($1,$2)");

  // sqrt, abs, log
  s = s.replace(/sqrt\(/g, "Math.sqrt(")
       .replace(/abs\(/g, "Math.abs(")
       .replace(/log10\(/g, "Math.log10(")
       .replace(/ln\(/g, "Math.log(");

  // Constants
  s = s.replace(/\bpi\b/gi, "Math.PI")
       .replace(/\be\b/gi, "Math.E");

  // %
  s = s.replace(/([\d\.]+)%/g, "($1/100)");

  // ANS
  s = s.replace(/\bans\b/gi, ans);

  // Remove --
  s = s.replace(/--/g, "+");

  try {
    const fn = new Function("Math","ans", `return (${s});`);
    const out = fn(Math, ans);
    return isFinite(out) ? out : NaN;
  } catch {
    return NaN;
  }
}


// =====================================================
//                BUTTON HANDLERS
// =====================================================

document.getElementById("keys").addEventListener("click", e=>{
  const btn = e.target.closest("button");
  if(!btn) return;

  const v = btn.dataset.val;
  if(!v) return;

  expr += v;
  render();

  if(btn.id === "equals") doEquals();
});

document.getElementById("back").onclick = ()=>{
  expr = expr.slice(0,-1);
  render();
};

document.getElementById("degRad").onclick = ()=>{
  useDegrees = !useDegrees;
  render();
};

document.getElementById("mc").onclick = ()=>{ memory = 0; render(); };
document.getElementById("mr").onclick = ()=>{ expr += memory; render(); };
document.getElementById("mplus").onclick = ()=>{ memory = ans; render(); };
document.getElementById("ansBtn").onclick = ()=>{ expr += "ans"; render(); };

document.getElementById("clearHistory").onclick = ()=>{
  history=[]; localStorage.removeItem("calc_history"); render();
};

document.getElementById("copyHistory").onclick = ()=>{
  navigator.clipboard.writeText(
    history.map(h=>`${h.expr} = ${h.result}`).join("\n")
  );
  alert("Copied!");
};

function doEquals(){
  const val = safeEval(expr);
  if(isNaN(val)){ ans = NaN; render(); alert("Invalid Expression"); return; }
  ans = val;
  pushHistory(expr, ans);
  expr = "" + ans;
  render();
}


// Keyboard support
window.addEventListener("keydown", e=>{
  if(e.key === "Enter"){ e.preventDefault(); doEquals(); }
  else if(e.key === "Backspace"){ expr = expr.slice(0,-1); render(); }
  else if("0123456789+-*/().%".includes(e.key)){ expr+=e.key; render(); }
});

render();
