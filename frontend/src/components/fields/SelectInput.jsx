import React from 'react';

const SelectInput = ({ label, options }) => (
  <div>
    <label>{label}</label>
    <select className="form-select">
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default SelectInput;