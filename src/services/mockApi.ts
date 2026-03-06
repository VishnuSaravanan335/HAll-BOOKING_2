import { User, KPREvent, InventoryItem, EventInventoryItem, Hall } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: 1, username: 'admin', role: 'Admin', department: 'Administration' },
  { id: 2, username: 'student', role: 'Booker', department: 'CSE' },
  { id: 3, username: 'it', role: 'IT', department: 'IT Support' },
  { id: 4, username: 'reception', role: 'Reception', department: 'Reception' },
  { id: 5, username: 'principal', role: 'Principal', department: 'Principal Office' },
];

const INITIAL_HALLS: Hall[] = [
  { id: 1, name: 'Main Auditorium', capacity: 500, type: 'Auditorium', is_locked: 0 },
  { id: 2, name: 'Conference Hall 1', capacity: 100, type: 'Hall', is_locked: 0 },
  { id: 3, name: 'Seminar Hall 2', capacity: 150, type: 'Hall', is_locked: 0 },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Projector', stock_qty: 10, department: 'IT', in_use: 0 },
  { id: 2, name: 'Wireless Mic', stock_qty: 15, department: 'IT', in_use: 0 },
  { id: 3, name: 'Laptop', stock_qty: 5, department: 'IT', in_use: 0 },
  { id: 4, name: 'Bouquet', stock_qty: 20, department: 'Reception', in_use: 0 },
  { id: 5, name: 'Mementos', stock_qty: 50, department: 'Reception', in_use: 0 },
];

const INITIAL_EVENTS: KPREvent[] = [
  {
    id: 101,
    name: "Annual Tech Symposium",
    resource_person: "Dr. Arun Kumar",
    coordinator_name: "Prof. Sarah",
    phone: "9876543210",
    department: "CSE",
    date: new Date().toISOString().split('T')[0],
    time_slot: "10:00 AM - 01:00 PM",
    hall_id: 1,
    hall_name: "Main Auditorium",
    student_count: 200,
    status: "Approved",
    has_budget: 1,
    budget_amount: 5000,
    intro_video: 1,
    dance_performance: 0,
    booker_id: 2
  }
];

const INITIAL_EVENT_INVENTORY: any[] = [
  {
    id: 201,
    event_id: 101,
    item_id: 1, // Projector
    requested_qty: 1,
    providable_qty: 1,
    allocated_qty: 1,
    returned_qty: 0,
    status: 'Approved'
  },
  {
    id: 202,
    event_id: 101,
    item_id: 2, // Wireless Mic
    requested_qty: 2,
    providable_qty: 2,
    allocated_qty: 2,
    returned_qty: 0,
    status: 'Approved'
  },
  {
    id: 203,
    event_id: 101,
    item_id: 4, // Bouquet
    requested_qty: 5,
    providable_qty: 5,
    allocated_qty: 5,
    returned_qty: 0,
    status: 'Approved'
  },
  {
    id: 204,
    event_id: 101,
    item_id: 5, // Mementos
    requested_qty: 10,
    providable_qty: 10,
    allocated_qty: 10,
    returned_qty: 0,
    status: 'Approved'
  }
];

// Helper to get from localStorage
const getStorage = <T>(key: string, initial: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : initial;
};

