import React from 'react';

const JsonCardViewer = ({ data }) => {
  const renderValue = (value, level = 0) => {
  const indent = { paddingLeft: `${Math.min(level * 16, 64)}px` };

  const isArrayOfObjects = (arr) =>
    Array.isArray(arr) && arr.every((item) => typeof item === 'object' && item !== null);

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      if (isArrayOfObjects(value)) {
        // Evita indentação extra em array de objetos
        return (
          <div className="nested-container" style={indent}>
            {value.map((obj, idx) => (
              <div key={idx} className="nested-block">
                {Object.entries(obj).map(([key, val], i) => (
                  <div key={i} className="nested-block">
                    <div className="label">{key}</div>
                    <div className="value">{renderValue(val, level + 1)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      } else {
        // Array comum (valores primitivos ou mistos)
        return (
          <div className="nested-container" style={indent}>
            {value.map((item, idx) => (
              <div key={idx} className="nested-block">
                {renderValue(item, level + 1)}
              </div>
            ))}
          </div>
        );
      }
    }

    // Objeto simples
    return (
      <div className="nested-container" style={indent}>
        {Object.entries(value).map(([key, val], idx) => (
          <div key={idx} className="nested-block">
            <div className="label">{key}</div>
            <div className="value">{renderValue(val, level + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="value">{String(value)}</div>;
};


  return (
    <div className="card-grid">
      {data.map((item, index) => (
        <div key={index} className="card">
          <div className="card-title">Item {index + 1}</div>
          {renderValue(item)}
        </div>
      ))}
    </div>
  );
};

export default JsonCardViewer;
