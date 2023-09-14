import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateUser';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      if (type === 'password') {
        showAlert('success', 'Password updated successfully ✌️');
      } else {
        showAlert('success', 'Data updated successfully ✌️');
      }
      window.setTimeout(() => {
        location.assign('/account');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
