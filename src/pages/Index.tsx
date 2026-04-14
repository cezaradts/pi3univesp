import { useState } from "react";

type FieldKey = "valorVista" | "qtdParcelas" | "valorParcela" | "taxaJuros";

// Formata número no padrão brasileiro: 1.234,56
const formatBRL = (raw: string, decimals: number): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, padded.length - decimals).replace(/^0+(?!$)/, "");
  const decPart = padded.slice(padded.length - decimals);
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intFormatted},${decPart}`;
};

// Remove formatação e converte para float
const parseBRL = (val: string): number => {
  return parseFloat(val.replace(/\./g, "").replace(",", "."));
};

const Index = () => {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    valorVista: "",
    qtdParcelas: "",
    valorParcela: "",
    taxaJuros: "",
  });
  const [result, setResult] = useState<FieldKey | null>(null);

  const handleChange = (key: FieldKey, val: string) => {
    let formatted: string;
    if (key === "qtdParcelas") {
      formatted = val.replace(/\D/g, "");
    } else {
      formatted = formatBRL(val, 2);
    }
    setValues((prev) => ({ ...prev, [key]: formatted }));
    setResult(null);
  };

  const calculate = () => {
    const filled = (Object.keys(values) as FieldKey[]).filter(
      (k) => values[k].trim() !== ""
    );
    const empty = (Object.keys(values) as FieldKey[]).filter(
      (k) => values[k].trim() === ""
    );

    if (empty.length !== 1) {
      alert("Deixe exatamente UM campo em branco para calcular.");
      return;
    }

    const target = empty[0];
    const pv = parseBRL(values.valorVista);
    const n = parseInt(values.qtdParcelas);
    const pmt = parseBRL(values.valorParcela);
    const iInput = parseBRL(values.taxaJuros);

    // Validate filled fields
    for (const k of filled) {
      const v = k === "qtdParcelas" ? n : k === "taxaJuros" ? iInput : k === "valorVista" ? pv : pmt;
      if (isNaN(v)) {
        alert("Preencha os campos com valores numéricos válidos.");
        return;
      }
    }

    let computed: number;

    if (target === "valorVista") {
      const i = iInput / 100;
      if (i === 0) {
        computed = pmt * n;
      } else {
        computed = pmt * (1 - Math.pow(1 + i, -n)) / i;
      }
      setValues((prev) => ({ ...prev, valorVista: formatBRL(computed.toFixed(2).replace(".", ""), 2) }));
    } else if (target === "qtdParcelas") {
      const i = iInput / 100;
      if (i === 0) {
        computed = pv / pmt;
      } else {
        computed = -Math.log(1 - (pv * i) / pmt) / Math.log(1 + i);
      }
      setValues((prev) => ({ ...prev, qtdParcelas: Math.ceil(computed).toString() }));
    } else if (target === "valorParcela") {
      const i = iInput / 100;
      if (i === 0) {
        computed = pv / n;
      } else {
        computed = pv * i / (1 - Math.pow(1 + i, -n));
      }
      setValues((prev) => ({ ...prev, valorParcela: formatBRL(computed.toFixed(2).replace(".", ""), 2) }));
    } else {
      // taxa de juros - Newton's method
      if (pmt * n === pv) {
        setValues((prev) => ({ ...prev, taxaJuros: formatBRL("000", 2) }));
        setResult(target);
        return;
      }
      let guess = 0.01;
      for (let iter = 0; iter < 1000; iter++) {
        const f = pmt * (1 - Math.pow(1 + guess, -n)) / guess - pv;
        const df =
          (pmt / guess) *
            (n * Math.pow(1 + guess, -n - 1) -
              (1 - Math.pow(1 + guess, -n)) / guess);
        const newGuess = guess - f / df;
        if (Math.abs(newGuess - guess) < 1e-10) {
          guess = newGuess;
          break;
        }
        guess = newGuess;
      }
      computed = guess * 100;
      setValues((prev) => ({ ...prev, taxaJuros: formatBRL(computed.toFixed(2).replace(".", ""), 2) }));
    }
    setResult(target);
  };

  const clear = () => {
    setValues({ valorVista: "", qtdParcelas: "", valorParcela: "", taxaJuros: "" });
    setResult(null);
  };

  const cards: { key: FieldKey; label: string; prefix: string; suffix: string; color: string }[] = [
    { key: "valorVista", label: "Valor à Vista", prefix: "R$", suffix: "", color: "bg-card-green" },
    { key: "qtdParcelas", label: "Quantidade de Parcelas", prefix: "", suffix: "x", color: "bg-card-orange" },
    { key: "valorParcela", label: "Valor da Parcela", prefix: "R$", suffix: "", color: "bg-card-blue" },
    { key: "taxaJuros", label: "Taxa de Juros", prefix: "", suffix: "% a.m.", color: "bg-card-purple" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary py-5 px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground text-center italic">
            Aplicativo de Cálculo Financeiro
          </h1>
        </div>
<p style={{ textAlign: "center", marginBottom: "20px" }}>
Informe três valores e deixe um em branco. 
O sistema calculará automaticamente o valor faltante.
</p>
        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          {cards.map(({ key, label, prefix, suffix, color }) => (
            <div
              key={key}
              className={`${color} rounded-xl p-5 text-primary-foreground transition-all ${
                result === key ? "ring-4 ring-foreground/30 scale-[1.02]" : ""
              }`}
            >
              <p className="text-sm font-semibold text-center opacity-90 mb-1">{label}</p>
              <hr className="border-primary-foreground/40 mb-3" />
              <div className="flex items-baseline justify-center gap-1">
                {prefix && <span className="text-lg font-medium opacity-80">{prefix}</span>}
                <input
                  type="text"
  inputMode="decimal"
  value={values[key]}
  onChange={(e) => handleChange(key, e.target.value)}
  placeholder="0"
  className={`
    bg-transparent 
    text-center 
    font-bold 
    placeholder:text-primary-foreground/50 
    outline-none 
    w-full 
    border-none
    ${values[key].length > 10 ? "text-xl" : values[key].length > 6 ? "text-2xl" : "text-4xl"}
  `}
/>
                {suffix && <span className="text-lg font-medium opacity-80">{suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-6 pb-6 justify-center">
  <button ...>Calcular</button>
  <button ...>Limpar</button>
</div>
          <button
            onClick={calculate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg transition-colors text-lg"
          >
            Calcular
          </button>
          <button
            onClick={clear}
            className="bg-muted hover:bg-muted/80 text-muted-foreground font-bold py-3 px-8 rounded-lg transition-colors text-lg"
          >
            Limpar
          </button>
          <div className="mt-6 bg-white rounded-xl p-5 shadow text-center">
  <h3 className="text-lg font-semibold mb-3">Resumo do Pagamento</h3>

 <p>
  Parcelas: <strong>{values.qtdParcelas || 0}x</strong>
</p>

<p>
  Valor da Parcela: <strong>R$ {values.valorParcela || "0,00"}</strong>
</p>

<hr className="my-3" />

<p className="text-xl text-green-600 font-bold">
  Total: R$ {
    (
      (parseBRL(values.qtdParcelas || "0") || 0) *
      (parseBRL(values.valorParcela || "0") || 0)
    ).toFixed(2)
  }
</p>
</div>
        </div>
      </div>
    </div>
  );
};

export default Index;
