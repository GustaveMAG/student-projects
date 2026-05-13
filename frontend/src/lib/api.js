import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api',
});

// Attache le JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirige vers /login si 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list:          ()         => api.get('/projects'),
  dashboard:     ()         => api.get('/projects/stats/dashboard'),
  get:           (id)       => api.get(`/projects/${id}`),
  create:        (data)     => api.post('/projects', data),
  update:        (id, data) => api.put(`/projects/${id}`, data),
  remove:        (id)       => api.delete(`/projects/${id}`),
  addMember:     (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember:  (id, uid)  => api.delete(`/projects/${id}/members/${uid}`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list:         (pid, params) => api.get(`/projects/${pid}/tasks`, { params }),
  get:          (pid, id)     => api.get(`/projects/${pid}/tasks/${id}`),
  create:       (pid, data)   => api.post(`/projects/${pid}/tasks`, data),
  update:       (pid, id, data) => api.put(`/projects/${pid}/tasks/${id}`, data),
  updateStatus: (pid, id, statut) =>
    api.patch(`/projects/${pid}/tasks/${id}/status`, { statut }),
  remove: (pid, id) => api.delete(`/projects/${pid}/tasks/${id}`),
};

// ── Deliverables ──────────────────────────────────────────────────────────────
export const deliverablesApi = {
  list:   (pid)      => api.get(`/projects/${pid}/deliverables`),
  upload: (pid, fd)  => api.post(`/projects/${pid}/deliverables`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (pid, id)  => api.delete(`/projects/${pid}/deliverables/${id}`),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsApi = {
  list:   (tid)      => api.get(`/tasks/${tid}/comments`),
  create: (tid, data) => api.post(`/tasks/${tid}/comments`, data),
  remove: (tid, id)   => api.delete(`/tasks/${tid}/comments/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users', { params }),
};

export default api;
