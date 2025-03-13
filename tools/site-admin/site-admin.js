/* eslint-disable no-alert */
const adminForm = document.getElementById('site-admin-form');
const org = document.getElementById('org');
const logTable = document.querySelector('table tbody');
const sitesElem = document.querySelector('div#sites');

/**
 * Logs the response information to the log table.
 * @param {Array} cols - Array containing response information.
 */
function logResponse(cols) {
  const hidden = logTable.closest('[aria-hidden]');
  if (hidden) hidden.removeAttribute('aria-hidden');
  const row = document.createElement('tr');
  // get the current time in hh:mm:ss format
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  // add each column (including time) to the row
  [...cols, time].forEach((col, i) => {
    const cell = document.createElement('td');
    if (!i) { // decorate status code
      const code = `<span class="status-light http${Math.floor(col / 100) % 10}">${col}</span>`;
      cell.innerHTML = code;
    } else cell.textContent = col;
    row.append(cell);
  });
  logTable.prepend(row);
}

async function saveSiteConfig(path, site, codeSrc, contentSrc) {
  const codeURL = new URL(codeSrc);
  const [, owner, repo] = codeURL.pathname.split('/');
  const code = {
    owner,
    repo,
    source: {
      type: 'github',
      url: codeSrc,
    },
  };
  const content = {
    source: {
      type: 'markup',
      url: contentSrc,
    },
  };

  const contentURL = new URL(contentSrc);
  if (contentSrc.startsWith('https://drive.google.com/drive')) {
    const id = contentURL.pathname.split('/').pop();
    content.source.type = 'google';
    content.source.id = id;
  }

  if (contentSrc.includes('sharepoint.com/')) {
    content.source.type = 'onedrive';
  }

  site.content = content;
  site.code = code;
  const adminURL = `https://admin.hlx.page${path}`;
  const resp = await fetch(adminURL, {
    method: 'POST',
    body: JSON.stringify(site),
    headers: {
      'content-type': 'application/json',
    },
  });
  await resp.text();
  logResponse([resp.status, 'POST', adminURL, resp.headers.get('x-error') || '']);
  // eslint-disable-next-line no-use-before-define
  displaySitesForOrg(org.value);
}

async function deleteSiteConfig(path) {
  const adminURL = `https://admin.hlx.page${path}`;
  const resp = await fetch(adminURL, {
    method: 'DELETE',
  });
  await resp.text();
  logResponse([resp.status, 'DELETE', adminURL, resp.headers.get('x-error') || '']);
  // eslint-disable-next-line no-use-before-define
  displaySitesForOrg(org.value);
}

function displaySiteDetails(path, name, elem, site = {
  code: {
    source: {
      url: '',
    },
  },
  content: {
    source: {
      url: '',
    },
  },
}) {
  elem.innerHTML = `<form id=${name}>
        <div class="form-field url-field">
          <label for="${name}-code">GitHub URL</label>
          <input value="${site.code.source.url}" name="code" id="${name}-code" required type="url"/>
          <div class="field-help-text">
            <p>
              Enter Code URL for the GitHub Repo to be used for this site
            </p>
          </div>
        </div>
        <div class="form-field url-field">
          <label for="${name}-content">Content Source</label>
          <input value="${site.content.source.url}" name="content" id="${name}-content" required type="url"/>
          <div class="field-help-text">
            <p>
              Enter Source URL for your Sharepoint, Google Drive or MarkUp source
            </p>
          </div>
        </div>
        <p class="button-wrapper">
          <button type="submit" id="${name}-save" class="button">Save</button>
          <button id="${name}-clone" class="button outline">Copy Site to ...</button>
          <button id="${name}-delete" class="button outline">Delete ...</button>
        </p>
    </form>`;
  const save = elem.querySelector(`#${name}-save`);
  save.addEventListener('click', (e) => {
    e.preventDefault();
    const contentSrc = elem.querySelector('input[name="content"]').value;
    const codeSrc = elem.querySelector('input[name="code"]').value;
    saveSiteConfig(path, site, codeSrc, contentSrc);
  });
  const clone = elem.querySelector(`#${name}-clone`);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    const contentSrc = elem.querySelector('input[name="content"]').value;
    const codeSrc = elem.querySelector('input[name="code"]').value;
    const sitename = prompt('Enter name of new site (eg. site1)');
    const newpath = `${path.substring(0, path.lastIndexOf('/'))}/${sitename}.json`;
    saveSiteConfig(newpath, site, codeSrc, contentSrc);
  });
  const remove = elem.querySelector(`#${name}-delete`);
  remove.addEventListener('click', (e) => {
    e.preventDefault();
    const [owner, sitecheck] = prompt('For safety enter org/sitename of the site you are about to delete').split('/');

    if (path === `/config/${owner}/sites/${sitecheck}.json`) deleteSiteConfig(path);
  });
}

