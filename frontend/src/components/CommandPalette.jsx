import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import api from '../api';
import { Users, FileText, Package, MessageCircle, BarChart2, Plus, Search, ArrowRight } from 'lucide-react';

const STATIC_ACTIONS = [
  { id: 'new-lead', label: 'Add New Lead', icon: Plus, shortcut: 'N', to: '/leads/new', group: 'Actions' },
  { id: 'new-quote', label: 'Create Quotation', icon: FileText, shortcut: 'Q', to: '/quotations/new', group: 'Actions' },
  { id: 'chat', label: 'Open AI Assistant', icon: MessageCircle, shortcut: 'J', to: '/chat', group: 'Actions' },
  { id: 'leads', label: 'View All Leads', icon: Users, to: '/leads', group: 'Navigate' },
  { id: 'machines', label: 'Machine Catalog', icon: Package, to: '/machines', group: 'Navigate' },
  { id: 'reports', label: 'Reports', icon: BarChart2, to: '/reports', group: 'Navigate' },
];

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useStore();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (commandPaletteOpen) {
      api.get('/leads').then(r => setLeads(r.data)).catch(() => {});
      setSearch('');
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useStore.getState().toggleCommandPalette();
      }
      if (e.key === 'Escape' && commandPaletteOpen) closeCommandPalette();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen]);

  const go = (path) => {
    navigate(path);
    closeCommandPalette();
  };

  if (!commandPaletteOpen) return null;

  const filteredLeads = search
    ? leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search)).slice(0, 5)
    : leads.slice(0, 4);

  return (
    <div cmdk-overlay="" onClick={closeCommandPalette}>
      <div cmdk-dialog="" onClick={e => e.stopPropagation()}>
        <Command cmdk-root="" shouldFilter={false} onKeyDown={e => { if (e.key === 'Escape') closeCommandPalette(); }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 10 }}>
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <Command.Input
              cmdk-input=""
              placeholder="Search leads, machines, or run a command..."
              value={search}
              onValueChange={setSearch}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', padding: 0 }}
            />
            <kbd style={{ fontSize: 11, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-muted)' }}>Esc</kbd>
          </div>

          <Command.List cmdk-list="">
            <Command.Empty cmdk-empty="">No results found</Command.Empty>

            <Command.Group heading="Actions" cmdk-group-heading="">
              {STATIC_ACTIONS.filter(a => a.group === 'Actions').filter(a => !search || a.label.toLowerCase().includes(search.toLowerCase())).map(action => {
                const Icon = action.icon;
                return (
                  <Command.Item key={action.id} cmdk-item="" value={action.id} onSelect={() => go(action.to)}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color: 'var(--brand-primary)' }} />
                    </div>
                    <span style={{ flex: 1 }}>{action.label}</span>
                    {action.shortcut && (
                      <kbd style={{ fontSize: 11, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-muted)' }}>⌘{action.shortcut}</kbd>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>

            {filteredLeads.length > 0 && (
              <Command.Group heading="Leads" cmdk-group-heading="">
                {filteredLeads.map(lead => (
                  <Command.Item key={lead.id} cmdk-item="" value={`lead-${lead.id}`} onSelect={() => go(`/leads/${lead.id}`)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'white' }}>
                      {lead.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.city || ''} · {lead.status}</div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigate" cmdk-group-heading="">
              {STATIC_ACTIONS.filter(a => a.group === 'Navigate').filter(a => !search || a.label.toLowerCase().includes(search.toLowerCase())).map(action => {
                const Icon = action.icon;
                return (
                  <Command.Item key={action.id} cmdk-item="" value={action.id} onSelect={() => go(action.to)}>
                    <Icon size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span>{action.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
