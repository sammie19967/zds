const STORAGE_KEY = 'zds_admin_notifications_v1';
const REMINDER_META_KEY = 'zds_admin_reminders_meta_v1';

const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return val ?? fallback;
  } catch (_) {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Ignore storage failures
  }
};

export const getNotifications = () => readJson(STORAGE_KEY, []);

export const saveNotifications = (items) => {
  writeJson(STORAGE_KEY, Array.isArray(items) ? items : []);
};

export const addNotification = (item) => {
  const existing = getNotifications();
  const next = [item, ...existing];
  saveNotifications(next);
  return next;
};

export const upsertNotification = (item) => {
  const existing = getNotifications();
  const idx = existing.findIndex((n) => n.id === item.id);
  if (idx === -1) {
    const next = [item, ...existing];
    saveNotifications(next);
    return next;
  }
  const prev = existing[idx];
  const nextItem = {
    ...prev,
    ...item,
    status: prev.status || item.status || 'open',
    doneAt: prev.doneAt || item.doneAt || null,
  };
  const next = [...existing.slice(0, idx), nextItem, ...existing.slice(idx + 1)];
  saveNotifications(next);
  return next;
};

export const markNotificationDone = (id) => {
  const items = getNotifications();
  const next = items.map((n) => n.id === id ? { ...n, status: 'done', doneAt: new Date().toISOString() } : n);
  saveNotifications(next);
  return next;
};

export const markNotificationsDoneByType = (types = [], dateKey = '') => {
  const set = new Set(types);
  const items = getNotifications();
  const next = items.map((n) => {
    const matchesType = set.has(n.type);
    const matchesDate = dateKey ? n.dateKey === dateKey : true;
    if (matchesType && matchesDate) {
      return { ...n, status: 'done', doneAt: new Date().toISOString() };
    }
    return n;
  });
  saveNotifications(next);
  return next;
};

export const ensureDailyReminders = () => {
  const day = todayKey();
  const meta = readJson(REMINDER_META_KEY, {});
  if (meta.lastGenerated === day) return getNotifications();

  const base = {
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  const items = getNotifications();
  const exists = (type) => items.some((n) => n.type === type && n.dateKey === day);
  const toAdd = [];

  if (!exists('fuel_price')) {
    toAdd.push({
      id: `fuel-${day}`,
      type: 'fuel_price',
      dateKey: day,
      title: 'Record Fuel Price',
      message: 'Please record today’s fuel price so costs stay accurate.',
      ctaLabel: 'Go to Fuel Log',
      ctaRoute: '/admin/fuel',
      ...base,
    });
  }
  if (!exists('expenses')) {
    toAdd.push({
      id: `expenses-${day}`,
      type: 'expenses',
      dateKey: day,
      title: 'Record Expenses',
      message: 'Please log today’s expenses to keep monthly reports up to date.',
      ctaLabel: 'Go to Expenses',
      ctaRoute: '/admin/expenses',
      ...base,
    });
  }

  if (toAdd.length) {
    saveNotifications([...toAdd, ...items]);
  }

  writeJson(REMINDER_META_KEY, { lastGenerated: day });
  return getNotifications();
};

export const getOpenRemindersForToday = () => {
  const day = todayKey();
  return getNotifications().filter((n) => n.dateKey === day && n.status !== 'done');
};

export const getLastShownKey = () => readJson(`${REMINDER_META_KEY}_shown`, {});

export const setLastShownKey = () => {
  writeJson(`${REMINDER_META_KEY}_shown`, { lastShown: todayKey() });
};
