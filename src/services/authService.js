import axiosInstance from '../api/axiosInstance';

const saveTokens = (data) => {
  console.log('Auth response data:', data);

  const access =
    data?.access ||
    data?.tokens?.access;

  const refresh =
    data?.refresh ||
    data?.tokens?.refresh;

  if (!access || !refresh) {
    throw new Error('Tokens not found in response');
  }

  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);

  if (data?.user) {
    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );
  }
};

export const registerUser = async (userData) => {
  const response = await axiosInstance.post(
    '/auth/register/',
    userData
  );

  saveTokens(response.data);

  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axiosInstance.post(
    '/auth/login/',
    credentials
  );

  saveTokens(response.data);

  return response.data;
};

export const logoutUser = async () => {
  const refreshToken =
    localStorage.getItem('refresh');

  try {
    if (refreshToken) {
      await axiosInstance.post(
        '/auth/logout/',
        {
          refresh: refreshToken,
        }
      );
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.clear();
  }
};

export const getProfile = async () => {
  const response = await axiosInstance.get(
    '/auth/me/'
  );

  return response.data;
};

export const updateProfile = async (data) => {
  const formData = new FormData();

  formData.append(
    'first_name',
    data.first_name
  );

  formData.append(
    'last_name',
    data.last_name
  );

  formData.append(
    'phone_number',
    data.phone_number
  );

  if (data.image) {
    formData.append(
      'image',
      data.image
    );
  }

  const response = await axiosInstance.put(
    '/auth/me/',
    formData
  );

  return response.data;
};

export const changeEmail = async (data) => {
  const response = await axiosInstance.post(
    '/auth/change-email/',
    data
  );

  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosInstance.post(
    '/auth/change-password/',
    data
  );

  return response.data;
};

export const getClientReviews = async () => {
  const response = await axiosInstance.get(
    '/client/reviews/'
  );

  return response.data;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access');
};