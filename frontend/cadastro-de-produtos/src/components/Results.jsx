import React from "react";

export default function Results({ data }) {
  return (
    <div className="results">
      <h2>Resultados</h2>
      <textarea
        value={data ? JSON.stringify(data, null, 2) : "Nenhuma resposta por enquanto."}
        readOnly
        rows={10}
        style={{ width: "100%", fontFamily: "monospace" }}
        ></textarea>
      </div>
  );
}
