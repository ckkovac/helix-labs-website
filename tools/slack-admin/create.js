import { API_ENDPOINT } from './config.js';

/* eslint-disable no-alert */
const createButton = document.getElementById('create');
const result = document.getElementById('result');

const key = document.getElementById('key');

const persistFormFields = () => {
  localStorage.setItem('key', key.value);
};

const create = async () => {
  try {
    const body = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
    };

    const response = await fetch(`${API_ENDPOINT}/channels`, {
      method: 'PUT',
      headers: {
        'x-api-key': key.value,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      result.innerHTML = '<p>Channel created</p>';
    } else {
      result.innerHTML = '<p>Cannot create channel</p>';
    }
  } catch (e) {
    result.innerHTML = '<p>Cannot create channel</p>';
  }
};

key.value = localStorage.getItem('key') || '';

createButton.addEventListener('click', async (e) => {
  e.preventDefault();
  persistFormFields();

  await create();
});
