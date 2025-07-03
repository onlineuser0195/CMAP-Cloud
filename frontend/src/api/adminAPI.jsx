const VITE_API_URL = import.meta.env.VITE_API_URL;

export const addUser = async (formData) => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/admin/add-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const deleteUser = async (userId) => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/admin/delete-user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: userId
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const getUsers = async () => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/admin/get-users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const getUser = async (id) => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/admin/get-user/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
 
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message);
        }
 
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
 
export const updateUser = async (userId, userData) => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/admin/update-user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
 
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message);
        }
 
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const getSiteLocations = async () => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/admin/get-locations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
 
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message);
        }
 
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const changeEmailDemo = async(email) => {
  const res = await fetch(`${VITE_API_URL}/api/admin/users/email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  const json = await res.json()
  if (!res.ok) {
    // pick up server-sent message or default
    throw new Error(json.error || 'Update failed')
  }
  return json  // { modifiedCount: number }
}