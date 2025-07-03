import { System } from '../models/systems.js';
import { Form } from '../models/forms.js';

// Get all Systems
export const getAllSystems = async (req, res) => {
    try {
        const systems = await System.find({}); // Fetch all Forms
        res.json(systems);
    } catch (error) {
        res.status(500).send('Server error');
    }
};

// Create new form
export const createSystem = async (req, res) => {
  try {
    // Get next form_id
    const lastSystem = await System.findOne().sort({ system_id: -1 });
    const system_id = lastSystem ? lastSystem.system_id + 1 : 1;

    const newSystem = new System({
      system_id,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      roles: req.body.roles || [] 
    });

    const savedSystem = await newSystem.save();
    res.json(savedSystem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating System', error });
  }
};

export const updateSystemDetails = async (req, res) => {
  try {
    const updatedSystem = await System.findOneAndUpdate(
      { system_id: req.params.systemId },
      { 
        $set: {
          name: req.body.name,
          description: req.body.description,
          status: req.body.status,
          roles: req.body.roles || []  
        }
      },
      { new: true }
    );

    if (!updatedSystem) {
      return res.status(404).json({ message: 'System not found' });
    }
    res.json(updatedSystem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating System', error });
  }
};


//Get System Details
export const getSystemDetails = async (req, res) => {
  try {
    const getSystem = await System.findOne(
      { system_id: req.params.systemId },
      { name: 1, description: 1, status: 1, roles: 1, full_name: 1 }
    );

    if (!getSystem) {
      return res.status(404).json({ message: 'System not found' });
    }
    res.json(getSystem);
  } catch (error) {
    res.status(500).json({ message: 'Error getting system details', error });
  }
};

// Get Available Forms
export const getAvailableForms = async (req, res) => {
    try {
      const { systemId } = req.params;
  
      if (parseInt(systemId) === 0) {
        // Return all forms if systemId is 0
        const allForms = await Form.find({});
        return res.json(allForms);
      } else {
        // Find the system to get its form_ids
        const system = await System.findOne({ system_id: parseInt(systemId) });
  
        if (!system) {
          return res.status(404).json({ message: "System not found" });
        }
  
        // Get forms that are NOT in the system's form_ids
        const availableForms = await Form.find({
          form_id: { $nin: system.form_ids } // Get forms NOT in the system
        }).sort({ form_id: 1 });
  
        return res.json(availableForms);
      }
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).send("Server error");
    }
  };
  

// Get all Systems
export const addFormsToSystem = async (req, res) => {
    try {
        const updatedSystem = await System.findOneAndUpdate(
          { system_id: req.params.systemId },
          { $addToSet: { form_ids: { $each: req.body.form_ids } } }, // Prevent duplicates
          { new: true }
        );
    
        if (!updatedSystem) {
          return res.status(404).json({ message: 'System not found' });
        }
    
        res.json(updatedSystem);
      } catch (error) {
        res.status(500).json({ message: 'Error updating system forms', error });
      }
    };

export const removeFormFromSystem = async (req, res) => {
    try {
        let { systemId, formId } = req.params;

        systemId = parseInt(systemId, 10);
        formId = parseInt(formId, 10);

        const system = await System.findOneAndUpdate(
            { system_id: systemId },
            { $pull: { form_ids: formId } },
            { new: true }
        );

        if (!system) {
            return res.status(404).json({ error: 'System not found' });
        }

        res.json({ message: 'Form removed from system' });
    } catch (error) {
        console.error('Error removing form from system:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteSystem = async (req, res) => {
  const { systemId } = req.params;

  try {
    const parsedSystemId = parseInt(systemId, 10);

    const deletedSystem = await System.findOneAndDelete({ system_id: parsedSystemId });
    if (!deletedSystem) {
      return res.status(404).json({ error: 'Sysmtem not found' });
    }

    res.status(200).json({ message: 'System deleted!' });

  } catch (error) {
    console.error('Error deleting System:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};