const API_BASE = `${process.env.NEXT_PUBLIC_API_BACKEND_URL}`;

const getToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token;
  }
  return null;
};

const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    const saved = localStorage.getItem('token');
  }
};

const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

const setUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    const data = localStorage.getItem('user');
    const userUuid = user?.uuid || (data ? JSON.parse(data).uuid : null);
    if (userUuid) {
      localStorage.setItem('userUuid', userUuid);
    } else {
    }
    
  }
};

const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user:', error);
    return null;
  }
};

const getRedirectUrl = () => {
  if (typeof window === 'undefined') return '/dashboard';
  
  const sessionRedirect = sessionStorage.getItem('redirectAfterLogin');
  if (sessionRedirect) {
    return sessionRedirect;
  }
  
  const params = new URLSearchParams(window.location.search);
  const queryRedirect = params.get('redirect');
  if (queryRedirect) {
    return queryRedirect;
  }
  
  return '/dashboard';
};

export const api = {
  getApplication: async (token: string, UserUuid: string) => {
    const url = `${API_BASE}/transactions/my-applications`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!res.ok) {
        console.error('🔴 Backend error:', responseData);
        throw new Error(responseData.message || responseData.error || `HTTP ${res.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('❌ API call failed:', error);
      throw error;
    }
  },

  createPelamar: async (token: string, data: any) => {
    const url = `${API_BASE}/pelamars`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', 
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(data), 
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!res.ok) {
        console.error('🔴 Backend error:', responseData);
        throw new Error(responseData.message || responseData.error || `HTTP ${res.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('❌ API call failed:', error);
      throw error;
    }
  },

  checkEmail: async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/checkemail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      return {
        success: res.ok && result.success,
        ...result,
      };
    } catch (error) {
      console.error("❌ Check email error:", error);
      return {
        success: false,
        message: "Failed to check email",
      };
    }
  },
  
  register: async (data: {
  username: string;
  name: string;
  email: string;
  password: string;
  no_hp: string;
}) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    
    // Handle response
    if (res.ok && result.success && result.data?.token) {
      setToken(result.data.token);
      if (result.data.user) {
        setUser(result.data.user);
      }
      return result;
    } else {
      // Jika response tidak OK
      return {
        success: false,
        message: result.message || result.error || 'Registrasi gagal',
        ...result
      };
    }
  } catch (error) {
    console.error('Register API error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
},

  login: async (email: string, password: string) => {
    const body = password ? { email, password } : { email };
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
      });
      
      const result = await res.json();
      const token = result?.data?.token;
      const user = result?.data?.user;
      const isSuccess = result?.success === true;
      
      if (token && isSuccess) {
        
        localStorage.setItem('token', token);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { 
          success: true,
          isAdmin: true,
          data: { token, user },
          ...result 
        };
      }
      
      console.warn('Login failed or no token');
      return { 
        success: false, 
        message: result?.message || 'Login failed',
        ...result 
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  me: async () => {
    const token = getToken();
    
    if (!token) {
      throw new Error('No token found');
    }

    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = await res.json();
    if (data.success && data.data) {
      setUser(data.data);
      return { success: true, data: data.data };
    }

    if (res.status === 401) {
      console.warn('⚠️ Token invalid, removing auth data');
      removeToken();
    }

    return data.data ? { success: true, data: data.data } : { success: false, message: data.message || 'Failed to fetch user' } ;
  },

  otpEmailForgotPassword: async (email: string) => {
    try{
      const res = await fetch(`${API_BASE}/otp/request`, {
        method:"POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email }),
      });
      return res.json();
    } catch (error) {
      console.error('❌ Error requesting OTP:', error);
      throw error;
    }
  },

  resetPassword: async (email:string,otp_code: string, new_Password: string) => {
    try {
      const res = await fetch(`${API_BASE}/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, otp_code, new_Password }),
      });
      return res.json();
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      throw error;
    }
  },

  updateProfile: async (data: any) => {
    const token = getToken();
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_BASE}/auth/update-profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.success && result.data) {
      const currentUser = getCurrentUser();
      const updatedUser = { ...currentUser, ...result.data };
      setUser(updatedUser);
    }

    return result;
  },

  uploadCV: async (formData: FormData) => {
    const token = getToken();
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_BASE}/auth/upload-cv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    const result = await res.json();

    if (result.success && result.data) {
      const currentUser = getCurrentUser();
      const updatedUser = { ...currentUser, cvFile: result.data.cvFile };
      setUser(updatedUser);
    }

    return result;
  },

  deleteCV: async () => {
    const token = getToken();
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_BASE}/auth/cv`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    const result = await res.json();

    if (result.success) {
      const currentUser = getCurrentUser();
      const updatedUser = { ...currentUser, cvFile: null };
      setUser(updatedUser);
    }

    return result;
  },

  logout: async (token?: string) => {
    const authToken = token || getToken();
    
    if (authToken) {
      try {
        const res = await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        const result = await res.json();
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    removeToken();
    localStorage.removeItem('userUuid');
    localStorage.removeItem('email');
    
    return { success: true };
  },

  googleLogin: (redirect?: string) => {
    if (typeof window === 'undefined') return;
    
    let redirectUrl = redirect || getRedirectUrl();
    if (redirectUrl && redirectUrl !== '/dashboard/v2') {
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
    }
    
    const targetRedirect = `${window.location.origin}/dashboard`;
    window.location.href = `${API_BASE}/auth/google?redirect=${encodeURIComponent(targetRedirect)}`;
  },

  passkeyRegisterBegin: async (username: string) => {
    const res = await fetch(`${API_BASE}/auth/passkey/register/begin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    
    if (data.success && data.data?.publicKey) {
      return {
        success: true,
        data: data.data.publicKey,
      };
    }
    
    return {
      success: false,
      data: null,
    };
  },

  passkeyRegisterFinish: async (username: string, response: any) => {

    const res = await fetch(`${API_BASE}/auth/passkey/register/finish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        username,
        response,
      }),
    });

    const data = await res.json();

    return data;
  },

  passkeyLoginBegin: async () => {
    const res = await fetch(`${API_BASE}/auth/passkey/login/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return data;
  },

  passkeyLoginFinish: async (sessionId: string, response: any) => {
    
    const res = await fetch(`${API_BASE}/auth/passkey/login/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        session_id: sessionId,
        response: {
          id: response.id,
          rawId: response.rawId,
          type: response.type || 'public-key',
          response: {
            clientDataJSON: response.response.clientDataJSON,
            authenticatorData: response.response.authenticatorData,
            signature: response.response.signature,
            userHandle: response.response.userHandle || null,
          },
        },
      }),
    });
    
    const data = await res.json();
    return data;
  },

  hasPasskey: async (username: string) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      return { success: false, data: { has_passkey: false } };
    }

    try {
      const res = await fetch(
        `${API_BASE}/auth/passkey/${username}/status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('🔵 hasPasskey error:', error);
      return { success: false, data: { has_passkey: false } };
    }
  },

  myPelamar: async () =>{
    const token = localStorage.getItem("token");
    try{
      const res = await fetch(`${API_BASE}/pelamars/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('🔵 myPelamar error:', error);
      return { success: false, data: null };
    }
  },

  // ── Room Management ────────────────────────────────────────────
  // ── Room Management ────────────────────────────────────────────
  createRoom: async (roomName: string, notes?: string, roomType: string = 'private') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ room_name: roomName, notes: notes || '', room_type: roomType }),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result?.message || 'Gagal membuat room' };
      }

      return {
        success: true,
        data: result?.data,
        room: result?.data?.room,
        room_code: result?.data?.room?.room_code,
        room_name: result?.data?.room?.room_name,
        room_type: result?.data?.room?.room_type || roomType,
      };
    } catch (error: any) {
      console.error('Create room error:', error);
      return { success: false, message: error?.message || 'Network error' };
    }
  },

  // Alias createInterview → createRoom (untuk kompatibilitas dashboard)
  createInterview: async (opts: { title?: string; scheduled_at?: string; room_type?: string }) => {
    try {
      const token = localStorage.getItem('token');
      const roomName = opts?.title || `Meeting ${new Date().toLocaleDateString('id-ID')}`;
      const roomType = opts?.room_type || 'private';
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ room_name: roomName, room_type: roomType }),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result?.message || 'Gagal membuat room' };
      }

      const room = result?.data?.room;
      return {
        success: true,
        data: {
          room_name: room?.room_code,   // room_code dipakai sebagai ID masuk meeting
          room_uuid: room?.uuid,
          room_code: room?.room_code,
          room_type: room?.room_type || roomType,
          access_token: null,
        },
        room,
      };
    } catch (error: any) {
      console.error('Create interview error:', error);
      return { success: false, message: error?.message || 'Network error' };
    }
  },

  listRooms: async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const result = await res.json();
      return { success: res.ok, rooms: result?.data?.rooms || [], ...result };
    } catch (error: any) {
      return { success: false, rooms: [], message: error?.message };
    }
  },

  // validateToken → cek room via room_code (alias checkRoom untuk dashboard)
  validateToken: async (roomCode: string) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/check/${roomCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const result = await res.json();
      return { success: res.ok && result?.data?.is_active !== false, ...result };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error' };
    }
  },

  checkRoom: async (roomCode: string) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/check/${roomCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result?.message || 'Failed to check room',
        };
      }

      return {
        success: true,
        data: result?.data,
        room: result?.data?.room,
        status: result?.data?.status,
        roomType: result?.data?.room_type || 'private',
        roomName: result?.data?.room_name || '',
      };
    } catch (error: any) {
      console.error('Check room error:', error);
      return {
        success: false,
        message: error?.message || 'Network error',
      };
    }
  },
  joinRoom: async (roomCode: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          room_code: roomCode,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result?.message || "Failed to join room",
        };
      }

      return {
        success: true,
        participant: result?.data || result,
      };
    } catch (error: any) {
      console.error("Join room error:", error);

      return {
        success: false,
        message: error?.message || "Network error",
      };
    }
  },
  joinRoomGuest: async (roomCode: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/join-guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          room_code: roomCode,
          name: name || "Guest",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result?.message || result?.error || "Failed to join room as guest",
        };
      }

      const participantData = result?.data || result;
      return {
        success: true,
        participant: {
          participant_uuid: participantData.participant_uuid || participantData.uuid,
          room_uuid: participantData.room_uuid,
          status: participantData.status || "pending",
          role: participantData.role || "candidate",
          name: participantData.name || name || "Guest",
        },
      };
    } catch (error: any) {
      console.error("Join room guest error:", error);

      return {
        success: false,
        message: error?.message || "Network error",
      };
    }
  },
  approveParticipant: async (uuid: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/participants/${uuid}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      const result = await res.json();
      return { success: res.ok, ...result };
    } catch (error: any) {
      console.error("Approve participant error:", error);
      return { success: false, message: error?.message || "Network error" };
    }
  },
  rejectParticipant: async (uuid: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/participants/${uuid}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      const result = await res.json();
      return { success: res.ok, ...result };
    } catch (error: any) {
      console.error("Reject participant error:", error);
      return { success: false, message: error?.message || "Network error" };
    }
  },

  // ── Helper methods untuk auth ──────────────────────────────────
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAdmin: () => {
    // Semua user yang sudah login bisa akses
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
};