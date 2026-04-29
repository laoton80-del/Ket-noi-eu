import { create } from 'zustand';

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: 'inquiry' | 'confirmed' | 'completed' | 'no_show';
  handoffSummary?: string;
}

type B2BBookingState = {
  services: Service[];
  bookings: Booking[];
  addAiBooking: (booking: Omit<Booking, 'id'>) => Booking;
  confirmBooking: (id: string) => void;
};

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const d = now.getDate();

function isoAt(hour: number, minute: number): string {
  return new Date(y, m, d, hour, minute, 0, 0).toISOString();
}

const mockServices: Service[] = [
  { id: 'svc_consult_30', name: 'Legal Consult', durationMinutes: 30 },
  { id: 'svc_doc_review_60', name: 'Document Review', durationMinutes: 60 },
  { id: 'svc_business_call_45', name: 'Business Call Support', durationMinutes: 45 },
];

const mockBookings: Booking[] = [
  {
    id: 'bk_0900',
    customerName: 'Nguyễn Thị Lan',
    customerPhone: '+420123456789',
    startTime: isoAt(9, 0),
    endTime: isoAt(9, 30),
    status: 'confirmed',
  },
  {
    id: 'bk_1100',
    customerName: 'Trần Minh Khoa',
    customerPhone: '+420777888999',
    startTime: isoAt(11, 0),
    endTime: isoAt(12, 0),
    status: 'inquiry',
    handoffSummary: 'Khách gọi hỏi làm nail 2 người, có đính đá, xin đến muộn 15p.',
  },
  {
    id: 'bk_1245',
    customerName: 'Lê Thị Quỳnh',
    customerPhone: '+420601234567',
    startTime: isoAt(12, 45),
    endTime: isoAt(13, 30),
    status: 'inquiry',
    handoffSummary: 'Khách cần đặt lịch gấp cho dịch vụ tư vấn giấy tờ, ưu tiên khung giờ sau 13:00.',
  },
  {
    id: 'bk_1430',
    customerName: 'Phạm Thu Hà',
    customerPhone: '+420555666777',
    startTime: isoAt(14, 30),
    endTime: isoAt(15, 15),
    status: 'completed',
  },
];

export const useB2BBookingStore = create<B2BBookingState>((set) => ({
  services: mockServices,
  bookings: mockBookings,
  addAiBooking: (booking) => {
    const created: Booking = {
      ...booking,
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    set((state) => ({
      bookings: [...state.bookings, created].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    }));
    return created;
  },
  confirmBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((booking) => {
        if (booking.id !== id) return booking;
        if (booking.status !== 'inquiry') return booking;
        return {
          ...booking,
          status: 'confirmed',
        };
      }),
    }));
  },
}));
