import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationDone } from '../../utils/notifications';
import '../styles/AdminNotifications.css';

const AdminNotifications = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('open'); // open | done | all
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getNotifications());
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'done') return items.filter((n) => n.status === 'done');
    return items.filter((n) => n.status !== 'done');
  }, [items, filter]);

  const handleDone = (id) => {
    const next = markNotificationDone(id);
    setItems(next);
  };

  const emptyText = filter === 'done'
    ? 'No completed reminders yet.'
    : filter === 'all'
    ? 'No notifications found.'
    : 'All caught up. No pending reminders.';

  return (
    <div className="admin-notify-container">
      <div className="admin-notify-header">
        <div>
          <h1 className="admin-notify-title">Notification Center</h1>
          <p className="admin-notify-subtitle">Actionable reminders for admin tasks</p>
        </div>
        <div className="admin-notify-filters">
          <button
            className={`admin-notify-filter ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Pending
          </button>
          <button
            className={`admin-notify-filter ${filter === 'done' ? 'active' : ''}`}
            onClick={() => setFilter('done')}
          >
            Done
          </button>
          <button
            className={`admin-notify-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      <div className="admin-notify-list">
        {filtered.map((n) => (
          <div key={n.id} className={`admin-notify-card ${n.status === 'done' ? 'is-done' : ''}`}>
            <div className="admin-notify-card-main">
              <div className="admin-notify-title-row">
                <h3 className="admin-notify-card-title">{n.title}</h3>
                <span className="admin-notify-date">{n.dateKey || ''}</span>
              </div>
              <p className="admin-notify-message">{n.message}</p>
            </div>
            <div className="admin-notify-actions">
              {n.ctaRoute ? (
                <button
                  className="admin-notify-btn"
                  onClick={() => navigate(n.ctaRoute)}
                >
                  {n.ctaLabel || 'Open'}
                </button>
              ) : (
                <Link className="admin-notify-btn" to="/admin/dashboard">
                  Open
                </Link>
              )}
              {n.status !== 'done' ? (
                <button
                  className="admin-notify-btn secondary"
                  onClick={() => handleDone(n.id)}
                >
                  Mark Done
                </button>
              ) : (
                <span className="admin-notify-done">Completed</span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="admin-notify-empty">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
