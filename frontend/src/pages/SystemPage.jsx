import React from 'react';
import SystemDetails from '../layouts/admin/system/SystemDetails';
import BackButton from '../components/buttons/BackButton';

const SystemPage = () => (
  <div>
    <BackButton />
    <h1 className="text-center my-4">System Details</h1>
    <SystemDetails />
  </div>
);

export default SystemPage;