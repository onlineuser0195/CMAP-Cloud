import React from 'react';
import TextInput from '../../../components/fields/TextInput'
import SelectInput from '../../../components/fields/SelectInput';
import CheckboxInput from '../../../components/fields/CheckboxInput';

const Form = ({ heading, fields, onSubmit }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>{heading}</h2>
            {fields.map((field) => {
                switch (field.type) {
                    case 'text':
                        return <TextInput key={field.name} {...field} />;
                    case 'select':
                        return <SelectInput key={field.name} {...field} />;
                    case 'checkbox':
                        return <CheckboxInput key={field.name} {...field} />;
                    default:
                        return null;
                }
            })}
            <button type="submit">Submit</button>
        </form>
    );
};

export default Form;