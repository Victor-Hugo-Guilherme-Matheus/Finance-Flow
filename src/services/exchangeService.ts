const BASE_URL = "https://api.frankfurter.dev/v2";

export async function convertCurrency(from: string, to: string, amount: number) {
  const res = await fetch(`${BASE_URL}/rates?base=${from}&quotes=${to}`);
  if (!res.ok) throw new Error("Par de moedas não suportado.");
  const data = await res.json();
  const entry = Array.isArray(data) ? data.find((d: any) => d.quote === to) : null;
  if (!entry?.rate) throw new Error("Taxa não disponível.");
  return (amount * entry.rate).toFixed(2);
}

export async function getCurrencies(): Promise<Record<string, string>> {
  const res = await fetch(`${BASE_URL}/currencies`);
  if (!res.ok) throw new Error("Erro ao buscar moedas");
  const data = await res.json();
  // A API v2 retorna um array de objetos com iso_code e name
  const result: Record<string, string> = {};
  if (Array.isArray(data)) {
    data.forEach((item: { iso_code: string; name: string }) => {
      result[item.iso_code] = item.name;
    });
  }
  return result;
}