function displaySite(site, sitesList, editMode = false) {
  const li = document.createElement('li');
  li.innerHTML = `<div class="sites-site-name">${site.name} <a target="_blank" href="https://main--${site.name}--${org.value}.aem.page/"><span class="site-admin-oinw"></span></a></div>`;
  const buttons = document.createElement('div');
  buttons.className = 'sites-site-edit';
  const edit = document.createElement('button');
  edit.className = 'button';
  edit.dataset.path = site.path;
  edit.textContent = 'Edit';
  edit.ariaHidden = editMode;
  buttons.append(edit);
  const cancel = document.createElement('button');
  cancel.className = 'button outline';
  cancel.dataset.path = site.path;
  cancel.textContent = 'Cancel';
  cancel.ariaHidden = !editMode;
  buttons.append(cancel);
  li.append(buttons);
  const details = document.createElement('div');
  details.className = 'sites-site-details';
  details.ariaHidden = !editMode;

  li.append(details);

  edit.addEventListener('click', async () => {
    const adminURL = `https://admin.hlx.page${site.path}`;
    const resp = await fetch(adminURL);
    if (resp.status === 200) {
      const siteDetails = await resp.json();
      displaySiteDetails(site.path, site.name, details, siteDetails);
      cancel.ariaHidden = false;
      edit.ariaHidden = true;
      details.ariaHidden = false;
    }
    logResponse([resp.status, 'GET', adminURL, resp.headers.get('x-error') || '']);
  });

  cancel.addEventListener('click', async () => {
    cancel.ariaHidden = true;
    edit.ariaHidden = false;
    details.innerText = '';
    details.ariaHidden = true;
  });

  sitesList.append(li);
  return details;
}

async function addNewSite(sitesList, blueprint) {
  const sitename = prompt('Enter name of new site (eg. site1)');
  if (sitename) {
    const path = `/config/${org.value}/sites/${sitename}.json`;
    const details = displaySite({
      name: sitename,
      path,
    }, sitesList, true);
    displaySiteDetails(path, sitename, details, blueprint);
  }
}

function displaySites(sites) {
  sitesElem.ariaHidden = false;
  sitesElem.textContent = '';
  const div = document.createElement('div');
  div.classList.add('sites-list-button-bar');
  const addNew = document.createElement('button');
  addNew.className = 'button';
  addNew.textContent = 'Add new site...';
  addNew.addEventListener('click', () => {
    // eslint-disable-next-line no-use-before-define
    addNewSite(sitesList);
  });
  div.append(addNew);
  sitesElem.append(div);
  const div2 = document.createElement('div');
  const sitesList = document.createElement('ol');
  sitesList.id = 'sites-list';
  sites.forEach((site) => {
    displaySite(site, sitesList);
  });
  div2.append(sitesList);
  sitesElem.append(div2);
}

async function displaySitesForOrg(orgValue) {
  const adminURL = `https://admin.hlx.page/config/${orgValue}/sites.json`;
  const resp = await fetch(adminURL);
  if (resp.status === 200) {
    const { sites } = await resp.json();
    displaySites(sites);
  }
  logResponse([resp.status, 'GET', adminURL, resp.headers.get('x-error') || '']);
}

/**
 * Handles site admin form submission.
 * @param {Event} e - Submit event.
 */
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  localStorage.setItem('org', org.value);
  displaySitesForOrg(org.value);
});

org.value = localStorage.getItem('org') || 'adobe';
if (org.value) displaySitesForOrg(org.value);
