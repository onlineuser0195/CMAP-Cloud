import React from 'react';
import { USER_ROLES } from '../../../constants/constants';

const FieldModal = ({
  isOpen,
  isEditing,
  componentType,
  onClose,
  onSubmit,
  onDelete,
  newLabel,
  setNewLabel,
  handleOptionChange,
  addOption,
  removeOption
}) => {
  if (!isOpen) return null;

  const isOptionField = ['select', 'checkbox', 'radio'].includes(componentType);
  
  const availableRoles = Object.values(USER_ROLES);

  // Handle role selection changes
  const handleRoleChange = (role) => {
    const currentRoles = newLabel.notEditableBy || [];
    const updatedRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setNewLabel({ ...newLabel, notEditableBy: updatedRoles });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-content">
          <h5 className='text-center'>{isEditing ? 'Edit' : 'Add New'} {componentType} Label</h5>
          <form onSubmit={onSubmit} className="modal-canvas">
            {/* First Column: All Form Inputs */}
            <div className="modal-column">
              {/* Label input */}
              <div className="modal-group">
                <label>Label Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newLabel.label}
                  onChange={(e) => setNewLabel({ ...newLabel, label: e.target.value })}
                  required
                />
              </div>

              {/* Text and Textarea: Placeholder */}
              {['text', 'textarea'].includes(componentType) && (
                <div className="form-group">
                  <label>Placeholder</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newLabel.placeholder}
                    onChange={(e) => setNewLabel({ ...newLabel, placeholder: e.target.value })}
                  />
                </div>
              )}

              {/* Option-based fields */}
              {isOptionField && (
                <div className="form-group">
                  <label>Options</label>
                  {newLabel.options.map((option, idx) => (
                    <div key={idx} className="input-group mb-1">
                      <input
                        type="text"
                        className="form-control"
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeOption(idx)}
                        disabled={newLabel.options.length === 1}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary mt-2"
                    onClick={addOption}
                  >
                    Add Option
                  </button>
                </div>
              )}

              {/* Textarea - rows */}
              {componentType === 'textarea' && (
                <div className="form-group">
                  <label>Number of Rows</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newLabel.rows}
                    min="1"
                    onChange={(e) => setNewLabel({ ...newLabel, rows: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {/* Date field */}
              {componentType === 'date' && (
                <>
                  <div className="form-group">
                    <label>Minimum Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newLabel.minDate || ''}
                      onChange={(e) => setNewLabel({ ...newLabel, minDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newLabel.maxDate || ''}
                      onChange={(e) => setNewLabel({ ...newLabel, maxDate: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Email or Phone */}
              {(componentType === 'email' || componentType === 'phone') && (
                <>
                  <div className="form-group">
                    <label>Placeholder</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newLabel.placeholder || ''}
                      onChange={(e) => setNewLabel({ ...newLabel, placeholder: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Validation Pattern (Regex)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newLabel.pattern || ''}
                      onChange={(e) => setNewLabel({ ...newLabel, pattern: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Number field */}
              {componentType === 'number' && (
                <>
                  <div className="form-group">
                    <label>Minimum Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newLabel.min ?? ''}
                      onChange={(e) => setNewLabel({ ...newLabel, min: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newLabel.max ?? ''}
                      onChange={(e) => setNewLabel({ ...newLabel, max: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Step</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newLabel.step}
                      onChange={(e) => setNewLabel({ ...newLabel, step: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Attachment-specific */}
              {componentType === 'attachment' && (
                <>
                  <div className="form-group">
                    <label>Accepted File Types (e.g. .pdf, image/*)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newLabel.accept}
                      onChange={(e) => setNewLabel({ ...newLabel, accept: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Size (MB)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newLabel.maxSizeMB}
                      min="1"
                      max="100"
                      onChange={(e) => setNewLabel({ ...newLabel, maxSizeMB: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Second Column: Not Editable By Section */}
            <div className="form-column">
              {/* Not Editable By section */}
              {componentType !== 'instruction' && (
                <div className="form-group">
                  <label>Not Editable By (Restrict editing for these roles)</label>
                  <div className="role-checkboxes">
                    {availableRoles.map(role => (
                      <div key={role} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`notEditable-${role}`}
                          checked={newLabel.notEditableBy?.includes(role) || false}
                          onChange={() => handleRoleChange(role)}
                        />
                        <label className="form-check-label" htmlFor={`notEditable-${role}`}>
                          {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                  <small className="text-muted">Select roles that should NOT be able to edit this field</small>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-danger mr-auto"
                  onClick={onDelete}
                >
                  Delete Field
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save Changes' : 'Save Label'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FieldModal;