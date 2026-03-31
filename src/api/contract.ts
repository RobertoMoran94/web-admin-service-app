/**
 * API CONTRACT — Spring Boot ↔ Web Portal
 * =========================================
 * These TypeScript interfaces define the exact JSON shapes the Spring Boot
 * backend must return. Both sides (backend Kotlin DTOs and frontend hooks)
 * must stay in sync with this file.
 *
 * Base URL:  https://<cloud-run-service>/api/v1
 * Auth:      Firebase ID token in Authorization: Bearer <token> header
 *
 * TODO (Phase 12):
 *  - Replace useMockMetrics with useAnalyticsApi once Cloud Run is deployed
 *  - Replace CalendarPage mock bookings with useBookingsApi
 *  - Add pagination support to GET /bookings (cursor-based or page/size)
 *  - Wire Firebase token verification on BE (FIREBASE_TOKEN_VERIFY=true)
 *  - Build notification trigger on booking cancellation
 *  - Build customer booking flow (mobile → BE → owner portal reflects it live)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared envelope
// ─────────────────────────────────────────────────────────────────────────────

/** Every BE response is wrapped in this envelope */
export interface ApiResponse<T> {
  success: boolean
  data:    T
  error?:  string     // only present when success = false
}

/** Paginated list response */
export interface PagedResponse<T> {
  items:      T[]
  totalItems: number
  page:       number
  pageSize:   number
  totalPages: number
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/categories
// ─────────────────────────────────────────────────────────────────────────────
// TODO (Phase 12): replace hardcoded CATEGORIES array in BusinessProfilePage
// and BusinessPage with a real call to this endpoint.

export interface CategoryDto {
  id:    string   // e.g. "barbershop"
  label: string   // e.g. "Barbershop"
}
// Response: ApiResponse<CategoryDto[]>

// ─────────────────────────────────────────────────────────────────────────────
// Analytics  GET /api/v1/analytics/overview?businessId=&from=&to=
// ─────────────────────────────────────────────────────────────────────────────
// TODO (Phase 12): replace useMockMetrics with a call to this endpoint.

export interface DailyRevenueDto {
  date:    string   // "Apr 1"  (formatted by BE, locale-aware)
  revenue: number   // USD cents or whole dollars — agree with BE team
}

export interface ServiceStatDto {
  serviceId: string
  name:      string
  bookings:  number
  revenue:   number
}

export interface AnalyticsOverviewDto {
  totalRevenue:      number
  totalBookings:     number
  newCustomers:      number
  avgBookingValue:   number
  revenueVsLastMonth: number   // percentage, e.g. 12.4 means +12.4%
  bookingsVsLastMonth: number
  customersVsLastMonth: number
  revenueByDay:      DailyRevenueDto[]
  topServices:       ServiceStatDto[]
}
// Response: ApiResponse<AnalyticsOverviewDto>

// ─────────────────────────────────────────────────────────────────────────────
// Bookings  GET /api/v1/bookings?businessId=&status=&from=&to=&page=&size=
// ─────────────────────────────────────────────────────────────────────────────
// TODO (Phase 12): replace CalendarPage mock booking list with a call here.

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'

export interface BookingDto {
  id:           string
  businessId:   string
  customerId:   string
  customerName: string
  customerEmail: string
  serviceId:    string
  serviceName:  string
  employeeId:   string
  employeeName: string
  date:         string   // ISO 8601: "2026-04-15"
  startTime:    string   // "10:30"
  endTime:      string   // "11:00"
  price:        number
  status:       BookingStatus
  notes?:       string
  createdAt:    string   // ISO 8601 datetime
  updatedAt:    string
}
// Response: ApiResponse<PagedResponse<BookingDto>>

// PATCH /api/v1/bookings/{id}/cancel
export interface CancelBookingRequest {
  reason?: string   // optional cancellation reason shown to customer
}
export interface CancelBookingResponse {
  id:     string
  status: 'cancelled'
}
// Response: ApiResponse<CancelBookingResponse>

// ─────────────────────────────────────────────────────────────────────────────
// Services  CRUD  /api/v1/businesses/{businessId}/services
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceDto {
  id:              string
  businessId:      string
  name:            string
  description:     string
  price:           number
  durationMinutes: number
  imageUrl:        string
  isActive:        boolean
  createdAt:       string
  updatedAt:       string
}

export interface UpsertServiceRequest {
  name:            string
  description:     string
  price:           number
  durationMinutes: number
  imageUrl:        string
  isActive:        boolean
}
// GET    → ApiResponse<ServiceDto[]>
// POST   → ApiResponse<ServiceDto>
// PUT    → ApiResponse<ServiceDto>
// DELETE → ApiResponse<{ id: string }>

// ─────────────────────────────────────────────────────────────────────────────
// Employees  CRUD  /api/v1/businesses/{businessId}/employees
// ─────────────────────────────────────────────────────────────────────────────

export interface EmployeeDto {
  id:        string
  businessId: string
  name:      string
  role:      string
  avatarUrl: string
  isActive:  boolean
  createdAt: string
  updatedAt: string
}

export interface UpsertEmployeeRequest {
  name:      string
  role:      string
  avatarUrl: string
  isActive:  boolean
}
// GET    → ApiResponse<EmployeeDto[]>
// POST   → ApiResponse<EmployeeDto>
// PUT    → ApiResponse<EmployeeDto>
// DELETE → ApiResponse<{ id: string }>

// ─────────────────────────────────────────────────────────────────────────────
// Business profile  GET/PUT /api/v1/businesses/{businessId}
// ─────────────────────────────────────────────────────────────────────────────

export interface DayHoursDto {
  open: boolean
  from: string   // "09:00"
  to:   string   // "18:00"
}

export interface BusinessHoursDto {
  monday:    DayHoursDto
  tuesday:   DayHoursDto
  wednesday: DayHoursDto
  thursday:  DayHoursDto
  friday:    DayHoursDto
  saturday:  DayHoursDto
  sunday:    DayHoursDto
}

export interface BusinessDto {
  id:          string
  ownerId:     string
  name:        string
  description: string
  category:    string
  address:     string
  phone:       string
  logoUrl:     string
  coverUrl:    string
  hours:       BusinessHoursDto
  createdAt:   string
  updatedAt:   string
}

export interface UpsertBusinessRequest {
  name:        string
  description: string
  category:    string
  address:     string
  phone:       string
  logoUrl:     string
  coverUrl:    string
  hours:       BusinessHoursDto
}
// GET → ApiResponse<BusinessDto>
// PUT → ApiResponse<BusinessDto>

// ─────────────────────────────────────────────────────────────────────────────
// Users (admin only)  GET /api/v1/admin/users?page=&size=&role=&search=
// ─────────────────────────────────────────────────────────────────────────────

export interface UserDto {
  id:          string
  email:       string
  displayName: string
  role:        'customer' | 'business_owner' | 'admin'
  createdAt:   string
  photoURL?:   string
}

export interface UpdateUserRoleRequest {
  role: 'customer' | 'business_owner'
}
// GET    → ApiResponse<PagedResponse<UserDto>>
// PATCH  /api/v1/admin/users/{uid}/role  → ApiResponse<UserDto>

// ─────────────────────────────────────────────────────────────────────────────
// Home page (mobile)  GET /api/v1/home/page  (already implemented)
// ─────────────────────────────────────────────────────────────────────────────

export interface HomeCategoryDto {
  id:    string
  name:  string
  icon?: string
}

export interface HomeBusinessDto {
  id:          string
  name:        string
  category:    string
  logoUrl:     string
  coverUrl:    string
  rating:      number
  reviewCount: number
  address:     string
}

export interface HomePageDto {
  categories:    HomeCategoryDto[]
  featuredShops: HomeBusinessDto[]
  nearbyShops:   HomeBusinessDto[]
}
// Response: ApiResponse<HomePageDto>
