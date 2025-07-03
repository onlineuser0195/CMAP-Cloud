import { Textbox, Dropdown, Checkbox, 
  Textarea, Radio, DateField,
  EmailField, PhoneField, NumberField, Attachment,
  Instruction
 } from '../models/fields.js';

// Get all Textbox components
export const getTextboxes = async (req, res) => {
    try {
      const textboxes = await Textbox.find({}, 'label field_id placeholder required notEditableBy'); // Include field_id
      res.json(textboxes);
    } catch (error) {
      res.status(500).send('Server error');
    }
  };
  
  // Get all Dropdown options
  export const getDropdowns = async (req, res) => {
    try {
      const dropdowns = await Dropdown.find({}, 'label options field_id required notEditableBy'); // Include field_id
  
      // Format options with field_id
      const formattedOptions = {};
      dropdowns.forEach(item => {
        formattedOptions[item.label] = {
          options: item.options,
          field_id: item.field_id
        };
      });
  
      res.json(formattedOptions);
    } catch (error) {
      res.status(500).send('Server error');
    }
  };
  
  // Get all Checkbox options
  export const getCheckboxes = async (req, res) => {
    try {
      const checkboxes = await Checkbox.find({}, 'label options field_id required notEditableBy'); // Include field_id
  
      // Format options with field_id
      const formattedOptions = {};
      checkboxes.forEach(item => {
        formattedOptions[item.label] = {
          options: item.options,
          field_id: item.field_id
        };
      });
  
      res.json(formattedOptions);
    } catch (error) {
      res.status(500).send('Server error');
    }
  };
  
  
  export const generateUniqueFieldId = async (model) => {
    let fieldId;
    do {
      fieldId = Math.floor(Math.random() * 1000000);
    } while (await model.findOne({ field_id: fieldId }));
    return fieldId;
  };
  
  // Create new Textbox

  export const postTextboxes = async (req, res) => {
    try {
      const { label, placeholder, required, notEditableBy } = req.body;
      const existing = await Textbox.findOne({ label });
      if (existing) return res.status(400).json({ message: 'Textbox label already exists' });
  
      const field_id = await generateUniqueFieldId(Textbox);
      const newTextbox = new Textbox({ label, field_id, placeholder, required, notEditableBy });
      await newTextbox.save();
      res.status(201).json(newTextbox);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Create new Dropdown
  export const postDropdowns = async (req, res) => {
    try {
      const { label, options, required, notEditableBy } = req.body;
      if (!options || options.length === 0) return res.status(400).json({ message: 'At least one option required' });
  
      const existing = await Dropdown.findOne({ label });
      if (existing) return res.status(400).json({ message: 'Dropdown label already exists' });
  
      const field_id = await generateUniqueFieldId(Dropdown);
      const newDropdown = new Dropdown({ label, options, field_id, required, notEditableBy });
      await newDropdown.save();
      res.status(201).json(newDropdown);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Create new Checkbox
  export const postCheckboxes =  async (req, res) => {
    try {
      const { label, options, required, notEditableBy } = req.body;
      if (!options || options.length === 0) return res.status(400).json({ message: 'At least one option required' });
  
      const existing = await Checkbox.findOne({ label });
      if (existing) return res.status(400).json({ message: 'Checkbox label already exists' });
  
      const field_id = await generateUniqueFieldId(Checkbox);
      const newCheckbox = new Checkbox({ label, options, field_id, required, notEditableBy });
      await newCheckbox.save();
      res.status(201).json(newCheckbox);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
// Add this factory function at the top
export const getField = (model, typeName) => async (req, res) => {
    try {
      const component = await model.findOne({ field_id: req.params.field_id });
      if (!component) {
        return res.status(404).json({ message: `${typeName} not found` });
      }
      res.json(component);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const updateTextbox = async (req, res) => {
    try {
      const { field_id } = req.params;
      const { label, placeholder, required, notEditableBy } = req.body;
      console.log('BODY:', req.body);
      const textbox = await Textbox.findOne({ field_id });
      if (!textbox) return res.status(404).json({ message: 'Textbox not found' });
  
      if (label !== textbox.label) {
        const existing = await Textbox.findOne({ label });
        if (existing) return res.status(400).json({ message: 'Label already exists' });
        textbox.label = label;
      }
  
      textbox.placeholder = placeholder;
      textbox.required = required;
      textbox.notEditableBy = notEditableBy;
      await textbox.save();
      res.json(textbox);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const updateDropdown = async (req, res) => {
    try {
      const { field_id } = req.params;
      const { label, options, required, notEditableBy } = req.body;
  
      const dropdown = await Dropdown.findOne({ field_id });
      if (!dropdown) return res.status(404).json({ message: 'Dropdown not found' });
  
      if (label !== dropdown.label) {
        const existing = await Dropdown.findOne({ label });
        if (existing) return res.status(400).json({ message: 'Label already exists' });
        dropdown.label = label;
      }
  
      dropdown.options = options;
      dropdown.required = required;
      dropdown.notEditableBy = notEditableBy;
      await dropdown.save();
      res.json(dropdown);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const updateCheckbox = async (req, res) => {
    try {
      const { field_id } = req.params;
      const { label, options, required, notEditableBy } = req.body;
  
      const checkbox = await Checkbox.findOne({ field_id });
      if (!checkbox) return res.status(404).json({ message: 'Checkbox not found' });
  
      if (label !== checkbox.label) {
        const existing = await Checkbox.findOne({ label });
        if (existing) return res.status(400).json({ message: 'Label already exists' });
        checkbox.label = label;
      }
  
      checkbox.options = options;
      checkbox.required = required;
      checkbox.notEditableBy = notEditableBy;
      await checkbox.save();
      res.json(checkbox);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
  export const deleteTextbox = async (req, res) => {
    try {
      const textbox = await Textbox.findOneAndDelete({ field_id: req.params.field_id });
      if (!textbox) return res.status(404).json({ message: 'Textbox not found' });
      res.json({ message: 'Textbox deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const deleteDropdown = async (req, res) => {
    try {
      const dropdown = await Dropdown.findOneAndDelete({ field_id: req.params.field_id });
      if (!dropdown) return res.status(404).json({ message: 'Dropdown not found' });
      res.json({ message: 'Dropdown deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const deleteCheckbox = async (req, res) => {
    try {
      const checkbox = await Checkbox.findOneAndDelete({ field_id: req.params.field_id });
      if (!checkbox) return res.status(404).json({ message: 'Checkbox not found' });
      res.json({ message: 'Checkbox deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // ======= GET =======

export const getTextareas = async (req, res) => {
  try {
    const textareas = await Textarea.find({}, 'label rows field_id placeholder required notEditableBy');
    res.json(textareas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRadios = async (req, res) => {
  try {
    const radios = await Radio.find({}, 'label options field_id required notEditableBy');
    const formatted = {};
    radios.forEach(item => {
      formatted[item.label] = { options: item.options, field_id: item.field_id };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDateFields = async (req, res) => {
  try {
    const dates = await DateField.find({}, 'label minDate maxDate field_id required notEditableBy');
    const formatted = {};
    dates.forEach(d => formatted[d.label] = { ...d._doc });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmailFields = async (req, res) => {
  try {
    const emails = await EmailField.find({}, 'label placeholder pattern field_id required notEditableBy');
    const formatted = {};
    emails.forEach(e => formatted[e.label] = { ...e._doc });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPhoneFields = async (req, res) => {
  try {
    const phones = await PhoneField.find({}, 'label placeholder pattern field_id required notEditableBy');
    const formatted = {};
    phones.forEach(p => formatted[p.label] = { ...p._doc });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNumberFields = async (req, res) => {
  try {
    const numbers = await NumberField.find({}, 'label min max step field_id required notEditableBy');
    const formatted = {};
    numbers.forEach(n => formatted[n.label] = { ...n._doc });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======= POST =======

export const postTextareas = async (req, res) => {
  try {
    const { label, rows, placeholder, required, notEditableBy } = req.body;
    const existing = await Textarea.findOne({ label });
    if (existing) return res.status(400).json({ message: 'Textarea already exists' });

    const field_id = await generateUniqueFieldId(Textarea);
    const textarea = new Textarea({ label, rows, placeholder, field_id, required, notEditableBy });

    await textarea.save();
    res.status(201).json(textarea);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const postRadios = async (req, res) => {
  try {
    const { label, options, required, notEditableBy } = req.body;
    const existing = await Radio.findOne({ label });
    if (existing) return res.status(400).json({ message: 'Radio already exists' });

    const field_id = await generateUniqueFieldId(Radio);
    const radio = new Radio({ label, options, field_id, required, notEditableBy });
    await radio.save();
    res.status(201).json(radio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const postDateFields = async (req, res) => {
  try {
    const { label, minDate, maxDate, required, notEditableBy } = req.body;
    const existing = await DateField.findOne({ label });
    if (existing) return res.status(400).json({ message: 'DateField already exists' });

    const field_id = await generateUniqueFieldId(DateField);
    const field = new DateField({ label, minDate, maxDate, field_id, required, notEditableBy });
    await field.save();
    res.status(201).json(field);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const postEmailFields = async (req, res) => {
  try {
    const { label, placeholder, pattern, required, notEditableBy } = req.body;
    const existing = await EmailField.findOne({ label });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const field_id = await generateUniqueFieldId(EmailField);
    const email = new EmailField({ label, placeholder, pattern, field_id, required, notEditableBy });
    await email.save();
    res.status(201).json(email);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const postPhoneFields = async (req, res) => {
  try {
    const { label, placeholder, pattern, required, notEditableBy } = req.body;
    const existing = await PhoneField.findOne({ label });
    if (existing) return res.status(400).json({ message: 'Phone already exists' });

    const field_id = await generateUniqueFieldId(PhoneField);
    const phone = new PhoneField({ label, placeholder, pattern, field_id, required, notEditableBy });
    await phone.save();
    res.status(201).json(phone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const postNumberFields = async (req, res) => {
  try {
    const { label, min, max, step, required, notEditableBy } = req.body;
    const existing = await NumberField.findOne({ label });
    if (existing) return res.status(400).json({ message: 'Number already exists' });

    const field_id = await generateUniqueFieldId(NumberField);
    const number = new NumberField({ label, min, max, step, field_id, required, notEditableBy });
    await number.save();
    res.status(201).json(number);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======= PUT/UPDATE =======

export const updateTextarea = async (req, res) => {
  try {
    const { field_id } = req.params;
    const textarea = await Textarea.findOne({ field_id });
    if (!textarea) return res.status(404).json({ message: 'Not found' });

    const { label, rows, placeholder, required, notEditableBy  } = req.body;
    if (label !== textarea.label) {
      const exists = await Textarea.findOne({ label });
      if (exists) return res.status(400).json({ message: 'Label exists' });
    }

    textarea.label = label;
    textarea.rows = rows;
    textarea.placeholder = placeholder;
    textarea.required = required;
    textarea.notEditableBy = notEditableBy;
    await textarea.save();
    res.json(textarea);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Repeat same logic structure for:
export const updateRadio = async (req, res) => {
  try {
    const { field_id } = req.params;
    const { label, options, required, notEditableBy } = req.body;
    const radio = await Radio.findOne({ field_id });
    if (!radio) return res.status(404).json({ message: 'Not found' });

    if (label !== radio.label) {
      const exists = await Radio.findOne({ label });
      if (exists) return res.status(400).json({ message: 'Label exists' });
    }

    radio.label = label;
    radio.options = options;
    radio.required = required;
    radio.notEditableBy = notEditableBy;
    await radio.save();
    res.json(radio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDateField = async (req, res) => {
  try {
    const { label, minDate, maxDate, required, notEditableBy } = req.body;
    const field = await DateField.findOne({ field_id: req.params.field_id });
    if (!field) return res.status(404).json({ message: 'Not found' });
    field.label = label;
    field.minDate = minDate;
    field.maxDate = maxDate;
    field.required = required;
    field.notEditableBy = notEditableBy;
    await field.save();
    res.json(field);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEmailField = async (req, res) => {
  try {
    const { label, placeholder, pattern, required, notEditableBy } = req.body;
    const field = await EmailField.findOne({ field_id: req.params.field_id });
    if (!field) return res.status(404).json({ message: 'Not found' });
    field.label = label;
    field.placeholder = placeholder;
    field.pattern = pattern;
    field.required = required;
    field.notEditableBy = notEditableBy;
    await field.save();
    res.json(field);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePhoneField = async (req, res) => {
  try {
    const { label, placeholder, pattern, required, notEditableBy } = req.body;
    const field = await PhoneField.findOne({ field_id: req.params.field_id });
    if (!field) return res.status(404).json({ message: 'Not found' });
    field.label = label;
    field.placeholder = placeholder;
    field.pattern = pattern;
    field.required = required;
    field.notEditableBy = notEditableBy;
    await field.save();
    res.json(field);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateNumberField = async (req, res) => {
  try {
    const { label, min, max, step, required, notEditableBy } = req.body;
    const field = await NumberField.findOne({ field_id: req.params.field_id });
    if (!field) return res.status(404).json({ message: 'Not found' });
    field.label = label;
    field.min = min;
    field.max = max;
    field.step = step;
    field.required = required;
    field.notEditableBy = notEditableBy;
    await field.save();
    res.json(field);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======= DELETE =======
export const deleteTextarea = async (req, res) => {
  try {
    const result = await Textarea.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRadio = async (req, res) => {
  try {
    const result = await Radio.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDateField = async (req, res) => {
  try {
    const result = await DateField.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEmailField = async (req, res) => {
  try {
    const result = await EmailField.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePhoneField = async (req, res) => {
  try {
    const result = await PhoneField.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteNumberField = async (req, res) => {
  try {
    const result = await NumberField.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAttachments = async (req, res) => {
  try {
    const attachments = await Attachment.find({}, 'label field_id accept maxSizeMB');
    const formatted = {};
    attachments.forEach(item => {
      formatted[item.label] = {
        ...item._doc
      };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const postAttachment = async (req, res) => {
  try {
    const { label, accept, maxSizeMB, required, notEditableBy } = req.body;
    const exists = await Attachment.findOne({ label });
    if (exists) return res.status(400).json({ message: 'Attachment already exists' });

    const field_id = await generateUniqueFieldId(Attachment);
    const attachment = new Attachment({ label, accept, maxSizeMB, field_id, required, notEditableBy});
    await attachment.save();
    res.status(201).json(attachment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAttachment = async (req, res) => {
  try {
    const { label, accept, maxSizeMB, required, notEditableBy } = req.body;
    const attachment = await Attachment.findOne({ field_id: req.params.field_id });
    if (!attachment) return res.status(404).json({ message: 'Not found' });

    attachment.label = label;
    attachment.accept = accept;
    attachment.maxSizeMB = maxSizeMB;
    attachment.required = required;
    attachment.notEditableBy = notEditableBy;
    await attachment.save();
    res.json(attachment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const result = await Attachment.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInstructions = async (req, res) => {
  try {
    const instructions = await Instruction.find({}, 'label field_id value'); // Include field_id
    res.json(instructions);
  } catch (error) {
    res.status(500).send('Server error');
  }
};

export const postInstruction = async (req, res) => {
  try {
    const { label, value } = req.body;
    const exists = await Instruction.findOne({ label });
    if (exists) return res.status(400).json({ message: 'Attachment already exists' });

    const field_id = await generateUniqueFieldId(Instruction);
    const instruction = new Instruction({ label, field_id, value});
    await instruction.save();
    res.status(201).json(instruction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateInstruction = async (req, res) => {
  try {
    const { label, value } = req.body;
    const instruction = await Instruction.findOne({ field_id: req.params.field_id });
    if (!instruction) return res.status(404).json({ message: 'Not found' });

    instruction.label = label;
    instruction.value = value;
    await instruction.save();
    res.json(instruction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteInstruction = async (req, res) => {
  try {
    const result = await Instruction.findOneAndDelete({ field_id: req.params.field_id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};