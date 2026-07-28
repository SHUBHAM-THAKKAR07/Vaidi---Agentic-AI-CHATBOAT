import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { api } from '../context/AuthContext';
import { Package, TrendingDown, AlertTriangle, CheckCircle, Edit3, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

function getStockStatus(current, minimum) {
  const ratio = current / minimum;
  if (ratio <= 0.3) return 'critical';
  if (ratio < 1) return 'low';
  return 'ok';
}

const STOCK_CONFIG = {
  ok:       { label: 'Adequate',  icon: CheckCircle,    cls: 'stock-ok',       border: 'border-forest-200' },
  low:      { label: 'Low Stock', icon: TrendingDown,   cls: 'stock-low',      border: 'border-amber-200' },
  critical: { label: 'Critical',  icon: AlertTriangle,  cls: 'stock-critical', border: 'border-red-200' },
};

export default function StockManagement() {
  const { t } = useLanguage();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // id of item being edited
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/worker/stock');
      setStock(res.data.stock);
    } catch {
      toast.error('Could not load stock data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setEditValue(String(item.current_stock));
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveStock = async (id) => {
    const val = parseInt(editValue);
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid non-negative number');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/worker/stock/${id}`, { current_stock: val });
      toast.success('Stock updated');
      setEditing(null);
      loadStock();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const criticalCount = stock.filter(s => getStockStatus(s.current_stock, s.min_stock) === 'critical').length;
  const lowCount = stock.filter(s => getStockStatus(s.current_stock, s.min_stock) === 'low').length;

  // Group by category
  const categories = [...new Set(stock.map(s => s.category))];

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-serif font-bold text-umber">{t('stockManagement')}</h1>
        <div className="flex gap-3 mt-2 text-xs text-muted">
          {criticalCount > 0 && (
            <span className="text-urgent-red font-semibold">{criticalCount} critical</span>
          )}
          {lowCount > 0 && (
            <span className="text-amber-600 font-semibold">{lowCount} low</span>
          )}
          <span>{stock.filter(s => getStockStatus(s.current_stock, s.min_stock) === 'ok').length} adequate</span>
        </div>
      </div>

      {/* Summary bar */}
      {stock.length > 0 && (
        <div className="card mb-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Stock Overview</p>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {[
              { status: 'critical', color: 'bg-urgent-red' },
              { status: 'low',      color: 'bg-amber-400' },
              { status: 'ok',       color: 'bg-forest-500' },
            ].map(({ status, color }) => {
              const count = stock.filter(s => getStockStatus(s.current_stock, s.min_stock) === status).length;
              const pct = (count / stock.length) * 100;
              return pct > 0 ? (
                <div
                  key={status}
                  className={`${color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${count}`}
                />
              ) : null;
            })}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-urgent-red inline-block" /> Critical: {criticalCount}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Low: {lowCount}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-forest-500 inline-block" /> OK: {stock.length - criticalCount - lowCount}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-terracotta-200 border-t-terracotta-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map(category => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <Package size={14} className="text-muted" />
                <h2 className="text-xs font-bold text-muted uppercase tracking-wider">{category}</h2>
              </div>
              <div className="space-y-2">
                {stock.filter(s => s.category === category).map(item => {
                  const status = getStockStatus(item.current_stock, item.min_stock);
                  const sc = STOCK_CONFIG[status];
                  const StatusIcon = sc.icon;
                  const isEditing = editing === item.id;
                  const ratio = Math.min(1, item.current_stock / item.min_stock);

                  return (
                    <div
                      key={item.id}
                      className={`card border ${sc.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg border ${sc.cls} shrink-0 mt-0.5`}>
                          <StatusIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-umber">{item.name}</p>
                              <p className="text-xs text-muted">{item.unit}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${sc.cls}`}>
                              {sc.label}
                            </span>
                          </div>

                          {/* Stock bar */}
                          <div className="mt-2 mb-2">
                            <div className="flex justify-between text-xs text-muted mb-1">
                              <span>Current: <strong className="text-umber">{item.current_stock}</strong></span>
                              <span>Min: {item.min_stock}</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  status === 'critical' ? 'bg-urgent-red' :
                                  status === 'low' ? 'bg-amber-400' : 'bg-forest-500'
                                }`}
                                style={{ width: `${ratio * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Edit area */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="input-field w-28 min-h-0 h-9 py-1.5 text-sm"
                                min="0"
                                autoFocus
                              />
                              <button
                                onClick={() => saveStock(item.id)}
                                disabled={saving}
                                className="flex items-center gap-1 bg-forest-600 text-white text-sm font-semibold px-3 h-9 rounded-lg hover:bg-forest-500 disabled:opacity-60"
                              >
                                <Save size={13} />
                                {t('save')}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 btn-ghost h-9 px-2 text-sm"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted">
                                Updated {new Date(item.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} by {item.updated_by}
                              </p>
                              <button
                                onClick={() => startEdit(item)}
                                className="flex items-center gap-1 text-xs text-terracotta-700 font-semibold hover:underline"
                              >
                                <Edit3 size={12} />
                                {t('updateStock')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
