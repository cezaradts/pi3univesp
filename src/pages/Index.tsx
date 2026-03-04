import { useState } from "react";

type FieldKey = "valorVista" | "qtdParcelas" | "valorParcela" | "taxaJuros";

const Index = () => {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    valorVista: "",
    qtdParcelas: "",
    valorParcela: "",
    taxaJuros: "",
  });
  const [result, setResult] = useState<FieldKey | null>(null);

  const handleChange = (key: FieldKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
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
    const pv = parseFloat(values.valorVista.replace(",", "."));
    const n = parseInt(values.qtdParcelas);
    const pmt = parseFloat(values.valorParcela.replace(",", "."));
    const iInput = parseFloat(values.taxaJuros.replace(",", "."));

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
      setValues((prev) => ({ ...prev, valorVista: computed.toFixed(2).replace(".", ",") }));
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
      setValues((prev) => ({ ...prev, valorParcela: computed.toFixed(2).replace(".", ",") }));
    } else {
      // taxa de juros - Newton's method
      if (pmt * n === pv) {
        setValues((prev) => ({ ...prev, taxaJuros: "0,00" }));
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
      setValues((prev) => ({ ...prev, taxaJuros: computed.toFixed(2).replace(".", ",") }));
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
                  className="bg-transparent text-center text-4xl font-bold placeholder:text-primary-foreground/50 outline-none w-28 border-none"
                />
                {suffix && <span className="text-lg font-medium opacity-80">{suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-6 pb-6 justify-center">
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
        </div>
      </div>
    </div>
  );
};

export default Index;