// Helper to save to localStorage
const saveStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockApi = {
  // Settings
  getSettings: async () => ({ portal_locked: localStorage.getItem('portal_locked') || '0' }),
  updateSettings: async (locked: boolean) => localStorage.setItem('portal_locked', locked ? '1' : '0'),

  // Users
  getUsers: async () => getStorage('mock_users_v3', INITIAL_USERS),
  addUser: async (user: Omit<User, 'id'>) => {
    const users = getStorage('mock_users_v3', INITIAL_USERS);
    const newUser = { ...user, id: Date.now() };
    saveStorage('mock_users_v3', [...users, newUser]);
    return newUser;
  },
  deleteUser: async (id: number) => {
    const users = getStorage('mock_users_v3', INITIAL_USERS);
    saveStorage('mock_users_v3', users.filter(u => u.id !== id));
  },

  // Halls
  getHalls: async () => getStorage('mock_halls_v3', INITIAL_HALLS),
  addHall: async (hall: Omit<Hall, 'id'>) => {
    const halls = getStorage('mock_halls_v3', INITIAL_HALLS);
    const newHall = { ...hall, id: Date.now() };
    saveStorage('mock_halls_v3', [...halls, newHall]);
    return newHall;
  },
  updateHall: async (id: number, hall: Partial<Hall>) => {
    const halls = getStorage('mock_halls_v3', INITIAL_HALLS);
    saveStorage('mock_halls_v3', halls.map(h => h.id === id ? { ...h, ...hall } : h));
  },
  deleteHall: async (id: number) => {
    const halls = getStorage('mock_halls_v3', INITIAL_HALLS);
    saveStorage('mock_halls_v3', halls.filter(h => h.id !== id));
  },

  // Events
  getEvents: async () => getStorage('mock_events_v3', INITIAL_EVENTS),
  addEvent: async (event: Omit<KPREvent, 'id'>) => {
    const events = getStorage('mock_events_v3', INITIAL_EVENTS);
    const newEvent = { ...event, id: Date.now() };
    saveStorage('mock_events_v3', [...events, newEvent]);
    return newEvent;
  },
  updateEvent: async (id: number, updates: Partial<KPREvent>) => {
    const events = getStorage('mock_events_v3', INITIAL_EVENTS);
    saveStorage('mock_events_v3', events.map(e => e.id === id ? { ...e, ...updates } : e));
  },
  deleteEvent: async (id: number) => {
    const events = getStorage('mock_events_v3', INITIAL_EVENTS);
    saveStorage('mock_events_v3', events.filter(e => e.id !== id));
    // Also cleanup inventory
    const inv = getStorage('mock_event_inventory_v3', INITIAL_EVENT_INVENTORY);
    saveStorage('mock_event_inventory_v3', inv.filter((i: any) => i.event_id !== id));
  },

  // Inventory Items
  getInventoryItems: async () => {
    const items = getStorage('mock_inventory_items_v3', INITIAL_INVENTORY);
    const eventInv = getStorage('mock_event_inventory_v3', INITIAL_EVENT_INVENTORY);
    const events = getStorage('mock_events_v3', INITIAL_EVENTS);
    
    return items.map(item => {
      const inUse = eventInv
        .filter((ei: any) => {
          const event = events.find((e: any) => e.id === ei.event_id);
          if (!event || event.status === 'Declined') return false;
          return ei.item_id === item.id;
        })
        .reduce((sum: number, ei: any) => {
          const event = events.find((e: any) => e.id === ei.event_id);
          if (event?.status === 'Approved') {
            return sum + (ei.allocated_qty - ei.returned_qty);
          }
          return sum + ei.providable_qty;
        }, 0);
      return { ...item, in_use: inUse };
    });
  },
  addInventoryItem: async (item: Omit<InventoryItem, 'id'>) => {
    const items = getStorage('mock_inventory_items_v3', INITIAL_INVENTORY);
    const newItem = { ...item, id: Date.now(), in_use: 0 };
    saveStorage('mock_inventory_items_v3', [...items, newItem]);
    return newItem;
  },
  updateInventoryItem: async (id: number, updates: Partial<InventoryItem>) => {
    const items = getStorage('mock_inventory_items_v3', INITIAL_INVENTORY);
    saveStorage('mock_inventory_items_v3', items.map(i => i.id === id ? { ...i, ...updates } : i));
  },
  deleteInventoryItem: async (id: number) => {
    const items = getStorage('mock_inventory_items_v3', INITIAL_INVENTORY);
    saveStorage('mock_inventory_items_v3', items.filter(i => i.id !== id));
  },

  // Event Inventory
  getEventInventory: async (eventId: number) => {
    const eventInv = getStorage('mock_event_inventory_v3', INITIAL_EVENT_INVENTORY);
    const items = await mockApi.getInventoryItems();
    
    return eventInv
      .filter((ei: any) => ei.event_id === eventId)
      .map((ei: any) => {
        const item = items.find(i => i.id === ei.item_id);
        const available = (item?.stock_qty || 0) - (item?.in_use || 0);
        return { 
          ...ei, 
          name: item?.name || 'Unknown Item', 
          department: item?.department || 'Unknown',
          stock_qty: item?.stock_qty || 0,
          available_qty: available
        };
      });
  },
  updateEventInventory: async (id: number, updates: Partial<EventInventoryItem>) => {
    const eventInv = getStorage('mock_event_inventory_v3', INITIAL_EVENT_INVENTORY);
    saveStorage('mock_event_inventory_v3', eventInv.map(ei => ei.id === id ? { ...ei, ...updates } : ei));
  },
  addEventInventory: async (eventId: number, itemId: number, requestedQty: number) => {
    const eventInv = getStorage('mock_event_inventory_v3', INITIAL_EVENT_INVENTORY);
    const newEi = {
      id: Date.now() + Math.random(),
      event_id: eventId,
      item_id: itemId,
      requested_qty: requestedQty,
      providable_qty: 0,
      allocated_qty: 0,
      returned_qty: 0,
      status: 'Pending'
    };
    saveStorage('mock_event_inventory_v3', [...eventInv, newEi]);
    return newEi;
  },

  // Pending Returns
  getPendingReturns: async (department: string) => {
    const events = getStorage('mock_events_v3', INITIAL_EVENTS);
    const eventInv = getStorage('mock_event_inventory_v3', INITIAL_EVENT_INVENTORY);
    const items = getStorage('mock_inventory_items_v3', INITIAL_INVENTORY);
    
    return events.filter(e => {
      if (e.status !== 'Approved') return false;
      const deptItems = eventInv.filter(ei => {
        const item = items.find(i => i.id === ei.item_id);
        return ei.event_id === e.id && item?.department === department && ei.allocated_qty > ei.returned_qty;
      });
      return deptItems.length > 0;
    });
  }
};
