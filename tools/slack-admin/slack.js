import { API_ENDPOINT } from './config.js';

/* eslint-disable no-alert */
const myslack = document.getElementById('myslack');
const slackContainer = document.getElementById('slack-container');

const key = document.getElementById('key');
const email = document.getElementById('email');

const persistFormFields = () => {
  localStorage.setItem('key', key.value);
  localStorage.setItem('email', email.value);
};
const getAllChannels = async () => {
  try {
    const response = await fetch(`${API_ENDPOINT}/teams`, {
      headers: {
        'x-api-key': key.value,
      },
    });

    if (response.ok) {
      const teams = await response.json();
      return teams;
    }
  } catch (e) { /* empty */ }

  return [];
};

const refreshSaveButton = () => {
  const button = document.getElementById('save');

  const add = slackContainer.querySelectorAll('.add');
  const remove = slackContainer.querySelectorAll('.remove');

  if (add.length || remove.length) {
    button.removeAttribute('disabled');
  } else {
    button.setAttribute('disabled', true);
  }
};

const displayChannels = async () => {
  slackContainer.innerHTML = '<span class="spinner"></span>';

  const channels = await getAllChannels();

  if (channels.length === 0) {
    slackContainer.innerHTML = '<p>No channels found - invite user first.</p>';
    return;
  }

  const all = await getAllChannels();
  all.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const ul = document.createElement('ul');

  all.forEach((channel) => {
    const found = channels.find((t) => t.displayName === channel.displayName);
    const li = document.createElement('li');
    li.classList.add(found ? 'member' : 'not-member');

    const title = document.createElement('h4');
    title.textContent = channel.displayName;
    li.appendChild(title);

    const description = document.createElement('p');
    description.textContent = channel.description;
    li.appendChild(description);

    ul.appendChild(li);

    li.addEventListener('click', () => {
      if (found) {
        if (li.classList.contains('remove')) {
          li.classList.remove('remove');
        } else {
          li.classList.add('remove');
        }
      } else if (li.classList.contains('add')) {
        li.classList.remove('add');
      } else {
        li.classList.add('add');
      }

      refreshSaveButton();
    });
  });

  const button = document.createElement('button');
  button.id = 'save';
  button.textContent = 'Save';
  button.disabled = true;
  button.classList.add('button');

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>';
    const add = slackContainer.querySelectorAll('.add');

    const body = {
      add: [],
      remove: [],
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const li of add) {
      const displayName = li.querySelector('h4').textContent;
      body.add.push(displayName);
    }

    const remove = slackContainer.querySelectorAll('.remove');

    // eslint-disable-next-line no-restricted-syntax
    for (const li of remove) {
      const displayName = li.querySelector('h4').textContent;
      body.remove.push(displayName);
    }

    try {
      const res = await fetch(`${API_ENDPOINT}/users/${email.value}/channels`, {
        method: 'POST',
        headers: {
          'x-api-key': key.value,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error(`Error saving updates: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.error(e);
    }

    await displayChannels();
  });

  const wrapper = document.createElement('p');
  wrapper.classList.add('button-wrapper');
  wrapper.appendChild(button);

  slackContainer.innerHTML = '';
  slackContainer.appendChild(ul);
  slackContainer.appendChild(wrapper);
};

/**
 * Handles site admin form submission.
 * @param {Event} e - Submit event.
 */
myslack.addEventListener('click', async (e) => {
  e.preventDefault();
  persistFormFields();

  await displayChannels();
});

key.value = localStorage.getItem('key') || '';
email.value = localStorage.getItem('email') || '@adobe.com';
