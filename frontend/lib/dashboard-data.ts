export type CustomerRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: 'Enterprise' | 'SME' | 'Retail';
  status: 'Active' | 'Prospect' | 'At risk';
  lifetimeValue: number;
  lastContact: string;
};

export type OrderRecord = {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: 'Processing' | 'Fulfilled' | 'Pending payment' | 'Cancelled';
  channel: 'Marketplace' | 'Direct sales' | 'Field agent';
  date: string;
};

export type InventoryRecord = {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  stock: number;
  reorderLevel: number;
  unitCost: number;
};

export type InvoiceRecord = {
  id: string;
  customer: string;
  amount: number;
  status: 'Paid' | 'Outstanding' | 'Overdue' | 'Draft';
  issued: string;
  due: string;
};

export type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export type AiInsight = {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'Forecast' | 'Risk' | 'Opportunity' | 'Automation';
};

export const customers: CustomerRecord[] = [
  { id: 'CUS-1042', name: 'Nadeesha Fernando', company: 'Lanka Freight Solutions', email: 'nadeesha@lankafreight.lk', phone: '+94 77 214 5521', segment: 'Enterprise', status: 'Active', lifetimeValue: 4820000, lastContact: '2 days ago' },
  { id: 'CUS-1041', name: 'Kasun Wijeratne', company: 'Ceylon Spice Traders', email: 'kasun@ceylonspice.lk', phone: '+94 71 908 3312', segment: 'SME', status: 'Active', lifetimeValue: 1260000, lastContact: '5 days ago' },
  { id: 'CUS-1040', name: 'Hasini Perera', company: 'Colombo Retail Group', email: 'hasini@colomboretail.lk', phone: '+94 76 552 1190', segment: 'Retail', status: 'Prospect', lifetimeValue: 0, lastContact: '1 week ago' },
  { id: 'CUS-1039', name: 'Dinuka Silva', company: 'Kandy Hardware Co.', email: 'dinuka@kandyhardware.lk', phone: '+94 70 441 6602', segment: 'SME', status: 'At risk', lifetimeValue: 685000, lastContact: '3 weeks ago' },
  { id: 'CUS-1038', name: 'Ishara Bandara', company: 'Galle Textiles PLC', email: 'ishara@galletextiles.lk', phone: '+94 77 663 4471', segment: 'Enterprise', status: 'Active', lifetimeValue: 6140000, lastContact: 'Yesterday' },
  { id: 'CUS-1037', name: 'Tharindu Jayasuriya', company: 'Negombo Fresh Foods', email: 'tharindu@negombofresh.lk', phone: '+94 75 320 9981', segment: 'SME', status: 'Active', lifetimeValue: 942000, lastContact: '4 days ago' }
];

export const orders: OrderRecord[] = [
  { id: 'ORD-8831', customer: 'Lanka Freight Solutions', items: 12, total: 486500, status: 'Processing', channel: 'Direct sales', date: 'Aug 22, 2026' },
  { id: 'ORD-8830', customer: 'Colombo Retail Group', items: 4, total: 58900, status: 'Pending payment', channel: 'Marketplace', date: 'Aug 22, 2026' },
  { id: 'ORD-8829', customer: 'Galle Textiles PLC', items: 30, total: 1284000, status: 'Fulfilled', channel: 'Field agent', date: 'Aug 21, 2026' },
  { id: 'ORD-8828', customer: 'Ceylon Spice Traders', items: 8, total: 132400, status: 'Fulfilled', channel: 'Marketplace', date: 'Aug 20, 2026' },
  { id: 'ORD-8827', customer: 'Kandy Hardware Co.', items: 2, total: 27600, status: 'Cancelled', channel: 'Marketplace', date: 'Aug 19, 2026' },
  { id: 'ORD-8826', customer: 'Negombo Fresh Foods', items: 16, total: 214300, status: 'Fulfilled', channel: 'Direct sales', date: 'Aug 18, 2026' }
];

