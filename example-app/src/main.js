import './style.css';
import { Capacitor } from '@capacitor/core';
import {
  CapgoAppIntents,
  drainPendingInvocations,
} from '@capgo/capacitor-app-intents';

const statusEl = document.getElementById('plugin-status');
const logEl = document.getElementById('invocation-log');

const invocations = [];

function renderLog() {
  if (invocations.length === 0) {
    logEl.classList.add('empty');
    logEl.textContent = 'No invocations yet.';
    return;
  }
  logEl.classList.remove('empty');
  logEl.innerHTML = invocations
    .map(
      (item) =>
        `<div class="log-item"><strong>${item.name}</strong> <span class="muted">${item.source}</span><pre>${JSON.stringify(item.params, null, 2)}</pre></div>`,
    )
    .join('');
}

function pushInvocation(invocation) {
  invocations.unshift(invocation);
  renderLog();
}

async function handleInvocation(invocation) {
  pushInvocation(invocation);
}

async function init() {
  try {
    if (!Capacitor.isNativePlatform()) {
      statusEl.textContent =
        'Web platform: native APIs are unimplemented. Build the iOS example app to test Siri, Shortcuts, and Spotlight.';
      statusEl.className = 'warn';
      return;
    }

    const { version } = await CapgoAppIntents.getPluginVersion();
    statusEl.textContent = `Plugin ready (v${version}). Use Siri, Shortcuts, Spotlight, or the buttons below.`;
    statusEl.className = 'success';

    await drainPendingInvocations(handleInvocation);
    await CapgoAppIntents.addListener('appIntentInvoked', async (event) => {
      await handleInvocation(event.invocation);
      await CapgoAppIntents.removePendingInvocation({ id: event.invocation.id });
    });
  } catch (error) {
    statusEl.textContent = `Plugin error: ${error.message}`;
    statusEl.className = 'error';
  }
}

document.getElementById('clear-log')?.addEventListener('click', () => {
  invocations.length = 0;
  renderLog();
});

document.getElementById('seed-catalog')?.addEventListener('click', async () => {
  await CapgoAppIntents.setEntityCatalog({
    type: 'dish',
    entries: [
      { id: 'pasta', title: 'Pasta', subtitle: 'Fresh today' },
      { id: 'salad', title: 'Salad', subtitle: 'Vegan' },
    ],
  });
  pushInvocation({
    name: 'debug',
    source: 'app_intent',
    params: { message: 'Catalog seeded for type dish' },
  });
});

document.getElementById('register-shortcuts')?.addEventListener('click', async () => {
  await CapgoAppIntents.setShortcutDefinitions({
    shortcuts: [
      {
        actionName: 'orderDish',
        shortTitle: 'Order dish',
        systemImageName: 'fork.knife',
        phrases: ['Order a dish in {{applicationName}}'],
      },
      {
        actionName: 'openMenu',
        shortTitle: 'Open menu',
        systemImageName: 'list.bullet',
        phrases: ['Open the menu in {{applicationName}}'],
      },
    ],
  });
});

document.getElementById('refresh-shortcuts')?.addEventListener('click', async () => {
  await CapgoAppIntents.refreshShortcuts();
});

document.getElementById('index-spotlight')?.addEventListener('click', async () => {
  await CapgoAppIntents.indexSpotlightEntities({
    entities: [
      {
        id: 'dish-pasta',
        title: 'Pasta',
        description: 'House special',
        keywords: ['food', 'pasta'],
        actionName: 'openDish',
        params: { dishId: 'pasta' },
      },
    ],
  });
});

document.getElementById('remove-spotlight')?.addEventListener('click', async () => {
  await CapgoAppIntents.removeSpotlightEntities({ ids: ['dish-pasta'] });
});

document.getElementById('set-quick-actions')?.addEventListener('click', async () => {
  await CapgoAppIntents.setHomeScreenShortcutItems({
    items: [
      {
        type: 'lastOrder',
        title: 'Last order',
        subtitle: 'Open your last order',
        iconName: 'clock',
        params: { screen: 'orders' },
      },
    ],
  });
});

document.getElementById('mail-schema')?.addEventListener('click', async () => {
  try {
    await CapgoAppIntents.performAppleSchemaTemplate({
      template: 'mail_create_draft',
      params: { to: 'hello@example.com', subject: 'Hello' },
    });
  } catch (error) {
    pushInvocation({
      name: 'appleSchemaMailCreateDraft',
      source: 'apple_schema',
      params: { error: error.message },
    });
  }
});

init();
