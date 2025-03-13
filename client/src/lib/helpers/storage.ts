export const saveUserToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("userToken", token);
  }
};

export const getUserToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userToken");
  }
  return null;
};

export const saveAdminToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("adminToken", token);
  }
};

export const getAdminToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken");
  }
  return null;
};
