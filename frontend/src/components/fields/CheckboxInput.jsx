import React from 'react';

const CheckboxInput = ({ label, options }) => (
  <div>
    <label>{label}</label>
    {options.map((option, index) => (
      <div className="form-check" key={index}>
        <input type="checkbox" className="form-check-input" value={option} />
        <label className="form-check-label">{option}</label>
      </div>
    ))}
  
  </div>
);

export default CheckboxInput;
