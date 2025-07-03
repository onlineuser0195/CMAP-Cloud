import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (role, email, password) => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: role,
                email: email,
                password: password
            }),
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const validateToken = async (token) => {
    try {
        const response = await fetch(`${VITE_API_URL}/api/login/validate-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
            }),
        });

        if (!response.ok) {
            throw new Error(`Authentication Failed`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export const validateUser = async (email, role, system) => {
    try {
      const res = await axios.post(`${VITE_API_URL}/api/login/validate-user`, { email, role, system });
      return res.data;            // { message: "User valid", role: ... }
    } catch (err) {
      // normalize the error
      const error = err.response?.data?.error || err.message;
      throw new Error(error);
    }
}

  // 2) Send your AAD token to backend and get the user record
export const authenticateToken = async (accessToken, role, system) => {
    try {
      const res = await axios.post(
        `${VITE_API_URL}/api/login/microsoft`,
        { role, system },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return res.data;            // { userId, firstName, lastName, email, role }
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      throw new Error(error);
    }
}