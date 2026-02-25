export type Role = "Booker" | "IT" | "Reception" | "Principal" | "Admin";

export interface User {
  id: number;
  username: string;
  role: Role;
  department: string;
}

export type EventStatus = 
  | "Pending_Admin" 
  | "Pending_IT_Reception" 
  | "Pending_Principal" 
  | "Approved" 
  | "Declined";

export interface Event {
  id: number;
  name: string;
  resource_person: string;
  coordinator_name: string;
  phone: string;
  department: string;
  student_count: number;
  date: string;
  time_slot: string;
  hall_id: number | null;
  hall_name?: string;
  status: EventStatus;
  booker_id: number;
  booker_name?: string;
  has_budget: number;
  budget_amount: number;
  intro_video: number;
  dance_performance: number;
}

export interface Hall {
  id: number;
  name: string;
  capacity: number;
  type: string;
  is_locked: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  department: "IT" | "Reception";
  stock_qty: number;
}

export interface EventInventoryItem {
  id: number;
  event_id: number;
  item_id: number;
  name: string;
  department: "IT" | "Reception";
  requested_qty: number;
  providable_qty: number;
  allocated_qty: number;
  status: "Pending" | "Approved" | "Declined";
  stock_qty: number;
}