export const inventory: InventoryRecord[] = [
  { id: 'INV-001', sku: 'CB-SPC-014', name: 'Ceylon Cinnamon Quills 1kg', category: 'Spices & Export', warehouse: 'Colombo DC', stock: 128, reorderLevel: 80, unitCost: 2450 },
  { id: 'INV-002', sku: 'CB-TXT-092', name: 'Handloom Cotton Fabric Roll', category: 'Textiles', warehouse: 'Galle Hub', stock: 42, reorderLevel: 50, unitCost: 6100 },
  { id: 'INV-003', sku: 'CB-HRD-231', name: 'Galvanised Roofing Sheet', category: 'Hardware', warehouse: 'Kandy Store', stock: 19, reorderLevel: 40, unitCost: 3980 },
  { id: 'INV-004', sku: 'CB-FRS-055', name: 'Packaged King Coconut Water 24pk', category: 'Fresh Foods', warehouse: 'Negombo Cold Store', stock: 210, reorderLevel: 120, unitCost: 1860 },
  { id: 'INV-005', sku: 'CB-LOG-118', name: 'Reusable Freight Pallet', category: 'Logistics', warehouse: 'Colombo DC', stock: 8, reorderLevel: 25, unitCost: 12500 }
];

export const invoices: InvoiceRecord[] = [
  { id: 'INVC-2214', customer: 'Galle Textiles PLC', amount: 1284000, status: 'Paid', issued: 'Aug 21, 2026', due: 'Sep 04, 2026' },
  { id: 'INVC-2213', customer: 'Lanka Freight Solutions', amount: 486500, status: 'Outstanding', issued: 'Aug 22, 2026', due: 'Sep 06, 2026' },
  { id: 'INVC-2212', customer: 'Kandy Hardware Co.', amount: 191200, status: 'Overdue', issued: 'Jul 30, 2026', due: 'Aug 13, 2026' },
  { id: 'INVC-2211', customer: 'Ceylon Spice Traders', amount: 132400, status: 'Paid', issued: 'Aug 20, 2026', due: 'Sep 03, 2026' },
  { id: 'INVC-2210', customer: 'Negombo Fresh Foods', amount: 214300, status: 'Draft', issued: '—', due: '—' }
];

export const activity: ActivityItem[] = [
  { id: 'ACT-1', actor: 'AI Assistant', action: 'flagged a stock risk for', target: 'Reusable Freight Pallet', time: '12 min ago' },
  { id: 'ACT-2', actor: 'Nadeesha Fernando', action: 'placed order', target: 'ORD-8831', time: '48 min ago' },
  { id: 'ACT-3', actor: 'Finance bot', action: 'marked invoice overdue', target: 'INVC-2212', time: '2 hours ago' },
  { id: 'ACT-4', actor: 'Dinuka Silva', action: 'opened a support ticket about', target: 'delayed delivery', time: '3 hours ago' },
  { id: 'ACT-5', actor: 'Ishara Bandara', action: 'upgraded to', target: 'Enterprise plan', time: 'Yesterday' }
];

export const aiInsights: AiInsight[] = [
  { id: 'AI-1', title: 'Reorder freight pallets within 5 days', description: 'Stock will fall below the safety threshold before the next scheduled restock based on the last 30 days of dispatch velocity.', confidence: 92, category: 'Risk' },
  { id: 'AI-2', title: 'Cross-sell opportunity: Ceylon Spice Traders', description: 'Order pattern suggests a 68% chance of a repeat order this week if paired with the export packaging bundle.', confidence: 74, category: 'Opportunity' },
  { id: 'AI-3', title: 'September revenue forecast: LKR 31.2M', description: 'Trend and seasonality model projects continued growth driven by the marketplace channel and Enterprise renewals.', confidence: 81, category: 'Forecast' },
  { id: 'AI-4', title: 'Auto-reconcile 14 pending payments', description: 'These payments match open invoices with high confidence and can be reconciled automatically to save manual review time.', confidence: 88, category: 'Automation' }
];

export const revenueTrend = [18.2, 19.4, 18.9, 21.6, 23.1, 22.4, 24.8, 25.9, 24.6, 27.2, 26.8, 28.4];
export const revenueTrendLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export const channelBreakdown = [
  { label: 'Marketplace', value: 42, color: 'bg-cyan-400' },
  { label: 'Direct sales', value: 35, color: 'bg-blue-500' },
  { label: 'Field agents', value: 23, color: 'bg-violet-500' }
];

export function formatLkr(amount: number) {
  if (amount >= 1000000) {
    return `LKR ${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `LKR ${(amount / 1000).toFixed(1)}K`;
  }
  return `LKR ${amount.toFixed(0)}`;
}
